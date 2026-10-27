import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Calendar, Phone, Mail, User, IndianRupee } from 'lucide-react';
const emptyLead = {
    _id: '',
    name: '',
    email: '',
    phone: '',
    message: '',
    status: 'new',
    requirements: '',
    paymentAmount: '',
    advancePayment: '',
    service: 'Wedding Photography',
    projectType: 'Destination Wedding',
    eventDate: '',
};
export const LeadModal = ({ lead, isOpen, onClose, onSave, onDelete, }) => {
    const [formData, setFormData] = useState(emptyLead);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (lead) {
            setFormData(lead);
        }
        else {
            setFormData({
                ...emptyLead,
                _id: `lead_${Date.now()}`,
                createdAt: new Date().toISOString(),
            });
        }
        setError(null);
    }, [lead, isOpen]);
    if (!isOpen)
        return null;
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setError('Client name is required.');
            return;
        }
        if (!formData.phone.trim()) {
            setError('Client phone number is required.');
            return;
        }
        onSave(formData);
        onClose();
    };
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-150", children: _jsxs("div", { className: "w-full max-w-lg bg-zinc-900 border border-zinc-700/80 rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto flex flex-col shadow-2xl", children: [_jsxs("div", { className: "sticky top-0 z-10 bg-zinc-900/95 backdrop-blur border-b border-zinc-800 px-5 py-4 flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("span", { className: "text-[10px] uppercase font-mono tracking-widest text-amber-400 font-bold", children: "Studio CRM Record" }), _jsx("h3", { className: "text-lg font-serif font-bold text-white mt-0.5", children: lead ? 'Edit Client Enquiry' : 'Add New Client Enquiry' })] }), _jsx("button", { onClick: onClose, className: "p-1.5 rounded-full bg-zinc-800 text-zinc-400 hover:text-white", children: _jsx(X, { size: 18 }) })] }), _jsxs("form", { onSubmit: handleSubmit, className: "p-5 space-y-4 text-xs text-zinc-200", children: [error && (_jsx("div", { className: "p-3 rounded-xl bg-red-950/70 border border-red-500/40 text-red-300", children: error })), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-zinc-400 font-bold mb-1", children: "Client Full Name *" }), _jsxs("div", { className: "relative", children: [_jsx(User, { className: "absolute left-3 top-3 size-4 text-zinc-500" }), _jsx("input", { type: "text", value: formData.name, onChange: (e) => setFormData({ ...formData, name: e.target.value }), placeholder: "e.g. Priya & Adithya", className: "w-full rounded-xl bg-zinc-950 border border-zinc-800 pl-9 pr-3 py-2.5 outline-none focus:border-amber-400", required: true })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-zinc-400 font-bold mb-1", children: "Mobile / WhatsApp *" }), _jsxs("div", { className: "relative", children: [_jsx(Phone, { className: "absolute left-3 top-3 size-4 text-zinc-500" }), _jsx("input", { type: "tel", value: formData.phone, onChange: (e) => setFormData({ ...formData, phone: e.target.value }), placeholder: "+91 98400 12345", className: "w-full rounded-xl bg-zinc-950 border border-zinc-800 pl-9 pr-3 py-2.5 outline-none focus:border-amber-400", required: true })] })] })] }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-zinc-400 font-bold mb-1", children: "Email Address" }), _jsxs("div", { className: "relative", children: [_jsx(Mail, { className: "absolute left-3 top-3 size-4 text-zinc-500" }), _jsx("input", { type: "email", value: formData.email, onChange: (e) => setFormData({ ...formData, email: e.target.value }), placeholder: "priya@example.com", className: "w-full rounded-xl bg-zinc-950 border border-zinc-800 pl-9 pr-3 py-2.5 outline-none focus:border-amber-400" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-zinc-400 font-bold mb-1", children: "Event Date" }), _jsxs("div", { className: "relative", children: [_jsx(Calendar, { className: "absolute left-3 top-3 size-4 text-zinc-500" }), _jsx("input", { type: "date", value: formData.eventDate || '', onChange: (e) => setFormData({ ...formData, eventDate: e.target.value }), className: "w-full rounded-xl bg-zinc-950 border border-zinc-800 pl-9 pr-3 py-2.5 outline-none focus:border-amber-400" })] })] })] }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-zinc-400 font-bold mb-1", children: "Service Required" }), _jsxs("select", { value: formData.service || 'Wedding Photography', onChange: (e) => setFormData({ ...formData, service: e.target.value }), className: "w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2.5 outline-none focus:border-amber-400 text-zinc-200", children: [_jsx("option", { value: "Wedding Photography & Cinema", children: "Wedding Photography & Cinema" }), _jsx("option", { value: "Pre-Wedding Couple Shoot", children: "Pre-Wedding Couple Shoot" }), _jsx("option", { value: "Traditional & Temple Wedding", children: "Traditional & Temple Wedding" }), _jsx("option", { value: "Bridal Portraits & Editorial", children: "Bridal Portraits & Editorial" }), _jsx("option", { value: "Drone Cinematography", children: "Drone Cinematography" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-zinc-400 font-bold mb-1", children: "Lead Status" }), _jsxs("select", { value: formData.status, onChange: (e) => setFormData({ ...formData, status: e.target.value }), className: "w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2.5 outline-none focus:border-amber-400 text-zinc-200", children: [_jsx("option", { value: "new", children: "New Enquiry" }), _jsx("option", { value: "contacted", children: "Contacted / In Discussion" }), _jsx("option", { value: "converted", children: "Confirmed Client (Advance Paid)" })] })] })] }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-zinc-400 font-bold mb-1", children: "Total Package Amount" }), _jsxs("div", { className: "relative", children: [_jsx(IndianRupee, { className: "absolute left-3 top-3 size-4 text-zinc-500" }), _jsx("input", { type: "text", value: formData.paymentAmount || '', onChange: (e) => setFormData({ ...formData, paymentAmount: e.target.value }), placeholder: "e.g. \u20B9 1,50,000", className: "w-full rounded-xl bg-zinc-950 border border-zinc-800 pl-9 pr-3 py-2.5 outline-none focus:border-amber-400" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-zinc-400 font-bold mb-1", children: "Advance Received" }), _jsx("input", { type: "text", value: formData.advancePayment || '', onChange: (e) => setFormData({ ...formData, advancePayment: e.target.value }), placeholder: "e.g. \u20B9 50,000 (UPI)", className: "w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2.5 outline-none focus:border-amber-400" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-zinc-400 font-bold mb-1", children: "Client Message / Notes" }), _jsx("textarea", { rows: 3, value: formData.message, onChange: (e) => setFormData({ ...formData, message: e.target.value }), placeholder: "Venue details, guest count, shot list expectations...", className: "w-full rounded-xl bg-zinc-950 border border-zinc-800 p-3 outline-none focus:border-amber-400 resize-none text-xs" })] }), _jsxs("div", { className: "pt-2 flex items-center justify-between border-t border-zinc-800", children: [lead && onDelete ? (_jsxs("button", { type: "button", onClick: () => {
                                        if (confirm('Delete this client enquiry record?')) {
                                            onDelete(lead._id);
                                            onClose();
                                        }
                                    }, className: "px-3 py-2 rounded-xl text-red-400 hover:bg-red-950/40 text-xs font-semibold flex items-center gap-1.5 transition", children: [_jsx(Trash2, { size: 14 }), _jsx("span", { children: "Delete" })] })) : (_jsx("div", {})), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { type: "button", onClick: onClose, className: "px-4 py-2.5 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-zinc-300 font-semibold text-xs transition", children: "Cancel" }), _jsxs("button", { type: "submit", className: "px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition shadow-md", children: [_jsx(Save, { size: 14 }), _jsx("span", { children: "Save Client" })] })] })] })] })] }) }));
};
