import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/mongodb'
import { Company } from '@/models/Company'

const SESSION_SECRET = process.env.SESSION_SECRET!
const encodedKey = new TextEncoder().encode(SESSION_SECRET)

export type SessionRole = 'superadmin' | 'owner' | 'admin'

export interface SessionPayload {
  userId: string
  email: string
  name: string
  role: SessionRole
  // The tenant this account belongs to; null only for superadmin (global).
  companyId: string | null
  // The tenant's URL slug (/secure/company/{slug}/...); null only for superadmin.
  companySlug: string | null
  // The hotel an admin is scoped to; null for the owner and for superadmin.
  hotelId: string | null
  // The hotel's URL slug (/secure/company/{c}/admin/{slug}/...); admin only.
  hotelSlug: string | null
  expiresAt: Date
}

// Where a session naturally lands after login (locale-less; caller prefixes it).
export function sessionHome(session: SessionPayload, subdomain: string | null = null): string {
  if (session.role === 'superadmin') {
    return subdomain === 'admin' ? '/dashboard' : '/secure/superadmin/dashboard'
  }
  if (session.role === 'owner') {
    return subdomain === 'app' ? '/dashboard' : `/secure/company/${session.companySlug}/dashboard`
  }
  return subdomain === 'app' ? `/admin/${session.hotelSlug}/calendar` : `/secure/company/${session.companySlug}/admin/${session.hotelSlug}/calendar`
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
  companyId: string | null,
  companySlug: string | null,
  hotelId: string | null,
  hotelSlug: string | null,
  isolatedDomain: boolean = false
) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const session = await encrypt({ userId, email, name, role, companyId, companySlug, hotelId, hotelSlug, expiresAt })
  const cookieStore = await cookies()
  
  // Set the cookie at the base domain level so it is accessible across subdomains
  const rootDomain = process.env.NODE_ENV === 'production' ? '.smartix.uz' : '.smartix.test'

  const cookieOptions: any = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  }
  
  if (!isolatedDomain) {
    cookieOptions.domain = rootDomain
  }

  cookieStore.set('session', session, cookieOptions)
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')?.value
  if (!sessionCookie) return null
  return decrypt(sessionCookie)
}

export async function deleteSession() {
  const cookieStore = await cookies()
  const domain = process.env.NODE_ENV === 'production' ? '.smartix.uz' : '.smartix.test'
  
  // Next.js standard cookie deletion only targets the immediate host footprint.
  // Since we rely on wildcard cross-tenant `.smartix.test` domain cookies, we
  // must overwrite them with an impossible maxAge using the explicit domain property.
  cookieStore.set('session', '', { maxAge: 0, domain, path: '/' })
  cookieStore.set('session', '', { maxAge: 0, path: '/' })
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
export type AdminSession = SessionPayload & { hotelId: string; companyId: string }
// An owner/admin session always has a concrete companyId (unlike superadmin's null).
export type TenantSession = SessionPayload & { companyId: string }

export async function requireAdmin(): Promise<AdminSession | Response> {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.role !== 'admin' || !session.hotelId || !session.companyId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }
  return session as AdminSession
}

export async function requireOwner(): Promise<TenantSession | Response> {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.role !== 'owner' || !session.companyId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }
  return session as TenantSession
}

export async function requireSuperadmin(): Promise<SessionPayload | Response> {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.role !== 'superadmin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }
  return session
}

// Any authenticated tenant user (owner or admin — excludes superadmin).
// Operational pages use this together with hotelScope()/writeHotelId() so the
// owner sees/acts across all their company's hotels while an admin stays
// confined to their own.
export async function requireDashboard(): Promise<TenantSession | Response> {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.role === 'superadmin' || !session.companyId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }
  return session as TenantSession
}

// Whether a company's plan expiry date has passed. Kept as a plain function
// (not inlined at each call site) so the impure `Date.now()` read doesn't
// happen directly inside a component's render body.
export function isCompanyExpired(expiresAt: Date): boolean {
  return expiresAt.getTime() < Date.now()
}

// Blocks writes for a tenant whose plan has expired. Call from every
// POST/PUT/PATCH/DELETE handler right after the role guard. Read (GET) routes
// are never blocked — an expired company stays browsable, just not editable.
export async function requireWritable(session: TenantSession): Promise<Response | null> {
  await connectDB()
  const company = await Company.findById(session.companyId).select('expiresAt').lean<{ expiresAt: Date }>()
  if (company && isCompanyExpired(company.expiresAt)) {
    return Response.json(
      { error: 'Your plan has expired. The account is read-only until it is renewed — contact support.' },
      { status: 403 }
    )
  }
  return null
}

// Mongo filter for list/read queries: every hotel in the tenant's company for
// the owner, or the admin's single hotel. Always scoped to the tenant.
export function hotelScope(session: TenantSession): Record<string, unknown> {
  return session.role === 'owner'
    ? { companyId: session.companyId }
    : { companyId: session.companyId, hotelId: session.hotelId }
}

// Same idea but for targeting one document by id.
export function idScope(session: TenantSession, id: string): Record<string, unknown> {
  return session.role === 'owner'
    ? { _id: id, companyId: session.companyId }
    : { _id: id, companyId: session.companyId, hotelId: session.hotelId }
}

// Booking-specific id scope. A booking is attributed to the service owner hotel
// (hotelId) but may have been made by a different, sharing hotel (bookedByHotelId).
// An admin may manage a booking their hotel owns OR one their hotel made.
export function bookingIdScope(session: TenantSession, id: string): Record<string, unknown> {
  if (session.role === 'owner') return { _id: id, companyId: session.companyId }
  return {
    _id: id,
    companyId: session.companyId,
    $or: [{ hotelId: session.hotelId }, { bookedByHotelId: session.hotelId }],
  }
}

// Resolve which hotel a newly-created record belongs to. Admins always use their
// own hotel; the owner must name one (from the request body). Returns null when
// the owner failed to supply a valid hotel.
export function writeHotelId(session: TenantSession, bodyHotelId: unknown): string | null {
  if (session.role !== 'owner') return session.hotelId
  return typeof bodyHotelId === 'string' && bodyHotelId ? bodyHotelId : null
}
