import mongoose, { Schema, Document, Types } from 'mongoose'

// Singleton (one document total): the group chat the bot posts booking
// notifications to, set once via the /login flow in that group.
export interface ITelegramConfig extends Document {
  _id: Types.ObjectId
  groupChatId: number
  loggedInBy: Types.ObjectId // Admin (owner) who completed /login
  createdAt: Date
  updatedAt: Date
}

const TelegramConfigSchema = new Schema<ITelegramConfig>(
  {
    groupChatId: { type: Number, required: true },
    loggedInBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
  },
  { timestamps: true }
)

delete mongoose.models.TelegramConfig
export const TelegramConfig = mongoose.model<ITelegramConfig>('TelegramConfig', TelegramConfigSchema)
