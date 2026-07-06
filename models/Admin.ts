import mongoose, { Schema, Document, Types } from 'mongoose'
import bcrypt from 'bcryptjs'

export interface IAdmin extends Document {
  _id: Types.ObjectId
  email: string
  password: string
  name: string
  role: 'admin' | 'superadmin'
  createdAt: Date
  comparePassword(candidate: string): Promise<boolean>
}

const AdminSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: ['admin', 'superadmin'], default: 'admin' },
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

export const Admin =
  (mongoose.models.Admin as mongoose.Model<IAdmin>) ||
  mongoose.model<IAdmin>('Admin', AdminSchema)
