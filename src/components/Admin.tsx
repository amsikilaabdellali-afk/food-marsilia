import { useState, useEffect, useCallback } from 'react';
import { adminUsers } from '@/lib/adminUsers';
import { supabase, type Commande, type Menu, type MatierePremiere, type Recette, type CommandeItem, type Category, type Utilisateur } from '@/lib/supabase';
import {
  LayoutDashboard, UtensilsCrossed, Package, ClipboardList, Leaf, Tags, Users, FileBarChart,
  Plus, Edit3, Trash2, X, Search, TrendingUp, DollarSign, ShoppingBag,
  AlertTriangle, Image as ImageIcon, ChevronDown, ChevronRight, ArrowUp, ArrowDown, Printer, Calendar
} from 'lucide-react';

type Tab = 'dashboard' | 'menu' | 'stock' | 'commandes' | 'matiere' | 'categories' | 'utilisateurs' | 'rapports';

// ============ HELPERS ============
const pad = (n: number) => String(n).padStart(2, '0');

// Date locale (pas UTC) au format YYYY-MM-DD
const localDate = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Début (inclus) et fin (exclue) d'une journée locale
const dayRange = (date: string) => {
  const [y, m, d] = date.split('-').map(Number);
  return {
    start: new Date(y, m - 1, d).toISOString(),
    end: new Date(y, m - 1, d + 1).toISOString(),
  };
};

// Début (inclus) et fin (exclue) d'un mois local, ym = YYYY-MM
const monthRange = (ym: string) => {
  const [y, m] = ym.split('-').map(Number);
  return {
    start: new Date(y, m - 1, 1).toISOString(),
    end: new Date(y, m, 1).toISOString(),
  };
};

// Échappe le HTML pour l'impression
const esc = (s: string) =>
  String(s ?? '').replace(/[&<>"']/g, (c) =>
    (({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>)[c])
  );

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
      const { start } = dayRange(localDate());
      const { data: cmds } = await supabase
        .from('commandes')
        .select('*')
        .gte('created_at', start)
        .order('created_at', { ascending: false });
      setCommandes(cmds || []);

      if (cmds && cmds.length > 0) {
        const ids = cmds.map((c) => c.id);
        const { data: its } = await supabase
          .from('commande_items')
          .select('*')
          .in('commande_id', ids);
        setItems(its || []);
      } else {
        setItems([]);
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
    const { error: e1 } = await supabase.from('recette').delete().eq('menu_id', id);
    if (e1) { alert(e1.message); return; }
    const { error: e2 } = await supabase.from('menu').delete().eq('id', id);
    if (e2) { alert(e2.message); return; }
    load();
  };

  const toggleDispo = async (m: Menu) => {
    const { error } = await supabase.from('menu').update({ disponible: !m.disponible }).eq('id', m.id);
    if (error) { alert(error.message); return; }
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
      const { error } = await supabase.from('menu').update(payload).eq('id', menu.id);
      if (error) { alert(error.message); setSaving(false); return; }
    } else {
      const { data, error } = await supabase.from('menu').insert(payload).select().single();
      if (error || !data) { alert(error?.message || 'Erreur'); setSaving(false); return; }
      menuId = data.id;
    }

    if (menuId) {
      await supabase.from('recette').delete().eq('menu_id', menuId);
      const rows = ingredients
        .filter((i) => i.matiere_id && parseFloat(i.qte) > 0)
        .map((i) => ({ menu_id: menuId, matiere_id: i.matiere_id, qte_necessaire: parseFloat(i.qte) }));
      if (rows.length > 0) {
        const { error } = await supabase.from('recette').insert(rows);
        if (error) alert(error.message);
      }
    }

    setSaving(f
