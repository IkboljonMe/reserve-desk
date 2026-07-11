import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IRoom extends Document {
  _id: Types.ObjectId
  companyId: Types.ObjectId
  hotelId: Types.ObjectId  // Hotel this room belongs to
  number: string           // Room's own number, e.g. "202" (displayed as "FG-202")
  floor: number            // 1, 2, 3 …
  order: number            // manual sort position within its hotel+floor
  type: string             // e.g. "Standard", "Lux"
  description: string
  createdAt: Date
  updatedAt: Date
}

const RoomSchema = new Schema<IRoom>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    hotelId: { type: Schema.Types.ObjectId, ref: 'Hotel', required: true },
    number: { type: String, required: true, trim: true },
    floor: { type: Number, required: true, default: 1 },
    order: { type: Number, default: 0 },
    type: { type: String, default: '' },
    description: { type: String, default: '' },
  },
  { timestamps: true }
)

// A room number is unique within a hotel (FG-202 and BH-202 can co-exist).
RoomSchema.index({ hotelId: 1, number: 1 }, { unique: true })
RoomSchema.index({ hotelId: 1, floor: 1, number: 1 })

delete mongoose.models.Room
export const Room = mongoose.model<IRoom>('Room', RoomSchema)
