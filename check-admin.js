const mongoose = require('mongoose');

async function check() {
  const uri = "mongodb+srv://ikboljonme_db_user:wB6Ym6Hypf2W55bw@main.stgzkab.mongodb.net/?appName=main"
  await mongoose.connect(uri);

  const AdminSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, default: 'superadmin' },
  }, { timestamps: true, strict: false });

  const Admin = mongoose.models.Admin || mongoose.model('Admin', AdminSchema);

  const admins = await Admin.find({ role: 'superadmin' });
  console.log("Superadmins:");
  for (const admin of admins) {
    console.log(`- Email: ${admin.email}, Name: ${admin.name}`);
  }
  
  await mongoose.disconnect();
}

check().catch(console.error);
