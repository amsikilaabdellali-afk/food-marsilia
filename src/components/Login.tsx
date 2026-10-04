import { useState } from 'react';
import { supabase } from '@/lib/supabase';
export type Role = 'admin' | 'serveur' | 'cuisine' | 'caisse' | 'plateforme';
export const ROLE_NAMES: Record<Role, string> = { admin: 'Admin', serveur: 'Serveur', cuisine: 'Cuisine', caisse: 'Caisse', plateforme: 'Plateforme' };
type Profil = { user: any; restaurantNom: string; };
export default function Login({ onLogin }: { onLogin: (p: Profil) => void }) {
  const [identifiant, setIdentifiant] = useState('');
  const [codeAcces, setCodeAcces] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const { data: users } = await supabase.from('utilisateurs').select('*').eq('identifiant', identifiant.trim()).eq('actif', true);
      if (!users || users.length === 0) throw new Error('Identifiant ghalat');
      const code = codeAcces.trim();
      const user = users.find((u: any) => [u.code_acces, u.code_d_acces, u.mot_de_passe].map((v:any)=>String(v||'').trim()).includes(code));
      if (!user) throw new Error('Code ghalat');
      let role = String(user.role).toLowerCase().trim();
      if (role.includes('caiss')) role = 'caisse';
      if (role.includes('cuisin')) role = 'cuisine';
      onLogin({ user: {...user, role}, restaurantNom: 'Marsilia Food' });
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-sm"><div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-6">
        <form onSubmit={handleLogin} className="space-y-4">
          <input value={identifiant} onChange={e=>setIdentifiant(e.target.value)} placeholder="c1" className="w-full bg-[#0f0f0f] border border-gray-700 rounded-xl px-4 py-3 text-white" required />
          <input type="password" value={codeAcces} onChange={e=>setCodeAcces(e.target.value)} placeholder="123456" className="w-full bg-[#0f0f0f] border border-gray-700 rounded-xl px-4 py-3 text-white" required />
          {error && <p className="text-xs text-red-400 bg-red-900/20 border border-red-800 rounded-lg p-2">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-orange-500 text-white rounded-xl py-3 font-semibold">{loading?'...':'Se connecter'}</button>
        </form></div></div></div>
  );
}
