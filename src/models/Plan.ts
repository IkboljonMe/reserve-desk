import mongoose, { Schema, Document } from 'mongoose'
import { FEATURE_KEYS, type FeatureKey } from '@/lib/planFeatures'

export const PLAN_KEY_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

// A subscription plan is a billing record plus a default feature set: a stable
// `key` (referenced by Company.plan), a display `name`, a monthly `price`, and
// the `features` the tier includes. A business seeds its own feature list from
// its plan when it's created, then may be tuned per-business (see Company), so
// this list is the tier's *default* rather than a hard gate.
export interface IPlan extends Document {
  key: string // matches Company.plan, e.g. "standard" — immutable after creation
  name: string
  price: number        // integer UZS per month (0 = "contact us" / free)
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
    price: { type: Number, default: 0, min: 0 },
    features: {
      type: [String],
      default: [],
      enum: FEATURE_KEYS as unknown as string[],
    },
  },
  { timestamps: true }
)

delete mongoose.models.Plan
export const Plan = mongoose.model<IPlan>('Plan', PlanSchema)
