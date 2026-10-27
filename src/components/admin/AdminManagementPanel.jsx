import React, { useEffect, useState } from 'react';
import { UserPlus, RefreshCw, Trash2, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const AdminManagementPanel = () => {
  const { user } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const load = async () => { try { setAdmins(await api.getAdmins()); } catch (e) { setError(e.message || 'Could not load admins.'); } };
  useEffect(() => { void load(); }, []);
  const create = async (event) => {
    event.preventDefault(); setError(''); setMessage(''); setBusy(true);
    try {
      await api.createAdmin({ name: name.trim(), email: email.trim(), password });
      setMessage('Admin created. They will be prompted to scan an authenticator QR code and save backup codes at first login.');
      setName(''); setEmail(''); setPassword(''); await load();
    } catch (e) { setError(e.message || 'Could not create admin.'); }
    finally { setBusy(false); }
  };
  const resetAuthenticator = async (admin) => {
    if (admin.email === user.email) return;
    if (!window.confirm(`Reset authenticator for ${admin.email}? They will need to enroll again at next login.`)) return;
    setError(''); setMessage('');
    try { await api.resetAdminAuthenticator(admin._id); await load(); setMessage(`Authenticator reset for ${admin.email}.`); }
    catch (e) { setError(e.message || 'Could not reset authenticator.'); }
  };
  const remove = async (admin) => {
    if (admin.email === user.email) return;
    if (!window.confirm(`Delete admin account ${admin.email}?`)) return;
    setError(''); setMessage('');
    try { await api.deleteAdmin(admin._id); await load(); setMessage('Admin account deleted.'); }
    catch (e) { setError(e.message || 'Could not delete admin.'); }
  };
  return <section className="px-4 pb-28 text-zinc-100 space-y-4">
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-4 space-y-3">
      <div className="flex items-center gap-2"><ShieldCheck className="text-amber-400" size={18}/><h3 className="font-bold text-sm">Admin Profiles</h3></div>
      <p className="text-xs text-zinc-400">Only signed-in administrators can add or remove other admin accounts. Use a unique password of at least 12 characters.</p>
      {error && <p role="alert" className="text-xs text-red-300 bg-red-950/50 p-3 rounded-lg">{error}</p>}
      {message && <p className="text-xs text-emerald-300 bg-emerald-950/40 p-3 rounded-lg">{message}</p>}
      <form onSubmit={create} className="space-y-2.5">
        <input required value={name} onChange={e=>setName(e.target.value)} placeholder="Admin full name" className="w-full rounded-xl bg-zinc-950 border border-zinc-700 p-3 text-sm" />
        <input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Admin email" className="w-full rounded-xl bg-zinc-950 border border-zinc-700 p-3 text-sm" />
        <input required minLength={12} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Temporary password (12+ characters)" className="w-full rounded-xl bg-zinc-950 border border-zinc-700 p-3 text-sm" />
        <button disabled={busy} className="w-full rounded-xl bg-amber-500 text-zinc-950 p-3 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"><UserPlus size={15}/>{busy ? 'Creating admin…' : 'Create admin account'}</button>
      </form>
    </div>
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-4 space-y-3">
      <div className="flex justify-between items-center"><h3 className="font-bold text-sm">Registered admins ({admins.length})</h3><button onClick={()=>void load()} aria-label="Refresh admins" className="p-2 rounded-lg border border-zinc-700"><RefreshCw size={14}/></button></div>
      {admins.map(admin=><div key={admin._id} className="flex items-center justify-between gap-3 rounded-xl bg-zinc-950 border border-zinc-800 p-3"><div className="min-w-0"><p className="text-sm font-semibold truncate">{admin.name}</p><p className="text-[11px] text-zinc-400 break-all">{admin.email}</p><p className="text-[10px] text-amber-400 uppercase mt-1">{admin.role}</p></div><button disabled={admin.email===user.email} onClick={()=>void resetAuthenticator(admin)} title="Reset authenticator" className="px-2 py-1 rounded-lg border border-amber-500/30 text-amber-300 text-[10px]">Reset 2FA</button><button disabled={admin.email===user.email || admins.length<2} onClick={()=>void remove(admin)} title={admin.email===user.email?'You cannot delete your own account':'Delete admin'} className="p-2 rounded-lg text-red-300 hover:bg-red-950/50 disabled:opacity-25"><Trash2 size={15}/></button></div>)}
    </div>
  </section>;
};
