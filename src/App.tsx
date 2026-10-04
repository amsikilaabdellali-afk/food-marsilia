// @ts-nocheck
import { useEffect, useState } from 'react';
import Login from '@/components/Login';

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

  const role = String(profil.user.role||'').toLowerCase();
  const nom = profil.user.nom;
  const ident = profil.user.identifiant;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="bg-orange-600 text-white text-center py-3 font-black">
        ROLE={role} | {nom} ({ident}) 
        <button onClick={onLogout} className="ml-4 bg-black text-white px-3 py-1 rounded text-xs">Logout</button>
      </div>
      
      <div className="p-6">
        {role.includes('caiss') && (
          <div className="bg-yellow-500 text-black p-6 rounded-2xl font-black text-xl">
            ✅ CAISSE KHADAM! Iman - c1
            <div className="text-sm font-normal mt-2">Daba 3rafna mochkil t-7al! Ghadi n-raj3o CaisseView s7i7.</div>
          </div>
        )}
        {role.includes('serveur') && <div className="bg-blue-600 p-6 rounded-2xl font-black">SERVEUR: {nom}</div>}
        {role.includes('cuisin') && <div className="bg-green-600 p-6 rounded-2xl font-black">CUISINE: {nom}</div>}
        {role.includes('admin') && <div className="bg-red-600 p-6 rounded-2xl font-black">ADMIN: {nom} - Ila `c1` kay-ban hna, mazal mochkil f DB - sift liya screenshot</div>}
      </div>
    </div>
  );
}
