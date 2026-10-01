import { useState, useEffect } from 'react';
import Login, { type Role, ROLE_NAMES } from '@/components/Login';
import Admin from '@/components/Admin';
import Serveur from '@/components/Serveur';
import Cuisine from '@/components/Cuisine';
import Caisse from '@/components/Caisse';
import Plateforme from '@/components/Plateforme';
import { supabase } from '@/lib/supabase';
import { loadProfil, type Profil } from '@/lib/session';
import { LogOut } from 'lucide-react';

export default function App() {
  const [profil, setProfil] = useState<Profil | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (session) {
        const p = await loadProfil(session.user.id);
        if (!cancelled) {
          if (p) {
            setProfil(p);
          } else {
            await supabase.auth.signOut();
          }
        }
      }
      if (!cancelled) setChecking(false);
    };
    restoreSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) setProfil(null);
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setProfil(null);
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profil) {
    return <Login onLogin={setProfil} />;
  }

  const { user, restaurantNom } = profil;
  const role = user.role as Role;

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/90 backdrop-blur border-b border-gray-800 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF6B00] to-[#FF8C00] flex items-center justify-center">
            <span className="text-white font-bold text-sm">{restaurantNom.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <span className="text-white font-bold text-sm">{restaurantNom}</span>
            <span className="text-gray-500 text-xs ml-2 hidden sm:inline">
              {user.nom} · {ROLE_NAMES[role]}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Déconnexion</span>
        </button>
      </header>

      <main className="pt-14">
        {role === 'plateforme' && <Plateforme />}
        {role === 'admin' && <Admin />}
        {role === 'serveur' && <Serveur serveurNom={user.nom} />}
        {role === 'cuisine' && <Cuisine />}
        {role === 'caisse' && <Caisse />}
      </main>
    </div>
  );
}
