import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { LayoutDashboard, Users, Camera, ShieldCheck, ReceiptText } from 'lucide-react';
export const MobileBottomNav = ({ currentTab, onSelectTab, newLeadsCount, }) => {
    const tabs = [
        {
            id: 'dashboard',
            label: 'Studio',
            icon: LayoutDashboard,
            badge: 0,
        },
        {
            id: 'leads',
            label: 'Enquiries',
            icon: Users,
            badge: newLeadsCount,
        },
        {
            id: 'portfolio',
            label: 'Portfolio',
            icon: Camera,
            badge: 0,
        },
        {
            id: 'invoices',
            label: 'Invoices',
            icon: ReceiptText,
            badge: 0,
        },
        {
            id: 'security',
            label: 'Security & 2FA',
            icon: ShieldCheck,
            badge: 0,
        },
    ];
    return (_jsx("nav", { className: "fixed bottom-0 left-0 right-0 z-40 bg-[#0e1014]/95 backdrop-blur-xl border-t border-white/[0.08] pb-safe", children: _jsx("div", { className: "max-w-md mx-auto grid grid-cols-5 px-1 py-1.5", children: tabs.map((tab) => {
                const isActive = currentTab === tab.id;
                const Icon = tab.icon;
                return (_jsxs("button", { onClick: () => {
                        onSelectTab(tab.id);
                        // Trigger subtle haptic vibration if supported on mobile
                        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                            try {
                                navigator.vibrate(10);
                            }
                            catch { }
                        }
                    }, className: `relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-150 active:scale-95 ${isActive
                        ? 'text-amber-400 font-semibold'
                        : 'text-zinc-400 hover:text-zinc-200 font-normal'}`, children: [_jsxs("div", { className: "relative", children: [_jsx(Icon, { size: 20, className: `transition-transform duration-200 ${isActive ? 'scale-110 text-amber-400' : 'text-zinc-400'}`, strokeWidth: isActive ? 2.3 : 1.8 }), tab.badge > 0 && (_jsx("span", { className: "absolute -top-1.5 -right-2.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500 text-black shadow-sm ring-2 ring-[#0e1014]", children: tab.badge }))] }), _jsx("span", { className: "text-[10px] mt-1 tracking-tight truncate max-w-[68px]", children: tab.label }), isActive && (_jsx("span", { className: "w-1 h-1 rounded-full bg-amber-400 mt-0.5" }))] }, tab.id));
            }) }) }));
};
