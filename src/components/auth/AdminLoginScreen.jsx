import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, ShieldCheck, AlertTriangle, Database, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminLoginScreen = () => {
  const { loginWithCredentials, lockoutRemaining, dbStatus } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Enter your admin email and password.');
      return;
    }
    setLoading(true);
    try {
      const result = await loginWithCredentials(email.trim(), password);
      if (!result.success) setError(result.error || 'Unable to sign in.');
    } catch {
      setError('Unable to reach the server. Check the API and database deployment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between px-6 pt-10 pb-8 bg-gradient-to-b from-[#12141a] via-[#0c0d10] to-[#07080a] text-zinc-100 overflow-y-auto">
      <div className="text-center pt-2">
        <div className="relative inline-block mb-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-zinc-900 border border-amber-500/40 p-1 flex items-center justify-center shadow-lg shadow-amber-500/10">
            <img src="/logo.jpg" alt="Endless Moment" className="w-full h-full object-cover rounded-xl" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
          </div>
          <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-blue-600 text-white ring-2 ring-[#0c0d10]"><ShieldCheck size={14} /></div>
        </div>
        <p className="text-[11px] font-mono uppercase tracking-[0.28em] text-amber-400 font-bold">Endless Moment</p>
        <h1 className="text-2xl font-serif font-bold text-zinc-100 mt-1">Admin Login</h1>
        <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">Secure access for authorised studio administrators.</p>
        <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px]">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border font-mono ${dbStatus?.connected ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300' : 'bg-zinc-900/90 border-zinc-700 text-zinc-300'}`}>
            <Database size={12} />{dbStatus?.connected ? `MongoDB Connected: ${dbStatus.dbName}` : 'Database unavailable'}
          </div>
        </div>
      </div>

      <div className="my-5">
        <div className="mb-4 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-[11px] text-zinc-400">Registration is disabled. An existing authorised administrator must provision additional admin accounts.</div>
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-bold text-zinc-300 mb-1.5">Admin Email</label>
            <div className="relative"><Mail className="absolute left-3.5 top-3.5 size-4 text-zinc-500" /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@yourstudio.com" autoComplete="username" className="w-full rounded-xl bg-zinc-900/90 border border-zinc-800 text-zinc-100 pl-10 pr-3 py-3 text-xs outline-none focus:border-amber-500/80" required /></div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-zinc-300 mb-1.5 flex items-center justify-between"><span>Password</span><button type="button" onClick={() => setShowPassword((value) => !value)} className="text-[10px] text-amber-400 hover:underline">{showPassword ? 'Hide' : 'Show'}</button></label>
            <div className="relative"><Lock className="absolute left-3.5 top-3.5 size-4 text-zinc-500" /><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" autoComplete="current-password" className="w-full rounded-xl bg-zinc-900/90 border border-zinc-800 text-zinc-100 pl-10 pr-3 py-3 text-xs outline-none focus:border-amber-500/80" required /></div>
          </div>
          {error && <div role="alert" className="p-3 rounded-xl bg-red-950/70 border border-red-500/40 text-red-300 text-xs flex items-start gap-2"><AlertTriangle size={15} className="shrink-0 mt-0.5" /><span>{error}</span></div>}
          {lockoutRemaining > 0 && <div className="p-3 rounded-xl bg-amber-950/70 border border-amber-500/40 text-amber-300 text-xs">Security lockout: wait {lockoutRemaining}s before retrying.</div>}
          <button type="submit" disabled={loading || lockoutRemaining > 0} className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 py-3.5 px-4 font-bold text-xs tracking-wide flex items-center justify-center gap-2 shadow-lg disabled:opacity-50">
            {loading ? <><span className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />Checking credentials…</> : <>Sign in securely <ArrowRight size={14} /></>}
          </button>
        </form>
      </div>

      <div className="pt-2 border-t border-zinc-900 text-center">
        <div className="flex items-center justify-center gap-4 text-[10px] text-zinc-500 flex-wrap"><span className="flex items-center gap-1"><CheckCircle2 size={11} className="text-emerald-500" /> bcrypt password hashing</span><span>•</span><span className="flex items-center gap-1"><CheckCircle2 size={11} className="text-amber-500" /> Two-factor verification</span></div>
        <p className="text-[9px] text-zinc-600 mt-2 font-mono">Private Admin Panel · Endless Moment</p>
      </div>
    </div>
  );
};
