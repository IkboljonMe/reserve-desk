import { NextRequest, NextResponse } from 'next/server'
import { decrypt, createSession, SessionRole } from '@/lib/session'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const token = url.searchParams.get('token')
  const dest = url.searchParams.get('dest') || '/'

  if (!token) return NextResponse.redirect(new URL('/login', req.url))

  const payload: any = await decrypt(token)
  if (!payload || payload.purpose !== 'sso_transfer') {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  await createSession(
    payload.userId,
    payload.email,
    payload.name,
    payload.role as SessionRole,
    payload.companyId,
    payload.companySlug,
    payload.hotelId,
    payload.hotelSlug,
    true // isolatedDomain: forces host-only cookie on the exact target subdomain
  )

  return NextResponse.redirect(new URL(dest, req.url))
}
