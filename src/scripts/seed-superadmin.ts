// Creates (or leaves untouched, if one already exists) the single superadmin
// account used to log in at /secure/superadmin. Unlike the old seed-owner.ts,
// this NEVER drops the database — it only upserts one document.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import mongoose from 'mongoose'
import { Admin } from '../models/Admin'

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

const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL || 'superadmin@easy-service.uz'
const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD || 'ChangeMeSuperAdmin!'
const SUPERADMIN_NAME = 'Smartix Superadmin'

async function main() {
  loadEnvLocal()

  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not set (checked .env.local and process.env)')

  console.log('Connecting to MongoDB…')
  await mongoose.connect(uri)

  const existing = await Admin.findOne({ role: 'superadmin' })
  if (existing) {
    console.log(`Superadmin already exists (${existing.email}). Nothing to do.`)
    await mongoose.disconnect()
    return
  }

  await Admin.create({
    name: SUPERADMIN_NAME,
    email: SUPERADMIN_EMAIL,
    password: SUPERADMIN_PASSWORD,
    role: 'superadmin',
    companyId: null,
    hotelId: null,
  })

  console.log('✅ Superadmin created.')
  console.log('   Email:', SUPERADMIN_EMAIL)
  console.log('   Password:', SUPERADMIN_PASSWORD)
  console.log('   Set SUPERADMIN_EMAIL / SUPERADMIN_PASSWORD env vars to control these.')

  await mongoose.disconnect()
}

main().catch(async (err) => {
  console.error('Seed failed:', err)
  await mongoose.disconnect().catch(() => {})
  process.exit(1)
})
