import mongoose, { Schema, Document, Types } from 'mongoose'

export type TileId = 'alarm' | 'services' | 'taxi' | 'reception' | 'problem' | 'reviews' | 'menu' | 'wifi'

export interface TileConfig {
  id: TileId
  enabled: boolean
  sortOrder: number
  labelUz: string
  labelRu: string
  labelEn: string
}

const TileConfigSchema = new Schema<TileConfig>(
  {
    id: { type: String, required: true },
    enabled: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    labelUz: { type: String, default: '' },
    labelRu: { type: String, default: '' },
    labelEn: { type: String, default: '' },
  },
  { _id: false },
)

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
  bannerUrl: string
  logoUrl: string
  receptionPhone: string
  // Wi-Fi credentials shown in the hub Wi-Fi tile.
  wifiName: string
  wifiPassword: string
  // Review / map URLs — first non-empty one used for the Reviews tile.
  tripadvisorUrl: string
  googleMapsUrl: string
  yandexMapsUrl: string
  // Social links shown in the hub footer.
  instagramUrl: string
  telegramUrl: string
  // Hub service tiles.
  tiles: TileConfig[]
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
    bannerUrl: { type: String, default: '' },
    logoUrl: { type: String, default: '' },
    receptionPhone: { type: String, default: '' },
    wifiName: { type: String, default: '' },
    wifiPassword: { type: String, default: '' },
    tripadvisorUrl: { type: String, default: '' },
    googleMapsUrl: { type: String, default: '' },
    yandexMapsUrl: { type: String, default: '' },
    instagramUrl: { type: String, default: '' },
    telegramUrl: { type: String, default: '' },
    tiles: { type: [TileConfigSchema], default: [] },
  },
  { timestamps: true },
)

delete mongoose.models.HotelMenuSettings
export const HotelMenuSettings = mongoose.model<IHotelMenuSettings>('HotelMenuSettings', HotelMenuSettingsSchema)
