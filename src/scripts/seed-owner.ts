import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import mongoose from 'mongoose'
import { Admin } from '../models/Admin'

// The project uses .env.local for prod credentials, but tsx does not load it
// automatically like Next does — parse it by hand before connecting.
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

const OWNER_EMAIL = 'owner@easy-service.uz'
const OWNER_PASSWORD = 'ProjectOwnerEasyService'
const OWNER_NAME = 'Project Owner'

async function main() {
  loadEnvLocal()

  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('MONGODB_URI is not set (checked .env.local and process.env)')
  }

  console.log('Connecting to MongoDB…')
  await mongoose.connect(uri)

  const dbName = mongoose.connection.db?.databaseName
  console.log(`⚠️  Wiping ALL data from database "${dbName}"…`)
  await mongoose.connection.dropDatabase()
  console.log('   Database dropped.')

  console.log(`Seeding owner ${OWNER_EMAIL}…`)
  // Password is hashed by the Admin model's pre-save hook.
  await Admin.create({
    name: OWNER_NAME,
    email: OWNER_EMAIL,
    password: OWNER_PASSWORD,
    role: 'owner',
    hotelId: null,
  })

  console.log('✅ Owner created.')
  console.log('   Email:', OWNER_EMAIL)
  console.log('   Password:', OWNER_PASSWORD)

  await mongoose.disconnect()
  console.log('Done.')
}

main().catch(async (err) => {
  console.error('Seed failed:', err)
  await mongoose.disconnect().catch(() => {})
  process.exit(1)
})
