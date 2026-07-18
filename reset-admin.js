const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function reset() {
  const uri = "mongodb+srv://ikboljonme_db_user:wB6Ym6Hypf2W55bw@main.stgzkab.mongodb.net/?appName=main"
  await mongoose.connect(uri);

  const AdminSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, default: 'superadmin' },
  }, { timestamps: true, strict: false });

  const Admin = mongoose.models.Admin || mongoose.model('Admin', AdminSchema);

  const email = 'superadmin@easy-service.uz';
  const newPasswordRaw = 'admin123';
  const password = await bcrypt.hash(newPasswordRaw, 12);
  
  await Admin.updateOne({ email }, { $set: { password } });
  
  console.log(`Password for ${email} reset to: ${newPasswordRaw}`);
  
  await mongoose.disconnect();
}

reset().catch(console.error);
