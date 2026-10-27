import mongoose, { Schema } from 'mongoose';
const LeadSchema = new Schema({
    name: { type: String, required: true, trim: true }, email: { type: String, trim: true, default: '' },
    phone: { type: String, required: true, trim: true }, message: { type: String, default: '' },
    status: { type: String, enum: ['new', 'contacted', 'converted'], default: 'new' },
    requirements: { type: String, default: '' }, paymentAmount: { type: String, default: '' },
    advancePayment: { type: String, default: '' }, service: { type: String, default: 'Wedding Photography' },
    projectType: { type: String, default: '' }, eventDate: { type: String, default: '' }, notes: { type: String, default: '' },
}, { timestamps: true });
export const MongoLeadModel = mongoose.models.Lead || mongoose.model('Lead', LeadSchema);
export const LeadRepo = {
    find: async () => MongoLeadModel.find().sort({ createdAt: -1 }).lean(),
    findById: async (id) => MongoLeadModel.findById(id).lean(),
    create: async (data) => new MongoLeadModel(data).save(),
    findByIdAndUpdate: async (id, update) => MongoLeadModel.findByIdAndUpdate(id, update, { new: true, runValidators: true }).lean(),
    findByIdAndDelete: async (id) => Boolean(await MongoLeadModel.findByIdAndDelete(id)),
};
