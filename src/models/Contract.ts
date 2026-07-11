import mongoose, { Schema, Document, Types } from 'mongoose'

// A contract with a partner organization that lets their staff stay at the
// hotel. The critical field is `finishDate` — we track it so we can remind
// the admin to renew or terminate before it lapses (see /api/notifications).
export type ContractStatus = 'awaiting' | 'signed' | 'terminated'

export interface IContract extends Document {
  _id: Types.ObjectId
  companyId: Types.ObjectId
  hotelId: Types.ObjectId  // Hotel this contract belongs to
  organizationName: string
  inn: string
  representativeName: string
  phone: string
  contractNumber: string
  signDate: Date | null
  finishDate: Date | null
  status: ContractStatus
  contractLink: string
  notes: string
  // Days-before-finish thresholds that should generate a reminder.
  reminderDays: number[]
  // Reminder tiers the admin has already dismissed. 0 = the "expired" tier.
  dismissedReminders: number[]
  createdAt: Date
  updatedAt: Date
}

const ContractSchema = new Schema<IContract>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    hotelId: { type: Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
    organizationName: { type: String, required: true, trim: true },
    inn: { type: String, default: '', trim: true },
    representativeName: { type: String, default: '', trim: true },
    phone: { type: String, default: '', trim: true },
    contractNumber: { type: String, default: '', trim: true },
    signDate: { type: Date, default: null },
    finishDate: { type: Date, default: null },
    status: { type: String, enum: ['awaiting', 'signed', 'terminated'], default: 'awaiting' },
    contractLink: { type: String, default: '', trim: true },
    notes: { type: String, default: '' },
    reminderDays: { type: [Number], default: [30, 7] },
    dismissedReminders: { type: [Number], default: [] },
  },
  { timestamps: true }
)

ContractSchema.index({ organizationName: 'text', contractNumber: 'text', inn: 'text' })
ContractSchema.index({ finishDate: 1 })
ContractSchema.index({ status: 1 })

// Force re-registration so schema changes are picked up in dev (see Hotel model).
delete mongoose.models.Contract
export const Contract = mongoose.model<IContract>('Contract', ContractSchema)
