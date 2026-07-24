import { connectDB } from '@/lib/mongodb'
import { Plan } from '@/models/Plan'

// PUBLIC — exposes the subscription plans (key, name, price). No auth; no
// sensitive data. The marketing landing page now renders pricing statically, so
// this is kept only as a lightweight public listing.
export async function GET() {
  await connectDB()
  const plans = await Plan.find()
    .select('key name price')
    .sort({ price: 1, createdAt: 1 })
    .lean()
  return Response.json(plans)
}
