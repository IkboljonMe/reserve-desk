// Upserts the three default plans (standard/pro/vip) that existing Company
// docs already reference by key. Never deletes or overwrites a plan that
// already exists — safe to re-run.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import mongoose from 'mongoose'
import { Plan } from '../models/Plan'
import { DEFAULT_PLAN_FEATURES, type FeatureKey } from '../lib/planFeatures'

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

// Plans carry a name, price, and the default feature set for the tier. Prices
// and features mirror the static landing tiers (see features/home constants).
type SeedPlan = { key: string; name: string; price: number; features: FeatureKey[] }

const DEFAULT_PLANS: SeedPlan[] = [
  { key: 'standard', name: 'Standard', price: 300000, features: DEFAULT_PLAN_FEATURES.standard },
  { key: 'pro', name: 'Pro', price: 600000, features: DEFAULT_PLAN_FEATURES.pro },
  { key: 'vip', name: 'VIP', price: 800000, features: DEFAULT_PLAN_FEATURES.vip },
]

async function main() {
  loadEnvLocal()

  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not set (checked .env.local and process.env)')

  console.log('Connecting to MongoDB…')
  await mongoose.connect(uri)

  // Upsert: create missing plans and refresh the name/price of existing ones to
  // the current defaults (never changes the immutable key). Safe to re-run.
  for (const p of DEFAULT_PLANS) {
    const res = await Plan.updateOne(
      { key: p.key },
      { $set: { name: p.name, price: p.price, features: p.features } },
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
