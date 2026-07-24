import mongoose, { Schema, Document, Types } from 'mongoose'
import type { FeatureKey } from '@/lib/planFeatures'
import type { BillingCycle, OfferingUnit } from '@/lib/offerings'

// A quote the superadmin composes live with a prospect: a set of priced line
// items (seeded from the offering catalog, then editable), a billing cycle, a
// negotiated discount, and payment terms. Saved as a `draft`, then turned into
// a real business by the provisioning step (which sets `companyId`).
//
// Every line snapshots its label/price/feature so later catalog edits never
// rewrite an existing order.
export type OrderStatus = 'draft' | 'accepted' | 'provisioned' | 'cancelled'
export const ORDER_STATUSES: OrderStatus[] = ['draft', 'accepted', 'provisioned', 'cancelled']

export interface IOrderLine {
  offeringKey: string
  label: string          // snapshot of the offering name at quote time
  unit: OfferingUnit
  feature: FeatureKey    // module this line unlocks when provisioned
  unitPrice: number      // monthly UZS per unit (editable)
  quantity: number       // services count / room count / 1 for flat
}

export interface IOrder extends Document {
  _id: Types.ObjectId
  // The prospect / future business.
  businessName: string
  contactName: string
  contactPhone: string
  lines: IOrderLine[]
  monthlySubtotal: number   // Σ unitPrice × quantity (stored for display/history)
  billingCycle: BillingCycle
  discountPercent: number
  total: number             // final charge for the cycle, after discount
  paymentMethod: string
  paymentDate: Date | null  // when payment is expected / was made
  status: OrderStatus
  companyId: Types.ObjectId | null  // set once the business is provisioned
  note: string
  createdAt: Date
  updatedAt: Date
}

const OrderLineSchema = new Schema<IOrderLine>(
  {
    offeringKey: { type: String, required: true },
    label: { type: String, required: true },
    unit: { type: String, required: true },
    feature: { type: String, required: true },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 0 },
  },
  { _id: false },
)

const OrderSchema = new Schema<IOrder>(
  {
    businessName: { type: String, required: true, trim: true },
    contactName: { type: String, default: '', trim: true },
    contactPhone: { type: String, default: '', trim: true },
    lines: { type: [OrderLineSchema], default: [] },
    monthlySubtotal: { type: Number, default: 0, min: 0 },
    billingCycle: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    total: { type: Number, default: 0, min: 0 },
    paymentMethod: { type: String, default: '', trim: true },
    paymentDate: { type: Date, default: null },
    status: { type: String, enum: ORDER_STATUSES, default: 'draft' },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', default: null },
    note: { type: String, default: '', trim: true },
  },
  { timestamps: true },
)

delete mongoose.models.Order
export const Order = mongoose.model<IOrder>('Order', OrderSchema)
