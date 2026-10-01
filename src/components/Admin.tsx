import { useState, useEffect, useCallback } from 'react';
import { adminUsers } from '@/lib/adminUsers';
import { supabase, type Commande, type Menu, type MatierePremiere, type Recette, type CommandeItem, type Category, type Utilisateur } from '@/lib/supabase';
import {
  LayoutDashboard, UtensilsCrossed, Package, ClipboardList, Leaf, Tags, Users, FileBarChart,
  Plus, Edit3, Trash2, X, Search, TrendingUp, DollarSign, ShoppingBag,
  AlertTriangle, Image as ImageIcon, ChevronDown, ChevronRight, ArrowUp, ArrowDown, Printer, Calendar
} from 'lucide-react';

type Tab = 'dashboard' | 'menu' | 'stock' | 'commandes' | 'matiere' | 'categories' | 'utilisateurs' | 'rapports';

export default function Admin() {
  const [tab, setTab] = useState<Tab>('dashboard');

  const tabs: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'menu', label: 'Menu', icon: UtensilsCrossed },
    { id: 'stock', label: 'Stock', icon: Package },
    { id: 'commandes', label: 'Commandes', icon: ClipboardList },
    { id: 'matiere', label: 'Matière', icon: Leaf },
    { id: 'categories', label: 'Catégories', icon: Tags },
    { id: 'utilisateurs', label: 'Utilisateurs', icon: Users },
    { id: 'rapports', label: 'Rapports', icon: FileBarChart },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-20">
      <div className="sticky top-0 z-30 bg-[#0A0A0A]/95 backdrop-blur border-b border-gray-800">
        <div className="flex items-center gap-1 px-2 py-2 overflow-x-auto scrollbar-hide">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                  tab === t.id ? 'bg-[#FF6B00] text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 max-w-6xl mx-auto">
        {tab === 'dashboard' && <DashboardTab />}
        {tab === 'menu' && <MenuTab />}
        {tab === 'stock' && <StockTab />}
        {tab === 'commandes' && <CommandesTab />}
        {tab === 'matiere' && <MatiereTab />}
        {tab === 'categories' && <CategoriesTab />}
        {tab === 'utilisateurs' && <UtilisateursTab />}
        {tab === 'rapports' && <RapportsTab />}
      </div>
    </div>
  );
}

// ============ DASHBOARD ============
function DashboardTab() {
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [items, setItems] = useState<CommandeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data: cmds } = await supabase
        .from('commandes')
        .select('*')
        .gte('created_at', today + 'T00:00:00')
        .order('created_at', { ascending: false });
      setCommandes(cmds || []);

      if (cmds && cmds.length > 0) {
        const ids = cmds.map((c) => c.id);
        const { data: its } = await supabase
          .from('commande_items')
          .select('*')
          .in('commande_id', ids);
        setItems(its || []);
      }
      setLoading(false);
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <LoadingSpinner />;

  const caTotal = commandes.reduce((s, c) => s + Number(c.total), 0);
  const caPaye = commandes.filter((c) => c.statut === 'paye').reduce((s, c) => s + Number(c.total), 0);
  const nbCmd = commandes.length;
  const panierMoy = nbCmd > 0 ? caTotal / nbCmd : 0;

  const platCounts: Record<string, { count: number; revenue: number }> = {};
  items.forEach((it) => {
    if (!platCounts[it.menu_nom]) platCounts[it.menu_nom] = { count: 0, revenue: 0 };
    platCounts[it.menu_nom].count += it.qte;
    platCounts[it.menu_nom].revenue += it.qte * Number(it.prix);
  });
  const topPlats = Object.entries(platCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white">Tableau de bord — Aujourd'hui</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={DollarSign} label="CA du jour" value={`${caTotal.toFixed(0)} DH`} color="text-green-400" bg="bg-green-950/30" />
        <StatCard icon={TrendingUp} label="CA encaissé" value={`${caPaye.toFixed(0)} DH`} color="text-[#FF6B00]" bg="bg-orange-950/30" />
        <StatCard icon={ShoppingBag} label="Commandes" value={nbCmd.toString()} color="text-blue-400" bg="bg-blue-950/30" />
        <StatCard icon={TrendingUp} label="Panier moyen" value={`${panierMoy.toFixed(0)} DH`} color="text-purple-400" bg="bg-purple-950/30" />
      </div>

      <div className="bg-[#1A1A1A] rounded-2xl p-5 border border-gray-800">
        <h3 className="text-white font-semibold mb-4">Top 5 plats</h3>
        {topPlats.length === 0 ? (
          <p className="text-gray-500 text-sm">Aucune commande aujourd'hui</p>
        ) : (
          <div className="space-y-3">
            {topPlats.map(([nom, info], i) => (
              <div key={nom} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-[#FF6B00]/20 text-[#FF6B00] flex items-center justify-center text-sm font-bold">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="text-white text-sm font-medium">{nom}</div>
                  <div className="text-gray-500 text-xs">{info.count} vendus · {info.revenue.toFixed(0)} DH</div>
                </div>
                <div className="w-24 bg-gray-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-[#FF6B00] rounded-full"
                    style={{ width: `${(info.count / topPlats[0][1].count) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-[#1A1A1A] rounded-2xl p-5 border border-gray-800">
        <h3 className="text-white font-semibold mb-4">Commandes récentes</h3>
        {commandes.length === 0 ? (
          <p className="text-gray-500 text-sm">Aucune commande aujourd'hui</p>
        ) : (
          <div className="space-y-2">
            {commandes.slice(0, 8).map((c) => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                <div>
                  <span className="text-white text-sm font-medium">{c.serveur_nom || 'N/A'}</span>
                  <span className="text-gray-500 text-xs ml-2">
                    {new Date(c.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge statut={c.statut} />
                  <span className="text-white text-sm font-semibold">{Number(c.total).toFixed(0)} DH</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, bg }: { icon: typeof DollarSign; label: string; value: string; color: string; bg: string }) {
  return (
    <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-gray-800">
      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div className="text-white text-xl font-bold">{value}</div>
      <div className="text-gray-500 text-xs mt-0.5">{label}</div>
    </div>
  );
}

function StatusBadge({ statut }: { statut: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    en_attente: { label: 'En attente', cls: 'bg-gray-700 text-gray-300' },
    en_preparation: { label: 'En préparation', cls: 'bg-blue-900 text-blue-300' },
    pret: { label: 'Prêt', cls: 'bg-green-900 text-green-300' },
    paye: { label: 'Payé', cls: 'bg-green-700 text-white' },
  };
  const s = map[statut] || map.en_attente;
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>;
}

// ============ MENU ============
function MenuTab() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [matieres, setMatieres] = useState<MatierePremiere[]>([]);
  const [recettes, setRecettes] = useState<Recette[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('Tous');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Menu | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    const [{ data: m }, { data: mp }, { data: r }, { data: cats }] = await Promise.all([
      supabase.from('menu').select('*').order('categorie').order('nom'),
      supabase.from('matiere_premiere').select('*').order('nom'),
      supabase.from('recette').select('*'),
      supabase.from('categories').select('*').order('ordre'),
    ]);
    setMenus(m || []);
    setMatieres(mp || []);
    setRecettes(r || []);
    setCategories(cats || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const catList = ['Tous', ...categories.map((c) => c.nom)];
  const catLabel = (nom: string) => categories.find((c) => c.nom === nom)?.label || nom;

  const filtered = menus.filter((m) => {
    if (filter !== 'Tous' && m.categorie !== filter) return false;
    if (search && !m.nom.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const grouped = filtered.reduce<Record<string, Menu[]>>((acc, m) => {
    (acc[m.categorie] = acc[m.categorie] || []).push(m);
    return acc;
  }, {});

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce plat ?')) return;
    await supabase.from('recette').delete().eq('menu_id', id);
    await supabase.from('menu').delete().eq('id', id);
    load();
  };

  const toggleDispo = async (m: Menu) => {
    await supabase.from('menu').update({ disponible: !m.disponible }).eq('id', m.id);
    load();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-white">Gestion du Menu</h2>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-[#FF6B00] hover:bg-[#FF7A1A] text-white font-medium px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un plat..."
            className="w-full bg-[#1A1A1A] text-white rounded-xl py-2.5 pl-10 pr-4 border border-gray-800 focus:border-[#FF6B00] focus:outline-none"
          />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {catList.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === c ? 'bg-[#FF6B00] text-white' : 'bg-[#1A1A1A] text-gray-400 hover:text-white'
            }`}
          >
            {c === 'Tous' ? 'Tous' : catLabel(c)}
          </button>
        ))}
      </div>

      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat}>
          <h3 className="text-lg font-bold text-[#FF6B00] mb-3">{catLabel(cat)}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((m) => {
              const recetteItems = recettes.filter((r) => r.menu_id === m.id);
              return (
                <div key={m.id} className="bg-[#1A1A1A] rounded-2xl overflow-hidden border border-gray-800">
                  <div className="relative h-32 bg-gray-900">
                    {m.image_url ? (
                      <img src={m.image_url} alt={m.nom} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-10 h-10 text-gray-700" />
                      </div>
                    )}
                    <button
                      onClick={() => toggleDispo(m)}
                      className={`absolute top-2 right-2 px-2.5 py-1 rounded-lg text-xs font-medium ${
                        m.disponible ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                      }`}
                    >
                      {m.disponible ? 'Disponible' : 'Indisponible'}
                    </button>
                  </div>
                  <div className="p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-white font-semibold text-sm">{m.nom}</h4>
                        <p className="text-[#FF6B00] font-bold">{Number(m.prix).toFixed(0)} DH</p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => { setEditing(m); setShowForm(true); }}
                          className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(m.id)}
                          className="p-2 rounded-lg bg-red-950 hover:bg-red-900 text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {recetteItems.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {recetteItems.map((r) => {
                          const mp = matieres.find((x) => x.id === r.matiere_id);
                          return (
                            <span key={r.id} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">
                              {mp?.nom} {r.qte_necessaire}{mp?.unite}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {showForm && (
        <MenuForm
          menu={editing}
          matieres={matieres}
          recettes={recettes}
          categories={categories}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={load}
        />
      )}
    </div>
  );
}

function MenuForm({ menu, matieres, recettes, categories, onClose, onSaved }: {
  menu: Menu | null;
  matieres: MatierePremiere[];
  recettes: Recette[];
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nom, setNom] = useState(menu?.nom || '');
  const [prix, setPrix] = useState(menu ? String(menu.prix) : '');
  const [categorie, setCategorie] = useState(menu?.categorie || (categories[0]?.nom || 'Plats'));
  const [image_url, setImageUrl] = useState(menu?.image_url || '');
  const [disponible, setDisponible] = useState(menu?.disponible ?? true);
  const [ingredients, setIngredients] = useState<{ matiere_id: string; qte: string }[]>(
    menu ? recettes.filter((r) => r.menu_id === menu.id).map((r) => ({ matiere_id: r.matiere_id, qte: String(r.qte_necessaire) })) : []
  );
  const [saving, setSaving] = useState(false);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxW = 800, maxH = 800;
        let { width, height } = img;
        if (width > height) {
          if (width > maxW) { height = (height * maxW) / width; width = maxW; }
        } else {
          if (height > maxH) { width = (width * maxH) / height; height = maxH; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        setImageUrl(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const addIngredient = () => {
    if (matieres.length === 0) return;
    setIngredients([...ingredients, { matiere_id: matieres[0].id, qte: '0.1' }]);
  };

  const removeIngredient = (idx: number) => {
    setIngredients(ingredients.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!nom || !prix) return;
    setSaving(true);
    const payload = { nom, prix: parseFloat(prix), categorie, image_url, disponible };
    let menuId = menu?.id;

    if (menu) {
      await supabase.from('menu').update(payload).eq('id', menu.id);
      await supabase.from('recette').delete().eq('menu_id', menu.id);
    } else {
      const { data } = await supabase.from('menu').insert(payload).select().single();
      menuId = data?.id;
    }

    if (menuId && ingredients.length > 0) {
      const recetteRows = ingredients
        .filter((i) => i.matiere_id && parseFloat(i.qte) > 0)
        .map((i) => ({ menu_id: menuId, matiere_id: i.matiere_id, qte_necessaire: parseFloat(i.qte) }));
      if (recetteRows.length > 0) {
        await supabase.from('recette').insert(recetteRows);
      }
    }

    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#1A1A1A] rounded-2xl w-full max-w-lg my-8 border border-gray-800">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h3 className="text-white font-semibold text-lg">{menu ? 'Modifier le plat' : 'Nouveau plat'}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Nom du plat</label>
            <input
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="w-full bg-[#0A0A0A] text-white rounded-xl py-2.5 px-3 border border-gray-700 focus:border-[#FF6B00] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Prix (DH)</label>
              <input
                type="number"
                value={prix}
                onChange={(e) => setPrix(e.target.value)}
                className="w-full bg-[#0A0A0A] text-white rounded-xl py-2.5 px-3 border border-gray-700 focus:border-[#FF6B00] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Catégorie</label>
              <select
                value={categorie}
                onChange={(e) => setCategorie(e.target.value)}
                className="w-full bg-[#0A0A0A] text-white rounded-xl py-2.5 px-3 border border-gray-700 focus:border-[#FF6B00] focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.nom}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Image</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 rounded-xl cursor-pointer transition-colors">
                <ImageIcon className="w-4 h-4" />
                <span className="text-sm">Choisir image</span>
                <input type="file" accept="image/*" onChange={handleImage} className="hidden" />
              </label>
              {image_url && (
                <div className="relative">
                  <img src={image_url} alt="preview" className="w-14 h-14 rounded-lg object-cover" />
                  <button
                    onClick={() => setImageUrl('')}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm text-gray-400 mb-1.5">
              <input
                type="checkbox"
                checked={disponible}
                onChange={(e) => setDisponible(e.target.checked)}
                className="w-4 h-4 accent-[#FF6B00]"
              />
              Disponible à la vente
            </label>
          </div>

          <div className="border-t border-gray-800 pt-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm text-gray-400 font-medium">Recette / Ingrédients</label>
              <button
                onClick={addIngredient}
                className="flex items-center gap-1 text-[#FF6B00] text-sm font-medium hover:opacity-80"
              >
                <Plus className="w-4 h-4" /> Ajouter
              </button>
            </div>
            <div className="space-y-2">
              {ingredients.map((ing, idx) => (
                <div key={idx} className="flex gap-2">
                  <select
                    value={ing.matiere_id}
                    onChange={(e) => {
                      const next = [...ingredients];
                      next[idx].matiere_id = e.target.value;
                      setIngredients(next);
                    }}
                    className="flex-1 bg-[#0A0A0A] text-white rounded-lg py-2 px-3 border border-gray-700 focus:border-[#FF6B00] focus:outline-none text-sm"
                  >
                    {matieres.map((mp) => (
                      <option key={mp.id} value={mp.id}>{mp.nom} ({mp.unite})</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    value={ing.qte}
                    onChange={(e) => {
                      const next = [...ingredients];
                      next[idx].qte = e.target.value;
                      setIngredients(next);
                    }}
                    className="w-20 bg-[#0A0A0A] text-white rounded-lg py-2 px-3 border border-gray-700 focus:border-[#FF6B00] focus:outline-none text-sm"
                  />
                  <button
                    onClick={() => removeIngredient(idx)}
                    className="p-2 rounded-lg bg-red-950 text-red-400 hover:bg-red-900"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {ingredients.length === 0 && (
                <p className="text-gray-600 text-sm">Aucun ingrédient. Cliquez sur Ajouter.</p>
              )}
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-gray-800 flex gap-3">
          <button onClick={onClose} className="flex-1 bg-gray-800 text-white py-3 rounded-xl font-medium hover:bg-gray-700">
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !nom || !prix}
            className="flex-1 bg-[#FF6B00] text-white py-3 rounded-xl font-medium hover:bg-[#FF7A1A] disabled:opacity-50"
          >
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ STOCK ============
function StockTab() {
  const [matieres, setMatieres] = useState<MatierePremiere[]>([]);
  const [recettes, setRecettes] = useState<Recette[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [{ data: mp }, { data: r }, { data: m }] = await Promise.all([
        supabase.from('matiere_premiere').select('*').order('nom'),
        supabase.from('recette').select('*'),
        supabase.from('menu').select('*'),
      ]);
      setMatieres(mp || []);
      setRecettes(r || []);
      setMenus(m || []);
      setLoading(false);
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white">État du Stock</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {matieres.map((mp) => {
          const isRupture = mp.quantite <= 0;
          const isLow = mp.quantite > 0 && mp.quantite <= mp.seuil_alerte;
          const pct = Math.min(100, (mp.quantite / (mp.seuil_alerte * 3)) * 100);

          const usedInMenus = recettes
            .filter((r) => r.matiere_id === mp.id)
            .map((r) => menus.find((m) => m.id === r.menu_id))
            .filter(Boolean);

          return (
            <div
              key={mp.id}
              className={`bg-[#1A1A1A] rounded-2xl p-4 border ${
                isRupture ? 'border-red-600' : isLow ? 'border-[#FF6B00]' : 'border-gray-800'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-white font-semibold">{mp.nom}</h4>
                  <p className="text-gray-500 text-xs">{mp.unite}</p>
                </div>
                {isRupture && (
                  <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-600 text-white text-xs font-bold">
                    <AlertTriangle className="w-3 h-3" /> RUPTURE
                  </span>
                )}
                {isLow && !isRupture && (
                  <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#FF6B00]/20 text-[#FF6B00] text-xs font-medium">
                    <AlertTriangle className="w-3 h-3" /> Faible
                  </span>
                )}
              </div>

              <div className="mb-2">
                <div className="flex items-baseline gap-1">
                  <span className={`text-2xl font-bold ${isRupture ? 'text-red-400' : 'text-white'}`}>
                    {Number(mp.quantite).toFixed(2)}
                  </span>
                  <span className="text-gray-500 text-sm">{mp.unite}</span>
                </div>
                <p className="text-gray-600 text-xs">Seuil: {mp.seuil_alerte} {mp.unite}</p>
              </div>

              <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full transition-all ${
                    isRupture ? 'bg-red-600' : isLow ? 'bg-[#FF6B00]' : 'bg-green-600'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              {usedInMenus.length > 0 && (
                <div className="text-xs text-gray-500">
                  Utilisé dans: {usedInMenus.map((m) => m!.nom).join(', ')}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============ COMMANDES ============
function CommandesTab() {
  const [commandes, setCommandes] = useState<(Commande & { items?: CommandeItem[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Tous');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: cmds } = await supabase
        .from('commandes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (cmds && cmds.length > 0) {
        const ids = cmds.map((c) => c.id);
        const { data: items } = await supabase
          .from('commande_items')
          .select('*')
          .in('commande_id', ids);
        const itemsMap: Record<string, CommandeItem[]> = {};
        (items || []).forEach((it) => {
          (itemsMap[it.commande_id] = itemsMap[it.commande_id] || []).push(it);
        });
        setCommandes(cmds.map((c) => ({ ...c, items: itemsMap[c.id] || [] })));
      } else {
        setCommandes([]);
      }
      setLoading(false);
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  const filters = ['Tous', 'en_attente', 'en_preparation', 'pret', 'paye'];
  const filtered = filter === 'Tous' ? commandes : commandes.filter((c) => c.statut === filter);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white">Historique des Commandes</h2>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f ? 'bg-[#FF6B00] text-white' : 'bg-[#1A1A1A] text-gray-400 hover:text-white'
            }`}
          >
            {f === 'Tous' ? 'Tous' : f === 'en_attente' ? 'En attente' : f === 'en_preparation' ? 'En préparation' : f === 'pret' ? 'Prêt' : 'Payé'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-8">Aucune commande</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <div key={c.id} className="bg-[#1A1A1A] rounded-2xl border border-gray-800 overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {expanded === c.id ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                  <div className="text-left">
                    <div className="text-white font-medium text-sm">
                      {c.serveur_nom || 'N/A'} · {new Date(c.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-gray-500 text-xs">{c.items?.length || 0} article(s)</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge statut={c.statut} />
                  <span className="text-white font-bold">{Number(c.total).toFixed(0)} DH</span>
                </div>
              </button>
              {expanded === c.id && c.items && c.items.length > 0 && (
                <div className="border-t border-gray-800 p-4 space-y-1">
                  {c.items.map((it) => (
                    <div key={it.id} className="flex justify-between text-sm">
                      <span className="text-gray-300">{it.qte}x {it.menu_nom}</span>
                      <span className="text-gray-400">{(it.qte * Number(it.prix)).toFixed(0)} DH</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ MATIERE PREMIERE ============
function MatiereTab() {
  const [matieres, setMatieres] = useState<MatierePremiere[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<MatierePremiere | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from('matiere_premiere').select('*').order('nom');
    setMatieres(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette matière première ?')) return;
    await supabase.from('recette').delete().eq('matiere_id', id);
    await supabase.from('matiere_premiere').delete().eq('id', id);
    load();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Matières Premières</h2>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-[#FF6B00] hover:bg-[#FF7A1A] text-white font-medium px-4 py-2.5 rounded-xl"
        >
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>

      <div className="space-y-2">
        {matieres.map((mp) => (
          <div key={mp.id} className="bg-[#1A1A1A] rounded-2xl p-4 border border-gray-800 flex items-center justify-between">
            <div>
              <h4 className="text-white font-semibold">{mp.nom}</h4>
              <p className="text-gray-500 text-sm">
                Stock: {Number(mp.quantite).toFixed(2)} {mp.unite} · Seuil: {mp.seuil_alerte} {mp.unite}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setEditing(mp); setShowForm(true); }}
                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(mp.id)}
                className="p-2 rounded-lg bg-red-950 hover:bg-red-900 text-red-400"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <MatiereForm
          matiere={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={load}
        />
      )}
    </div>
  );
}

function MatiereForm({ matiere, onClose, onSaved }: {
  matiere: MatierePremiere | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nom, setNom] = useState(matiere?.nom || '');
  const [quantite, setQuantite] = useState(matiere ? String(matiere.quantite) : '');
  const [unite, setUnite] = useState(matiere?.unite || 'kg');
  const [seuil, setSeuil] = useState(matiere ? String(matiere.seuil_alerte) : '5');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!nom) return;
    setSaving(true);
    const payload = { nom, quantite: parseFloat(quantite) || 0, unite, seuil_alerte: parseFloat(seuil) || 0 };
    if (matiere) {
      await supabase.from('matiere_premiere').update(payload).eq('id', matiere.id);
    } else {
      await supabase.from('matiere_premiere').insert(payload);
    }
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-[#1A1A1A] rounded-2xl w-full max-w-md border border-gray-800">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h3 className="text-white font-semibold text-lg">{matiere ? 'Modifier' : 'Nouvelle matière'}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Nom</label>
            <input
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="w-full bg-[#0A0A0A] text-white rounded-xl py-2.5 px-3 border border-gray-700 focus:border-[#FF6B00] focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Quantité</label>
              <input
                type="number"
                step="0.01"
                value={quantite}
                onChange={(e) => setQuantite(e.target.value)}
                className="w-full bg-[#0A0A0A] text-white rounded-xl py-2.5 px-3 border border-gray-700 focus:border-[#FF6B00] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Unité</label>
              <select
                value={unite}
                onChange={(e) => setUnite(e.target.value)}
                className="w-full bg-[#0A0A0A] text-white rounded-xl py-2.5 px-3 border border-gray-700 focus:border-[#FF6B00] focus:outline-none"
              >
                <option value="kg">kg</option>
                <option value="L">L</option>
                <option value="pcs">pcs</option>
                <option value="g">g</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Seuil</label>
              <input
                type="number"
                step="0.01"
                value={seuil}
                onChange={(e) => setSeuil(e.target.value)}
                className="w-full bg-[#0A0A0A] text-white rounded-xl py-2.5 px-3 border border-gray-700 focus:border-[#FF6B00] focus:outline-none"
              />
            </div>
          </div>
        </div>
        <div className="p-5 border-t border-gray-800 flex gap-3">
          <button onClick={onClose} className="flex-1 bg-gray-800 text-white py-3 rounded-xl font-medium hover:bg-gray-700">Annuler</button>
          <button
            onClick={handleSave}
            disabled={saving || !nom}
            className="flex-1 bg-[#FF6B00] text-white py-3 rounded-xl font-medium hover:bg-[#FF7A1A] disabled:opacity-50"
          >
            {saving ? '...' : 'Sauvegarder'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ CATEGORIES ============
function CategoriesTab() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    const [{ data: c }, { data: m }] = await Promise.all([
      supabase.from('categories').select('*').order('ordre'),
      supabase.from('menu').select('*'),
    ]);
    setCategories(c || []);
    setMenus(m || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (cat: Category) => {
    const count = menus.filter((m) => m.categorie === cat.nom).length;
    if (count > 0) {
      alert(`Impossible de supprimer: ${count} plat(s) utilisent cette catégorie.`);
      return;
    }
    if (!confirm('Supprimer cette catégorie ?')) return;
    await supabase.from('categories').delete().eq('id', cat.id);
    load();
  };

  const moveOrder = async (cat: Category, dir: -1 | 1) => {
    const sorted = [...categories].sort((a, b) => a.ordre - b.ordre);
    const idx = sorted.findIndex((c) => c.id === cat.id);
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= sorted.length) return;
    const target = sorted[targetIdx];
    await Promise.all([
      supabase.from('categories').update({ ordre: target.ordre }).eq('id', cat.id),
      supabase.from('categories').update({ ordre: cat.ordre }).eq('id', target.id),
    ]);
    load();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Catégories du Menu</h2>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-[#FF6B00] hover:bg-[#FF7A1A] text-white font-medium px-4 py-2.5 rounded-xl"
        >
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>

      <div className="space-y-2">
        {categories.map((cat, i) => {
          const count = menus.filter((m) => m.categorie === cat.nom).length;
          return (
            <div key={cat.id} className="bg-[#1A1A1A] rounded-2xl p-4 border border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveOrder(cat, -1)}
                    disabled={i === 0}
                    className="p-1 rounded hover:bg-gray-700 text-gray-400 disabled:opacity-20"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => moveOrder(cat, 1)}
                    disabled={i === categories.length - 1}
                    className="p-1 rounded hover:bg-gray-700 text-gray-400 disabled:opacity-20"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>
                </div>
                <div>
                  <h4 className="text-white font-semibold">{cat.label}</h4>
                  <p className="text-gray-500 text-sm">{count} plat(s) · clé: {cat.nom}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setEditing(cat); setShowForm(true); }}
                  className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(cat)}
                  className="p-2 rounded-lg bg-red-950 hover:bg-red-900 text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <CategoryForm
          category={editing}
          existingNoms={categories.map((c) => c.nom)}
          nextOrdre={categories.length + 1}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={load}
        />
      )}
    </div>
  );
}

function CategoryForm({ category, existingNoms, nextOrdre, onClose, onSaved }: {
  category: Category | null;
  existingNoms: string[];
  nextOrdre: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [label, setLabel] = useState(category?.label || '');
  const [nom, setNom] = useState(category?.nom || '');
  const [ordre, setOrdre] = useState(category ? String(category.ordre) : String(nextOrdre));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!label || !nom) return;
    const key = nom.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    if (!category && existingNoms.includes(key)) {
      alert('Une catégorie avec ce nom existe déjà.');
      return;
    }
    setSaving(true);
    const payload = { nom: key, label: label.trim(), ordre: parseInt(ordre) || 1 };
    if (category) {
      await supabase.from('categories').update({ label: payload.label, ordre: payload.ordre }).eq('id', category.id);
    } else {
      await supabase.from('categories').insert(payload);
    }
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-[#1A1A1A] rounded-2xl w-full max-w-md border border-gray-800">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h3 className="text-white font-semibold text-lg">{category ? 'Modifier catégorie' : 'Nouvelle catégorie'}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Nom affiché</label>
            <input
              value={label}
              onChange={(e) => {
                setLabel(e.target.value);
                if (!category) setNom(e.target.value);
              }}
              placeholder="ex: Pizzas, Salades..."
              className="w-full bg-[#0A0A0A] text-white rounded-xl py-2.5 px-3 border border-gray-700 focus:border-[#FF6B00] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Clé technique</label>
            <input
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              disabled={!!category}
              placeholder="auto-généré"
              className="w-full bg-[#0A0A0A] text-white rounded-xl py-2.5 px-3 border border-gray-700 focus:border-[#FF6B00] focus:outline-none disabled:opacity-50"
            />
            <p className="text-gray-600 text-xs mt-1">Utilisé en interne. Non modifiable après création.</p>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Ordre d'affichage</label>
            <input
              type="number"
              value={ordre}
              onChange={(e) => setOrdre(e.target.value)}
              className="w-full bg-[#0A0A0A] text-white rounded-xl py-2.5 px-3 border border-gray-700 focus:border-[#FF6B00] focus:outline-none"
            />
          </div>
        </div>
        <div className="p-5 border-t border-gray-800 flex gap-3">
          <button onClick={onClose} className="flex-1 bg-gray-800 text-white py-3 rounded-xl font-medium hover:bg-gray-700">Annuler</button>
          <button
            onClick={handleSave}
            disabled={saving || !label}
            className="flex-1 bg-[#FF6B00] text-white py-3 rounded-xl font-medium hover:bg-[#FF7A1A] disabled:opacity-50"
          >
            {saving ? '...' : 'Sauvegarder'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ UTILISATEURS ============
function UtilisateursTab() {
  const [users, setUsers] = useState<Utilisateur[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Utilisateur | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from('utilisateurs').select('*').order('nom');
    setUsers(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (u: Utilisateur) => {
    if (users.length <= 1) {
      alert('Impossible de supprimer le dernier utilisateur.');
      return;
    }
    if (!confirm(`Supprimer l'utilisateur "${u.nom}" ?`)) return;
    const err = await adminUsers({ action: 'delete', id: u.id });
    if (err) alert(err);
    load();
  };

  const toggleActif = async (u: Utilisateur) => {
    const err = await adminUsers({ action: 'update', id: u.id, actif: !u.actif });
    if (err) alert(err);
    load();
  };

  const roleLabels: Record<string, string> = {
    admin: 'Administrateur',
    serveur: 'Serveur',
    cuisine: 'Cuisine',
    caisse: 'Caisse',
  };
  const roleColors: Record<string, string> = {
    admin: 'bg-orange-900/40 text-orange-300',
    serveur: 'bg-blue-900/40 text-blue-300',
    cuisine: 'bg-green-900/40 text-green-300',
    caisse: 'bg-purple-900/40 text-purple-300',
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Gestion des Utilisateurs</h2>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-[#FF6B00] hover:bg-[#FF7A1A] text-white font-medium px-4 py-2.5 rounded-xl"
        >
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>

      <div className="space-y-2">
        {users.map((u) => (
          <div key={u.id} className="bg-[#1A1A1A] rounded-2xl p-4 border border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${u.actif ? 'bg-[#FF6B00]/20 text-[#FF6B00]' : 'bg-gray-800 text-gray-600'}`}>
                {u.nom.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-white font-semibold">{u.nom}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[u.role] || 'bg-gray-800 text-gray-400'}`}>
                    {roleLabels[u.role] || u.role}
                  </span>
                  {!u.actif && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-900 text-red-300">Désactivé</span>
                  )}
                </div>
                <p className="text-gray-500 text-sm">Identifiant : {u.identifiant}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => toggleActif(u)}
                className={`px-3 py-2 rounded-lg text-xs font-medium ${u.actif ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-green-900 text-green-300 hover:bg-green-800'}`}
              >
                {u.actif ? 'Désactiver' : 'Activer'}
              </button>
              <button
                onClick={() => { setEditing(u); setShowForm(true); }}
                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(u)}
                className="p-2 rounded-lg bg-red-950 hover:bg-red-900 text-red-400"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <UtilisateurForm
          user={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={load}
        />
      )}
    </div>
  );
}

function UtilisateurForm({ user, onClose, onSaved }: {
  user: Utilisateur | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nom, setNom] = useState(user?.nom || '');
  const [identifiant, setIdentifiant] = useState(user?.identifiant || '');
  const [code, setCode] = useState('');
  const [role, setRole] = useState(user?.role || 'serveur');
  const [actif, setActif] = useState(user?.actif ?? true);
  const [saving, setSaving] = useState(false);

  const canSave = user ? !!nom.trim() : !!nom.trim() && !!identifiant.trim() && code.length >= 6;

  const handleSave = async () => {
    if (!canSave) return;
    if (code && code.length < 6) {
      alert('Le code doit contenir au moins 6 caractères.');
      return;
    }
    setSaving(true);
    const err = user
      ? await adminUsers({ action: 'update', id: user.id, nom: nom.trim(), role, actif, ...(code ? { code } : {}) })
      : await adminUsers({ action: 'create', nom: nom.trim(), identifiant: identifiant.trim(), code, role, actif });
    setSaving(false);
    if (err) {
      alert(err);
      return;
    }
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-[#1A1A1A] rounded-2xl w-full max-w-md border border-gray-800">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h3 className="text-white font-semibold text-lg">{user ? 'Modifier utilisateur' : 'Nouvel utilisateur'}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Nom</label>
            <input
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="ex: Ahmed, Fatima..."
              className="w-full bg-[#0A0A0A] text-white rounded-xl py-2.5 px-3 border border-gray-700 focus:border-[#FF6B00] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Identifiant de connexion</label>
            <input
              value={identifiant}
              onChange={(e) => setIdentifiant(e.target.value.toLowerCase())}
              disabled={!!user}
              autoCapitalize="none"
              placeholder="ex: ahmed"
              className="w-full bg-[#0A0A0A] text-white rounded-xl py-2.5 px-3 border border-gray-700 focus:border-[#FF6B00] focus:outline-none disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">
              {user ? "Nouveau code d'accès (laisser vide pour ne pas changer)" : "Code d'accès (6 caractères minimum)"}
            </label>
            <input
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoComplete="new-password"
              placeholder="••••••"
              className="w-full bg-[#0A0A0A] text-white rounded-xl py-2.5 px-3 border border-gray-700 focus:border-[#FF6B00] focus:outline-none font-mono tracking-widest"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Rôle</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-[#0A0A0A] text-white rounded-xl py-2.5 px-3 border border-gray-700 focus:border-[#FF6B00] focus:outline-none"
            >
              <option value="admin">Administrateur</option>
              <option value="serveur">Serveur</option>
              <option value="cuisine">Cuisine</option>
              <option value="caisse">Caisse</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-400">
            <input
              type="checkbox"
              checked={actif}
              onChange={(e) => setActif(e.target.checked)}
              className="w-4 h-4 accent-[#FF6B00]"
            />
            Compte actif
          </label>
        </div>
        <div className="p-5 border-t border-gray-800 flex gap-3">
          <button onClick={onClose} className="flex-1 bg-gray-800 text-white py-3 rounded-xl font-medium hover:bg-gray-700">Annuler</button>
          <button
            onClick={handleSave}
            disabled={saving || !canSave}
            className="flex-1 bg-[#FF6B00] text-white py-3 rounded-xl font-medium hover:bg-[#FF7A1A] disabled:opacity-50"
          >
            {saving ? '...' : 'Sauvegarder'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ RAPPORTS ============
function RapportsTab() {
  const [commandes, setCommandes] = useState<(Commande & { items?: CommandeItem[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'jour' | 'mois'>('jour');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));

  const load = useCallback(async () => {
    let query = supabase.from('commandes').select('*').order('created_at', { ascending: false });
    if (view === 'jour') {
      query = query.gte('created_at', selectedDate + 'T00:00:00').lte('created_at', selectedDate + 'T23:59:59');
    } else {
      query = query.gte('created_at', selectedMonth + '-01T00:00:00').lte('created_at', selectedMonth + '-31T23:59:59');
    }
    const { data: cmds } = await query;

    if (cmds && cmds.length > 0) {
      const ids = cmds.map((c) => c.id);
      const { data: items } = await supabase.from('commande_items').select('*').in('commande_id', ids);
      const itemsMap: Record<string, CommandeItem[]> = {};
      (items || []).forEach((it) => {
        (itemsMap[it.commande_id] = itemsMap[it.commande_id] || []).push(it);
      });
      setCommandes(cmds.map((c) => ({ ...c, items: itemsMap[c.id] || [] })));
    } else {
      setCommandes([]);
    }
    setLoading(false);
  }, [view, selectedDate, selectedMonth]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const payedCmds = commandes.filter((c) => c.statut === 'paye');
  const totalPaye = payedCmds.reduce((s, c) => s + Number(c.total), 0);
  const totalGeneral = commandes.reduce((s, c) => s + Number(c.total), 0);

  const byServer: Record<string, { count: number; total: number }> = {};
  payedCmds.forEach((c) => {
    const name = c.serveur_nom || 'N/A';
    if (!byServer[name]) byServer[name] = { count: 0, total: 0 };
    byServer[name].count++;
    byServer[name].total += Number(c.total);
  });

  const platCounts: Record<string, { count: number; revenue: number }> = {};
  payedCmds.forEach((c) => {
    c.items?.forEach((it) => {
      if (!platCounts[it.menu_nom]) platCounts[it.menu_nom] = { count: 0, revenue: 0 };
      platCounts[it.menu_nom].count += it.qte;
      platCounts[it.menu_nom].revenue += it.qte * Number(it.prix);
    });
  });
  const topPlats = Object.entries(platCounts).sort((a, b) => b[1].revenue - a[1].revenue);

  const byDay: Record<string, { count: number; total: number }> = {};
  payedCmds.forEach((c) => {
    const day = new Date(c.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    if (!byDay[day]) byDay[day] = { count: 0, total: 0 };
    byDay[day].count++;
    byDay[day].total += Number(c.total);
  });

  if (loading) return <LoadingSpinner />;

  const printReport = () => {
    const period = view === 'jour' ? `Journee du ${selectedDate}` : `Mois de ${selectedMonth}`;
    const w = window.open('', '_blank', 'width=500,height=700');
    if (!w) return;
    w.document.write(`
      <html><head><title>Recap ${period}</title>
      <style>
        * { font-family: 'Courier New', monospace; }
        body { width: 400px; margin: 0 auto; padding: 15px; }
        h1 { text-align: center; font-size: 18px; margin: 5px 0; }
        h2 { font-size: 14px; margin: 15px 0 5px; border-bottom: 1px solid #000; padding-bottom: 3px; }
        .info { text-align: center; font-size: 12px; margin: 3px 0; }
        hr { border: 1px dashed #000; margin: 8px 0; }
        table { width: 100%; font-size: 12px; border-collapse: collapse; }
        td { padding: 3px 5px; }
        .total { font-size: 16px; font-weight: bold; display: flex; justify-content: space-between; margin-top: 5px; }
      </style></head><body>
      <h1>MARSILIA FOOD</h1>
      <div class="info">Recap ${view === 'jour' ? 'journalier' : 'mensuel'}</div>
      <div class="info">${period}</div>
      <hr>
      <div class="total"><span>Total encaisse:</span><span>${totalPaye.toFixed(0)} DH</span></div>
      <div class="total"><span>Total general:</span><span>${totalGeneral.toFixed(0)} DH</span></div>
      <div class="info">${payedCmds.length} commande(s) payee(s)</div>
      <hr>
      <h2>Par serveur</h2>
      <table>
        ${Object.entries(byServer).sort((a, b) => b[1].total - a[1].total).map(([n, i]) => `<tr><td>${n}</td><td>${i.count} cmd</td><td style="text-align:right">${i.total.toFixed(0)} DH</td></tr>`).join('')}
      </table>
      <h2>Top plats</h2>
      <table>
        ${topPlats.map(([n, i]) => `<tr><td>${n}</td><td>${i.count}x</td><td style="text-align:right">${i.revenue.toFixed(0)} DH</td></tr>`).join('')}
      </table>
      ${view === 'mois' && Object.keys(byDay).length > 0 ? `
      <h2>Par jour</h2>
      <table>
        ${Object.entries(byDay).sort().map(([d, i]) => `<tr><td>${d}</td><td>${i.count} cmd</td><td style="text-align:right">${i.total.toFixed(0)} DH</td></tr>`).join('')}
      </table>` : ''}
      <hr>
      <div class="info">Imprime le ${new Date().toLocaleString('fr-FR')}</div>
      </body></html>
    `);
    w.document.close();
    w.print();
    setTimeout(() => w.close(), 500);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Rapports</h2>
        <button
          onClick={printReport}
          disabled={payedCmds.length === 0}
          className="flex items-center gap-2 bg-[#FF6B00] hover:bg-[#FF7A1A] text-white font-medium px-4 py-2.5 rounded-xl disabled:opacity-50"
        >
          <Printer className="w-4 h-4" /> Imprimer
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setView('jour')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium ${view === 'jour' ? 'bg-[#FF6B00] text-white' : 'bg-[#1A1A1A] text-gray-400'}`}
        >
          <Calendar className="w-4 h-4" /> Journalier
        </button>
        <button
          onClick={() => setView('mois')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium ${view === 'mois' ? 'bg-[#FF6B00] text-white' : 'bg-[#1A1A1A] text-gray-400'}`}
        >
          <Calendar className="w-4 h-4" /> Mensuel
        </button>
      </div>

      <div>
        {view === 'jour' ? (
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-[#1A1A1A] text-white rounded-xl py-2.5 px-3 border border-gray-800 focus:border-[#FF6B00] focus:outline-none"
          />
        ) : (
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-[#1A1A1A] text-white rounded-xl py-2.5 px-3 border border-gray-800 focus:border-[#FF6B00] focus:outline-none"
          />
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={DollarSign} label="Total encaissé" value={`${totalPaye.toFixed(0)} DH`} color="text-green-400" bg="bg-green-950/30" />
        <StatCard icon={TrendingUp} label="Total général" value={`${totalGeneral.toFixed(0)} DH`} color="text-[#FF6B00]" bg="bg-orange-950/30" />
        <StatCard icon={ShoppingBag} label="Commandes payées" value={payedCmds.length.toString()} color="text-blue-400" bg="bg-blue-950/30" />
        <StatCard icon={TrendingUp} label="Panier moyen" value={payedCmds.length > 0 ? `${(totalPaye / payedCmds.length).toFixed(0)} DH` : '0 DH'} color="text-purple-400" bg="bg-purple-950/30" />
      </div>

      <div className="bg-[#1A1A1A] rounded-2xl p-5 border border-gray-800">
        <h3 className="text-white font-semibold mb-4">Par serveur</h3>
        {Object.keys(byServer).length === 0 ? (
          <p className="text-gray-500 text-sm">Aucune donnée</p>
        ) : (
          <div className="space-y-2">
            {Object.entries(byServer).sort((a, b) => b[1].total - a[1].total).map(([name, info]) => (
              <div key={name} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                <div>
                  <span className="text-white text-sm font-medium">{name}</span>
                  <span className="text-gray-500 text-xs ml-2">{info.count} cmd</span>
                </div>
                <span className="text-green-400 font-semibold">{info.total.toFixed(0)} DH</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-[#1A1A1A] rounded-2xl p-5 border border-gray-800">
        <h3 className="text-white font-semibold mb-4">Top plats vendus</h3>
        {topPlats.length === 0 ? (
          <p className="text-gray-500 text-sm">Aucune vente</p>
        ) : (
          <div className="space-y-2">
            {topPlats.map(([nom, info], i) => (
              <div key={nom} className="flex items-center gap-3 py-2 border-b border-gray-800 last:border-0">
                <span className="w-6 h-6 rounded-full bg-[#FF6B00]/20 text-[#FF6B00] flex items-center justify-center text-xs font-bold">{i + 1}</span>
                <div className="flex-1">
                  <span className="text-white text-sm">{nom}</span>
                  <span className="text-gray-500 text-xs ml-2">{info.count} vendus</span>
                </div>
                <span className="text-green-400 font-semibold text-sm">{info.revenue.toFixed(0)} DH</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {view === 'mois' && Object.keys(byDay).length > 0 && (
        <div className="bg-[#1A1A1A] rounded-2xl p-5 border border-gray-800">
          <h3 className="text-white font-semibold mb-4">Récap par jour</h3>
          <div className="space-y-2">
            {Object.entries(byDay).sort().map(([day, info]) => (
              <div key={day} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                <span className="text-white text-sm font-medium">{day}</span>
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 text-xs">{info.count} cmd</span>
                  <span className="text-green-400 font-semibold">{info.total.toFixed(0)} DH</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
