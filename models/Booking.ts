import mongoose, { Schema, Document, Types } from 'mongoose'

export type BookingStatus = 'confirmed' | 'pending' | 'cancelled'

export interface IBooking extends Document {
  _id: Types.ObjectId
  serviceId: Types.ObjectId
  clientId?: Types.ObjectId
  customerName: string
  customerPhone: string
  roomNumber: string
  date: string        // "YYYY-MM-DD"
  startTime: string   // "HH:mm"
  endTime: string     // "HH:mm"
  bufferedEndTime: string
  duration: number    // minutes
  totalPrice: number
  notes: string
  status: BookingStatus
  paid: boolean       // payment received (free bookings need no payment)
  finished: boolean   // booking fulfilled/completed
  createdBy: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const BookingSchema = new Schema<IBooking>(
  {
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', default: null },
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, default: '' },
    roomNumber: { type: String, default: '', trim: true },
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    bufferedEndTime: { type: String, required: true },
    duration: { type: Number, required: true, default: 60 },
    totalPrice: { type: Number, required: true, default: 0 },
    notes: { type: String, default: '' },
    status: { type: String, enum: ['confirmed', 'pending', 'cancelled'], default: 'confirmed' },
    paid: { type: Boolean, default: false },
    finished: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Admin' },
  },
  { timestamps: true }
)

// Index for fast calendar queries
BookingSchema.index({ serviceId: 1, date: 1 })
BookingSchema.index({ date: 1 })

// Force re-registration so the new paid/finished fields are picked up in dev.
delete mongoose.models.Booking
export const Booking = mongoose.model<IBooking>('Booking', BookingSchema)
