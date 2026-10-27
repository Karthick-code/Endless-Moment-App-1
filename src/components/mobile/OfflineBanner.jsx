import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
export const OfflineBanner = () => {
    const isOnline = useOnlineStatus();
    if (isOnline)
        return null;
    return (_jsxs("div", { className: "bg-amber-600/90 text-white px-3 py-1.5 text-[11px] font-medium flex items-center justify-center gap-1.5 shadow-md", children: [_jsx(WifiOff, { size: 13, className: "animate-pulse" }), _jsx("span", { children: "Offline Mode \u2014 Showing cached records. Login requires internet; uploads and sync need internet." })] }));
};
