import dns from 'node:dns'
import mongoose from 'mongoose'

// Windows sometimes reports 127.0.0.1 as the system DNS server even when
// nothing listens there, which breaks the SRV lookup mongodb+srv:// needs.
// Force known-good resolvers so the lookup doesn't depend on that.
dns.setServers(['1.1.1.1', '8.8.8.8'])

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable in .env.local')
}

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined
}

const cached: MongooseCache = global.mongooseCache ?? { conn: null, promise: null }
global.mongooseCache = cached

export async function connectDB() {
  if (cached.conn) return cached.conn

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false })
  }

  cached.conn = await cached.promise
  return cached.conn
}
