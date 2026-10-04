// @ts-nocheck
import { useState } from 'react';
import { supabase } from '../lib/supabase';

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
      const user = users.find((u: any) => [u.code_acces, u.code_d_acces, u.mot_de_passe, u.password].map((v:any)=>String(v||'').trim()).includes(code));
      if (!user) throw new Error('Code ghalat');
      let role = String(user.role).toLowerCase().trim();
      if (role.includes('caiss')) role = 'caisse';
      if (role.includes('cuisin')) role = 'cuisine';
      if (role.includes('serv')) role = 'serveur';
      onLogin({ user: {...user, role}, restaurantNom: 'Marsilia Food' });
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-sm">
        {/* LOGO HNA - 7ayad l-logo.png f public/ */}
        <div className="flex flex-col items-center mb-6">
          <img
            src="/logo.png"
            alt="Marsilia Food"
            className="w-28 h-28 rounded-2xl object-contain bg-black border border-orange-500/20 shadow-lg shadow-orange-500/20 p-1"
            onError={(e:any)=>{ e.target.style.display='none'; document.getElementById('logo-fallback')!.style.display='flex'; }}
          />
          <div id="logo-fallback" style={{display:'none'}} className="w-28 h-28 rounded-2xl bg-[#1a1a1a] border-2 border-orange-500 flex items-center justify-center">
            <span className="text-orange-500 font-black text-2xl">MF</span>
          </div>
          <h1 className="text-orange-500 font-black text-2xl mt-3 tracking-wider">MARSILIA</h1>
          <p className="text-white font-bold tracking-[0.3em] text-xs -mt-1">FOOD</p>
        </div>

        <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <input value={identifiant} onChange={e=>setIdentifiant(e.target.value)} placeholder="Identifiant (c1 / admin / s1)" className="w-full bg-[#0f0f0f] border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-orange-500 outline-none" required />
            <input type="password" value={codeAcces} onChange={e=>setCodeAcces(e.target.value)} placeholder="Code (123456)" className="w-full bg-[#0f0f0f] border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-orange-500 outline-none" required />
            {error && <p className="text-xs text-red-400 bg-red-900/20 border border-red-800 rounded-lg p-3 text-center">{error}</p>}
            <button type="submit" disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-3.5 font-bold transition">{loading?'...':'Se connecter'}</button>
            <div className="text-center text-[10px] text-zinc-600">Marsilia Food - Tit Mellil</div>
          </form>
        </div>
      </div>
    </div>
  );
}
