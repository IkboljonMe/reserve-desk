import mongoose, { Schema, Document, Types } from 'mongoose'

// Per-hotel configuration for the room-service menu module. Kept separate from
// the core Hotel model so hotels without a menu carry none of these fields, and
// the menu stays an opt-in module. One document per hotel.
export interface IHotelMenuSettings extends Document {
  _id: Types.ObjectId
  companyId: Types.ObjectId
  hotelId: Types.ObjectId
  menuEnabled: boolean
  serviceFeeType: 'none' | 'percent' | 'fixed'
  serviceFeeValue: number      // percent (e.g. 10) or fixed UZS amount
  preorderEnabled: boolean
  // Guest-landing branding.
  logoUrl: string
  wifiName: string
  wifiPassword: string
  tripadvisorUrl: string
  googleMapsUrl: string
  yandexMapsUrl: string
  instagramUrl: string
  telegramUrl: string
  createdAt: Date
  updatedAt: Date
}

const HotelMenuSettingsSchema = new Schema<IHotelMenuSettings>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    hotelId: { type: Schema.Types.ObjectId, ref: 'Hotel', required: true, unique: true },
    menuEnabled: { type: Boolean, default: false },
    serviceFeeType: { type: String, enum: ['none', 'percent', 'fixed'], default: 'none' },
    serviceFeeValue: { type: Number, default: 0, min: 0 },
    preorderEnabled: { type: Boolean, default: false },
    logoUrl: { type: String, default: '' },
    wifiName: { type: String, default: '' },
    wifiPassword: { type: String, default: '' },
    tripadvisorUrl: { type: String, default: '' },
    googleMapsUrl: { type: String, default: '' },
    yandexMapsUrl: { type: String, default: '' },
    instagramUrl: { type: String, default: '' },
    telegramUrl: { type: String, default: '' },
  },
  { timestamps: true },
)

delete mongoose.models.HotelMenuSettings
export const HotelMenuSettings = mongoose.model<IHotelMenuSettings>('HotelMenuSettings', HotelMenuSettingsSchema)
