import { connectDB } from '@/lib/mongodb'
import { Hotel } from '@/models/Hotel'
import { Service } from '@/models/Service'
import { TelegramConfig } from '@/models/TelegramConfig'
import { TelegramTopic } from '@/models/TelegramTopic'
import type { Types } from 'mongoose'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const API_BASE = BOT_TOKEN ? `https://api.telegram.org/bot${BOT_TOKEN}` : null

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

export function sendMessage(chatId: number, text: string, messageThreadId?: number) {
  return callTelegram('sendMessage', {
    chat_id: chatId,
    text,
    message_thread_id: messageThreadId,
    parse_mode: 'HTML',
  })
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
// in the configured group if missing. Returns null if Telegram isn't set up.
export async function ensureTopicForService(
  hotelId: Types.ObjectId | string,
  serviceId: Types.ObjectId | string
): Promise<{ chatId: number; messageThreadId: number } | null> {
  await connectDB()
  const config = await TelegramConfig.findOne().sort({ createdAt: -1 }).lean()
  if (!config) return null

  const existing = await TelegramTopic.findOne({ hotelId, serviceId }).lean()
  if (existing) return { chatId: config.groupChatId, messageThreadId: existing.messageThreadId }

  const [hotel, service] = await Promise.all([
    Hotel.findById(hotelId).lean(),
    Service.findById(serviceId).lean(),
  ])
  if (!hotel || !service) return null

  const name = `${hotel.shortName}-${service.name}`
  const messageThreadId = await createForumTopic(config.groupChatId, name)
  await TelegramTopic.create({ hotelId, serviceId, name, messageThreadId })

  return { chatId: config.groupChatId, messageThreadId }
}

// Removes the forum topic tied to a deleted service, if one exists.
export async function deleteTopicForService(serviceId: Types.ObjectId | string): Promise<void> {
  await connectDB()
  const [config, topic] = await Promise.all([
    TelegramConfig.findOne().sort({ createdAt: -1 }).lean(),
    TelegramTopic.findOne({ serviceId }),
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

// Creates any missing topics for every (hotel, service) pair. Used right
// after /login so the group is fully set up without waiting for bookings.
export async function syncAllTopics(): Promise<void> {
  await connectDB()
  const services = await Service.find().lean()
  for (const service of services) {
    try {
      await ensureTopicForService(service.hotelId, service._id)
    } catch (err) {
      console.error(`Failed to create Telegram topic for service ${service._id}`, err)
    }
  }
}

const money = (v: number) => v.toLocaleString('en-US').replace(/,/g, ' ')

// Posts a booking summary to the (hotel, service) topic. Best-effort: never
// throws, since a Telegram hiccup shouldn't block booking creation.
export async function notifyNewBooking(booking: {
  hotelId: Types.ObjectId | string
  serviceId: Types.ObjectId | string | { _id: Types.ObjectId | string; name: string }
  customerName: string
  roomNumber?: string
  date: string
  startTime: string
  endTime: string
  totalPrice: number
  paid: boolean
}): Promise<void> {
  try {
    const hasName = (v: unknown): v is { _id: Types.ObjectId | string; name: string } =>
      typeof v === 'object' && v !== null && 'name' in v
    const serviceId = hasName(booking.serviceId) ? booking.serviceId._id : booking.serviceId
    const serviceName = hasName(booking.serviceId) ? booking.serviceId.name : undefined
    const topic = await ensureTopicForService(booking.hotelId, serviceId)
    if (!topic) return

    const priceText = booking.totalPrice > 0 ? `${money(booking.totalPrice)} UZS` : 'Free'
    const paidText = booking.paid ? 'Paid ✅' : 'Not paid ❌'
    const who = booking.roomNumber ? `${booking.customerName} (room ${booking.roomNumber})` : booking.customerName
    const lines = [
      `🆕 <b>${serviceName ?? 'New booking'}</b>`,
      `🕒 ${booking.date} ${booking.startTime}-${booking.endTime}`,
      `👤 ${who}`,
      `💰 ${priceText} — ${paidText}`,
    ]
    await sendMessage(topic.chatId, lines.join('\n'), topic.messageThreadId)
  } catch (err) {
    console.error('Failed to send Telegram booking notification', err)
  }
}
