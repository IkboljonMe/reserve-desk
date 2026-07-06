import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IClient extends Document {
  _id: Types.ObjectId
  name: string
  phone: string
  roomNumber: string
  floor: number
  notes: string
  createdAt: Date
  updatedAt: Date
}

const ClientSchema = new Schema<IClient>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, default: '', trim: true },
    roomNumber: { type: String, default: '', trim: true },
    floor: { type: Number, default: 0 },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
)

ClientSchema.index({ name: 'text', roomNumber: 'text' })
ClientSchema.index({ roomNumber: 1 })

export const Client =
  (mongoose.models.Client as mongoose.Model<IClient>) ||
  mongoose.model<IClient>('Client', ClientSchema)
