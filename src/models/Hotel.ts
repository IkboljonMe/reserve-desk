import mongoose, { Schema, Document, Types } from 'mongoose'

export const HOTEL_SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

// URL-safe slug from a hotel name, e.g. "Tashkent Grand Hotel" -> "tashkent-grand-hotel".
export function slugifyHotelName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export interface IHotel extends Document {
  _id: Types.ObjectId
  companyId: Types.ObjectId // The tenant (Company) this hotel belongs to.
  name: string        // Full name, e.g. "Fergana Grand Hotel"
  shortName: string   // Compact unique code, e.g. "FG"
  // URL segment for this hotel's admin area:
  // /secure/company/{companySlug}/admin/{slug}. Defaults to the slugified
  // name; the owner can change it in Settings → Hotels.
  slug: string
  location: string    // e.g. "Fergana, Uzbekistan"
  roomTypes: string[] // e.g. ["Standard", "Middle", "Lux"]
  createdAt: Date
  updatedAt: Date
}

const HotelSchema = new Schema<IHotel>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    name: { type: String, required: true, trim: true },
    shortName: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: (v: string) => !v || HOTEL_SLUG_PATTERN.test(v),
        message: 'Slug must be lowercase letters, numbers and hyphens.',
      },
    },
    location: { type: String, default: '', trim: true },
    roomTypes: { type: [String], default: [] },
  },
  { timestamps: true }
)

// Default the slug from the name so every hotel is reachable even if the
// caller never set one explicitly.
HotelSchema.pre('save', function () {
  if (!this.slug) this.slug = slugifyHotelName(this.name as string)
})

// shortName / slug only need to be unique within a company, not globally.
HotelSchema.index({ companyId: 1, shortName: 1 }, { unique: true })
HotelSchema.index(
  { companyId: 1, slug: 1 },
  { unique: true, partialFilterExpression: { slug: { $type: 'string' } } }
)

delete mongoose.models.Hotel
export const Hotel = mongoose.model<IHotel>('Hotel', HotelSchema)
