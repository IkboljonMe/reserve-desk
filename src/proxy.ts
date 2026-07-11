import { NextRequest, NextResponse } from 'next/server'
import { decrypt } from '@/lib/session'
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale } from '@/i18n/config'

// A request for a static file — its last path segment has an extension, e.g.
// /assets/logo-safir.png. These must never be locale-redirected.
const PUBLIC_FILE = /\.[^/]+$/

const SUPERADMIN_LOGIN = '/secure/superadmin/login'
// Matches /secure/admin/{slug}(/rest...) and captures slug + the trailing path.
const TENANT_RE = /^\/secure\/admin\/([a-z0-9-]+)(\/.*)?$/

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

  // The public marketing site and the standalone (localStorage-only, no real
  // auth) demo are never gated — always pass through untouched.
  if (rest === '/' || rest === '/demo' || rest.startsWith('/demo/')) {
    // A logged-in user landing on the bare marketing root gets sent to their
    // own area instead of seeing the pitch again.
    if (rest === '/') {
      const sessionCookie = request.cookies.get('session')?.value
      const session = sessionCookie ? await decrypt(sessionCookie) : null
      if (session?.role === 'superadmin') return to('/secure/superadmin/dashboard')
      if (session?.companySlug) {
        return to(`/secure/admin/${session.companySlug}/${session.role === 'owner' ? 'dashboard' : 'calendar'}`)
      }
    }
    return NextResponse.next()
  }

  const sessionCookie = request.cookies.get('session')?.value
  const session = sessionCookie ? await decrypt(sessionCookie) : null

  // --- Superadmin area ------------------------------------------------------
  if (rest === SUPERADMIN_LOGIN) {
    if (session?.role === 'superadmin') return to('/secure/superadmin/dashboard')
    return NextResponse.next()
  }
  if (rest === '/secure/superadmin' || rest.startsWith('/secure/superadmin/')) {
    if (session?.role !== 'superadmin') return to(SUPERADMIN_LOGIN)
    if (rest === '/secure/superadmin') return to('/secure/superadmin/dashboard')
    return NextResponse.next()
  }

  // --- Tenant area (/secure/admin/{slug}/...) ------------------------------
  const tenantMatch = rest.match(TENANT_RE)
  if (tenantMatch) {
    const slug = tenantMatch[1]
    const sub = tenantMatch[2] || '/'
    const home = (s: string) => `/secure/admin/${slug}/${s}`

    if (sub === '/login') {
      // Already signed in? Bounce to wherever they actually belong (which may
      // be a different slug than the one in this URL).
      if (session?.companySlug) {
        return to(`/secure/admin/${session.companySlug}/${session.role === 'owner' ? 'dashboard' : 'calendar'}`)
      }
      return NextResponse.next()
    }

    if (!session || (session.role !== 'owner' && session.role !== 'admin')) {
      return to(home('login'))
    }
    // Logged in, but for a different tenant than this URL names — send them
    // to their own slug instead of leaking whether this one exists.
    if (session.companySlug !== slug) {
      return to(`/secure/admin/${session.companySlug}/${session.role === 'owner' ? 'dashboard' : 'calendar'}`)
    }

    const isOwner = session.role === 'owner'
    const isSettings = sub.startsWith('/settings')

    if (sub === '/') {
      return to(home(isOwner ? 'dashboard' : 'calendar'))
    }
    if (!isOwner && isSettings) {
      return to(home('calendar'))
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
