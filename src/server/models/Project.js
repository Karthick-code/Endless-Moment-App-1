import mongoose, { Schema } from 'mongoose';
const ProjectSchema = new Schema({
    title: { type: String, required: true, trim: true }, description: { type: String, required: true, trim: true },
    category: { type: String, enum: ['wedding', 'pre-wedding', 'portrait', 'cinematography', 'commercial', 'other'], default: 'wedding' },
    images: { type: [String], default: [] }, clientName: { type: String, default: '' }, shootDate: { type: String, default: '' },
    location: { type: String, default: '' }, featured: { type: Boolean, default: false },
}, { timestamps: true });
export const MongoProjectModel = mongoose.models.Project || mongoose.model('Project', ProjectSchema);
export const ProjectRepo = {
    find: async () => MongoProjectModel.find().sort({ createdAt: -1 }).lean(),
    findById: async (id) => MongoProjectModel.findById(id).lean(),
    create: async (data) => new MongoProjectModel(data).save(),
    findByIdAndUpdate: async (id, update) => MongoProjectModel.findByIdAndUpdate(id, update, { new: true, runValidators: true }).lean(),
    findByIdAndDelete: async (id) => Boolean(await MongoProjectModel.findByIdAndDelete(id)),
};
