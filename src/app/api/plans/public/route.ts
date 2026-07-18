import { connectDB } from '@/lib/mongodb'
import { Plan } from '@/models/Plan'

// PUBLIC — the marketing landing page reads plans (name, price, features,
// description, highlight) to render its pricing cards. No auth; no sensitive
// data. Ordered the way they should appear on the page.
export async function GET() {
  await connectDB()
  const plans = await Plan.find()
    .select('key name price description features highlight sortOrder')
    .sort({ sortOrder: 1, price: 1, createdAt: 1 })
    .lean()
  return Response.json(plans)
}
