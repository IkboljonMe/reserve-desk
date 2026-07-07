import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Contract } from '@/models/Contract'
import { getSession } from '@/lib/session'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''

  await connectDB()

  const filter: Record<string, unknown> = {}
  if (search) {
    filter.$or = [
      { organizationName: { $regex: search, $options: 'i' } },
      { contractNumber: { $regex: search, $options: 'i' } },
      { inn: { $regex: search, $options: 'i' } },
      { representativeName: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ]
  }
  if (status) filter.status = status

  const contracts = await Contract.find(filter).sort({ finishDate: 1, createdAt: -1 }).lean()
  return Response.json(contracts)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    if (!body.organizationName?.trim()) {
      return Response.json({ error: 'Organization name is required' }, { status: 400 })
    }

    await connectDB()
    const contract = await Contract.create({
      organizationName: body.organizationName,
      inn: body.inn || '',
      representativeName: body.representativeName || '',
      phone: body.phone || '',
      contractNumber: body.contractNumber || '',
      signDate: body.signDate || null,
      finishDate: body.finishDate || null,
      status: body.status || 'awaiting',
      contractLink: body.contractLink || '',
      notes: body.notes || '',
      reminderDays: Array.isArray(body.reminderDays) ? body.reminderDays : [30, 7],
      dismissedReminders: [],
    })
    return Response.json(contract, { status: 201 })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Failed to create contract' }, { status: 500 })
  }
}
