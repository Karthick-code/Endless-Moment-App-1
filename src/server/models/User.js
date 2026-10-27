import mongoose, { Schema } from 'mongoose';
const UserSchema = new Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, default: 'Studio Owner' },
    role: { type: String, default: 'owner' },
    isGoogleVerified: { type: Boolean, default: false },
    totpSecret: { type: String, default: '' },
    totpEnabled: { type: Boolean, default: false },
    pendingTotpSecret: { type: String, default: '' },
    pendingBackupCodes: { type: [String], default: [] },
    emergencyBackupCodes: { type: [String], default: [] },
    biometricRegistered: { type: Boolean, default: false },
    verifiedDeviceName: { type: String, default: 'Owner Device' },
    lastLogin: { type: Date },
}, { timestamps: true });
export const MongoUserModel = mongoose.models.User || mongoose.model('User', UserSchema);
export const UserRepo = {
    findOne: async (query) => MongoUserModel.findOne(query).lean(),
    countDocuments: async () => MongoUserModel.countDocuments(),
    create: async (data) => new MongoUserModel(data).save(),
    updateOne: async (query, update) => MongoUserModel.findOneAndUpdate(query, update, { new: true }).lean(),
    findAdmins: async () => MongoUserModel.find({}, { email: 1, name: 1, role: 1, createdAt: 1, lastLogin: 1 }).sort({ createdAt: 1 }).lean(),
    deleteById: async (id) => MongoUserModel.findByIdAndDelete(id),
};
