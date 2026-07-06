import mongoose, { Schema, Document, Types } from 'mongoose'

export type BookingStatus = 'confirmed' | 'pending' | 'cancelled'

export interface IBooking extends Document {
  _id: Types.ObjectId
  serviceId: Types.ObjectId
  customerName: string
  customerPhone: string
  date: string        // "YYYY-MM-DD"
  startTime: string   // "HH:mm"
  endTime: string     // "HH:mm"
  notes: string
  status: BookingStatus
  createdBy: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const BookingSchema = new Schema<IBooking>(
  {
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, default: '' },
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    notes: { type: String, default: '' },
    status: { type: String, enum: ['confirmed', 'pending', 'cancelled'], default: 'confirmed' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Admin' },
  },
  { timestamps: true }
)

// Index for fast calendar queries
BookingSchema.index({ serviceId: 1, date: 1 })
BookingSchema.index({ date: 1 })

export const Booking =
  (mongoose.models.Booking as mongoose.Model<IBooking>) ||
  mongoose.model<IBooking>('Booking', BookingSchema)
