import { readFileSync } from 'fs'
import mongoose from 'mongoose'

// Load MONGODB_URI from .env.local (Next.js convention)
const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
const uri = env.match(/^MONGODB_URI=(.*)$/m)?.[1]?.trim().replace(/^["']|["']$/g, '')
if (!uri) throw new Error('MONGODB_URI not found in .env.local')

async function main() {
  await mongoose.connect(uri!)
  const coll = mongoose.connection.collection('rooms')

  const before = await coll.indexes()
  console.log('Indexes BEFORE:')
  console.dir(before, { depth: null })

  // Drop the stale global-unique index on `number` if it exists.
  const stale = before.find(
    (i) => i.unique && i.key && Object.keys(i.key).length === 1 && i.key.number === 1
  )
  if (stale) {
    console.log(`\nDropping stale index: ${stale.name}`)
    await coll.dropIndex(stale.name!)
  } else {
    console.log('\nNo stale global-unique `number` index found.')
  }

  // Ensure the correct compound indexes exist.
  await coll.createIndex({ hotelId: 1, number: 1 }, { unique: true })
  await coll.createIndex({ hotelId: 1, floor: 1, number: 1 })

  const after = await coll.indexes()
  console.log('\nIndexes AFTER:')
  console.dir(after, { depth: null })

  await mongoose.disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
