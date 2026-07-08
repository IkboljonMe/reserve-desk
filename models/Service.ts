import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IPricingPlan {
  duration: number
  price: number
}

// A pricing group scopes a set of duration/price rows to a specific room
// category or client group. `target` is what kind of category it applies to;
// `category` holds the room-type name (for 'room') or the ClientGroup _id
// (for 'client').
export interface IPricingGroup {
  target: 'room' | 'client'
  category: string
  rows: IPricingPlan[]
}

export interface IService extends Document {
  _id: Types.ObjectId
  name: string
  icon: string
  description: string
  hotelId: Types.ObjectId          // Owner hotel — the one the resource physically belongs to
  sharedHotelIds: Types.ObjectId[] // Other hotels allowed to book this same (single) resource
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
  pricingGroups: IPricingGroup[]
  color: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const PricingPlanSchema = new Schema<IPricingPlan>({
  duration: { type: Number, required: true },
  price: { type: Number, required: true }
}, { _id: false })

const PricingGroupSchema = new Schema<IPricingGroup>({
  target: { type: String, enum: ['room', 'client'], required: true },
  category: { type: String, required: true },
  rows: { type: [PricingPlanSchema], default: [] },
}, { _id: false })

const ServiceSchema = new Schema<IService>(
  {
    name: { type: String, required: true, trim: true },
    icon: { type: String, default: 'concierge' },
    description: { type: String, default: '' },
    hotelId: { type: Schema.Types.ObjectId, ref: 'Hotel' },
    sharedHotelIds: { type: [{ type: Schema.Types.ObjectId, ref: 'Hotel' }], default: [] },
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
    pricingGroups: { type: [PricingGroupSchema], default: [] },
    color: { type: String, default: '#6366f1' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

// Force re-registration so the new pricingGroups field is picked up in dev.
delete mongoose.models.Service
export const Service = mongoose.model<IService>('Service', ServiceSchema)
