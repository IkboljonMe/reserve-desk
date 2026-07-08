import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const SESSION_SECRET = process.env.SESSION_SECRET!
const encodedKey = new TextEncoder().encode(SESSION_SECRET)

export type SessionRole = 'owner' | 'admin'

export interface SessionPayload {
  userId: string
  email: string
  name: string
  role: SessionRole
  // The hotel an admin is scoped to; null for the owner.
  hotelId: string | null
  expiresAt: Date
}

export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey)
}

export async function decrypt(session: string | undefined = '') {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    })
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

export async function createSession(
  userId: string,
  email: string,
  name: string,
  role: SessionRole,
  hotelId: string | null,
) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const session = await encrypt({ userId, email, name, role, hotelId, expiresAt })
  const cookieStore = await cookies()

  cookieStore.set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  })
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')?.value
  if (!sessionCookie) return null
  return decrypt(sessionCookie)
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}

export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession()
  if (!session) redirect('/login')
  return session
}

// ---- API authorization helpers ----------------------------------------------
// Each returns either the authorized session, or a Response the route should
// return immediately. Usage:
//   const s = await requireAdmin(); if (s instanceof Response) return s

// An admin session always has a concrete hotelId (unlike the owner's null).
export type AdminSession = SessionPayload & { hotelId: string }

export async function requireAdmin(): Promise<AdminSession | Response> {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.role !== 'admin' || !session.hotelId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }
  return session as AdminSession
}

export async function requireOwner(): Promise<SessionPayload | Response> {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.role !== 'owner') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }
  return session
}

// Any authenticated user (owner or admin). Operational pages use this together
// with hotelScope()/writeHotelId() so the owner sees/acts across all hotels
// while an admin stays confined to their own.
export async function requireDashboard(): Promise<SessionPayload | Response> {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  return session
}

// Mongo filter for list/read queries: empty (all hotels) for the owner, or the
// admin's single hotel.
export function hotelScope(session: SessionPayload): Record<string, unknown> {
  return session.role === 'owner' ? {} : { hotelId: session.hotelId }
}

// Same idea but for targeting one document by id.
export function idScope(session: SessionPayload, id: string): Record<string, unknown> {
  return session.role === 'owner' ? { _id: id } : { _id: id, hotelId: session.hotelId }
}

// Resolve which hotel a newly-created record belongs to. Admins always use their
// own hotel; the owner must name one (from the request body). Returns null when
// the owner failed to supply a valid hotel.
export function writeHotelId(session: SessionPayload, bodyHotelId: unknown): string | null {
  if (session.role !== 'owner') return session.hotelId
  return typeof bodyHotelId === 'string' && bodyHotelId ? bodyHotelId : null
}
