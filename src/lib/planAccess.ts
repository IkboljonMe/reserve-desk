import 'server-only'
import type { Types } from 'mongoose'
import { connectDB } from '@/lib/mongodb'
import { Company } from '@/models/Company'
import { Plan } from '@/models/Plan'
import type { FeatureKey } from '@/lib/planFeatures'

// The feature keys granted by a company's current plan. Empty if the company
// or its plan can't be resolved (fail closed for gated features).
export async function companyPlanFeatures(companyId: Types.ObjectId | string): Promise<FeatureKey[]> {
  await connectDB()
  const company = await Company.findById(companyId).select('plan').lean<{ plan: string }>()
  if (!company) return []
  const plan = await Plan.findOne({ key: company.plan }).select('features').lean<{ features: FeatureKey[] }>()
  return plan?.features ?? []
}

export async function companyHasFeature(companyId: Types.ObjectId | string, feature: FeatureKey): Promise<boolean> {
  const features = await companyPlanFeatures(companyId)
  return features.includes(feature)
}
