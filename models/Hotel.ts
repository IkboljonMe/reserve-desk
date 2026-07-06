import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IHotel extends Document {
  _id: Types.ObjectId
  name: string        // Full name, e.g. "Fergana Grand Hotel"
  shortName: string   // Compact unique code, e.g. "FG"
  location: string    // e.g. "Fergana, Uzbekistan"
  createdAt: Date
  updatedAt: Date
}

const HotelSchema = new Schema<IHotel>(
  {
    name: { type: String, required: true, trim: true },
    shortName: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
    },
    location: { type: String, default: '', trim: true },
  },
  { timestamps: true }
)

export const Hotel =
  (mongoose.models.Hotel as mongoose.Model<IHotel>) ||
  mongoose.model<IHotel>('Hotel', HotelSchema)
