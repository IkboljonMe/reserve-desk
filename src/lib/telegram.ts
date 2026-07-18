import { format } from 'date-fns'
import { connectDB } from '@/lib/mongodb'
import { Hotel } from '@/models/Hotel'
import { Service } from '@/models/Service'
import { Admin } from '@/models/Admin'
import { TelegramConfig } from '@/models/TelegramConfig'
import { TelegramTopic } from '@/models/TelegramTopic'
import { MenuTelegramTopic } from '@/models/MenuTelegramTopic'
import type { OrderStatus } from '@/models/MenuOrder'
import { nowUZ } from '@/lib/timezone'
import type { Types } from 'mongoose'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const API_BASE = BOT_TOKEN ? `https://api.telegram.org/bot${BOT_TOKEN}` : null

// Cached for the life of the server process — the bot's own username never
// changes at runtime, so there's no reason to hit Telegram on every render.
let cachedBotUsername: string | null | undefined
export async function getBotUsername(): Promise<string | null> {
  if (cachedBotUsername !== undefined) return cachedBotUsername
  try {
    const me = await callTelegram<{ username?: string }>('getMe', {})
    cachedBotUsername = me.username ?? null
  } catch {
    cachedBotUsername = null
  }
  return cachedBotUsername
}

async function callTelegram<T = unknown>(method: string, payload: Record<string, unknown>): Promise<T> {
  if (!API_BASE) throw new Error('TELEGRAM_BOT_TOKEN is not configured')
  const res = await fetch(`${API_BASE}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!data.ok) throw new Error(`Telegram ${method} failed: ${data.description || res.status}`)
  return data.result as T
}

// A subset of Telegram's Message object — enough for callers to read message_id.
export interface TelegramMessage {
  message_id: number
}

export function sendMessage(chatId: number, text: string, messageThreadId?: number): Promise<TelegramMessage> {
  return callTelegram<TelegramMessage>('sendMessage', {
    chat_id: chatId,
    text,
    message_thread_id: messageThreadId,
    parse_mode: 'HTML',
  })
}

// Edits an already-sent message in place. Best-effort: never throws, so a
// Telegram hiccup can't block the web request that triggered the update.
export async function editMessageText(
  chatId: number,
  messageId: number,
  text: string,
  messageThreadId?: number
): Promise<void> {
  try {
    await callTelegram('editMessageText', {
      chat_id: chatId,
      message_id: messageId,
      message_thread_id: messageThreadId,
      text,
      parse_mode: 'HTML',
    })
  } catch (err) {
    console.error('Failed to edit Telegram message', err)
  }
}

export function deleteMessage(chatId: number, messageId: number) {
  return callTelegram('deleteMessage', { chat_id: chatId, message_id: messageId }).catch(() => {
    // Best-effort: bot may lack delete rights (e.g. in the general topic).
  })
}

async function createForumTopic(chatId: number, name: string): Promise<number> {
  const result = await callTelegram<{ message_thread_id: number }>('createForumTopic', {
    chat_id: chatId,
    name,
  })
  return result.message_thread_id
}

// Ensures a forum topic exists for a given (hotel, service) pair, creating it
// in the configured group if missing. Returns null if Telegram isn't set up
// for this company, or the topic's notifications are muted.
export async function ensureTopicForService(
  companyId: Types.ObjectId | string,
  hotelId: Types.ObjectId | string,
  serviceId: Types.ObjectId | string
): Promise<{ chatId: number; messageThreadId: number; notificationsEnabled: boolean } | null> {
  await connectDB()
  const config = await TelegramConfig.findOne({ companyId }).lean()
  if (!config) return null

  const existing = await TelegramTopic.findOne({ companyId, hotelId, serviceId }).lean()
  if (existing) {
    return { chatId: config.groupChatId, messageThreadId: existing.messageThreadId, notificationsEnabled: existing.notificationsEnabled }
  }

  const [hotel, service] = await Promise.all([
    Hotel.findById(hotelId).lean(),
    Service.findById(serviceId).lean(),
  ])
  if (!hotel || !service) return null

  const name = `${hotel.shortName}-${service.name}`
  const messageThreadId = await createForumTopic(config.groupChatId, name)
  await TelegramTopic.create({ companyId, hotelId, serviceId, name, messageThreadId })

  return { chatId: config.groupChatId, messageThreadId, notificationsEnabled: true }
}

// Removes the forum topic tied to a deleted service, if one exists.
export async function deleteTopicForService(companyId: Types.ObjectId | string, serviceId: Types.ObjectId | string): Promise<void> {
  await connectDB()
  const [config, topic] = await Promise.all([
    TelegramConfig.findOne({ companyId }).lean(),
    TelegramTopic.findOne({ companyId, serviceId }),
  ])
  if (!topic) return
  if (config) {
    try {
      await callTelegram('deleteForumTopic', {
        chat_id: config.groupChatId,
        message_thread_id: topic.messageThreadId,
      })
    } catch (err) {
      console.error(`Failed to delete Telegram topic for service ${serviceId}`, err)
    }
  }
  await TelegramTopic.deleteOne({ _id: topic._id })
}

// Creates any missing topics for every (hotel, service) pair in one company.
// Used right after /login so the group is fully set up without waiting for
// bookings.
export async function syncAllTopics(companyId: Types.ObjectId | string): Promise<void> {
  await connectDB()
  const services = await Service.find({ companyId }).lean()
  for (const service of services) {
    try {
      await ensureTopicForService(companyId, service.hotelId, service._id)
    } catch (err) {
      console.error(`Failed to create Telegram topic for service ${service._id}`, err)
    }
  }
}

const money = (v: number) => v.toLocaleString('en-US').replace(/,/g, ' ')

export interface BookingMenuItem {
  name: string
  qty: number
  price: number
}

export interface BookingNotifyData {
  bookingId?: string
  companyId: Types.ObjectId | string
  hotelId: Types.ObjectId | string
  serviceId: Types.ObjectId | string | { _id: Types.ObjectId | string; name: string }
  customerName: string
  roomNumber?: string
  date: string
  startTime: string
  endTime: string
  persons?: number
  totalPrice: number
  amountPaid?: number      // collected so far; < totalPrice renders as a deposit
  paid: boolean
  finished?: boolean
  status?: string          // 'confirmed' | 'pending' | 'cancelled'
  notes?: string
  menuItems?: BookingMenuItem[]  // optional food/order request (e.g. for a SPA & Pool event)
  menuReadyTime?: string         // "HH:mm" — when the order should be ready
  createdByName?: string   // the admin who created the booking ("who booked")
}

// Informational only — shown in the order message, doesn't affect the
// booking's actual totalPrice/payment (src/components/ui/MenuItemsEditor.tsx
// and useBookingWizard.ts's live preview must stay in sync with this rate).
const MENU_SERVICE_FEE_RATE = 0.1

// Where a booking's Telegram message lives, so it can be edited later.
export interface BookingMessageRef {
  chatId: number
  messageThreadId?: number
  messageId: number
}

const hasName = (v: unknown): v is { _id: Types.ObjectId | string; name: string } =>
  typeof v === 'object' && v !== null && 'name' in v

// The Russian summary posted to the (hotel, service) topic. Emoji are
// intentional here — this is the Telegram message, not the web UI.
function buildBookingMessage(booking: BookingNotifyData, serviceName?: string): string {
  const priceText = booking.totalPrice > 0 ? `${money(booking.totalPrice)} UZS` : 'Бесплатно'
  // Collected-so-far: a value between 0 and the total is a deposit.
  const collected = typeof booking.amountPaid === 'number'
    ? booking.amountPaid
    : (booking.paid ? booking.totalPrice : 0)
  const partial = booking.totalPrice > 0 && collected > 0 && collected < booking.totalPrice
  const paidText = partial
    ? `Частично: ${money(collected)} / ${money(booking.totalPrice)} UZS ⏳`
    : booking.paid ? 'Оплачено ✅' : 'Не оплачено ❌'
  const who = booking.roomNumber ? `${booking.customerName} (номер ${booking.roomNumber})` : booking.customerName
  const cancelled = booking.status === 'cancelled'
  const header = cancelled ? '🚫 <b>Отменено</b>' : `🆕 <b>${serviceName ?? 'Новое бронирование'}</b>`
  const lines = [
    header,
    `🕒 ${booking.date} ${booking.startTime}-${booking.endTime}`,
    `👤 ${who}`,
  ]
  if (booking.persons && booking.persons > 1) lines.push(`👥 ${booking.persons} чел.`)
  if (booking.createdByName) lines.push(`🧑‍💼 Забронировал: ${booking.createdByName}`)
  lines.push(`💰 ${priceText} — ${paidText}`)
  if (!cancelled && booking.finished) lines.push('✅ Завершено')
  return lines.join('\n')
}

// Spacious, itemized order summary used when a booking has menu items
// attached (e.g. food for a SPA & Pool event) — spans multiple blank-line
// separated sections so it stays easy to scan on a phone.
function buildOrderMessage(booking: BookingNotifyData, hotelName: string): string {
  const cancelled = booking.status === 'cancelled'
  const header = cancelled ? '🚫 <b>Отменено</b>' : '✅ <b>Заказ принят</b>'
  const items = booking.menuItems ?? []
  const subtotal = items.reduce((sum, it) => sum + it.qty * it.price, 0)
  const fee = Math.round(subtotal * MENU_SERVICE_FEE_RATE)
  const total = subtotal + fee
  const itemLines = items.map(it => `${it.qty}x ${it.name} - ${money(it.qty * it.price)} so'm`)
  const timeStr = format(nowUZ(), 'dd.MM.yyyy, HH:mm:ss')

  const lines = [header, '', `🆔 Заказ: #${booking.bookingId ?? ''}`, `🏢 Заведение: ${hotelName}`]
  if (booking.roomNumber) lines.push(`🛏️ Номер: ${booking.roomNumber}`)
  lines.push('')
  if (booking.createdByName) lines.push(`👤 Принял: ${booking.createdByName}`)
  lines.push('', 'Детали заказа:', ...itemLines, '')
  lines.push(`🔧 Сервисный сбор (10%): ${money(fee)} сум`)
  lines.push(`💵 Итоговая сумма: ${money(total)} сум`, '')
  lines.push(`✍️ Примечание: ${booking.notes?.trim() || 'Нет'}`, '')
  lines.push(`⏰ Время: ${timeStr}`)
  return lines.join('\n')
}

// Picks the right template and, for an itemized order, resolves the hotel's
// display name (not carried on BookingNotifyData itself).
async function buildMessage(booking: BookingNotifyData, serviceName?: string): Promise<string> {
  if (booking.menuItems && booking.menuItems.length > 0) {
    await connectDB()
    const hotel = await Hotel.findById(booking.hotelId).select('name shortName').lean()
    return buildOrderMessage(booking, hotel?.name || hotel?.shortName || '')
  }
  return buildBookingMessage(booking, serviceName)
}

// Posts a booking summary to the (hotel, service) topic and returns where the
// message landed (so a later update can edit it). Best-effort: never throws,
// since a Telegram hiccup shouldn't block booking creation. Returns null when
// Telegram isn't configured or anything fails.
export async function notifyNewBooking(booking: BookingNotifyData): Promise<BookingMessageRef | null> {
  try {
    const serviceId = hasName(booking.serviceId) ? booking.serviceId._id : booking.serviceId
    const serviceName = hasName(booking.serviceId) ? booking.serviceId.name : undefined
    const topic = await ensureTopicForService(booking.companyId, booking.hotelId, serviceId)
    if (!topic || !topic.notificationsEnabled) return null

    const text = await buildMessage(booking, serviceName)
    const sent = await sendMessage(topic.chatId, text, topic.messageThreadId)
    return { chatId: topic.chatId, messageThreadId: topic.messageThreadId, messageId: sent.message_id }
  } catch (err) {
    console.error('Failed to send Telegram booking notification', err)
    return null
  }
}

// Edits the booking's existing Telegram message in place so it reflects the
// current state (e.g. payment status) — never posts a duplicate. Best-effort.
export async function notifyBookingUpdated(
  ref: BookingMessageRef,
  booking: BookingNotifyData,
  serviceName?: string,
): Promise<void> {
  const resolvedName = serviceName ?? (hasName(booking.serviceId) ? booking.serviceId.name : undefined)
  const text = await buildMessage(booking, resolvedName)
  await editMessageText(ref.chatId, ref.messageId, text, ref.messageThreadId)
}

/* ------------------------------- Menu orders ------------------------------- */

// Ensures a "Menu orders" forum topic exists for a hotel, creating it in the
// configured group if missing. Separate from ensureTopicForService — a menu
// order isn't tied to any Service. Returns null if Telegram isn't set up.
export async function ensureTopicForMenuOrders(
  companyId: Types.ObjectId | string,
  hotelId: Types.ObjectId | string
): Promise<{ chatId: number; messageThreadId: number; notificationsEnabled: boolean } | null> {
  await connectDB()
  const config = await TelegramConfig.findOne({ companyId }).lean()
  if (!config) return null

  const existing = await MenuTelegramTopic.findOne({ companyId, hotelId }).lean()
  if (existing) {
    return { chatId: config.groupChatId, messageThreadId: existing.messageThreadId, notificationsEnabled: existing.notificationsEnabled }
  }

  const hotel = await Hotel.findById(hotelId).lean()
  if (!hotel) return null

  // The guest-hub topic: menu orders and guest reports for this hotel land here.
  const name = `${hotel.shortName}-HUB`
  const messageThreadId = await createForumTopic(config.groupChatId, name)
  await MenuTelegramTopic.create({ companyId, hotelId, name, messageThreadId })

  return { chatId: config.groupChatId, messageThreadId, notificationsEnabled: true }
}

// Posts a guest hub notification (e.g. a problem report from the in-room page)
// to the hotel's HUB topic. Best-effort: never throws. Returns false if
// Telegram isn't set up or the topic is muted.
export async function notifyHubMessage(
  companyId: Types.ObjectId | string,
  hotelId: Types.ObjectId | string,
  text: string,
): Promise<boolean> {
  try {
    const topic = await ensureTopicForMenuOrders(companyId, hotelId)
    if (!topic || !topic.notificationsEnabled) return false
    await sendMessage(topic.chatId, text, topic.messageThreadId)
    return true
  } catch (err) {
    console.error('Failed to send hub notification', err)
    return false
  }
}

// Where a menu order's Telegram message lives, so a status change can edit it.
export interface MenuOrderMessageRef {
  chatId: number
  messageThreadId?: number
  messageId: number
}

export interface MenuOrderNotifyItem {
  name: string
  price: number
  quantity: number
}

export interface MenuOrderNotifyData {
  orderId: string
  companyId: Types.ObjectId | string
  hotelId: Types.ObjectId | string
  roomNumber: string
  guestName?: string
  note?: string
  status: OrderStatus
  items: MenuOrderNotifyItem[]
  serviceFee: number
  total: number
}

const MENU_ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: '🆕 Новый заказ',
  preparing: '👨‍🍳 Готовится',
  ready: '✅ Готово к выдаче',
  delivered: '📦 Доставлено',
  cancelled: '🚫 Отменено',
}

function buildMenuOrderMessage(order: MenuOrderNotifyData, hotelName: string): string {
  const header = MENU_ORDER_STATUS_LABEL[order.status] ?? order.status
  const itemLines = order.items.map(it => `${it.quantity}x ${it.name} - ${money(it.price * it.quantity)} so'm`)
  const lines = [
    `<b>${header}</b>`,
    '',
    `🆔 Заказ: #${order.orderId.slice(-6).toUpperCase()}`,
    `🏢 Отель: ${hotelName}`,
    `🛏️ Номер: ${order.roomNumber}`,
  ]
  if (order.guestName) lines.push(`👤 Гость: ${order.guestName}`)
  lines.push('', 'Состав заказа:', ...itemLines)
  if (order.serviceFee > 0) lines.push('', `🔧 Сервисный сбор: ${money(order.serviceFee)} сум`)
  lines.push(`💵 Итого: ${money(order.total)} сум`)
  if (order.note) lines.push('', `✍️ Примечание: ${order.note}`)
  return lines.join('\n')
}

// Posts a new order to the hotel's "Menu orders" topic and returns where the
// message landed (so a later status change can edit it). Best-effort: never
// throws, since a Telegram hiccup shouldn't block order placement.
export async function notifyNewMenuOrder(order: MenuOrderNotifyData): Promise<MenuOrderMessageRef | null> {
  try {
    const topic = await ensureTopicForMenuOrders(order.companyId, order.hotelId)
    if (!topic || !topic.notificationsEnabled) return null

    await connectDB()
    const hotel = await Hotel.findById(order.hotelId).select('name shortName').lean()
    const text = buildMenuOrderMessage(order, hotel?.name || hotel?.shortName || '')
    const sent = await sendMessage(topic.chatId, text, topic.messageThreadId)
    return { chatId: topic.chatId, messageThreadId: topic.messageThreadId, messageId: sent.message_id }
  } catch (err) {
    console.error('Failed to send Telegram menu order notification', err)
    return null
  }
}

// Edits the order's existing Telegram message in place so it reflects the
// current status — never posts a duplicate. Best-effort.
export async function notifyMenuOrderUpdated(ref: MenuOrderMessageRef, order: MenuOrderNotifyData): Promise<void> {
  await connectDB()
  const hotel = await Hotel.findById(order.hotelId).select('name shortName').lean()
  const text = buildMenuOrderMessage(order, hotel?.name || hotel?.shortName || '')
  await editMessageText(ref.chatId, ref.messageId, text, ref.messageThreadId)
}

/* ------------------------------- Settings UI ------------------------------- */

export interface TelegramTopicSummary {
  id: string
  kind: 'booking' | 'menu'
  hotelName: string
  serviceName?: string // absent for the 'menu' kind
  notificationsEnabled: boolean
}

export interface TelegramStatus {
  connected: boolean
  groupChatId?: number
  loggedInByName?: string
  loggedInByEmail?: string
  connectedAt?: Date
  botUsername: string | null
  topics: TelegramTopicSummary[]
}

// Everything the owner-facing Settings > Telegram page needs in one call.
export async function getTelegramStatus(companyId: Types.ObjectId | string): Promise<TelegramStatus> {
  await connectDB()
  const botUsername = await getBotUsername()
  const config = await TelegramConfig.findOne({ companyId }).lean()
  if (!config) return { connected: false, botUsername, topics: [] }

  const [loggedInBy, bookingTopics, menuTopics] = await Promise.all([
    Admin.findById(config.loggedInBy).select('name email').lean(),
    TelegramTopic.find({ companyId }).populate('hotelId', 'name').populate('serviceId', 'name').lean(),
    MenuTelegramTopic.find({ companyId }).populate('hotelId', 'name').lean(),
  ])

  const hasHotelName = (v: unknown): v is { name: string } =>
    typeof v === 'object' && v !== null && 'name' in v

  const topics: TelegramTopicSummary[] = [
    ...bookingTopics.map(t => ({
      id: t._id.toString(),
      kind: 'booking' as const,
      hotelName: hasHotelName(t.hotelId) ? t.hotelId.name : '',
      serviceName: hasHotelName(t.serviceId) ? t.serviceId.name : undefined,
      notificationsEnabled: t.notificationsEnabled,
    })),
    ...menuTopics.map(t => ({
      id: t._id.toString(),
      kind: 'menu' as const,
      hotelName: hasHotelName(t.hotelId) ? t.hotelId.name : '',
      notificationsEnabled: t.notificationsEnabled,
    })),
  ]

  return {
    connected: true,
    groupChatId: config.groupChatId,
    loggedInByName: loggedInBy?.name,
    loggedInByEmail: loggedInBy?.email,
    connectedAt: config.createdAt,
    botUsername,
    topics,
  }
}

// Toggles whether a specific topic receives new notifications. Scoped to
// companyId so one company can never touch another's topic by guessing an id.
export async function setTopicNotifications(
  companyId: Types.ObjectId | string,
  kind: 'booking' | 'menu',
  topicId: string,
  enabled: boolean
): Promise<boolean> {
  await connectDB()
  const res = kind === 'booking'
    ? await TelegramTopic.updateOne({ _id: topicId, companyId }, { notificationsEnabled: enabled })
    : await MenuTelegramTopic.updateOne({ _id: topicId, companyId }, { notificationsEnabled: enabled })
  return res.matchedCount > 0
}

// Disconnects a company's group: clears its config and topics so a later
// /login (to the same or a different group) starts clean — old
// messageThreadIds would be meaningless in a new group anyway.
export async function disconnectTelegram(companyId: Types.ObjectId | string): Promise<void> {
  await connectDB()
  await Promise.all([
    TelegramConfig.deleteOne({ companyId }),
    TelegramTopic.deleteMany({ companyId }),
    MenuTelegramTopic.deleteMany({ companyId }),
  ])
}
