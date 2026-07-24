import mongoose, { Schema, Document, Types } from 'mongoose'
import { FEATURE_KEYS, type FeatureKey } from '@/lib/planFeatures'
import { PAYMENT_STATUSES, type PaymentStatus } from '@/lib/paymentStatus'

export type { PaymentStatus }

// A company's plan is a free-form key referencing Plan.key (see
// src/models/Plan.ts) — superadmins can create plans beyond the seeded
// standard/pro/vip, so this isn't a fixed union anymore. Validity against the
// current Plan catalog is checked at the API layer, not in the schema.
export type CompanyPlan = string

// How the guest food menu is scoped across a company's hotels:
//  - 'per_hotel' (default): each hotel has its own menu (categories/products).
//  - 'shared': every hotel shows one shared menu — the content of
//    menuSourceHotelId — so the owner edits it once.
export type MenuMode = 'per_hotel' | 'shared'

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
  // The modules this business can actually use. Seeded from its plan's default
  // features at creation, then editable per-business (so a "Custom" deal or a
  // one-off add-on works without inventing a new plan). An empty array is a
  // fully-locked business; the *absence* of the field (legacy docs) means
  // "ungated" — see companyFeatureAccess in lib/planAccess.ts.
  features: FeatureKey[]
  expiresAt: Date
  contactName: string
  contactPhone: string
  paymentMethod: string
  paymentStatus: PaymentStatus
  note: string
  // Guest food-menu scope across this company's hotels.
  menuMode: MenuMode
  menuSourceHotelId: Types.ObjectId | null  // the shared menu's source hotel (used when menuMode === 'shared')
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
    features: {
      type: [String],
      default: undefined, // absent => ungated (legacy); a set array => gated
      enum: FEATURE_KEYS as unknown as string[],
    },
    expiresAt: { type: Date, required: true },
    contactName: { type: String, default: '', trim: true },
    contactPhone: { type: String, default: '', trim: true },
    paymentMethod: { type: String, default: '', trim: true },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'pending' },
    note: { type: String, default: '', trim: true },
    menuMode: { type: String, enum: ['per_hotel', 'shared'], default: 'per_hotel' },
    menuSourceHotelId: { type: Schema.Types.ObjectId, ref: 'Hotel', default: null },
  },
  { timestamps: true }
)

delete mongoose.models.Company
export const Company = mongoose.model<ICompany>('Company', CompanySchema)
