import mongoose, { Schema, Document, Types } from 'mongoose'
import { LocalizedText, LocalizedSchema } from './localized'

// Manager-defined in-room services shown on the guest landing (airport
// transfer, pool, conference hall …). Translatable like menu items. Distinct
// from Bronit's bookable `Service` model — these are informational/orderable
// guest offerings, not calendar-bookable resources.
export interface IGuestService extends Document {
  _id: Types.ObjectId
  companyId: Types.ObjectId
  hotelId: Types.ObjectId
  name: string
  sourceLang: string
  nameI18n: LocalizedText
  nameI18nLocked: string[]      // languages kept as sourceLang text, not auto-translated
  description: string
  descI18n: LocalizedText
  descI18nLocked: string[]
  icon: string                 // optional icon key
  imageUrl: string
  price: number                // integer UZS; 0 = no price shown
  sortOrder: number
  active: boolean
  createdAt: Date
  updatedAt: Date
}

const GuestServiceSchema = new Schema<IGuestService>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    hotelId: { type: Schema.Types.ObjectId, ref: 'Hotel', required: true },
    name: { type: String, required: true, trim: true },
    sourceLang: { type: String, default: 'en' },
    nameI18n: { type: LocalizedSchema, default: () => ({}) },
    nameI18nLocked: { type: [String], default: [] },
    description: { type: String, default: '' },
    descI18n: { type: LocalizedSchema, default: () => ({}) },
    descI18nLocked: { type: [String], default: [] },
    icon: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    price: { type: Number, default: 0, min: 0 },
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
)

GuestServiceSchema.index({ hotelId: 1, sortOrder: 1 })

delete mongoose.models.GuestService
export const GuestService = mongoose.model<IGuestService>('GuestService', GuestServiceSchema)
