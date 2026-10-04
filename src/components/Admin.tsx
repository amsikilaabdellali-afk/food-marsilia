import { useState, useEffect } from 'react';
import { Role, ROLE_NAMES } from '@/lib/roles';
import Admin from '@/pages/Admin';
import Serveur from '@/pages/Serveur';
import Cuisine from '@/pages/Cuisine';
import Caisse from '@/pages/Caisse';

function App() {
  const [role, setRole] = useState<Role | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(()=>{
    const saved = localStorage.getItem('marsilia_role');
    const savedUser = localStorage.getItem('marsilia_user');
    if(saved) setRole(saved as Role);
    if(savedUser) try{ setUser(JSON.parse(savedUser)); }catch{}
  },[]);

  const login = (r: Role, u:any)=>{
    setRole(r);
    setUser(u);
    localStorage.setItem('marsilia_role', r);
    localStorage.setItem('marsilia_user', JSON.stringify(u));
  };

  const logout = ()=>{
    setRole(null);
    setUser(null);
    localStorage.removeItem('marsilia_role');
    localStorage.removeItem('marsilia_user');
  };

  if(!role){
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <h1 className="text-3xl font-black text-white text-center">MARSILIA</h1>
          <p className="text-gray-500 text-center text-sm">Choisi role bach t-dkhel</p>
          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(ROLE_NAMES) as Role[]).map((r)=>(
              <button key={r} onClick={()=>{
                const u = {role: r, nom: r};
                login(r, u);
              }} className="bg-[#1A1A1A] border border-gray-800 p-6 rounded-2xl hover:border-[#FF6B00] transition">
                <div className="text-white font-black">{ROLE_NAMES[r]}</div>
                <div className="text-gray-500 text-xs mt-1">{r}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {role==='admin' && <Admin />}
      {role==='serveur' && <Serveur user={user} onLogout={logout} />}
      {role==='cuisine' && <Cuisine user={user} onLogout={logout} />}
      {role==='caisse' && <Caisse user={user} onLogout={logout} />}
      {role!=='admin' && <button onClick={logout} className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-xl text-sm">Logout</button>}
    </div>
  );
}

export default App;
