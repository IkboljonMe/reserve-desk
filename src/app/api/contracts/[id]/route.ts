import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Contract } from '@/models/Contract'
import { requireDashboard, requireWritable, idScope } from '@/lib/session'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireDashboard()
  if (session instanceof Response) return session
  const blocked = await requireWritable(session)
  if (blocked) return blocked

  try {
    const { id } = await params
    const body = await req.json()

    const update: Record<string, unknown> = {}
    for (const key of [
      'organizationName', 'inn', 'representativeName', 'phone',
      'contractNumber', 'status', 'contractLink', 'notes',
    ] as const) {
      if (body[key] !== undefined) update[key] = body[key]
    }
    // Dates: allow clearing to null.
    if (body.signDate !== undefined) update.signDate = body.signDate || null
    if (body.finishDate !== undefined) update.finishDate = body.finishDate || null
    if (Array.isArray(body.reminderDays)) update.reminderDays = body.reminderDays

    // Editing the contract's reminder config or finish date resets both the
    // in-app dismissals and the Telegram-sent tiers, so fresh reminders can
    // fire (and re-post to the group) against the new schedule.
    if (body.finishDate !== undefined || body.reminderDays !== undefined) {
      update.dismissedReminders = []
      update.telegramSentReminders = []
    }

    await connectDB()
    const contract = await Contract.findOneAndUpdate(idScope(session, id), update, { new: true }).lean()
    if (!contract) return Response.json({ error: 'Not found' }, { status: 404 })
    return Response.json(contract)
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Failed to update contract' }, { status: 500 })
  }
}

// PATCH is used to dismiss a single reminder tier without touching the rest of
// the contract (called from the Notifications page).
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireDashboard()
  if (session instanceof Response) return session
  const blocked = await requireWritable(session)
  if (blocked) return blocked

  try {
    const { id } = await params
    const body = await req.json()
    await connectDB()

    if (typeof body.dismissReminder === 'number') {
      const contract = await Contract.findOneAndUpdate(
        idScope(session, id),
        { $addToSet: { dismissedReminders: body.dismissReminder } },
        { new: true },
      ).lean()
      if (!contract) return Response.json({ error: 'Not found' }, { status: 404 })
      return Response.json(contract)
    }

    return Response.json({ error: 'Nothing to update' }, { status: 400 })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Failed to update contract' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireDashboard()
  if (session instanceof Response) return session
  const blocked = await requireWritable(session)
  if (blocked) return blocked

  try {
    const { id } = await params
    await connectDB()
    await Contract.findOneAndDelete(idScope(session, id))
    return Response.json({ ok: true })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Failed to delete contract' }, { status: 500 })
  }
}
