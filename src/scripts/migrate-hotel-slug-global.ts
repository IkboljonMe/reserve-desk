// Makes Hotel.slug globally unique (it now identifies a public guest hub at
// menu.bronit.uz/<locale>/<slug>). Safe to run repeatedly.
//
//   1. Finds hotels sharing a slug across companies and auto-suffixes the
//      newer ones (keeps the oldest hotel's slug, renames the rest to
//      "<slug>-2", "<slug>-3", … skipping any already-taken value).
//   2. Drops the old per-company { companyId, slug } index if present.
//   3. Ensures the new global unique { slug } partial index exists.
//
// Run:  npx tsx src/scripts/migrate-hotel-slug-global.ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import mongoose from 'mongoose'
import { Hotel } from '../models/Hotel'

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
    // No .env.local — rely on the ambient environment.
  }
}

async function main() {
  loadEnvLocal()
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not set (checked .env.local and process.env)')

  console.log('Connecting to MongoDB…')
  await mongoose.connect(uri)

  // All slugs currently in use (across every company), plus the hotels holding
  // them, oldest first so the original keeps its slug on a collision.
  const hotels = await Hotel.find({ slug: { $type: 'string', $ne: '' } })
    .select('_id name slug companyId createdAt')
    .sort({ createdAt: 1 })
    .lean()

  const taken = new Set<string>()
  let renamed = 0

  for (const h of hotels) {
    const slug = h.slug as string
    if (!taken.has(slug)) {
      taken.add(slug)
      continue
    }
    // Collision — find the next free "<slug>-N".
    let n = 2
    let candidate = `${slug}-${n}`
    while (taken.has(candidate)) {
      n += 1
      candidate = `${slug}-${n}`
    }
    taken.add(candidate)
    await Hotel.updateOne({ _id: h._id }, { slug: candidate })
    console.log(`  Renamed "${h.name}" slug: ${slug} → ${candidate}`)
    renamed += 1
  }

  console.log(renamed === 0 ? 'No slug collisions found.' : `Resolved ${renamed} slug collision(s).`)

  // Swap indexes: drop the old per-company one, ensure the new global one.
  const coll = mongoose.connection.db!.collection('hotels')
  const indexes = await coll.indexes()
  const oldIdx = indexes.find(i => i.name === 'companyId_1_slug_1')
  if (oldIdx) {
    await coll.dropIndex('companyId_1_slug_1')
    console.log('Dropped old index companyId_1_slug_1.')
  }
  await Hotel.syncIndexes()
  console.log('Ensured global unique slug index.')

  await mongoose.disconnect()
  console.log('✅ Done.')
}

main().catch(async (err) => {
  console.error('Migration failed:', err)
  await mongoose.disconnect().catch(() => {})
  process.exit(1)
})
