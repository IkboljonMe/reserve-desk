import { nowUZ } from '@/lib/timezone'
import type { IContract } from '@/models/Contract'

export type NotificationTier = 'expired' | 'urgent' | 'warning'

export interface ContractNotification {
  contractId: string
  organizationName: string
  contractNumber: string
  finishDate: string | null
  daysLeft: number
  tier: NotificationTier
  // The reminder threshold this notification maps to (0 = expired tier).
  threshold: number
  title: string
  message: string
}

// Whole-day difference between a finish date and "today" in Uzbekistan time.
// Negative means the contract has already lapsed.
export function daysUntil(finishDate: Date | string): number {
  const now = nowUZ()
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  const f = new Date(finishDate)
  const target = Date.UTC(f.getUTCFullYear(), f.getUTCMonth(), f.getUTCDate())
  return Math.round((target - today) / 86_400_000)
}

function tierFor(threshold: number, daysLeft: number): NotificationTier {
  if (daysLeft < 0) return 'expired'
  if (threshold <= 7) return 'urgent'
  return 'warning'
}

// Given a contract, return its single active reminder (the most urgent tier
// that has triggered and hasn't been dismissed), or null if nothing is due.
export function notificationForContract(
  c: Pick<IContract, 'organizationName' | 'contractNumber' | 'finishDate' | 'status' | 'reminderDays' | 'dismissedReminders'> & { _id: unknown },
): ContractNotification | null {
  if (c.status === 'terminated' || !c.finishDate) return null

  const daysLeft = daysUntil(c.finishDate)
  // Candidate tiers: each configured threshold plus the "expired" tier (0).
  const tiers = Array.from(new Set([...(c.reminderDays || []), 0])).sort((a, b) => b - a)
  const triggered = tiers.filter(t => daysLeft <= t)
  if (triggered.length === 0) return null

  // Most urgent triggered tier = smallest threshold value.
  const threshold = Math.min(...triggered)
  if ((c.dismissedReminders || []).includes(threshold)) return null

  const tier = tierFor(threshold, daysLeft)
  const org = c.organizationName
  let title: string
  let message: string
  if (daysLeft < 0) {
    title = `Contract expired`
    message = `${org}'s contract ended ${Math.abs(daysLeft)} day${Math.abs(daysLeft) === 1 ? '' : 's'} ago. Renew or terminate it.`
  } else if (daysLeft === 0) {
    title = `Contract expires today`
    message = `${org}'s contract expires today. Renew or terminate it.`
  } else {
    title = `Contract expiring soon`
    message = `${org}'s contract expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.`
  }

  return {
    contractId: String(c._id),
    organizationName: org,
    contractNumber: c.contractNumber,
    finishDate: c.finishDate ? new Date(c.finishDate).toISOString() : null,
    daysLeft,
    tier,
    threshold,
    title,
    message,
  }
}
