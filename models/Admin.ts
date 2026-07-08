import mongoose, { Schema, Document, Types } from 'mongoose'
import bcrypt from 'bcryptjs'

export type AdminRole = 'owner' | 'admin'

export interface IAdmin extends Document {
  _id: Types.ObjectId
  email: string
  password: string
  name: string
  role: AdminRole
  // The single hotel an admin manages. `null` for the owner (who owns all hotels).
  hotelId: Types.ObjectId | null
  createdAt: Date
  comparePassword(candidate: string): Promise<boolean>
}

const AdminSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: ['owner', 'admin'], default: 'admin' },
    hotelId: { type: Schema.Types.ObjectId, ref: 'Hotel', default: null },
  },
  { timestamps: true }
)

AdminSchema.pre('save', async function () {
  if (!this.isModified('password')) return
  this.password = await bcrypt.hash(this.password as string, 12)
})

AdminSchema.methods.comparePassword = async function (candidate: string) {
  return bcrypt.compare(candidate, this.password as string)
}

// Force re-registration so the new role enum / hotelId field are picked up in dev.
delete mongoose.models.Admin
export const Admin = mongoose.model<IAdmin>('Admin', AdminSchema)
