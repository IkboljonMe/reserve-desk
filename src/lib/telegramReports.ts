import type { Types } from 'mongoose'
import { connectDB } from '@/lib/mongodb'
import { Hotel } from '@/models/Hotel'
import { MenuOrder } from '@/models/MenuOrder'
import { Booking } from '@/models/Booking'
import { GuestReview } from '@/models/GuestReview'
import { TelegramConfig } from '@/models/TelegramConfig'
import { sendMessage, ensureReportsTopic, money } from '@/lib/telegram'
import { nowUZ, formatUZ } from '@/lib/timezone'

// Group-chat reports for the Telegram bot: today's orders, active (in-progress)
// orders, and income — plus the end-of-day summary. Everything is scoped to one
// company and broken down per hotel, so a reception team reads its own numbers.

// Menu-order statuses that still need action (not delivered, not cancelled).
const ACTIVE_STATUSES = ['pending', 'preparing', 'ready'] as const

// Start/end UTC instants of a UZ calendar day. offsetDays shifts the day:
// 0 = today, -1 = yesterday (used by the end-of-day report just after midnight).
export function dayBoundsUZ(offsetDays = 0): { start: Date; end: Date; label: string } {
  const now = nowUZ()
  const wallMidnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + offsetDays)
  const UZ_OFFSET = 5 * 60 * 60 * 1000
  const start = new Date(wallMidnight - UZ_OFFSET)
  const end = new Date(wallMidnight + 24 * 60 * 60 * 1000 - UZ_OFFSET)
  const label = formatUZ(start, { day: '2-digit', month: 'long', year: 'numeric' })
  return { start, end, label }
}

// Start/end UTC instants of a UZ calendar month. offsetMonths shifts it:
// 0 = current month, -1 = last month (used by the end-of-month report).
export function monthBoundsUZ(offsetMonths = 0): { start: Date; end: Date; label: string } {
  const now = nowUZ()
  const UZ_OFFSET = 5 * 60 * 60 * 1000
  const startWall = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offsetMonths, 1)
  const endWall = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offsetMonths + 1, 1)
  const start = new Date(startWall - UZ_OFFSET)
  const end = new Date(endWall - UZ_OFFSET)
  const label = formatUZ(start, { month: 'long', year: 'numeric' })
  return { start, end, label }
}

interface HotelRef {
  _id: Types.ObjectId
  name: string
  shortName: string
}

async function hotelsOf(companyId: Types.ObjectId | string): Promise<HotelRef[]> {
  return Hotel.find({ companyId }).select('name shortName').lean<HotelRef[]>()
}

const nameOf = (h: HotelRef) => h.name || h.shortName || '—'

export interface HotelIncome {
  hotelId: string
  name: string
  orders: number          // non-cancelled menu orders in range
  menuRevenue: number     // sum of those orders' totals
  bookings: number        // non-cancelled bookings created in range
  bookingsCollected: number // money actually collected on them
  income: number          // menuRevenue + bookingsCollected
}

export interface DayReport {
  label: string
  hotels: HotelIncome[]
  totalIncome: number
  totalOrders: number
}

// Per-hotel income for a company across a time range (menu orders + bookings).
export async function getIncomeReport(
  companyId: Types.ObjectId | string,
  start: Date,
  end: Date,
): Promise<DayReport> {
  await connectDB()
  const hotels = await hotelsOf(companyId)

  const [orders, bookings] = await Promise.all([
    MenuOrder.find({
      companyId,
      status: { $ne: 'cancelled' },
      createdAt: { $gte: start, $lt: end },
    }).select('hotelId total').lean<{ hotelId: Types.ObjectId; total: number }[]>(),
    Booking.find({
      companyId,
      status: { $ne: 'cancelled' },
      createdAt: { $gte: start, $lt: end },
    }).select('hotelId amountPaid').lean<{ hotelId: Types.ObjectId; amountPaid: number }[]>(),
  ])

  const rows: HotelIncome[] = hotels.map(h => {
    const id = h._id.toString()
    const hOrders = orders.filter(o => o.hotelId?.toString() === id)
    const hBookings = bookings.filter(b => b.hotelId?.toString() === id)
    const menuRevenue = hOrders.reduce((s, o) => s + (o.total || 0), 0)
    const bookingsCollected = hBookings.reduce((s, b) => s + (b.amountPaid || 0), 0)
    return {
      hotelId: id,
      name: nameOf(h),
      orders: hOrders.length,
      menuRevenue,
      bookings: hBookings.length,
      bookingsCollected,
      income: menuRevenue + bookingsCollected,
    }
  })

  return {
    label: '',
    hotels: rows,
    totalIncome: rows.reduce((s, r) => s + r.income, 0),
    totalOrders: rows.reduce((s, r) => s + r.orders, 0),
  }
}

/* ------------------------------- Messages ------------------------------- */

// /income — today's income per hotel and the total.
export async function buildIncomeMessage(companyId: Types.ObjectId | string): Promise<string> {
  const { start, end, label } = dayBoundsUZ(0)
  const report = await getIncomeReport(companyId, start, end)
  const lines = [`💰 <b>Доход за сегодня</b> (${label})`, '']
  const active = report.hotels.filter(h => h.income > 0 || h.orders > 0 || h.bookings > 0)
  if (active.length === 0) {
    lines.push('Пока нет дохода за сегодня.')
  } else {
    for (const h of active) {
      lines.push(`🏢 <b>${h.name}</b>: ${money(h.income)} сум`)
    }
    lines.push('', `Σ <b>Итого: ${money(report.totalIncome)} сум</b>`)
  }
  return lines.join('\n')
}

// /orders — today's menu orders, newest first (compact list).
export async function buildOrdersMessage(companyId: Types.ObjectId | string): Promise<string> {
  await connectDB()
  const { start, end, label } = dayBoundsUZ(0)
  const [hotels, orders] = await Promise.all([
    hotelsOf(companyId),
    MenuOrder.find({
      companyId,
      status: { $ne: 'cancelled' },
      createdAt: { $gte: start, $lt: end },
    })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean<{ _id: Types.ObjectId; hotelId: Types.ObjectId; roomNumber: string; total: number; status: string }[]>(),
  ])
  const hotelName = (id: Types.ObjectId) =>
    nameOf(hotels.find(h => h._id.toString() === id?.toString()) || ({} as HotelRef))

  const lines = [`🧾 <b>Заказы за сегодня</b> (${label})`, '']
  if (orders.length === 0) {
    lines.push('Заказов за сегодня пока нет.')
  } else {
    for (const o of orders) {
      lines.push(
        `#${o._id.toString().slice(-6).toUpperCase()} · ${hotelName(o.hotelId)} · №${o.roomNumber} · ${money(o.total)} сум · ${STATUS_RU[o.status] ?? o.status}`,
      )
    }
    lines.push('', `Всего: ${orders.length}`)
  }
  return lines.join('\n')
}

// /active-orders — menu orders still in progress (need action), any day.
export async function buildActiveOrdersMessage(companyId: Types.ObjectId | string): Promise<string> {
  await connectDB()
  const [hotels, orders] = await Promise.all([
    hotelsOf(companyId),
    MenuOrder.find({ companyId, status: { $in: ACTIVE_STATUSES } })
      .sort({ createdAt: 1 })
      .limit(40)
      .lean<{ _id: Types.ObjectId; hotelId: Types.ObjectId; roomNumber: string; total: number; status: string }[]>(),
  ])
  const hotelName = (id: Types.ObjectId) =>
    nameOf(hotels.find(h => h._id.toString() === id?.toString()) || ({} as HotelRef))

  const lines = ['⏳ <b>Активные заказы</b>', '']
  if (orders.length === 0) {
    lines.push('Активных заказов нет 👍')
  } else {
    for (const o of orders) {
      lines.push(
        `#${o._id.toString().slice(-6).toUpperCase()} · ${hotelName(o.hotelId)} · №${o.roomNumber} · ${money(o.total)} сум · ${STATUS_RU[o.status] ?? o.status}`,
      )
    }
    lines.push('', `Всего: ${orders.length}`)
  }
  return lines.join('\n')
}

// End-of-day summary for the day that just ended (per hotel + total).
export async function buildDailyReportMessage(companyId: Types.ObjectId | string): Promise<string | null> {
  const { start, end, label } = dayBoundsUZ(-1)
  const report = await getIncomeReport(companyId, start, end)
  const lines = [`📊 <b>Итоги дня</b> (${label})`, '']
  for (const h of report.hotels) {
    lines.push(`🏢 <b>${h.name}</b>: ${money(h.income)} сум · заказов: ${h.orders}`)
  }
  lines.push('', `Σ <b>Итого за день: ${money(report.totalIncome)} сум</b>`, `Всего заказов: ${report.totalOrders}`)
  return lines.join('\n')
}

const STATUS_RU: Record<string, string> = {
  pending: '🆕 новый',
  preparing: '👨‍🍳 готовится',
  ready: '✅ готово',
  delivered: '📦 доставлено',
  cancelled: '🚫 отменён',
}

const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(Math.max(0, 5 - n))

// The day's guest reviews, or null if none were left. Posted alongside the
// end-of-day report so the team sees the feedback in one place.
export async function buildDailyReviewsMessage(
  companyId: Types.ObjectId | string,
): Promise<string | null> {
  await connectDB()
  const { start, end, label } = dayBoundsUZ(-1)
  const reviews = await GuestReview.find({ companyId, createdAt: { $gte: start, $lt: end } })
    .populate('hotelId', 'name shortName')
    .sort({ createdAt: -1 })
    .limit(30)
    .lean<{ rating: number; comment: string; roomNumber: string; hotelId: unknown }[]>()

  if (reviews.length === 0) return null

  const hotelName = (v: unknown) =>
    typeof v === 'object' && v !== null && ('name' in v || 'shortName' in v)
      ? (v as { name?: string; shortName?: string }).name || (v as { shortName?: string }).shortName || ''
      : ''

  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
  const lines = [`⭐ <b>Отзывы за день</b> (${label}) — средний ${avg.toFixed(1)}/5`, '']
  for (const r of reviews) {
    const head = [stars(r.rating), hotelName(r.hotelId), r.roomNumber ? `№${r.roomNumber}` : '']
      .filter(Boolean)
      .join(' · ')
    lines.push(r.comment ? `${head}\n“${r.comment}”` : head)
  }
  return lines.join('\n')
}

// End-of-month summary for the previous UZ month: per-hotel income + orders,
// company total, and the month's review stats. Posted to the reports topic.
export async function buildMonthlyReportMessage(companyId: Types.ObjectId | string): Promise<string> {
  const { start, end, label } = monthBoundsUZ(-1)
  const report = await getIncomeReport(companyId, start, end)
  const reviews = await GuestReview.find({ companyId, createdAt: { $gte: start, $lt: end } })
    .select('rating')
    .lean<{ rating: number }[]>()
  const reviewCount = reviews.length
  const avg = reviewCount ? reviews.reduce((s, r) => s + r.rating, 0) / reviewCount : 0

  const lines = [`📅 <b>Итоги месяца</b> (${label})`, '']
  for (const h of report.hotels) {
    lines.push(`🏢 <b>${h.name}</b>: ${money(h.income)} сум · заказов: ${h.orders}`)
  }
  lines.push('', `Σ <b>Итого за месяц: ${money(report.totalIncome)} сум</b>`, `Всего заказов: ${report.totalOrders}`)
  if (reviewCount) lines.push(`⭐ Отзывов: ${reviewCount} · средний ${avg.toFixed(1)}/5`)
  return lines.join('\n')
}

// Posts the monthly report to every company's reports topic (or General if the
// group isn't a forum). Meant to run on the 1st of the month. Returns how many
// groups received a report.
export async function sendMonthlyReportsForAll(): Promise<number> {
  await connectDB()
  const configs = await TelegramConfig.find().select('companyId').lean<{ companyId: Types.ObjectId }[]>()
  let sent = 0
  for (const cfg of configs) {
    try {
      const topic = await ensureReportsTopic(cfg.companyId)
      if (!topic) continue
      const text = await buildMonthlyReportMessage(cfg.companyId)
      await sendMessage(topic.chatId, text, topic.threadId)
      sent++
    } catch (err) {
      console.error(`Failed to send monthly report for company ${cfg.companyId}`, err)
    }
  }
  return sent
}

// Posts the end-of-day report to every company's Telegram group (General
// topic). Meant to run just after midnight UZ. Best-effort per company.
// Returns how many groups received a report.
export async function sendDailyReportsForAll(): Promise<number> {
  await connectDB()
  const configs = await TelegramConfig.find().select('companyId groupChatId').lean<
    { companyId: Types.ObjectId; groupChatId: number }[]
  >()
  let sent = 0
  for (const cfg of configs) {
    try {
      const text = await buildDailyReportMessage(cfg.companyId)
      if (!text) continue
      await sendMessage(cfg.groupChatId, text)
      // Same-day guest feedback, if any, as a follow-up message.
      const reviews = await buildDailyReviewsMessage(cfg.companyId)
      if (reviews) await sendMessage(cfg.groupChatId, reviews)
      sent++
    } catch (err) {
      console.error(`Failed to send daily report for company ${cfg.companyId}`, err)
    }
  }
  return sent
}
