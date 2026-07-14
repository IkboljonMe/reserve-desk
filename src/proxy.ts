import { NextRequest, NextResponse } from 'next/server'
import { decrypt, sessionHome, type SessionPayload } from '@/lib/session'
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale } from '@/i18n/config'
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
// (cookie) first, then the browser's Accept-Language, then the default.
function pickLocale(request: NextRequest): string {
  const cookie = request.cookies.get(LOCALE_COOKIE)?.value
  if (isLocale(cookie)) return cookie

  const header = request.headers.get('accept-language') || ''
  const preferred = header.split(',')[0]?.split('-')[0]?.toLowerCase()
  if (isLocale(preferred)) return preferred

  return DEFAULT_LOCALE
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
    const baseDomain = host.replace(/^(app|admin|demo|[\w-]+)\./, '')
    return new URL(`/${locale}${path}`, `${protocol}://${baseDomain}`)
  }

  const getSubdomainUrl = (path: string, targetSub: string) => {
    const protocol = request.headers.get('x-forwarded-proto') || (host.includes('localhost') || host.includes('.test') || host.includes('172.') ? 'http' : 'https')
    const baseDomain = host.replace(/^(app|admin|demo|[\w-]+)\./, '')
    return new URL(`/${locale}${path}`, `${protocol}://${targetSub}.${baseDomain}`)
  }

  const toHome = (session: SessionPayload) => {
    if (session.role === 'superadmin') {
      if (sub === 'admin') return to('/dashboard')
      return NextResponse.redirect(getSubdomainUrl('/dashboard', 'admin'))
    }
    if (session.role === 'owner') {
      if (sub === session.companySlug || sub === 'app' || sub === 'demo') return to('/dashboard')
      return NextResponse.redirect(getSubdomainUrl('/dashboard', session.companySlug || 'app'))
    }
    if (session.role === 'admin') {
      if (sub === session.hotelSlug) return to('/calendar')
      if (sub === 'app' || sub === 'demo') return to(`/admin/${session.hotelSlug}/calendar`)
      return NextResponse.redirect(getSubdomainUrl('/calendar', session.hotelSlug || 'app'))
    }
    return NextResponse.redirect(getRootUrl('/login'))
  }

  const sessionCookie = request.cookies.get('session')?.value
  const session = sessionCookie ? await decrypt(sessionCookie) : null

  // --- LEAKED DEMO COOKIE TRAP ----------------------------------------------
  // If the user's browser cached a global demo cookie prior to our isolatedDomain 
  // fix, they are trapped. We explicitly annihilate it if seen on the root domain.
  if (!sub && session && session.companySlug === 'demo-hotels') {
    const rootLogin = new URL(`/${locale}/login`, request.url)
    const res = NextResponse.redirect(rootLogin)
    
    let rootDomain: string | undefined
    if (process.env.NODE_ENV === 'production') rootDomain = '.smartix.uz'
    else if (host.includes('smartix.test')) rootDomain = '.smartix.test'
    else if (host.includes('localhost')) rootDomain = undefined
    else rootDomain = host.split(':')[0]
    
    // Delete both the wildcard domain and host-specific versions
    if (rootDomain) res.cookies.set('session', '', { maxAge: 0, domain: rootDomain, path: '/' })
    res.cookies.set('session', '', { maxAge: 0, path: '/' })
    return res
  }

  // --- SUBDOMAIN ROUTING ----------------------------------------------------
  if (sub) {
    if (sub === 'app' || sub === 'demo') {
      if (rest === '/login') {
        if (session) return toHome(session)
        return NextResponse.redirect(getRootUrl('/login'))
      }
      
      if (sub === 'demo' && (rest === '/' || rest === '/demo')) {
        return rewriteTo('/demo')
      }

      // Everything else on app/demo subdomains require auth to rewrite to secure paths
      if (!session) {
        return NextResponse.redirect(getRootUrl('/login'))
      }

      let targetPath = rest
      if (session.role === 'owner') {
        targetPath = `/secure/company/${session.companySlug}${rest === '/' ? '/dashboard' : rest}`
      } else if (session.role === 'admin') {
        if (rest.startsWith('/admin/')) {
          targetPath = `/secure/company/${session.companySlug}${rest}`
        } else if (rest === '/') {
          targetPath = `/secure/company/${session.companySlug}/admin/${session.hotelSlug}/calendar`
        } else {
          targetPath = `/secure/company/${session.companySlug}/admin/${session.hotelSlug}${rest}`
        }
      } else {
        return NextResponse.redirect(getRootUrl('/login'))
      }
      
      return rewriteTo(targetPath)
    }

    if (sub === 'admin') {
      if (rest === '/login' || rest === '/') {
        if (session?.role === 'superadmin') return toHome(session)
        return NextResponse.redirect(getRootUrl('/login'))
      }
      if (!session || session.role !== 'superadmin') return NextResponse.redirect(getRootUrl('/login'))
      
      return rewriteTo(`/secure/superadmin${rest === '/' ? '/dashboard' : rest}`)
    }

    if (!isKnownSubdomain(sub)) {
      if (rest === '/login') {
        if (session) return toHome(session)
        return NextResponse.redirect(getRootUrl('/login'))
      }

      if (session?.role === 'owner' && session.companySlug === sub) {
         if (rest === '/') return rewriteTo(`/hotel/${sub}`)
         return rewriteTo(`/secure/company/${sub}${rest}`)
      }
      
      if (session?.role === 'admin' && session.hotelSlug === sub) {
         if (rest === '/') return rewriteTo(`/hotel/${sub}`)
         return rewriteTo(`/secure/company/${session.companySlug}/admin/${session.hotelSlug}${rest}`)
      }

      if (!session && ['/dashboard', '/calendar', '/settings', '/bookings', '/clients', '/staff'].some(r => rest.startsWith(r))) {
         return NextResponse.redirect(getRootUrl('/login'))
      }

      return rewriteTo(`/hotel/${sub}${rest === '/' ? '' : rest}`)
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
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
