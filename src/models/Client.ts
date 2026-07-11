import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IClient extends Document {
  _id: Types.ObjectId
  companyId: Types.ObjectId // Tenant this client belongs to (shared pool within the company)
  hotelId?: Types.ObjectId  // Legacy: clients are now a single global pool, not per-hotel
  name: string
  phone: string
  roomNumber: string
  floor: number
  notes: string
  groupId: Types.ObjectId | null
  createdAt: Date
  updatedAt: Date
}

const ClientSchema = new Schema<IClient>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    hotelId: { type: Schema.Types.ObjectId, ref: 'Hotel', required: false, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, default: '', trim: true },
    roomNumber: { type: String, default: '', trim: true },
    floor: { type: Number, default: 0 },
    notes: { type: String, default: '' },
    groupId: { type: Schema.Types.ObjectId, ref: 'ClientGroup', default: null },
  },
  { timestamps: true }
)

ClientSchema.index({ name: 'text', roomNumber: 'text' })
ClientSchema.index({ roomNumber: 1 })
ClientSchema.index({ groupId: 1 })

// Force re-registration so the new groupId field is picked up in dev.
delete mongoose.models.Client
export const Client = mongoose.model<IClient>('Client', ClientSchema)
