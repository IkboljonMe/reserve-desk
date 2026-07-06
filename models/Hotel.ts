import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IHotel extends Document {
  _id: Types.ObjectId
  name: string
  createdAt: Date
  updatedAt: Date
}

const HotelSchema = new Schema<IHotel>(
  {
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true }
)

export const Hotel =
  (mongoose.models.Hotel as mongoose.Model<IHotel>) ||
  mongoose.model<IHotel>('Hotel', HotelSchema)
