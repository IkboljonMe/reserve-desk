import mongoose, { Schema, Document, Types } from 'mongoose'

// One document per company: the group chat that company's bot posts booking
// notifications to, set via the /login flow run inside that group.
export interface ITelegramConfig extends Document {
  _id: Types.ObjectId
  companyId: Types.ObjectId
  groupChatId: number
  loggedInBy: Types.ObjectId // Admin (owner) who completed /login
  // Forum topic where the periodic (monthly) reports are posted, created on
  // demand. Absent until the first monthly report, or when the group isn't a
  // forum (reports then fall back to the General topic).
  reportsThreadId?: number
  createdAt: Date
  updatedAt: Date
}

const TelegramConfigSchema = new Schema<ITelegramConfig>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, unique: true },
    groupChatId: { type: Number, required: true },
    loggedInBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
    reportsThreadId: { type: Number },
  },
  { timestamps: true }
)

delete mongoose.models.TelegramConfig
export const TelegramConfig = mongoose.model<ITelegramConfig>('TelegramConfig', TelegramConfigSchema)
