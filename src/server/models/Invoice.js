import mongoose, { Schema } from 'mongoose';
const InvoiceSchema = new Schema({
    invoiceNumber: { type: String, required: true, unique: true, trim: true },
    leadId: { type: String, required: true, index: true }, clientName: { type: String, required: true, trim: true },
    clientEmail: { type: String, default: '' }, clientPhone: { type: String, default: '' },
    invoiceDate: { type: String, required: true }, service: { type: String, required: true },
    description: { type: String, default: '' }, total: { type: Number, required: true, min: 0.01 },
    advance: { type: Number, default: 0, min: 0 }, notes: { type: String, default: '' },
}, { timestamps: true });
export const MongoInvoiceModel = mongoose.models.Invoice || mongoose.model('Invoice', InvoiceSchema);
export const InvoiceRepo = {
    find: async () => MongoInvoiceModel.find().sort({ createdAt: -1 }).lean(),
    create: async (data) => new MongoInvoiceModel(data).save(),
};
