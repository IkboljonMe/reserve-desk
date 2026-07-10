import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import mongoose from 'mongoose'
import { Hotel } from '../models/Hotel'
import { Room } from '../models/Room'

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

function range(from: number, to: number): number[] {
  const nums: number[] = []
  for (let n = from; n <= to; n++) nums.push(n)
  return nums
}

// hotelShortName -> list of room numbers, in display order. Floor is derived
// from the number's leading digit (1xx -> floor 1, 2xx -> floor 2, ...).
const PLAN: Record<string, number[]> = {
  SAF: [
    ...range(101, 103), ...range(105, 113),
    ...range(201, 211),
    ...range(301, 311),
    ...range(401, 411),
    ...range(501, 511),
    ...range(601, 610),
  ],
  F: [
    ...range(201, 205),
    ...range(301, 305),
    ...range(401, 405),
    ...range(501, 506),
  ],
}

async function main() {
  loadEnvLocal()

  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not set (checked .env.local and process.env)')

  console.log('Connecting to MongoDB…')
  await mongoose.connect(uri)

  for (const [shortName, numbers] of Object.entries(PLAN)) {
    const hotel = await Hotel.findOne({ shortName })
    if (!hotel) {
      console.warn(`⚠️  No hotel with shortName "${shortName}" — skipping its rooms.`)
      continue
    }

    console.log(`Seeding ${numbers.length} rooms for ${hotel.name} (${shortName})…`)
    let order = 0
    let created = 0
    let skipped = 0
    for (const num of numbers) {
      const floor = Math.floor(num / 100)
      const number = String(num)
      const res = await Room.findOneAndUpdate(
        { hotelId: hotel._id, number },
        { $setOnInsert: { hotelId: hotel._id, number, floor, order, type: '', description: '' } },
        { upsert: true, returnDocument: 'before' }
      )
      if (res === null) created++
      else skipped++
      order++
    }
    console.log(`   ✅ ${created} created, ${skipped} already existed.`)
  }

  await mongoose.disconnect()
  console.log('Done.')
}

main().catch(async (err) => {
  console.error('Seed failed:', err)
  await mongoose.disconnect().catch(() => {})
  process.exit(1)
})
