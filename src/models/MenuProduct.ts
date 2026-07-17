import mongoose, { Schema, Document, Types } from 'mongoose'
import { LocalizedText, LocalizedSchema } from './localized'

// A single orderable menu item, belonging to a MenuCategory of one hotel.
export interface IMenuProduct extends Document {
  _id: Types.ObjectId
  companyId: Types.ObjectId
  hotelId: Types.ObjectId
  categoryId: Types.ObjectId
  name: string                 // source/fallback text (in sourceLang)
  description: string          // source/fallback text
  sourceLang: string
  nameI18n: LocalizedText
  descI18n: LocalizedText
  price: number                // integer UZS (so'm) — whole units, no minor units
  imageUrl: string
  available: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

const MenuProductSchema = new Schema<IMenuProduct>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    hotelId: { type: Schema.Types.ObjectId, ref: 'Hotel', required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'MenuCategory', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    sourceLang: { type: String, default: 'en' },
    nameI18n: { type: LocalizedSchema, default: () => ({}) },
    descI18n: { type: LocalizedSchema, default: () => ({}) },
    price: { type: Number, required: true, min: 0 },
    imageUrl: { type: String, default: '' },
    available: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
)

MenuProductSchema.index({ categoryId: 1, sortOrder: 1 })
MenuProductSchema.index({ hotelId: 1 })

delete mongoose.models.MenuProduct
export const MenuProduct = mongoose.model<IMenuProduct>('MenuProduct', MenuProductSchema)
