import { NextRequest, NextResponse } from 'next/server'
import { decrypt, sessionHome, type SessionPayload } from '@/lib/session'
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale } from '@/i18n/config'

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
  const to = (path: string) => NextResponse.redirect(new URL(`/${locale}${path}`, request.url))
  const toHome = (session: SessionPayload) => to(sessionHome(session))

  // The marketing site and the demo are always public. A logged-in visitor is
  // deliberately NOT auto-redirected away from the landing page — they only
  // re-enter their area via /secure/... or the login button.
  if (rest === '/' || rest === '/demo' || rest.startsWith('/demo/')) {
    return NextResponse.next()
  }

  const sessionCookie = request.cookies.get('session')?.value
  const session = sessionCookie ? await decrypt(sessionCookie) : null

  // --- Universal login --------------------------------------------------------
  // Clicking "Sign in" while already authenticated goes straight home.
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
    const sub = companyMatch[2] || '/'

    // Nested hotel-admin area: /secure/company/{c}/admin/{h}/...
    const hotelMatch = sub.match(HOTEL_ADMIN_RE)
    if (hotelMatch) {
      const hotelSlug = hotelMatch[1]
      const hotelSub = hotelMatch[2] || '/'
      const loginPath = `/secure/company/${companySlug}/admin/${hotelSlug}/login`

      if (hotelSub === '/login') {
        if (session) return toHome(session)
        return NextResponse.next()
      }
      if (!session || session.role !== 'admin') {
        // Owners (and superadmin) belong elsewhere; guests go to this login.
        return session ? toHome(session) : to(loginPath)
      }
      if (session.companySlug !== companySlug || session.hotelSlug !== hotelSlug) {
        return toHome(session)
      }
      if (hotelSub === '/') return toHome(session)
      // Hotel admins never get Settings.
      if (hotelSub.startsWith('/settings')) return toHome(session)
      return NextResponse.next()
    }

    // Owner area.
    const loginPath = `/secure/company/${companySlug}/login`
    if (sub === '/login') {
      if (session) return toHome(session)
      return NextResponse.next()
    }
    if (!session || session.role !== 'owner') {
      return session ? toHome(session) : to(loginPath)
    }
    if (session.companySlug !== companySlug) {
      return toHome(session)
    }
    if (sub === '/') return toHome(session)
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
