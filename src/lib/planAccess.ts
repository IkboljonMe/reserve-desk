import 'server-only'
import type { Types } from 'mongoose'
import { connectDB } from '@/lib/mongodb'
import { Company } from '@/models/Company'
import { normalizeFeatures, type FeatureKey } from '@/lib/planFeatures'

// A business's enabled features live on the Company (seeded from its plan at
// creation, then editable per-business). Returns `null` when the business
// doesn't have the field configured at all — a legacy doc predating feature
// gating — which callers treat as "ungated / full access" so an upgrade never
// silently locks an existing customer out. A present-but-empty array means the
// business really has no modules enabled.
export async function companyFeatureAccess(
  companyId: Types.ObjectId | string,
): Promise<FeatureKey[] | null> {
  await connectDB()
  const company = await Company.findById(companyId).select('features').lean<{ features?: FeatureKey[] }>()
  if (!company || company.features == null) return null
  return normalizeFeatures(company.features)
}

export async function companyHasFeature(
  companyId: Types.ObjectId | string,
  feature: FeatureKey,
): Promise<boolean> {
  const features = await companyFeatureAccess(companyId)
  return features == null || features.includes(feature)
}
