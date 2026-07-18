import mongoose, { Schema, Document } from 'mongoose'
import { FEATURE_KEYS, type FeatureKey } from '@/lib/planFeatures'

export const PLAN_KEY_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

export interface IPlan extends Document {
  key: string // matches Company.plan, e.g. "standard" — immutable after creation
  name: string
  features: FeatureKey[]
  price: number        // integer UZS per month (0 = "contact us" / free)
  description: string  // short marketing line shown on the landing card
  highlight: boolean   // the "most popular" card on the landing page
  sortOrder: number    // ascending display order on the landing page
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
    price: { type: Number, default: 0, min: 0 },
    description: { type: String, default: '', trim: true },
    highlight: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
)

delete mongoose.models.Plan
export const Plan = mongoose.model<IPlan>('Plan', PlanSchema)
