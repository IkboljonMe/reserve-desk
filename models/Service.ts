import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IPricingPlan {
  duration: number
  price: number
}

export interface IService extends Document {
  _id: Types.ObjectId
  name: string
  icon: string
  description: string
  hotelId: Types.ObjectId
  openTime: string   // "HH:mm"
  closeTime: string  // "HH:mm"
  slotDuration: number
  capacity: number
  price: number
  isFree: boolean
  details: string
  bufferTimeBefore: number
  bufferTimeAfter: number
  pricingPlans: IPricingPlan[]
  color: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const PricingPlanSchema = new Schema<IPricingPlan>({
  duration: { type: Number, required: true },
  price: { type: Number, required: true }
}, { _id: false })

const ServiceSchema = new Schema<IService>(
  {
    name: { type: String, required: true, trim: true },
    icon: { type: String, default: 'concierge' },
    description: { type: String, default: '' },
    hotelId: { type: Schema.Types.ObjectId, ref: 'Hotel' },
    openTime: { type: String, required: true, default: '08:00' },
    closeTime: { type: String, required: true, default: '20:00' },
    slotDuration: { type: Number, required: true, default: 60 },
    capacity: { type: Number, required: true, default: 1 },
    price: { type: Number, default: 0 },
    isFree: { type: Boolean, default: false },
    details: { type: String, default: '' },
    bufferTimeBefore: { type: Number, default: 0 },
    bufferTimeAfter: { type: Number, default: 0 },
    pricingPlans: { type: [PricingPlanSchema], default: [] },
    color: { type: String, default: '#6366f1' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export const Service =
  (mongoose.models.Service as mongoose.Model<IService>) ||
  mongoose.model<IService>('Service', ServiceSchema)
