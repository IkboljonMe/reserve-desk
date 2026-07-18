import mongoose, { Schema, Document, Types } from 'mongoose'

// One forum topic in the notifications group per hotel, dedicated to room-service
// menu orders (kept separate from the per-(hotel, service) TelegramTopic used by
// bookings — a menu order isn't tied to any Service).
export interface IMenuTelegramTopic extends Document {
  _id: Types.ObjectId
  hotelId: Types.ObjectId
  name: string          // "SAF-Menu"
  messageThreadId: number
  createdAt: Date
  updatedAt: Date
}

const MenuTelegramTopicSchema = new Schema<IMenuTelegramTopic>(
  {
    hotelId: { type: Schema.Types.ObjectId, ref: 'Hotel', required: true, unique: true },
    name: { type: String, required: true },
    messageThreadId: { type: Number, required: true },
  },
  { timestamps: true }
)

delete mongoose.models.MenuTelegramTopic
export const MenuTelegramTopic = mongoose.model<IMenuTelegramTopic>('MenuTelegramTopic', MenuTelegramTopicSchema)
