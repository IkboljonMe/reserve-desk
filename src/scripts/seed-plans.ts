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

const DEFAULT_PLANS: { key: string; name: string; features: FeatureKey[] }[] = [
  { key: 'standard', name: 'Standard', features: ['calendar', 'clients', 'notifications'] },
  { key: 'pro', name: 'Pro', features: ['calendar', 'clients', 'contracts', 'notifications', 'menu'] },
  { key: 'vip', name: 'VIP', features: ['calendar', 'clients', 'contracts', 'notifications', 'menu', 'guestHub'] },
]

async function main() {
  loadEnvLocal()

  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not set (checked .env.local and process.env)')

  console.log('Connecting to MongoDB…')
  await mongoose.connect(uri)

  for (const p of DEFAULT_PLANS) {
    const existing = await Plan.findOne({ key: p.key })
    if (existing) {
      console.log(`Plan "${p.key}" already exists — skipping.`)
      continue
    }
    await Plan.create(p)
    console.log(`✅ Created plan "${p.key}" (${p.name})`)
  }

  await mongoose.disconnect()
}

main().catch(async (err) => {
  console.error('Seed failed:', err)
  await mongoose.disconnect().catch(() => {})
  process.exit(1)
})
