import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { MongoUserModel } from './src/server/models/User.js';

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
const name = process.env.BOOTSTRAP_ADMIN_NAME || 'Studio Owner';
if (!uri || !email || !password) {
  console.error('Set MONGODB_URI, BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD before running this script.')
  process.exit(1);
}
if (password.length < 12) { console.error('BOOTSTRAP_ADMIN_PASSWORD must be at least 12 characters.'); process.exit(1); }
try {
  await mongoose.connect(uri);
  if (await MongoUserModel.countDocuments() > 0) {
    console.error('Bootstrap refused: an administrator already exists.'); process.exitCode = 1;
  } else {
    const emergencyBackupCodes = [];
    await MongoUserModel.create({ email, passwordHash: await bcrypt.hash(password, 12), name, role: 'owner', totpSecret: '', totpEnabled: false, emergencyBackupCodes, verifiedDeviceName: 'Owner Device' });
    console.log(`Initial administrator created for ${email}. `);
  }
} catch (error) { console.error('Could not create initial administrator:', error instanceof Error ? error.message : error); process.exitCode = 1; }
finally { await mongoose.disconnect(); }
