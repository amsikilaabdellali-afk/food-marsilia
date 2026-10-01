import { useState, useEffect, useCallback } from 'react';
import { callEdge } from '@/lib/edge';
import { Plus, X, Store } from 'lucide-react';

type RestaurantInfo = {
  id: string;
  nom: string;
  slug: string;
  actif: boolean;
  created_at: string;
  nb_utilisateurs: number;
  admins: string[];
};

export default function Plateforme() {
  const [restaurants, setRestaurants] = useState<RestaurantInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    const { data, error: err } = await callEdge<{ restaurants: RestaurantInfo[] }>('platform-admin', { action: 'list' });
    if (err) setError(err);
    else setRestaurants(data?.restaurants || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleActif = async (r: RestaurantInfo) => {
    const message = r.actif
      ? `Désactiver « ${r.nom} » ? Tous ses utilisateurs perdront l'accès.`
      : `Réactiver « ${r.nom} » ?`;
    if (!confirm(message)) return;
    const { error: err } = await callEdge('platform-admin', { action: 'set_actif', id: r.id, actif: !r.actif });
    if (err) alert(err);
    load();
  };

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Restaurants clients</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-[#FF6B00] hover:bg-[#FF7A1A] text-white font-medium px-4 py-2.5 rounded-xl"
        >
          <Plus className="w-4 h-4" /> Nouveau restaurant
        </button>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}
      {loading && <p className="text-gray-500 text-sm">Chargement...</p>}

      <div className="space-y-2">
        {restaurants.map((r) => (
          <div key={r.id} className="bg-[#1A1A1A] rounded-2xl p-4 border border-gray-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${r.actif ? 'bg-[#FF6B00]/20 text-[#FF6B00]' : 'bg-gray-800 text-gray-600'}`}>
                <Store className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-white font-semibold truncate">{r.nom}</h4>
                  {!r.actif && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-900 text-red-300">Désactivé</span>
                  )}
                </div>
                <p className="text-gray-500 text-sm">
                  Code : {r.slug} · {r.nb_utilisateurs} utilisateur(s)
                  {r.admins.length > 0 && ` · admin : ${r.admins.join(', ')}`}
                </p>
              </div>
            </div>
            <button
              onClick={() => toggleActif(r)}
              className={`px-3 py-2 rounded-lg text-xs font-medium shrink-0 ${r.actif ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-green-900 text-green-300 hover:bg-green-800'}`}
            >
              {r.actif ? 'Désactiver' : 'Activer'}
            </button>
          </div>
        ))}
        {!loading && restaurants.length === 0 && !error && (
          <p className="text-gray-500 text-sm">Aucun restaurant pour le moment.</p>
        )}
      </div>

      {showForm && <RestaurantForm onClose={() => setShowForm(false)} onSaved={load} />}
    </div>
  );
}

function RestaurantForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [nom, setNom] = useState('');
  const [slug, setSlug] = useState('');
  const [adminNom, setAdminNom] = useState('');
  const [adminIdentifiant, setAdminIdentifiant] = useState('');
  const [code, setCode] = useState('');
  const [saving, setSaving] = useState(false);

  const canSave = !!nom.trim() && !!slug.trim() && !!adminIdentifiant.trim() && code.length >= 6;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    const { error } = await callEdge('platform-admin', {
      action: 'create_restaurant',
      nom: nom.trim(),
      slug: slug.trim(),
      admin_nom: adminNom.trim(),
      admin_identifiant: adminIdentifiant.trim(),
      code,
    });
    setSaving(false);
    if (error) {
      alert(error);
      return;
    }
    onSaved();
    onClose();
  };

  const inputClass =
    'w-full bg-[#0A0A0A] text-white rounded-xl py-2.5 px-3 border border-gray-700 focus:border-[#FF6B00] focus:outline-none';

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-[#1A1A1A] rounded-2xl w-full max-w-md border border-gray-800 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h3 className="text-white font-semibold text-lg">Nouveau restaurant</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Nom du restaurant</label>
            <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="ex: Chez Karim" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Code restaurant (utilisé à la connexion)</label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              autoCapitalize="none"
              placeholder="ex: chez-karim"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Nom de l'administrateur</label>
            <input value={adminNom} onChange={(e) => setAdminNom(e.target.value)} placeholder="ex: Karim" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Identifiant de l'administrateur</label>
            <input
              value={adminIdentifiant}
              onChange={(e) => setAdminIdentifiant(e.target.value.toLowerCase())}
              autoCapitalize="none"
              placeholder="ex: karim"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Code d'accès (6 caractères minimum)</label>
            <input
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoComplete="new-password"
              placeholder="••••••"
              className={`${inputClass} font-mono tracking-widest`}
            />
          </div>
          <p className="text-xs text-gray-500">
            Le restaurant démarre avec 4 catégories et 8 tables. L'administrateur pourra ensuite créer ses propres utilisateurs.
          </p>
        </div>
        <div className="p-5 border-t border-gray-800 flex gap-3">
          <button onClick={onClose} className="flex-1 bg-gray-800 text-white py-3 rounded-xl font-medium hover:bg-gray-700">Annuler</button>
          <button
            onClick={handleSave}
            disabled={saving || !canSave}
            className="flex-1 bg-[#FF6B00] text-white py-3 rounded-xl font-medium hover:bg-[#FF7A1A] disabled:opacity-50"
          >
            {saving ? '...' : 'Créer'}
          </button>
        </div>
      </div>
    </div>
  );
}
