import mongoose, { Schema, Document, Types } from 'mongoose'

export type CompanyPlan = 'standard' | 'pro' | 'vip'

// Slugs that would collide with real routes under /secure/admin/{slug} or
// with other top-level app paths.
export const RESERVED_SLUGS = [
  'admin', 'superadmin', 'api', 'login', 'logout', 'dashboard', 'settings',
  'demo', 'secure', 'assets', 'static', 'favicon.ico',
]

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

export interface ICompany extends Document {
  _id: Types.ObjectId
  name: string
  slug: string
  plan: CompanyPlan
  expiresAt: Date
  contactName: string
  contactPhone: string
  paymentMethod: string
  createdAt: Date
  updatedAt: Date
}

const CompanySchema = new Schema<ICompany>(
  {
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: (v: string) => SLUG_PATTERN.test(v) && !RESERVED_SLUGS.includes(v),
        message: 'Slug must be lowercase letters, numbers and hyphens, and not a reserved word.',
      },
    },
    plan: { type: String, enum: ['standard', 'pro', 'vip'], default: 'standard' },
    expiresAt: { type: Date, required: true },
    contactName: { type: String, default: '', trim: true },
    contactPhone: { type: String, default: '', trim: true },
    paymentMethod: { type: String, default: '', trim: true },
  },
  { timestamps: true }
)

delete mongoose.models.Company
export const Company = mongoose.model<ICompany>('Company', CompanySchema)
