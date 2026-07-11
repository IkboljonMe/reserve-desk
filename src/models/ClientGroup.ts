import mongoose, { Schema, Document, Types } from 'mongoose'

// Admin-defined client groups (categories), e.g. "Private", "Friends",
// "Contractors". One shared set per company, used by every hotel in it.
export interface IClientGroup extends Document {
  _id: Types.ObjectId
  companyId: Types.ObjectId
  name: string
  color: string
  order: number
  createdAt: Date
  updatedAt: Date
}

const ClientGroupSchema = new Schema<IClientGroup>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    name: { type: String, required: true, trim: true },
    color: { type: String, default: '#6366f1' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
)

// A group name only needs to be unique within a company, not globally.
ClientGroupSchema.index({ companyId: 1, name: 1 }, { unique: true })

// Force re-registration so schema changes are picked up in dev (see Hotel model).
delete mongoose.models.ClientGroup
export const ClientGroup = mongoose.model<IClientGroup>('ClientGroup', ClientGroupSchema)
