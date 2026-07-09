import mongoose, { Schema, Document, Types } from 'mongoose'

// Transient state for the in-chat /login flow (one per Telegram chat+user).
// Expires on its own shortly after the last message so an abandoned login
// doesn't linger forever.
export interface ITelegramSession extends Document {
  _id: Types.ObjectId
  chatId: number
  userId: number
  step: 'awaiting_email' | 'awaiting_password'
  email?: string
  updatedAt: Date
}

const TelegramSessionSchema = new Schema<ITelegramSession>(
  {
    chatId: { type: Number, required: true },
    userId: { type: Number, required: true },
    step: { type: String, enum: ['awaiting_email', 'awaiting_password'], required: true },
    email: { type: String },
    updatedAt: { type: Date, default: Date.now, expires: 600 }, // 10 minutes
  }
)

TelegramSessionSchema.index({ chatId: 1, userId: 1 }, { unique: true })

delete mongoose.models.TelegramSession
export const TelegramSession = mongoose.model<ITelegramSession>('TelegramSession', TelegramSessionSchema)
