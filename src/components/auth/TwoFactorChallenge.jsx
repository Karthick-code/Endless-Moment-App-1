import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { ShieldCheck, Key, ArrowLeft, AlertCircle, Copy, Check, Smartphone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export const TwoFactorChallenge = () => {
  const { user, pending2FA, verify2FACode, complete2FASetup, cancel2FA } = useAuth();
  const [method, setMethod] = useState('totp');
  const [code, setCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [setup, setSetup] = useState(null);
  const [qr, setQr] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const needsSetup = pending2FA?.requiresSetup === true;

  useEffect(() => {
    let alive = true;
    if (!needsSetup || !pending2FA?.tempToken) return () => { alive = false; };
    setLoading(true);
    api.setup2FA(pending2FA.tempToken)
      .then(async (data) => {
        const image = await QRCode.toDataURL(data.otpauthUrl, { width: 220, margin: 2 });
        if (alive) { setSetup(data); setQr(image); }
      })
      .catch((e) => { if (alive) setError(e.message || 'Could not start setup.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [needsSetup, pending2FA?.tempToken]);

  const submit = async (value, type) => {
    setError(''); setLoading(true);
    try {
      const result = needsSetup ? await complete2FASetup(value) : await verify2FACode(value, type);
      if (!result.success) setError(result.error || 'Verification failed.');
    } catch (e) { setError(e.message || 'Verification failed.'); }
    finally { setLoading(false); }
  };

  const copy = async (value) => {
    try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1800); }
    catch { setError('Clipboard access failed. Please copy the value manually.'); }
  };

  return <div className="flex-1 flex flex-col px-6 pt-8 pb-8 bg-gradient-to-b from-[#12141a] via-[#0c0d10] to-[#07080a] text-zinc-100 overflow-y-auto">
    <button onClick={cancel2FA} className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white py-1 self-start"><ArrowLeft size={14}/> Back to Credentials</button>
    <div className="text-center mt-4">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 mb-3"><ShieldCheck size={28}/></div>
      <h2 className="text-xl font-bold">{needsSetup ? 'Set up your authenticator' : 'Verify your identity'}</h2>
      <p className="text-xs text-zinc-400 mt-2">{pending2FA?.email || user?.email}</p>
    </div>

    {needsSetup ? <div className="mt-5 space-y-4">
      <p className="text-sm text-zinc-300">Set up two-factor authentication before entering the admin panel. Scan the QR code with Google Authenticator, Microsoft Authenticator, or another TOTP app.</p>
      {loading && !setup && <p className="text-sm text-zinc-400">Preparing secure setup…</p>}
      {qr && <div className="bg-white rounded-xl p-3 w-fit mx-auto"><img src={qr} alt="Authenticator setup QR code" className="w-52 h-52"/></div>}
      {setup && <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-3 space-y-2"><p className="text-xs text-zinc-400">Manual setup key</p><code className="block break-all text-sm text-amber-300">{setup.secret}</code><button onClick={() => copy(setup.secret)} className="text-xs text-amber-300 flex items-center gap-1"><Copy size={13}/>{copied ? 'Copied' : 'Copy secret'}</button></div>}
      {setup && <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3"><h3 className="font-bold text-sm text-amber-300">Save these backup codes now</h3><p className="text-xs text-zinc-400 mt-1">Each code works once. Store them somewhere private; they will not be shown again.</p><div className="grid grid-cols-2 gap-2 mt-3">{setup.backupCodes.map((item) => <code key={item} className="text-center bg-black/40 rounded p-2 text-xs">{item}</code>)}</div><button onClick={() => copy(setup.backupCodes.join('\n'))} className="mt-3 text-xs text-amber-300 flex items-center gap-1"><Copy size={13}/>{copied ? 'Copied' : 'Copy backup codes'}</button></div>}
      <form onSubmit={(e) => { e.preventDefault(); if (code.trim().length === 6) submit(code.trim(), 'totp'); }} className="space-y-2"><label className="block text-xs text-zinc-300">Enter the current 6-digit code to confirm setup</label><input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="000000" className="w-full rounded-xl bg-zinc-900 border border-zinc-700 p-3 text-center text-xl tracking-[0.4em]"/><button disabled={loading || code.length !== 6 || !setup} className="w-full rounded-xl bg-amber-500 text-black font-bold p-3 disabled:opacity-50">{loading ? 'Verifying…' : 'Confirm and activate 2FA'}</button></form>
    </div> : <div className="mt-5 space-y-4">
      <div className="grid grid-cols-2 gap-2"><button onClick={() => setMethod('totp')} className={`rounded-xl p-3 text-xs ${method === 'totp' ? 'bg-amber-500 text-black font-bold' : 'bg-zinc-900 text-zinc-300'}`}><Smartphone size={14} className="inline mr-1"/>Authenticator</button><button onClick={() => setMethod('backup_code')} className={`rounded-xl p-3 text-xs ${method === 'backup_code' ? 'bg-amber-500 text-black font-bold' : 'bg-zinc-900 text-zinc-300'}`}><Key size={14} className="inline mr-1"/>Backup code</button></div>
      {method === 'totp' ? <form onSubmit={e => { e.preventDefault(); if (code.length === 6) submit(code, 'totp'); }} className="space-y-3"><input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="6-digit code" className="w-full rounded-xl bg-zinc-900 border border-zinc-700 p-3 text-center text-xl tracking-[0.4em]"/><button disabled={loading || code.length !== 6} className="w-full rounded-xl bg-amber-500 text-black font-bold p-3 disabled:opacity-50">Verify code</button></form> : <form onSubmit={e => { e.preventDefault(); if (backupCode.trim()) submit(backupCode.trim(), 'backup_code'); }} className="space-y-3"><input value={backupCode} onChange={e => setBackupCode(e.target.value.toUpperCase())} autoComplete="one-time-code" placeholder="XXXX-XXXX" className="w-full rounded-xl bg-zinc-900 border border-zinc-700 p-3 text-center font-mono"/><button disabled={loading || !backupCode.trim()} className="w-full rounded-xl bg-amber-500 text-black font-bold p-3 disabled:opacity-50">Verify backup code</button></form>}
    </div>}
    {error && <div role="alert" className="mt-4 p-3 rounded-xl bg-red-950/70 border border-red-500/40 text-red-300 text-xs flex gap-2"><AlertCircle size={15}/><span>{error}</span></div>}
  </div>;
};
