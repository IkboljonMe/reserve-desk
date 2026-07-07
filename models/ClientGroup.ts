import mongoose, { Schema, Document, Types } from 'mongoose'

// Admin-defined client groups (categories), e.g. "Private", "Friends",
// "Contractors". Global collection — not scoped to a hotel.
export interface IClientGroup extends Document {
  _id: Types.ObjectId
  name: string
  color: string
  order: number
  createdAt: Date
  updatedAt: Date
}

const ClientGroupSchema = new Schema<IClientGroup>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    color: { type: String, default: '#6366f1' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
)

// Force re-registration so schema changes are picked up in dev (see Hotel model).
delete mongoose.models.ClientGroup
export const ClientGroup = mongoose.model<IClientGroup>('ClientGroup', ClientGroupSchema)
