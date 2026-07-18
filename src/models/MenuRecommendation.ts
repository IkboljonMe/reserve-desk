import mongoose, { Schema, Document, Types } from 'mongoose'

// "Recommendation of the day" — a product featured on a given weekday for a
// hotel. dayOfWeek: 0 = Sunday … 6 = Saturday.
export interface IMenuRecommendation extends Document {
  _id: Types.ObjectId
  companyId: Types.ObjectId
  hotelId: Types.ObjectId
  dayOfWeek: number
  productId: Types.ObjectId
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

const MenuRecommendationSchema = new Schema<IMenuRecommendation>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    hotelId: { type: Schema.Types.ObjectId, ref: 'Hotel', required: true },
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    productId: { type: Schema.Types.ObjectId, ref: 'MenuProduct', required: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
)

// One product can be featured once per weekday, per hotel.
MenuRecommendationSchema.index({ hotelId: 1, dayOfWeek: 1, productId: 1 }, { unique: true })

delete mongoose.models.MenuRecommendation
export const MenuRecommendation = mongoose.model<IMenuRecommendation>('MenuRecommendation', MenuRecommendationSchema)
