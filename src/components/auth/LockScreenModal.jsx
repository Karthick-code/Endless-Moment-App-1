import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { Lock, Fingerprint, LogOut, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
export const LockScreenModal = () => {
    const { user, isLocked, verifyBiometricUnlock, logout } = useAuth();
    const [unlocking, setUnlocking] = useState(false);
    const [success, setSuccess] = useState(false);
    if (!isLocked)
        return null;
    const handleUnlock = async () => {
        setUnlocking(true);
        await new Promise((resolve) => setTimeout(resolve, 800));
        setSuccess(true);
        await new Promise((resolve) => setTimeout(resolve, 300));
        await verifyBiometricUnlock();
        setUnlocking(false);
        setSuccess(false);
    };
    return (_jsxs("div", { className: "fixed inset-0 z-50 bg-[#07080a]/95 backdrop-blur-2xl flex flex-col justify-between p-6 text-zinc-100 select-none animate-in fade-in duration-200", children: [_jsxs("div", { className: "flex items-center justify-between text-xs text-zinc-500 pt-8", children: [_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: "w-2 h-2 rounded-full bg-amber-400" }), _jsx("span", { children: "Session Auto-Locked (Privacy Shield)" })] }), _jsx("span", { className: "text-[10px] font-mono", children: user.verifiedDeviceName })] }), _jsxs("div", { className: "text-center my-auto py-8", children: [_jsxs("div", { className: "relative inline-block mb-5", children: [_jsx("div", { className: "w-20 h-20 rounded-3xl bg-zinc-900 border border-amber-500/30 p-1 flex items-center justify-center shadow-xl shadow-amber-500/10", children: _jsx("img", { src: "/logo.jpg", alt: "Endless Moment", className: "w-full h-full object-cover rounded-2xl", onError: (e) => {
                                        e.target.style.display = 'none';
                                    } }) }), _jsx("div", { className: "absolute -bottom-1 -right-1 p-1.5 rounded-full bg-amber-500 text-zinc-950 shadow-md", children: _jsx(Lock, { size: 14 }) })] }), _jsx("h2", { className: "text-xl font-bold font-serif text-white", children: "Endless Moment Desk" }), _jsxs("p", { className: "text-xs text-zinc-400 mt-1", children: ["Owner: ", _jsx("strong", { className: "text-zinc-200", children: user.name })] }), _jsxs("div", { className: "mt-8", children: [_jsx("button", { onClick: handleUnlock, disabled: unlocking, className: `w-20 h-20 rounded-full mx-auto flex items-center justify-center transition-all duration-300 ${success
                                    ? 'bg-emerald-500/20 border-2 border-emerald-400 scale-105'
                                    : unlocking
                                        ? 'bg-blue-500/20 border-2 border-blue-400 animate-pulse scale-105'
                                        : 'bg-zinc-900 border border-zinc-700 hover:border-amber-400 active:scale-95'}`, children: success ? (_jsx(CheckCircle2, { size: 36, className: "text-emerald-400" })) : (_jsx(Fingerprint, { size: 36, className: unlocking ? 'text-blue-400' : 'text-amber-400' })) }), _jsx("p", { className: "text-xs font-semibold text-zinc-300 mt-3", children: unlocking ? 'Unlocking app…' : 'Tap to Unlock App' }), _jsx("p", { className: "text-[10px] text-zinc-500 mt-0.5", children: "This is an in-app privacy lock, not an operating-system biometric prompt." })] })] }), _jsx("div", { className: "pb-6 text-center", children: _jsxs("button", { onClick: logout, className: "inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-red-400 transition", children: [_jsx(LogOut, { size: 13 }), _jsx("span", { children: "Terminate Session & Sign Out" })] }) })] }));
};
