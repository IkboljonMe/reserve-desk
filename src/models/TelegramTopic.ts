import mongoose, { Schema, Document, Types } from 'mongoose'

// One forum topic in the notifications group per (hotel, service), e.g. "SAF-Pool".
export interface ITelegramTopic extends Document {
  _id: Types.ObjectId
  hotelId: Types.ObjectId
  serviceId: Types.ObjectId
  name: string          // "SAF-Pool"
  messageThreadId: number
  createdAt: Date
  updatedAt: Date
}

const TelegramTopicSchema = new Schema<ITelegramTopic>(
  {
    hotelId: { type: Schema.Types.ObjectId, ref: 'Hotel', required: true },
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
    name: { type: String, required: true },
    messageThreadId: { type: Number, required: true },
  },
  { timestamps: true }
)

TelegramTopicSchema.index({ hotelId: 1, serviceId: 1 }, { unique: true })

delete mongoose.models.TelegramTopic
export const TelegramTopic = mongoose.model<ITelegramTopic>('TelegramTopic', TelegramTopicSchema)
