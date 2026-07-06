import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/reservedesk'
  await mongoose.connect(uri)

  const AdminSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, default: 'superadmin' },
  }, { timestamps: true })

  const Admin = mongoose.models.Admin || mongoose.model('Admin', AdminSchema)

  const email = 'admin@hotel.com'
  const existing = await Admin.findOne({ email })
  if (existing) {
    console.log('Admin already exists:', email)
    await mongoose.disconnect()
    return
  }

  const password = await bcrypt.hash('admin123', 12)
  await Admin.create({ email, password, name: 'Hotel Admin', role: 'superadmin' })
  console.log('✅ Seed admin created!')
  console.log('   Email:', email)
  console.log('   Password: admin123')
  console.log('   ⚠️  Change this password in production!')
  await mongoose.disconnect()
}

seed().catch(console.error)
