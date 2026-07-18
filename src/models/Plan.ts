import mongoose, { Schema, Document } from 'mongoose'
import { FEATURE_KEYS, type FeatureKey } from '@/lib/planFeatures'

export const PLAN_KEY_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

export interface IPlan extends Document {
  key: string // matches Company.plan, e.g. "standard" — immutable after creation
  name: string
  features: FeatureKey[]
  createdAt: Date
  updatedAt: Date
}

const PlanSchema = new Schema<IPlan>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: (v: string) => PLAN_KEY_PATTERN.test(v),
        message: 'Key must be lowercase letters, numbers and hyphens.',
      },
    },
    name: { type: String, required: true, trim: true },
    features: [{ type: String, enum: FEATURE_KEYS }],
  },
  { timestamps: true }
)

delete mongoose.models.Plan
export const Plan = mongoose.model<IPlan>('Plan', PlanSchema)
