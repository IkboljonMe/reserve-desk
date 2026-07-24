import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Order } from '@/models/Order'
import { requireSuperadmin } from '@/lib/session'
import { readOrderFields } from '@/lib/offerings'

export async function GET() {
  const session = await requireSuperadmin()
  if (session instanceof Response) return session

  await connectDB()
  const orders = await Order.find().sort({ createdAt: -1 }).lean()
  return Response.json(orders)
}

export async function POST(req: NextRequest) {
  const session = await requireSuperadmin()
  if (session instanceof Response) return session

  try {
    const body = await req.json()
    const fields = readOrderFields(body)

    if (!fields.businessName) return Response.json({ error: 'Business name is required' }, { status: 400 })
    if (fields.lines.length === 0) return Response.json({ error: 'Add at least one item to the order' }, { status: 400 })

    await connectDB()
    const order = await Order.create({ ...fields, status: 'draft' })
    return Response.json(order, { status: 201 })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Failed to create order' }, { status: 500 })
  }
}
