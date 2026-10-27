import mongoose, { Schema } from 'mongoose';
const SecurityLogSchema = new Schema({
    event: { type: String, required: true }, status: { type: String, enum: ['success', 'warning', 'critical'], default: 'success' },
    ip: { type: String, default: '' }, device: { type: String, default: '' }, location: { type: String, default: '' },
    method: { type: String, default: '' }, details: { type: String, default: '' }, timestamp: { type: Date, default: Date.now },
}, { timestamps: true });
export const MongoSecurityLogModel = mongoose.models.SecurityLog || mongoose.model('SecurityLog', SecurityLogSchema);
export const SecurityLogRepo = {
    find: async (limit = 30) => MongoSecurityLogModel.find().sort({ timestamp: -1 }).limit(limit).lean(),
    create: async (data) => new MongoSecurityLogModel(data).save(),
};
