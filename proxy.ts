import { NextRequest, NextResponse } from 'next/server'
import { decrypt } from '@/lib/session'

const PUBLIC_ROUTES = ['/login']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route))

  const sessionCookie = request.cookies.get('session')?.value
  const session = sessionCookie ? await decrypt(sessionCookie) : null

  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (session) {
    const isOwner = session.role === 'owner'
    const isSettings = pathname.startsWith('/settings')

    // Landing after login, plus a hard redirect off the root.
    if (pathname === '/login' || pathname === '/') {
      return NextResponse.redirect(new URL(isOwner ? '/dashboard' : '/calendar', request.url))
    }

    // The owner may access everything (all hotels + settings); admins can use
    // every operational page but are kept out of Settings.
    if (!isOwner && isSettings) {
      return NextResponse.redirect(new URL('/calendar', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
