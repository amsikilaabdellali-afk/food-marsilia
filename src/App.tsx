// @ts-nocheck
import { useEffect, useState } from 'react';
import Login from './components/Login';

export default function App(){
  const [profil,setProfil]=useState<any>(null);
  useEffect(()=>{
    const s=localStorage.getItem('marsilia_profil');
    if(s){ try{ setProfil(JSON.parse(s)); }catch{} }
  },[]);
  if(!profil) return <Login onLogin={(p:any)=>{localStorage.setItem('marsilia_profil',JSON.stringify(p));setProfil(p);}} />;
  const role=String(profil.user.role||'').toLowerCase();
  return(
    <div className="min-h-screen bg-black text-white">
      <div className="bg-yellow-500 text-black p-3 font-black flex justify-between">
        <span>{role.toUpperCase()}: {profil.user.nom} ({profil.user.identifiant})</span>
        <button onClick={()=>{localStorage.clear();setProfil(null);}} className="bg-black text-white px-3 py-1 rounded text-xs">Logout</button>
      </div>
      <div className="p-10 text-center text-2xl font-black">
        ✅ {role==='caisse'?'CAISSE KHADAM!':'ADMIN KHADAM!'}<br/>
        <span className="text-sm font-normal">{profil.user.nom}</span>
      </div>
    </div>
  );
}
