import { useState } from 'react';
import { supabase, identifiantToEmail } from '@/lib/supabase';
import { loadProfil, type Profil } from '@/lib/session';
import { UtensilsCrossed, Lock, User, Store, AlertCircle } from 'lucide-react';

const RESTAURANT_CODE_KEY = 'marsilia_restaurant_code';

export type Role = 'admin' | 'serveur' | 'cuisine' | 'caisse' | 'plateforme';

export const ROLE_NAMES: Record<Role, string> = {
  admin: 'Administrateur',
  serveur: 'Serveur',
  cuisine: 'Cuisine',
  caisse: 'Caisse',
  plateforme: 'Plateforme',
};

export default function Login({ onLogin }: { onLogin: (profil: Profil) => void }) {
  const [restaurantCode, setRestaurantCode] = useState(() => localStorage.getItem(RESTAURANT_CODE_KEY) || '');
  const [identifiant, setIdentifiant] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantCode.trim() || !identifiant.trim() || !code) {
      setError('Veuillez remplir le code restaurant, votre identifiant et votre code');
      return;
    }
    setLoading(true);
    setError('');

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: identifiantToEmail(identifiant, restaurantCode),
      password: code,
    });

    if (signInError || !data.user) {
      setLoading(false);
      setError('Identifiant ou code incorrect');
      return;
    }

    const profil = await loadProfil(data.user.id);

    if (!profil) {
      await supabase.auth.signOut();
      setLoading(false);
      setError('Compte désactivé ou non autorisé');
      return;
    }

    localStorage.setItem(RESTAURANT_CODE_KEY, restaurantCode.trim().toLowerCase());
    setLoading(false);
    onLogin(profil);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#FF6B00] to-[#FF8C00] mb-4 shadow-lg shadow-orange-500/20">
            <UtensilsCrossed className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Marsilia Food</h1>
          <p className="text-gray-500 mt-1 text-sm">Système de gestion restaurant</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#1A1A1A] rounded-2xl p-6 shadow-xl border border-gray-800">
          <label className="block text-sm font-medium text-gray-400 mb-2">Code restaurant</label>
          <div className="relative mb-4">
            <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
            <input
              type="text"
              value={restaurantCode}
              onChange={(e) => {
                setRestaurantCode(e.target.value);
                setError('');
              }}
              placeholder="ex: marsilia"
              autoCapitalize="none"
              autoCorrect="off"
              className="w-full bg-[#0A0A0A] text-white text-lg font-semibold rounded-xl py-3.5 pl-12 pr-4 border border-gray-700 focus:border-[#FF6B00] focus:outline-none transition-colors"
              autoFocus={!restaurantCode}
            />
          </div>

          <label className="block text-sm font-medium text-gray-400 mb-2">Identifiant</label>
          <div className="relative mb-4">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
            <input
              type="text"
              value={identifiant}
              onChange={(e) => {
                setIdentifiant(e.target.value);
                setError('');
              }}
              placeholder="Votre identifiant"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              className="w-full bg-[#0A0A0A] text-white text-lg font-semibold rounded-xl py-3.5 pl-12 pr-4 border border-gray-700 focus:border-[#FF6B00] focus:outline-none transition-colors"
              autoFocus={!!restaurantCode}
            />
          </div>

          <label className="block text-sm font-medium text-gray-400 mb-2">Code d'accès</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
            <input
              type="password"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError('');
              }}
              placeholder="Votre code"
              autoComplete="current-password"
              className="w-full bg-[#0A0A0A] text-white text-lg font-semibold rounded-xl py-3.5 pl-12 pr-4 border border-gray-700 focus:border-[#FF6B00] focus:outline-none transition-colors"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 mt-3 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-[#FF6B00] hover:bg-[#FF7A1A] disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-colors active:scale-[0.98]"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}
