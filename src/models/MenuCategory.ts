import mongoose, { Schema, Document, Types } from 'mongoose'
import { LocalizedText, LocalizedSchema } from './localized'

// A menu section (e.g. "Breakfast", "Drinks") for one hotel's room-service menu.
export interface IMenuCategory extends Document {
  _id: Types.ObjectId
  companyId: Types.ObjectId    // tenant (denormalized for scoped queries)
  hotelId: Types.ObjectId
  name: string                 // source/fallback text (in sourceLang)
  sourceLang: string           // 'en' | 'ru' | 'uz'
  nameI18n: LocalizedText      // { en, ru, uz } — empty entries fall back to `name`
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

const MenuCategorySchema = new Schema<IMenuCategory>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    hotelId: { type: Schema.Types.ObjectId, ref: 'Hotel', required: true },
    name: { type: String, required: true, trim: true },
    sourceLang: { type: String, default: 'en' },
    nameI18n: { type: LocalizedSchema, default: () => ({}) },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
)

MenuCategorySchema.index({ hotelId: 1, sortOrder: 1 })

delete mongoose.models.MenuCategory
export const MenuCategory = mongoose.model<IMenuCategory>('MenuCategory', MenuCategorySchema)
