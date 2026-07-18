import mongoose, { Schema, Document, Types } from 'mongoose'

// A company's plan is a free-form key referencing Plan.key (see
// src/models/Plan.ts) — superadmins can create plans beyond the seeded
// standard/pro/vip, so this isn't a fixed union anymore. Validity against the
// current Plan catalog is checked at the API layer, not in the schema.
export type CompanyPlan = string

// Slugs that would collide with real routes under /secure/company/{slug} or
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
  note: string
  createdAt: Date
  updatedAt: Date
}

// Generates a URL-safe slug from a company name (used internally for routing).
export function slugifyCompanyName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
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
    plan: { type: String, default: 'standard', trim: true, lowercase: true },
    expiresAt: { type: Date, required: true },
    contactName: { type: String, default: '', trim: true },
    contactPhone: { type: String, default: '', trim: true },
    paymentMethod: { type: String, default: '', trim: true },
    note: { type: String, default: '', trim: true },
  },
  { timestamps: true }
)

delete mongoose.models.Company
export const Company = mongoose.model<ICompany>('Company', CompanySchema)
