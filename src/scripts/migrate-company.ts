// One-off migration: introduces the Company (tenant) model on top of the
// existing single-company data. Creates ONE Company from your real business
// details and backfills companyId onto every existing Hotel and onto the
// existing owner/admin Admin docs. Does NOT drop or delete anything.
//
// Usage:
//   npx tsx src/scripts/migrate-company.ts "Safir Group MCHJ" safir-group-mchj [plan] [expiresInDays]
//   plan defaults to "pro", expiresInDays defaults to 365.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import mongoose from 'mongoose'
import { Admin } from '../models/Admin'
import { Hotel } from '../models/Hotel'
import { Client } from '../models/Client'
import { ClientGroup } from '../models/ClientGroup'
import { Service } from '../models/Service'
import { Room } from '../models/Room'
import { Contract } from '../models/Contract'
import { Booking } from '../models/Booking'
import { Company, RESERVED_SLUGS, SLUG_PATTERN, type CompanyPlan } from '../models/Company'

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

async function main() {
  loadEnvLocal()

  const [, , name, slug, planArg, daysArg] = process.argv
  if (!name || !slug) {
    console.error('Usage: npx tsx src/scripts/migrate-company.ts "Company Name" slug [plan] [expiresInDays]')
    process.exit(1)
  }
  if (!SLUG_PATTERN.test(slug) || RESERVED_SLUGS.includes(slug)) {
    console.error(`Invalid slug "${slug}": must be lowercase letters/numbers/hyphens and not reserved.`)
    process.exit(1)
  }
  const plan = (planArg || 'pro') as CompanyPlan
  if (!['standard', 'pro', 'vip'].includes(plan)) {
    console.error(`Invalid plan "${plan}": must be standard, pro, or vip.`)
    process.exit(1)
  }
  const days = Number(daysArg || 365)
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000)

  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not set (checked .env.local and process.env)')

  console.log('Connecting to MongoDB…')
  await mongoose.connect(uri)

  const existing = await Company.findOne({})
  if (existing) {
    console.error(`A Company already exists ("${existing.name}", slug "${existing.slug}"). Refusing to run this migration twice.`)
    await mongoose.disconnect()
    process.exit(1)
  }

  console.log(`Creating company "${name}" (slug "${slug}", plan ${plan}, expires ${expiresAt.toISOString()})…`)
  const company = await Company.create({ name, slug, plan, expiresAt })

  // Every existing document predates the Company model, so it all belongs to
  // this one (first) company — there is nothing else for it to belong to yet.
  const filter = { companyId: { $exists: false } }
  const set = { $set: { companyId: company._id } }
  console.log(`Backfilled companyId onto ${(await Hotel.updateMany(filter, set)).modifiedCount} hotel(s).`)
  console.log(`Backfilled companyId onto ${(await Client.updateMany(filter, set)).modifiedCount} client(s).`)
  console.log(`Backfilled companyId onto ${(await ClientGroup.updateMany(filter, set)).modifiedCount} client group(s).`)
  console.log(`Backfilled companyId onto ${(await Service.updateMany(filter, set)).modifiedCount} service(s).`)
  console.log(`Backfilled companyId onto ${(await Room.updateMany(filter, set)).modifiedCount} room(s).`)
  console.log(`Backfilled companyId onto ${(await Contract.updateMany(filter, set)).modifiedCount} contract(s).`)
  console.log(`Backfilled companyId onto ${(await Booking.updateMany(filter, set)).modifiedCount} booking(s).`)

  const adminResult = await Admin.updateMany(
    { role: { $in: ['owner', 'admin'] }, companyId: null },
    { $set: { companyId: company._id } }
  )
  console.log(`Backfilled companyId onto ${adminResult.modifiedCount} admin/owner account(s).`)

  console.log('✅ Migration complete.')
  console.log(`   Owners/admins now log in at /secure/company/${slug}/login`)

  await mongoose.disconnect()
}

main().catch(async (err) => {
  console.error('Migration failed:', err)
  await mongoose.disconnect().catch(() => {})
  process.exit(1)
})
