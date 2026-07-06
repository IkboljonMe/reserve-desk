import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IService extends Document {
  _id: Types.ObjectId
  name: string
  description: string
  location: string
  openTime: string   // "HH:mm"
  closeTime: string  // "HH:mm"
  slotDuration: number  // minutes
  capacity: number
  price: number
  isFree: boolean
  details: string
  color: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const ServiceSchema = new Schema<IService>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    location: { type: String, default: '' },
    openTime: { type: String, required: true, default: '08:00' },
    closeTime: { type: String, required: true, default: '20:00' },
    slotDuration: { type: Number, required: true, default: 60 },
    capacity: { type: Number, required: true, default: 1 },
    price: { type: Number, default: 0 },
    isFree: { type: Boolean, default: false },
    details: { type: String, default: '' },
    color: { type: String, default: '#6366f1' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export const Service =
  (mongoose.models.Service as mongoose.Model<IService>) ||
  mongoose.model<IService>('Service', ServiceSchema)
