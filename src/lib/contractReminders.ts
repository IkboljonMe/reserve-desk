import type { Types } from 'mongoose'
import { connectDB } from '@/lib/mongodb'
import { Contract } from '@/models/Contract'
import { TelegramConfig } from '@/models/TelegramConfig'
import { sendMessage } from '@/lib/telegram'
import { daysUntil } from '@/lib/notifications'
import { formatUZ } from '@/lib/timezone'

// The single most-urgent reminder tier that has triggered for a contract and
// hasn't been pushed to Telegram yet. Mirrors notificationForContract's tier
// selection, but tracks Telegram sends (telegramSentReminders) independently
// of the in-app dismissals. Returns null when nothing new is due.
function dueTier(daysLeft: number, reminderDays: number[], sent: number[]): number | null {
  const tiers = Array.from(new Set([...(reminderDays || []), 0])).sort((a, b) => b - a)
  const triggered = tiers.filter(t => daysLeft <= t)
  if (triggered.length === 0) return null
  const threshold = Math.min(...triggered)
  if (sent.includes(threshold)) return null
  return threshold
}

const hasName = (v: unknown): v is { name?: string; shortName?: string } =>
  typeof v === 'object' && v !== null && ('name' in v || 'shortName' in v)

function buildReminderMessage(
  c: { organizationName: string; contractNumber?: string; finishDate: Date | null },
  daysLeft: number,
  threshold: number,
  hotelName: string,
): string {
  const header =
    daysLeft < 0
      ? '🔴 <b>Договор истёк</b>'
      : threshold <= 7
        ? '⚠️ <b>Договор истекает — срочно</b>'
        : '⏳ <b>Договор истекает</b>'

  const left =
    daysLeft < 0
      ? `истёк ${Math.abs(daysLeft)} дн. назад`
      : daysLeft === 0
        ? 'сегодня'
        : `осталось ${daysLeft} дн.`

  const lines = [header, '']
  if (hotelName) lines.push(`🏢 Отель: ${hotelName}`)
  lines.push(`🏛️ Организация: ${c.organizationName}`)
  if (c.contractNumber) lines.push(`📄 Договор: ${c.contractNumber}`)
  if (c.finishDate) {
    lines.push(`📅 Дата окончания: ${formatUZ(c.finishDate, { day: '2-digit', month: 'short', year: 'numeric' })}`)
  }
  lines.push(`⏰ Срок: ${left}`)
  return lines.join('\n')
}

// Posts any newly-due contract reminders for one company to its Telegram group
// (the group's General topic), marking each tier as sent so it never repeats.
// Best-effort per contract: a Telegram hiccup on one won't block the others.
// Returns how many reminders were sent.
export async function sendContractRemindersForCompany(
  companyId: Types.ObjectId | string,
): Promise<number> {
  await connectDB()
  const config = await TelegramConfig.findOne({ companyId }).lean()
  if (!config) return 0

  const contracts = await Contract.find({
    companyId,
    status: { $ne: 'terminated' },
    finishDate: { $ne: null },
  })
    .populate('hotelId', 'name shortName')
    .lean()

  let sent = 0
  for (const c of contracts) {
    if (!c.finishDate) continue
    const daysLeft = daysUntil(c.finishDate)
    const threshold = dueTier(daysLeft, c.reminderDays, c.telegramSentReminders || [])
    if (threshold === null) continue

    const hotelName = hasName(c.hotelId) ? c.hotelId.name || c.hotelId.shortName || '' : ''
    const text = buildReminderMessage(c, daysLeft, threshold, hotelName)
    try {
      await sendMessage(config.groupChatId, text)
      await Contract.updateOne({ _id: c._id }, { $addToSet: { telegramSentReminders: threshold } })
      sent++
    } catch (err) {
      console.error(`Failed to send contract reminder for ${c._id}`, err)
    }
  }
  return sent
}

// Runs the reminder sweep across every company that has Telegram configured.
// Used by the daily cron endpoint. Returns the total number of reminders sent.
export async function sendContractRemindersForAll(): Promise<number> {
  await connectDB()
  const configs = await TelegramConfig.find().select('companyId').lean()
  let total = 0
  for (const cfg of configs) {
    total += await sendContractRemindersForCompany(cfg.companyId)
  }
  return total
}
