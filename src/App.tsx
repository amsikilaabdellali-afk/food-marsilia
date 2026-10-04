// @ts-nocheck
import { useEffect, useState } from 'react';
import Login from './components/Login';
import Admin from './components/Admin';
import Caisse from './components/Caisse';
import Cuisine from './components/Cuisine';
import Serveur from './components/Serveur';

export default function App(){
  const [profil,setProfil]=useState<any>(null);
  useEffect(()=>{ const s=localStorage.getItem('marsilia_profil'); if(s){ try{ setProfil(JSON.parse(s)); }catch{} } },[]);
  if(!profil) return <Login onLogin={(p:any)=>{localStorage.setItem('marsilia_profil',JSON.stringify(p));setProfil(p);}} />;
  const role=String(profil.user.role||'').toLowerCase().trim();
  const id=String(profil.user.identifiant||'').toLowerCase().trim();
  const onLogout=()=>{localStorage.clear();setProfil(null);location.reload();};
  if(role==='caisse'||id==='c1') return <Caisse profil={profil} onLogout={onLogout} />;
  if(role==='cuisine'||id==='said') return <Cuisine profil={profil} onLogout={onLogout} />;
  if(role==='serveur'||id==='s1'||id.startsWith('s')) return <Serveur profil={profil} onLogout={onLogout} />;
  return <div className="min-h-screen bg-black"><div className="bg-red-600 text-white text-center py-2 text-xs font-bold flex justify-center gap-3">ADMIN: {profil.user.nom} ({profil.user.identifiant})<button onClick={onLogout} className="bg-black px-3 py-1 rounded">Logout</button></div><Admin /></div>;
}
