import { NextRequest, NextResponse } from 'next/server'
import { decrypt } from '@/lib/session'
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale } from '@/i18n/config'

// Paths (locale-stripped) that don't require an authenticated session.
const PUBLIC_ROUTES = ['/login']

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

  const isPublicRoute = PUBLIC_ROUTES.some((route) => rest === route || rest.startsWith(`${route}/`))

  const sessionCookie = request.cookies.get('session')?.value
  const session = sessionCookie ? await decrypt(sessionCookie) : null

  if (!session && !isPublicRoute) {
    return to('/login')
  }

  if (session) {
    const isOwner = session.role === 'owner'
    const isSettings = rest.startsWith('/settings')

    // Landing after login, plus a hard redirect off the locale root.
    if (rest === '/login' || rest === '/') {
      return to(isOwner ? '/dashboard' : '/calendar')
    }

    // The owner may access everything (all hotels + settings); admins can use
    // every operational page but are kept out of Settings.
    if (!isOwner && isSettings) {
      return to('/calendar')
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
