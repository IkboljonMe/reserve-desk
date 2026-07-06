import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IRoom extends Document {
  _id: Types.ObjectId
  number: string      // e.g. "101", "204A"
  floor: number       // 1, 2, 3 …
  description: string
  createdAt: Date
  updatedAt: Date
}

const RoomSchema = new Schema<IRoom>(
  {
    number: { type: String, required: true, trim: true, unique: true },
    floor: { type: Number, required: true, default: 1 },
    description: { type: String, default: '' },
  },
  { timestamps: true }
)

RoomSchema.index({ floor: 1, number: 1 })

export const Room =
  (mongoose.models.Room as mongoose.Model<IRoom>) ||
  mongoose.model<IRoom>('Room', RoomSchema)
