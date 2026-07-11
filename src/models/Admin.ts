import mongoose, { Schema, Document, Types } from 'mongoose'
import bcrypt from 'bcryptjs'

export type AdminRole = 'superadmin' | 'owner' | 'admin'

export interface IAdmin extends Document {
  _id: Types.ObjectId
  email: string
  password: string
  name: string
  role: AdminRole
  // The tenant this account belongs to. `null` only for superadmin (global, no tenant).
  companyId: Types.ObjectId | null
  // The single hotel an admin manages. `null` for the owner (who owns all hotels
  // within their company) and for superadmin.
  hotelId: Types.ObjectId | null
  createdAt: Date
  comparePassword(candidate: string): Promise<boolean>
}

const AdminSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: ['superadmin', 'owner', 'admin'], default: 'admin' },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', default: null },
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
