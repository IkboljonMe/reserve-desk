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

// shortName is unique within a company. The slug, however, is GLOBALLY unique:
// it identifies a hotel's public guest hub at menu.bronit.uz/<locale>/<slug>
// with no company in the path, so no two hotels anywhere may share one.
// (Migration for existing per-company data: src/scripts/migrate-hotel-slug-global.ts.)
HotelSchema.index({ companyId: 1, shortName: 1 }, { unique: true })
HotelSchema.index(
  { slug: 1 },
  { unique: true, partialFilterExpression: { slug: { $type: 'string' } } }
)

delete mongoose.models.Hotel
export const Hotel = mongoose.model<IHotel>('Hotel', HotelSchema)

// Returns true if `slug` is already used by a hotel other than `excludeId`.
// The slug is globally unique (see the index note above), so this deliberately
// checks across ALL companies, not just the caller's.
export async function isHotelSlugTaken(slug: string, excludeId?: Types.ObjectId | string): Promise<boolean> {
  const query: Record<string, unknown> = { slug }
  if (excludeId) query._id = { $ne: excludeId }
  const clash = await Hotel.findOne(query).select('_id').lean()
  return !!clash
}
