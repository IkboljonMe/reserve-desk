import { NextRequest, NextResponse } from 'next/server'
import { decrypt, sessionHome, type SessionPayload } from '@/lib/session'
import { FALLBACK_LOCALE, LOCALE_COOKIE, isLocale } from '@/i18n/config'
import { getSubdomain, isKnownSubdomain } from '@/lib/subdomain'

// A request for a static file — its last path segment has an extension, e.g.
// /assets/logo-safir.png. These must never be locale-redirected.
const PUBLIC_FILE = /\.[^/]+$/

const SUPERADMIN_LOGIN = '/secure/superadmin/login'
// /secure/company/{companySlug}(/rest...) — the owner area, which may nest an
// /admin/{hotelSlug}(/rest...) hotel-admin area inside it.
const COMPANY_RE = /^\/secure\/company\/([a-z0-9-]+)(\/.*)?$/
const HOTEL_ADMIN_RE = /^\/admin\/([a-z0-9-]+)(\/.*)?$/
// Legacy paths from before the /secure/company rename.
const LEGACY_TENANT_RE = /^\/secure\/admin\/([a-z0-9-]+)(\/.*)?$/

// Pick a locale for a request that arrived without one: remembered choice
// (cookie) first, then the browser's Accept-Language, then the neutral fallback
// (Russian) — used for visitors and crawlers with no detectable preference.
function pickLocale(request: NextRequest): string {
  const cookie = request.cookies.get(LOCALE_COOKIE)?.value
  if (isLocale(cookie)) return cookie

  const header = request.headers.get('accept-language') || ''
  const preferred = header.split(',')[0]?.split('-')[0]?.toLowerCase()
  if (isLocale(preferred)) return preferred

  return FALLBACK_LOCALE
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Static files (public/) pass straight through — no locale, no auth.
  if (PUBLIC_FILE.test(pathname)) return NextResponse.next()

  const firstSegment = pathname.split('/')[1]

  // 1. No (valid) locale prefix → redirect to the same path under a locale.
  if (!isLocale(firstSegment)) {
    const locale = pickLocale(request)
    const url = request.nextUrl.clone()
    url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`
    return NextResponse.redirect(url)
  }

  // 2. Split the locale from the logical path (e.g. /uz/settings -> /settings).
  const locale = firstSegment
  const rest = pathname.slice(`/${locale}`.length) || '/'

  // 3. Subdomain extraction
  const host = request.headers.get('host') || ''
  const sub = getSubdomain(host)

  const to = (path: string) => NextResponse.redirect(new URL(`/${locale}${path}`, request.url))
  const rewriteTo = (path: string) => {
    const res = NextResponse.rewrite(new URL(`/${locale}${path}`, request.url))
    if (sub) res.headers.set('x-subdomain', sub)
    return res
  }

  const getRootUrl = (path: string) => {
    const protocol = request.headers.get('x-forwarded-proto') || (host.includes('localhost') || host.includes('.test') || host.includes('172.') ? 'http' : 'https')
    const match = host.match(/^(?:([a-zA-Z0-9-]+)\.)?bronit\./)
    const baseDomain = match ? host.slice(match[1] ? match[1].length + 1 : 0) : host
    return new URL(`/${locale}${path}`, `${protocol}://${baseDomain}`)
  }

  const getSubdomainUrl = (path: string, targetSub: string) => {
    const protocol = request.headers.get('x-forwarded-proto') || (host.includes('localhost') || host.includes('.test') || host.includes('172.') ? 'http' : 'https')
    const match = host.match(/^(?:([a-zA-Z0-9-]+)\.)?bronit\./)
    const baseDomain = match ? host.slice(match[1] ? match[1].length + 1 : 0) : host
    return new URL(`/${locale}${path}`, `${protocol}://${targetSub}.${baseDomain}`)
  }

  const toHome = (session: SessionPayload) => {
    if (session.role === 'superadmin') return to('/dashboard')
    if (session.role === 'owner') return to('/dashboard')
    if (session.role === 'admin') return to('/calendar')
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url))
  }

  const sessionCookie = request.cookies.get('session')?.value
  const session = sessionCookie ? await decrypt(sessionCookie) : null

  // --- LEAKED DEMO COOKIE TRAP ----------------------------------------------
  if (!sub && session && session.companySlug === 'demo-hotels') {
    const rootLogin = new URL(`/${locale}/login`, request.url)
    const res = NextResponse.redirect(rootLogin)
    
    let rootDomain: string | undefined
    if (process.env.NODE_ENV === 'production') rootDomain = '.bronit.uz'
    else if (host.includes('bronit.test')) rootDomain = '.bronit.test'
    else if (host.includes('localhost')) rootDomain = undefined
    else rootDomain = host.split(':')[0]
    
    if (rootDomain) res.cookies.set('session', '', { maxAge: 0, domain: rootDomain, path: '/' })
    res.cookies.set('session', '', { maxAge: 0, path: '/' })
    return res
  }

  // --- SUBDOMAIN ROUTING ----------------------------------------------------
  if (sub) {
    let cleanRest = rest
    const tenantMatch = rest.match(/^\/secure\/company\/[a-z0-9-]+(?:\/admin\/[a-z0-9-]+)?(\/.*)?$/)
    if (tenantMatch) {
      cleanRest = tenantMatch[1] || '/'
    } else {
      const superMatch = rest.match(/^\/secure\/superadmin(\/.*)?$/)
      if (superMatch) cleanRest = superMatch[1] || '/'
    }

    if (sub === 'app') {
      if (cleanRest === '/login' || cleanRest === '/login/') {
        if (session && session.role === 'owner') return toHome(session)
        // If not logged in, just let them see the login page for app.
        return NextResponse.next()
      }
      // Guest menu is public — no auth required.
      if (cleanRest === '/menu' || cleanRest.startsWith('/menu/')) {
        return NextResponse.next()
      }
      if (!session || session.role !== 'owner') {
        return NextResponse.redirect(new URL(`/${locale}/login`, request.url))
      }
      const targetPath = `/secure/company/${session.companySlug}${cleanRest === '/' ? '/dashboard' : cleanRest}`
      return rewriteTo(targetPath)
    }

    if (sub === 'admin') {
      if (cleanRest === '/login' || cleanRest === '/login/') {
        if (session && session.role === 'admin') return toHome(session)
        // Serve login purely on admin branch
        return NextResponse.next()
      }
      if (!session || session.role !== 'admin') {
        return NextResponse.redirect(new URL(`/${locale}/login`, request.url))
      }
      const targetPath = `/secure/company/${session.companySlug}/admin/${session.hotelSlug}${cleanRest === '/' ? '/calendar' : cleanRest}`
      return rewriteTo(targetPath)
    }

    if (sub === 'super') {
      if (cleanRest === '/login' || cleanRest === '/login/' || cleanRest === '/') {
        if (session?.role === 'superadmin') return toHome(session)
        return cleanRest === '/' ? NextResponse.redirect(new URL(`/${locale}/login`, request.url)) : NextResponse.next()
      }
      if (!session || session.role !== 'superadmin') return NextResponse.redirect(new URL(`/${locale}/login`, request.url))
      return rewriteTo(`/secure/superadmin${cleanRest === '/' ? '/dashboard' : cleanRest}`)
    }

    if (sub === 'demo') {
      if (rest === '/login') {
        if (session) return toHome(session)
        return NextResponse.redirect(getRootUrl('/login'))
      }
      if (rest === '/' || rest === '/demo') {
        return rewriteTo('/demo')
      }
      // Demo logic requires auth
      if (!session) return NextResponse.redirect(getRootUrl('/login'))
      let targetPath = rest
      if (session.role === 'owner') {
        targetPath = `/secure/company/${session.companySlug}${rest === '/' ? '/dashboard' : rest}`
      } else if (session.role === 'admin') {
        targetPath = rest.startsWith('/admin/') ? `/secure/company/${session.companySlug}${rest}` : `/secure/company/${session.companySlug}/admin/${session.hotelSlug}${rest === '/' ? '/calendar' : rest}`
      } else {
        return NextResponse.redirect(getRootUrl('/login'))
      }
      return rewriteTo(targetPath)
    }

    // Any other unknown subdomain → redirect to the root domain.
    if (!isKnownSubdomain(sub)) {
      return NextResponse.redirect(getRootUrl(rest))
    }
  }

  // --- STANDARD DOMAIN ROUTING (No subdomain) -------------------------------
  
  if (!sub) {
    // When visitors click "Try the demo" on the landing page, bounce them to the demo subdomain.
    if (rest === '/demo' || rest.startsWith('/demo/')) {
      return NextResponse.redirect(getSubdomainUrl('/demo', 'demo'))
    }
  }

  // The marketing site is always public. 
  if (rest === '/') {
    return NextResponse.next()
  }

  // --- Universal login --------------------------------------------------------
  if (rest === '/login') {
    if (session) return toHome(session)
    return NextResponse.next()
  }

  // --- Legacy /secure/admin/{slug} paths → new /secure/company/{slug} --------
  const legacy = rest.match(LEGACY_TENANT_RE)
  if (legacy) {
    return to(`/secure/company/${legacy[1]}${legacy[2] || ''}`)
  }

  // --- Superadmin area --------------------------------------------------------
  if (rest === SUPERADMIN_LOGIN) {
    if (session?.role === 'superadmin') return toHome(session)
    if (session) return toHome(session)
    return NextResponse.next()
  }
  if (rest === '/secure/superadmin' || rest.startsWith('/secure/superadmin/')) {
    if (session?.role !== 'superadmin') return to(SUPERADMIN_LOGIN)
    if (rest === '/secure/superadmin') return toHome(session)
    return NextResponse.next()
  }

  // --- Company area (/secure/company/{slug}/...) ------------------------------
  const companyMatch = rest.match(COMPANY_RE)
  if (companyMatch) {
    const companySlug = companyMatch[1]
    const subRoute = companyMatch[2] || '/'

    // Nested hotel-admin area: /secure/company/{c}/admin/{h}/...
    const hotelMatch = subRoute.match(HOTEL_ADMIN_RE)
    if (hotelMatch) {
      const hotelSlug = hotelMatch[1]
      const hotelSub = hotelMatch[2] || '/'
      const loginPath = `/secure/company/${companySlug}/admin/${hotelSlug}/login`

      if (hotelSub === '/login') {
        if (session) return toHome(session)
        return NextResponse.next()
      }
      if (!session || session.role !== 'admin') {
        return session ? toHome(session) : to(loginPath)
      }
      if (session.companySlug !== companySlug || session.hotelSlug !== hotelSlug) {
        return toHome(session)
      }
      if (hotelSub === '/') return toHome(session)
      if (hotelSub.startsWith('/settings')) return toHome(session)
      return NextResponse.next()
    }

    // Owner area.
    const loginPath = `/secure/company/${companySlug}/login`
    if (subRoute === '/login') {
      if (session) return toHome(session)
      return NextResponse.next()
    }
    if (!session || session.role !== 'owner') {
      return session ? toHome(session) : to(loginPath)
    }
    if (session.companySlug !== companySlug) {
      return toHome(session)
    }
    if (subRoute === '/') return toHome(session)
    return NextResponse.next()
  }

  // Anything else under /secure is unknown → send to the universal login.
  if (rest.startsWith('/secure')) {
    return session ? toHome(session) : to('/login')
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next|favicon.ico).*)'],
}
