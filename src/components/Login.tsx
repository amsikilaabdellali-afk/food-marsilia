// @ts-nocheck
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Login({ onLogin }: any) {
  const [identifiant, setIdentifiant] = useState('c1');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e:any) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { data, error } = await supabase.from('utilisateurs').select('*').eq('identifiant', identifiant.toLowerCase()).single();
      if (error ||!data) { setError('Identifiant ghalat'); setLoading(false); return; }
      const passOk = data.code_acces === password || data.password === password;
      if (!passOk) { setError('Password ghalat'); setLoading(false); return; }
      localStorage.setItem('user', JSON.stringify(data));
      onLogin(data);
    } catch(err:any){ setError(err.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* LOGO MARSILIA FOOD */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-32 h-32 bg-black rounded-2xl flex items-center justify-center border border-yellow-600/30 shadow-[0_0_30px_rgba(212,175,55,0.2)] p-2">
            <img src="/logo.png" alt="Marsilia Food" className="w-full h-full object-contain" />
          </div>
          <div className="mt-4 text-center">
            <h1 className="text-white font-black text-xl tracking-widest">MARSILIA</h1>
            <p className="text-[#D4AF37] font-bold tracking-[0.4em] text-xs">FOOD MECHOUI</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="bg-[#1A1A1A] border border-zinc-800 rounded-3xl p-6 space-y-4">
          <input value={identifiant} onChange={e=>setIdentifiant(e.target.value)} placeholder="Identifiant" className="w-full bg-black border border-zinc-700 rounded-2xl px-4 py-4 text-white font-bold focus:border-[#D4AF37] outline-none" />
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" className="w-full bg-black border border-zinc-700 rounded-2xl px-4 py-4 text-white font-bold focus:border-[#D4AF37] outline-none" />
          {error && <div className="bg-red-900/30 border border-red-700 text-red-400 p-3 rounded-xl text-sm text-center">{error}</div>}
          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-[#D4AF37] to-yellow-600 text-black font-black py-4 rounded-2xl text-lg">
            {loading? '...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}
