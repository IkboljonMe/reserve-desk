import mongoose, { Schema, Document, Types } from 'mongoose'

export type BookingStatus = 'confirmed' | 'pending' | 'cancelled'
export type BookingType = 'client' | 'room' | 'custom'

// A single audit event in a booking's history.
export interface IBookingEvent {
  action: 'created' | 'paid' | 'payment' | 'finished' | 'notes_updated' | 'reopened' | 'rescheduled'
  at: Date
  by?: Types.ObjectId
  detail?: string
}

export interface IBooking extends Document {
  _id: Types.ObjectId
  hotelId: Types.ObjectId  // Owner hotel the booking is attributed to (the service's owner hotel)
  bookedByHotelId?: Types.ObjectId  // Hotel that actually created it (differs from hotelId for shared services)
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
  persons: number     // party size (guests on this booking)
  totalPrice: number
  amountPaid: number  // money actually collected so far (0..totalPrice); < total is a deposit
  notes: string
  status: BookingStatus
  paid: boolean       // fully paid (amountPaid >= totalPrice); free bookings need no payment
  finished: boolean   // booking fulfilled/completed
  bookingType?: BookingType  // how it was booked: client group, room category, or custom
  category?: string          // client-group id or room-type chosen at booking
  variantId?: string         // service variant chosen (empty for single-config services)
  variantName?: string       // snapshot of the variant's name at booking time
  paidAt?: Date | null       // when payment was recorded
  finishedAt?: Date | null   // when it was marked completed
  // Coordinates of the Telegram message announcing this booking, so status
  // changes edit that message in place instead of posting a duplicate.
  tgChatId?: number
  tgMessageId?: number
  tgThreadId?: number
  history: IBookingEvent[]
  createdBy: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const BookingEventSchema = new Schema<IBookingEvent>({
  action: { type: String, required: true },
  at: { type: Date, default: Date.now },
  by: { type: Schema.Types.ObjectId, ref: 'Admin' },
  detail: { type: String },
}, { _id: false })

const BookingSchema = new Schema<IBooking>(
  {
    hotelId: { type: Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
    bookedByHotelId: { type: Schema.Types.ObjectId, ref: 'Hotel', default: null },
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
    persons: { type: Number, required: true, default: 1, min: 1 },
    totalPrice: { type: Number, required: true, default: 0 },
    amountPaid: { type: Number, default: 0, min: 0 },
    notes: { type: String, default: '' },
    status: { type: String, enum: ['confirmed', 'pending', 'cancelled'], default: 'confirmed' },
    paid: { type: Boolean, default: false },
    finished: { type: Boolean, default: false },
    bookingType: { type: String, enum: ['client', 'room', 'custom'], default: undefined },
    category: { type: String, default: '' },
    variantId: { type: String, default: '' },
    variantName: { type: String, default: '' },
    paidAt: { type: Date, default: null },
    finishedAt: { type: Date, default: null },
    tgChatId: { type: Number, default: null },
    tgMessageId: { type: Number, default: null },
    tgThreadId: { type: Number, default: null },
    history: { type: [BookingEventSchema], default: [] },
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
