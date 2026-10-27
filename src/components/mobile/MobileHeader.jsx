import React, { useState } from 'react';
import { Shield, ShieldCheck, Lock, Wifi, BatteryCharging, Signal, Package, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const MobileHeader = ({ onOpenDeploymentGuide }) => {
  const { user, lockApp, logout } = useAuth();
  const [showCert, setShowCert] = useState(false);
  const [currentTime, setCurrentTime] = useState(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    if (window.confirm('Log out of Endless Moment Admin?')) logout();
  };

  return (
    <header className="sticky top-0 z-30 bg-[#0e1014]/95 backdrop-blur-md border-b border-white/[0.08] select-none">
      <div className="flex items-center justify-between px-5 pt-2 pb-1 text-[11px] font-medium tracking-wide text-zinc-400">
        <span className="font-semibold text-zinc-200">{currentTime}</span>
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-zinc-900/90 border border-zinc-800 text-[10px] text-zinc-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Admin Enclave Active</span>
        </div>
        <div className="flex items-center gap-2 text-zinc-300">
          <Signal size={12} className="text-zinc-200" />
          <Wifi size={12} className="text-zinc-200" />
          <div className="flex items-center gap-0.5"><span className="text-[10px] font-mono text-zinc-300">98%</span><BatteryCharging size={13} className="text-emerald-400" /></div>
        </div>
      </div>
      <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0">
            <img src="/logo.jpg" alt="Endless Moment" className="w-8 h-8 rounded-lg object-cover ring-1 ring-amber-500/30" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-[#0e1014]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5"><h1 className="text-sm font-bold tracking-tight text-zinc-100 font-sans">Endless Moment</h1><span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30">PRO</span></div>
            <p className="text-[10px] text-zinc-400">Owner Studio Desk</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={() => setShowCert(!showCert)} className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-blue-950/60 border border-blue-500/40 text-blue-300 text-[11px] font-medium hover:bg-blue-900/40 transition" title="Admin Session Details" aria-label="Admin session details">
            <ShieldCheck size={14} /><span className="hidden sm:inline">Admin</span><span className="text-emerald-400 font-bold">Session</span>
          </button>
          {onOpenDeploymentGuide && <button onClick={onOpenDeploymentGuide} className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:text-white hover:bg-amber-500/30 active:scale-90 transition" title="Mobile Installer & Deployment Guide" aria-label="Deployment guide"><Package size={14} /></button>}
          <button onClick={lockApp} className="p-2 rounded-xl bg-zinc-800/80 border border-zinc-700/60 text-zinc-300 hover:text-white hover:bg-zinc-700/80 active:scale-90 transition" title="Lock Session" aria-label="Lock session"><Lock size={14} /></button>
          <button onClick={handleLogout} className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 hover:bg-red-900/70 active:scale-95 transition" title="Log out" aria-label="Log out"><LogOut size={15} /><span className="text-[11px] font-semibold">Logout</span></button>
        </div>
      </div>
      {showCert && <div className="border-t border-blue-500/20 bg-blue-950/40 px-4 py-3 text-xs text-zinc-300 flex flex-col gap-2">
        <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Shield className="text-blue-400 size-4" /><span className="font-semibold text-white">Admin Session Security</span></div><button onClick={() => setShowCert(false)} className="text-zinc-400 hover:text-white text-[11px]">✕</button></div>
        <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-400 pt-1">
          <div><span className="text-zinc-500 block">Signed-in admin:</span><span className="text-zinc-200 font-medium truncate block">{user?.email || 'Admin'}</span></div>
          <div><span className="text-zinc-500 block">Transport security:</span><span className="text-emerald-400 font-semibold block">HTTPS depends on deployment host</span></div>
          <div><span className="text-zinc-500 block">Sign-in method:</span><span className="text-amber-300 font-medium block">Email and password</span></div>
          <div><span className="text-zinc-500 block">Session:</span><span className="text-blue-300 font-mono truncate block">Active</span></div>
        </div>
      </div>}
    </header>
  );
};
