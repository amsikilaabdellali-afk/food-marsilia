// @ts-nocheck
import { useEffect, useState } from 'react';
import Login from '@/components/Login';
import Admin from '@/components/admin/Admin';
import { supabase } from '@/lib/supabase';

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
    window.location.reload();
  };
  const onLogout = ()=>{
    localStorage.clear();
    setProfil(null);
  };

  if(loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">...</div>;
  if(!profil) return <Login onLogin={onLogin} />;

  const role = String(profil.user.role||'').toLowerCase();

  if(role.includes('caiss')){
    return <div className="min-h-screen bg-black text-white"><div className="bg-yellow-500 text-black text-center py-2 font-black">CAISSE: {profil.user.nom} <button onClick={onLogout} className="ml-4 bg-black text-white px-3 py-1 rounded">Logout</button></div><div className="p-6 text-xl">✅ DABA KHADAM - CAISSE VIEW</div></div>;
  }
  if(role.includes('serveur')){
    return <div className="min-h-screen bg-black text-white"><div className="bg-blue-600 text-center py-2">SERVEUR: {profil.user.nom} <button onClick={onLogout} className="ml-2 underline">Logout</button></div></div>;
  }
  if(role.includes('cuisin')){
    return <div className="min-h-screen bg-black text-white"><div className="bg-green-600 text-center py-2">CUISINE: {profil.user.nom} <button onClick={onLogout} className="ml-2 underline">Logout</button></div></div>;
  }
  return <div><div className="bg-red-600 text-white text-center py-1">ADMIN: {profil.user.nom} <button onClick={onLogout} className="ml-2 bg-black px-2 rounded">Logout</button></div><Admin /></div>;
}
