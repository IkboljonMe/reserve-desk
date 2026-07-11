import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IHotel extends Document {
  _id: Types.ObjectId
  companyId: Types.ObjectId // The tenant (Company) this hotel belongs to.
  name: string        // Full name, e.g. "Fergana Grand Hotel"
  shortName: string   // Compact unique code, e.g. "FG"
  location: string    // e.g. "Fergana, Uzbekistan"
  roomTypes: string[] // e.g. ["Standard", "Middle", "Lux"]
  createdAt: Date
  updatedAt: Date
}

const HotelSchema = new Schema<IHotel>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    name: { type: String, required: true, trim: true },
    shortName: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    location: { type: String, default: '', trim: true },
    roomTypes: { type: [String], default: [] },
  },
  { timestamps: true }
)

// shortName only needs to be unique within a company, not globally.
HotelSchema.index({ companyId: 1, shortName: 1 }, { unique: true })

delete mongoose.models.Hotel
export const Hotel = mongoose.model<IHotel>('Hotel', HotelSchema)
