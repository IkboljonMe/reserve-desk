import mongoose, { Schema, Document, Types } from 'mongoose'

// An optional review a guest leaves after placing a room-service order. Purely
// feedback — not tied to payment or fulfilment. Surfaced in the end-of-day
// Telegram summary so the team sees the day's feedback in one place.
export interface IGuestReview extends Document {
  _id: Types.ObjectId
  companyId: Types.ObjectId
  hotelId: Types.ObjectId
  orderId?: Types.ObjectId   // the menu order it followed, if any
  roomNumber: string
  guestName: string
  rating: number             // 1..5
  comment: string
  createdAt: Date
  updatedAt: Date
}

const GuestReviewSchema = new Schema<IGuestReview>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    hotelId: { type: Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'MenuOrder', default: null },
    roomNumber: { type: String, default: '', trim: true },
    guestName: { type: String, default: '', trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '', trim: true },
  },
  { timestamps: true },
)

GuestReviewSchema.index({ companyId: 1, createdAt: -1 })

delete mongoose.models.GuestReview
export const GuestReview = mongoose.model<IGuestReview>('GuestReview', GuestReviewSchema)
