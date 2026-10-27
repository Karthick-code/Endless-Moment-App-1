import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useMemo, useState } from 'react';
import { Download, FilePlus2, Printer, ReceiptText, CheckCircle2, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
const money = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n || 0);
const today = () => new Date().toISOString().slice(0, 10);
export const InvoicesTab = ({ leads }) => {
    const completedClients = useMemo(() => leads.filter(l => l.status === 'converted'), [leads]);
    const [invoices, setInvoices] = useState([]);
    const [loadingInvoices, setLoadingInvoices] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loadError, setLoadError] = useState('');
    const [selectedId, setSelectedId] = useState('');
    const [invoiceDate, setInvoiceDate] = useState(today());
    const [service, setService] = useState('Photography service');
    const [description, setDescription] = useState('Photography / event coverage');
    const [total, setTotal] = useState('');
    const [advance, setAdvance] = useState('');
    const [notes, setNotes] = useState('Thank you for choosing Endless Moment.');
    const [activeInvoice, setActiveInvoice] = useState(null);
    const selected = completedClients.find(l => l._id === selectedId);
    const refreshInvoices = async () => {
        setLoadingInvoices(true);
        setLoadError('');
        try {
            setInvoices(await api.getInvoices());
        }
        catch (e) {
            setLoadError(e instanceof Error ? e.message : 'Could not load invoices.');
        }
        finally {
            setLoadingInvoices(false);
        }
    };
    useEffect(() => { void refreshInvoices(); }, []);
    const chooseClient = (id) => {
        setSelectedId(id);
        const lead = completedClients.find(l => l._id === id);
        if (lead) {
            setService(lead.service || lead.projectType || 'Photography service');
            setDescription(lead.requirements || lead.message || lead.service || 'Photography / event coverage');
            setTotal((lead.paymentAmount || '').replace(/[^\d.]/g, ''));
            setAdvance((lead.advancePayment || '').replace(/[^\d.]/g, ''));
        }
        setActiveInvoice(null);
    };
    const saveInvoice = async () => {
        if (!selected) {
            alert('Select a completed/converted client first.');
            return;
        }
        const amount = Number(total), paid = Number(advance || 0);
        if (!Number.isFinite(amount) || amount <= 0) {
            alert('Enter a valid invoice total greater than zero.');
            return;
        }
        if (!Number.isFinite(paid) || paid < 0 || paid > amount) {
            alert('Advance paid must be between ₹0 and the invoice total.');
            return;
        }
        setSaving(true);
        setLoadError('');
        try {
            const record = await api.createInvoice({
                leadId: selected._id, clientName: selected.name, clientEmail: selected.email || '', clientPhone: selected.phone || '',
                invoiceDate, service, description, total: amount, advance: paid, notes,
            });
            setInvoices(prev => [record, ...prev.filter(inv => inv._id !== record._id)]);
            setActiveInvoice(record);
        }
        catch (e) {
            setLoadError(e instanceof Error ? e.message : 'Could not save invoice.');
        }
        finally {
            setSaving(false);
        }
    };
    const printInvoice = () => { if (activeInvoice)
        window.print(); };
    return _jsxs("div", { className: "flex-1 overflow-y-auto px-4 py-5 pb-28 space-y-4 text-zinc-100", children: [_jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-bold text-white", children: "Client Invoices" }), _jsx("p", { className: "text-xs text-zinc-400 mt-1", children: "Generate invoices for completed clients. Invoices are stored in your connected database." })] }), _jsx("div", { className: "rounded-xl bg-amber-500/10 border border-amber-500/20 p-2 text-amber-400", children: _jsx(ReceiptText, { size: 22 }) })] }), loadError && _jsx("div", { role: "alert", className: "rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-200", children: loadError }), _jsxs("div", { className: "rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 space-y-3 print:hidden", children: [_jsxs("h3", { className: "font-semibold text-sm flex items-center gap-2", children: [_jsx(FilePlus2, { size: 16, className: "text-amber-400" }), " Generate invoice"] }), _jsx("label", { className: "block text-xs text-zinc-400", children: "Completed / converted client" }), _jsxs("select", { value: selectedId, onChange: e => chooseClient(e.target.value), className: "w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-3 text-sm", children: [_jsx("option", { value: "", children: "Select a client\u2026" }), completedClients.map(l => _jsxs("option", { value: l._id, children: [l.name, l.phone ? ` · ${l.phone}` : ''] }, l._id))] }), completedClients.length === 0 && _jsx("p", { className: "text-xs text-amber-300", children: "No completed clients yet. Go to Enquiries and change the client's status to converted first." }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-xs text-zinc-400 mb-1", children: "Invoice date" }), _jsx("input", { type: "date", value: invoiceDate, onChange: e => setInvoiceDate(e.target.value), className: "w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs text-zinc-400 mb-1", children: "Service" }), _jsx("input", { value: service, onChange: e => setService(e.target.value), className: "w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm", placeholder: "Wedding photography" })] })] }), _jsx("label", { className: "block text-xs text-zinc-400", children: "Description" }), _jsx("textarea", { value: description, onChange: e => setDescription(e.target.value), rows: 2, className: "w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm" }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-xs text-zinc-400 mb-1", children: "Total amount (\u20B9)" }), _jsx("input", { type: "number", min: "0", step: "0.01", value: total, onChange: e => setTotal(e.target.value), className: "w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm", placeholder: "25000" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs text-zinc-400 mb-1", children: "Advance paid (\u20B9)" }), _jsx("input", { type: "number", min: "0", step: "0.01", value: advance, onChange: e => setAdvance(e.target.value), className: "w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm", placeholder: "5000" })] })] }), _jsx("label", { className: "block text-xs text-zinc-400", children: "Notes / payment terms" }), _jsx("textarea", { value: notes, onChange: e => setNotes(e.target.value), rows: 2, className: "w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm" }), _jsxs("div", { className: "flex justify-between rounded-xl bg-zinc-950 p-3 text-sm", children: [_jsx("span", { className: "text-zinc-400", children: "Balance due" }), _jsx("strong", { className: "text-amber-300", children: money(Math.max(0, Number(total || 0) - Number(advance || 0))) })] }), _jsx("button", { disabled: saving || !selected, onClick: () => void saveInvoice(), className: "w-full rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold py-3 text-sm", children: saving ? 'Saving invoice…' : 'Generate invoice' })] }), activeInvoice && _jsxs("section", { className: "invoice-paper rounded-2xl bg-white text-zinc-900 p-5 space-y-4", children: [_jsxs("div", { className: "flex items-start justify-between gap-3 border-b border-zinc-200 pb-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs tracking-[.2em] font-bold text-amber-700", children: "ENDLESS MOMENT" }), _jsx("h3", { className: "text-2xl font-bold mt-2", children: "INVOICE" }), _jsx("p", { className: "text-xs text-zinc-500 mt-1", children: "Capture your moments" })] }), _jsxs("div", { className: "text-right text-xs", children: [_jsxs("p", { children: [_jsx("b", { children: "Invoice #" }), " ", activeInvoice.invoiceNumber] }), _jsxs("p", { className: "mt-1", children: [_jsx("b", { children: "Date" }), " ", activeInvoice.invoiceDate] })] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-[10px] uppercase tracking-wider text-zinc-500", children: "Bill to" }), _jsx("p", { className: "font-bold text-lg", children: activeInvoice.clientName }), activeInvoice.clientPhone && _jsx("p", { className: "text-sm", children: activeInvoice.clientPhone }), activeInvoice.clientEmail && _jsx("p", { className: "text-sm", children: activeInvoice.clientEmail })] }), _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-zinc-300 text-left", children: [_jsx("th", { className: "py-2", children: "Service / Description" }), _jsx("th", { className: "py-2 text-right", children: "Amount" })] }) }), _jsx("tbody", { children: _jsxs("tr", { className: "border-b border-zinc-200 align-top", children: [_jsxs("td", { className: "py-3 pr-3", children: [_jsx("b", { children: activeInvoice.service }), _jsx("p", { className: "text-xs text-zinc-500 mt-1 whitespace-pre-wrap", children: activeInvoice.description })] }), _jsx("td", { className: "py-3 text-right whitespace-nowrap", children: money(activeInvoice.total) })] }) })] }), _jsxs("div", { className: "ml-auto max-w-xs space-y-2 text-sm", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Subtotal" }), _jsx("span", { children: money(activeInvoice.total) })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Advance paid" }), _jsx("span", { children: money(activeInvoice.advance) })] }), _jsxs("div", { className: "flex justify-between border-t border-zinc-300 pt-2 font-bold text-base", children: [_jsx("span", { children: "Balance due" }), _jsx("span", { children: money(activeInvoice.total - activeInvoice.advance) })] })] }), activeInvoice.notes && _jsxs("div", { className: "border-t border-zinc-200 pt-3 text-xs whitespace-pre-wrap", children: [_jsx("b", { children: "Notes" }), _jsx("p", { className: "mt-1", children: activeInvoice.notes })] }), _jsx("p", { className: "border-t border-zinc-200 pt-3 text-center text-[10px] text-zinc-500", children: "Thank you for your business \u00B7 Endless Moment" }), _jsxs("div", { className: "flex gap-2 print:hidden", children: [_jsxs("button", { onClick: printInvoice, className: "flex-1 rounded-xl bg-zinc-900 text-white py-3 text-sm font-semibold flex justify-center items-center gap-2", children: [_jsx(Printer, { size: 16 }), " Print / Save PDF"] }), _jsxs("button", { onClick: () => { const blob = new Blob([JSON.stringify(activeInvoice, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${activeInvoice.invoiceNumber}.json`; a.click(); URL.revokeObjectURL(url); }, className: "rounded-xl border border-zinc-300 px-3 py-3 text-sm flex items-center gap-2", children: [_jsx(Download, { size: 16 }), " Data"] })] })] }), _jsxs("div", { className: "rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3 print:hidden", children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsxs("h3", { className: "font-semibold text-sm", children: ["Saved invoices (", invoices.length, ")"] }), _jsx("button", { onClick: () => void refreshInvoices(), className: "p-2 rounded-lg border border-zinc-700 text-zinc-300", "aria-label": "Refresh invoices", children: _jsx(RefreshCw, { size: 14 }) })] }), loadingInvoices ? _jsx("p", { className: "text-xs text-zinc-400", children: "Loading invoices\u2026" }) : invoices.length === 0 ? _jsx("p", { className: "text-xs text-zinc-500", children: "No invoices yet. Generated invoices will be saved to the database and remain available on your other devices." }) : invoices.map(inv => _jsxs("button", { onClick: () => { setActiveInvoice(inv); setSelectedId(inv.leadId); }, className: "w-full text-left rounded-xl border border-zinc-800 bg-zinc-950 p-3 flex items-center justify-between gap-3", children: [_jsxs("span", { children: [_jsx("b", { className: "block text-sm", children: inv.clientName }), _jsxs("span", { className: "text-[11px] text-zinc-500", children: [inv.invoiceNumber, " \u00B7 ", inv.invoiceDate] })] }), _jsxs("span", { className: "text-right", children: [_jsx("b", { className: "block text-sm", children: money(inv.total) }), _jsxs("span", { className: "text-[10px] text-emerald-400 flex items-center gap-1", children: [_jsx(CheckCircle2, { size: 11 }), " Saved"] })] })] }, inv._id || inv.invoiceNumber))] }), _jsx("style", { children: `@media print { body * { visibility: hidden !important; } .invoice-paper, .invoice-paper * { visibility: visible !important; } .invoice-paper { position: absolute; inset: 0; width: 100%; border-radius: 0; padding: 24px; color: #111 !important; } @page { size: A4; margin: 12mm; } }` })] });
};
