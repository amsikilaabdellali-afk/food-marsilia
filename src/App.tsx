// @ts-nocheck
import { useEffect, useState } from 'react';
import Login from './components/Login';
import Admin from './components/admin/Admin';
import { supabase } from './lib/supabase';

function CaissePage({ profil, onLogout }: any){
  const [total,setTotal]=useState(0);
  const [count,setCount]=useState(0);
  const [cmds,setCmds]=useState<any[]>([]);
  useEffect(()=>{
    const load = async ()=>{
      const start = new Date(); start.setHours(0,0,0,0);
      const end = new Date(); end.setHours(23,59,59,999);
      const {data} = await supabase.from('commandes').select('*').eq('statut','paye').gte('paye_at',start.toISOString()).lte('paye_at',end.toISOString()).order('paye_at',{ascending:false}).limit(20);
      if(data){ 
        setCmds(data);
        setCount(data.length); 
        setTotal(data.reduce((s:any,c:any)=>s+(c.total||0),0)); 
      }
    };
    load();
  },[]);
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="bg-yellow-500 text-black p-3 flex justify-between items-center font-black">
        <span>CAISSE: {profil.user.nom} ({profil.user.identifiant}) - {total} DH</span>
        <button onClick={onLogout} className="bg-black text-white px-4 py-1 rounded-xl text-xs">Logout</button>
      </div>
      <div className="p-4 grid grid-cols-2 gap-3">
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl"><div className="text-xs text-zinc-400">CA Lyoum</div><div className="text-xl font-black text-yellow-500">{total} DH</div></div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl"><div className="text-xs text-zinc-400">Commandes</div><div className="text-xl font-black">{count}</div></div>
      </div>
      <div className="p-4">
        <h3 className="font-bold mb-2">Dernieres payées</h3>
        {cmds.map((c:any)=><div key={c.id} className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl mb-2 flex justify-between"><span>T{c.table_id} - {c.total} DH</span><span className="text-xs text-zinc-500">{new Date(c.paye_at).toLocaleTimeString()}</span></div>)}
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
  const onLogin = (p:any)=>{ localStorage.setItem('marsilia_profil', JSON.stringify(p)); setProfil(p); };
  const onLogout = ()=>{ localStorage.clear(); setProfil(null); };
  if(loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">...</div>;
  if(!profil) return <Login onLogin={onLogin} />;
  const role = String(profil.user.role||'').toLowerCase().trim();
  if(role.includes('caiss')) return <CaissePage profil={profil} onLogout={onLogout} />;
  if(role.includes('serveur')) return <div className="min-h-screen bg-black text-white"><div className="bg-blue-600 text-center py-2 font-bold">SERVEUR: {profil.user.nom} <button onClick={onLogout} className="ml-2 bg-black px-3 py-1 rounded text-xs">Logout</button></div><div className="p-6">Serveur - khdam</div></div>;
  if(role.includes('cuisin')) return <div className="min-h-screen bg-black text-white"><div className="bg-green-600 text-center py-2 font-bold">CUISINE: {profil.user.nom} <button onClick={onLogout} className="ml-2 bg-black px-3 py-1 rounded text-xs">Logout</button></div><div className="p-6">Cuisine - khdam</div></div>;
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
