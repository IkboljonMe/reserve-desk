import { connectDB } from '@/lib/mongodb'
import { Admin } from '@/models/Admin'
import { requireSuperadmin } from '@/lib/session'

// Superadmin-only view of every login (owner + hotel admins) under one company,
// so login details can be handed to a customer without ever storing plaintext
// passwords — passwords are reset (see [id], not read back.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSuperadmin()
  if (session instanceof Response) return session

  const { id } = await params
  await connectDB()

  const admins = await Admin.find({ companyId: id, role: { $in: ['owner', 'admin'] } })
    .select('-password')
    .populate('hotelId', 'name shortName')
    .sort({ role: 1, createdAt: 1 })
    .lean()

  return Response.json(admins)
}
