import mongoose, { Schema, Document } from 'mongoose'

export const PLAN_KEY_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

// A subscription plan is now just a billing record: a stable `key` (referenced
// by Company.plan), a display `name`, and a monthly `price`. Feature access is
// no longer gated per plan — every business gets every module — so the old
// features/description/highlight/sortOrder fields were dropped.
export interface IPlan extends Document {
  key: string // matches Company.plan, e.g. "standard" — immutable after creation
  name: string
  price: number        // integer UZS per month (0 = "contact us" / free)
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
  },
  { timestamps: true }
)

delete mongoose.models.Plan
export const Plan = mongoose.model<IPlan>('Plan', PlanSchema)
