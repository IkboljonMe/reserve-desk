// Upserts the three default plans (standard/pro/vip) that existing Company
// docs already reference by key. Never deletes or overwrites a plan that
// already exists — safe to re-run.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import mongoose from 'mongoose'
import { Plan } from '../models/Plan'
import type { FeatureKey } from '../lib/planFeatures'

function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      let val = trimmed.slice(eq + 1).trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      if (!(key in process.env)) process.env[key] = val
    }
  } catch {
    // No .env.local — fall back to whatever is already in the environment.
  }
}

type SeedPlan = {
  key: string
  name: string
  features: FeatureKey[]
  price: number
  description: string
  highlight: boolean
  sortOrder: number
}

const DEFAULT_PLANS: SeedPlan[] = [
  {
    key: 'standard', name: 'Standard', price: 300000, sortOrder: 0, highlight: false,
    description: 'Bookings, clients and reminders for a single hotel.',
    features: ['calendar', 'clients', 'notifications'],
  },
  {
    key: 'pro', name: 'Pro', price: 600000, sortOrder: 1, highlight: true,
    description: 'Everything in Standard plus contracts and the room-service menu.',
    features: ['calendar', 'clients', 'contracts', 'notifications', 'menu'],
  },
  {
    key: 'vip', name: 'VIP', price: 1000000, sortOrder: 2, highlight: false,
    description: 'The full suite: guest hub and Telegram bot notifications included.',
    features: ['calendar', 'clients', 'contracts', 'notifications', 'menu', 'guestHub', 'telegram'],
  },
]

async function main() {
  loadEnvLocal()

  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not set (checked .env.local and process.env)')

  console.log('Connecting to MongoDB…')
  await mongoose.connect(uri)

  // Upsert: create missing plans and refresh the pricing/features of existing
  // ones to the current defaults (never changes the immutable key). Safe to
  // re-run — this is how prices/features get applied to already-seeded plans.
  for (const p of DEFAULT_PLANS) {
    const res = await Plan.updateOne(
      { key: p.key },
      { $set: { name: p.name, features: p.features, price: p.price, description: p.description, highlight: p.highlight, sortOrder: p.sortOrder } },
      { upsert: true },
    )
    const action = res.upsertedCount ? 'Created' : 'Updated'
    console.log(`✅ ${action} plan "${p.key}" (${p.name}) — ${p.price.toLocaleString()} UZS/mo`)
  }

  await mongoose.disconnect()
}

main().catch(async (err) => {
  console.error('Seed failed:', err)
  await mongoose.disconnect().catch(() => {})
  process.exit(1)
})
