// @ts-nocheck
import { useEffect, useState } from 'react';
import Login from '@/components/Login';
import Admin from '@/components/admin/Admin';
import { supabase } from '@/lib/supabase';

function CaissePage({ profil, onLogout }: any){
  const [total,setTotal]=useState(0);
  const [count,setCount]=useState(0);
  useEffect(()=>{
    const today = new Date().toISOString().split('T')[0];
    const start = new Date(); start.setHours(0,0,0,0);
    const end = new Date(); end.setHours(23,59,59,999);
    supabase.from('commandes').select('total').eq('statut','paye').gte('paye_at',start.toISOString()).lte('paye_at',end.toISOString()).then(({data})=>{
      if(data){ setCount(data.length); setTotal(data.reduce((s:any,c:any)=>s+(c.total||0),0)); }
    });
  },[]);
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-black">CAISSE - {profil.user.nom}</h1>
        <button onClick={onLogout} className="bg-zinc-800 px-4 py-2 rounded-xl">Logout</button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-yellow-500 text-black p-5 rounded-2xl"><div className="text-sm">CA Lyoum</div><div className="text-2xl font-black">{total} DH</div></div>
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl"><div className="text-sm text-zinc-400">Commandes</div><div className="text-2xl font-black">{count}</div></div>
      </div>
      <div className="mt-6 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center text-zinc-500">
        CaisseView s7i7a - ila 3andek CaisseView.tsx 9dima, goul liya path dyalha n-raj3ha
      </div>
    </div>
  );
}

export default function App(){
  const [profil,setProfil]=useState<any>(null);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    const s = localStorage.getItem('marsilia_profil');
    if(s){ try{ setProfil(JSON.parse(s)); }catch{} }
    setLoading(false);
  },[]);

  const onLogin = (p:any)=>{
    localStorage.setItem('marsilia_profil', JSON.stringify(p));
    setProfil(p);
  };
  const onLogout = ()=>{
    localStorage.clear();
    setProfil(null);
  };

  if(loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">...</div>;
  if(!profil) return <Login onLogin={onLogin} />;

  const role = String(profil.user.role||'').toLowerCase().trim();

  if(role.includes('caiss')) return <CaissePage profil={profil} onLogout={onLogout} />;
  if(role.includes('serveur')) return <div className="min-h-screen bg-black text-white"><div className="bg-blue-600 text-center py-2 font-bold">SERVEUR: {profil.user.nom} <button onClick={onLogout} className="ml-3 bg-black px-3 py-1 rounded text-xs">Logout</button></div><div className="p-6">ServeurView - khdam</div></div>;
  if(role.includes('cuisin')) return <div className="min-h-screen bg-black text-white"><div className="bg-green-600 text-center py-2 font-bold">CUISINE: {profil.user.nom} <button onClick={onLogout} className="ml-3 bg-black px-3 py-1 rounded text-xs">Logout</button></div><div className="p-6">CuisineView - khdam</div></div>;
  if(role.includes('plateforme')) return <div className="min-h-screen bg-black text-white p-6">Plateforme: {profil.user.nom} <button onClick={onLogout} className="ml-3 bg-zinc-800 px-3 py-1 rounded">Logout</button></div>;

  // ADMIN
  return (
    <div className="min-h-screen bg-black">
      <div className="bg-red-600 text-white text-center py-2 text-xs font-bold flex justify-center items-center gap-3">
        ADMIN: {profil.user.nom} ({profil.user.identifiant})
        <button onClick={onLogout} className="bg-black px-3 py-1 rounded">Logout</button>
      </div>
      <Admin />
    </div>
  );
}
