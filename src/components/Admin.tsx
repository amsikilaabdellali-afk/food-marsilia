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
              <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap ${tab === t.id? 'bg-[#FF6B00] text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
                <Icon className="w-4 h-4" />{t.label}
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

function DashboardTab() {
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [items, setItems] = useState<CommandeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viderLoading, setViderLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data: cmds } = await supabase.from('commandes').select('*').gte('created_at', today + 'T00:00:00').order('created_at', { ascending: false });
      setCommandes(cmds || []);
      if (cmds && cmds.length > 0) {
        const ids = cmds.map((c) => c.id);
        const { data: its } = await supabase.from('commande_items').select('*').in('commande_id', ids);
        setItems(its || []);
      }
      setLoading(false);
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleViderCommandes = async () => {
    if (!confirm("⚠️ Wach bghiti t-mse7 GA3 les commandes? Tables kamlin ghadi y-wliw LIBRE")) return;
    setViderLoading(true);
    try {
      await supabase.from('commande_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('commandes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('tables').update({ statut: 'libre' } as any).neq('id', '00000000-0000-0000-0000-000000000000');
      alert("✅ T-mes7o ga3!");
      window.location.reload();
    } catch (e: any) { alert(e.message); }
    setViderLoading(false);
  };

  if (loading) return <LoadingSpinner />;
  const caTotal = commandes.reduce((s, c) => s + Number(c.total), 0);
  const caPaye = commandes.filter((c) => c.statut === 'paye').reduce((s, c) => s + Number(c.total), 0);
  const nbCmd = commandes.length;
  const panierMoy = nbCmd > 0? caTotal / nbCmd : 0;
  const platCounts: Record<string, { count: number; revenue: number }> = {};
  items.forEach((it) => {
    if (!platCounts[it.menu_nom]) platCounts[it.menu_nom] = { count: 0, revenue: 0 };
    platCounts[it.menu_nom].count += it.qte;
    platCounts[it.menu_nom].revenue += it.qte * Number(it.prix);
  });
  const topPlats = Object.entries(platCounts).sort((a, b) => b[1].count - a[1].count).slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-white">Dashboard - Aujourd'hui</h2>
        <button onClick={handleViderCommandes} disabled={viderLoading} className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
          <Trash2 className="w-4 h-4" />{viderLoading? "..." : "Vider Commandes"}
        </button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={DollarSign} label="CA du jour" value={`${caTotal.toFixed(0)} DH`} color="text-green-400" bg="bg-green-950/30" />
        <StatCard icon={TrendingUp} label="CA encaissé" value={`${caPaye.toFixed(0)} DH`} color="text-[#FF6B00]" bg="bg-orange-950/30" />
        <StatCard icon={ShoppingBag} label="Commandes" value={nbCmd.toString()} color="text-blue-400" bg="bg-blue-950/30" />
        <StatCard icon={TrendingUp} label="Panier moyen" value={`${panierMoy.toFixed(0)} DH`} color="text-purple-400" bg="bg-purple-950/30" />
      </div>
      <div className="bg-[#1A1A1A] rounded-2xl p-5 border border-gray-800">
        <h3 className="text-white font-semibold mb-4">Top 5 plats</h3>
        {topPlats.length === 0? <p className="text-gray-500 text-sm">Aucune commande</p> : <div className="space-y-3">{topPlats.map(([nom, info], i) => (<div key={nom} className="flex items-center gap-3"><div className="w-7 h-7 rounded-full bg-[#FF6B00]/20 text-[#FF6B00] flex items-center justify-center text-sm font-bold">{i+1}</div><div className="flex-1"><div className="text-white text-sm font-medium">{nom}</div><div className="text-gray-500 text-xs">{info.count} vendus · {info.revenue.toFixed(0)} DH</div></div></div>))}</div>}
      </div>
      <div className="bg-[#1A1A1A] rounded-2xl p-5 border border-gray-800">
        <h3 className="text-white font-semibold mb-4">Commandes récentes</h3>
        {commandes.length === 0? <p className="text-gray-500 text-sm">Aucune commande</p> : <div className="space-y-2">{commandes.slice(0, 8).map((c) => (<div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0"><div><span className="text-white text-sm font-medium">{c.serveur_nom}</span><span className="text-gray-500 text-xs ml-2">{new Date(c.created_at).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</span></div><div className="flex items-center gap-3"><StatusBadge statut={c.statut} /><span className="text-white text-sm font-semibold">{Number(c.total).toFixed(0)} DH</span></div></div>))}</div>}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, bg }: { icon: any; label: string; value: string; color: string; bg: string }) {
  return (<div className="bg-[#1A1A1A] rounded-2xl p-4 border border-gray-800"><div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}><Icon className={`w-5 h-5 ${color}`} /></div><div className="text-white text-xl font-bold">{value}</div><div className="text-gray-500 text-xs mt-0.5">{label}</div></div>);
}
function StatusBadge({ statut }: { statut: string }) {
  const map: Record<string, { label: string; cls: string }> = { en_attente: { label: 'En attente', cls: 'bg-gray-700 text-gray-300' }, en_preparation: { label: 'En préparation', cls: 'bg-blue-900 text-blue-300' }, pret: { label: 'Prêt', cls: 'bg-green-900 text-green-300' }, paye: { label: 'Payé', cls: 'bg-green-700 text-white' } };
  const s = map[statut] || map.en_attente;
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>;
}
function LoadingSpinner() { return <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin" /></div>; }

// ---- Les autres Tabs kima homa (Menu, Stock, Commandes, Matiere, Categories, Utilisateurs, Rapports) ----
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
    const [{ data: m }, { data: mp }, { data: r }, { data: cats }] = await Promise.all([supabase.from('menu').select('*').order('categorie').order('nom'), supabase.from('matiere_premiere').select('*').order('nom'), supabase.from('recette').select('*'), supabase.from('categories').select('*').order('ordre')]);
    setMenus(m || []); setMatieres(mp || []); setRecettes(r || []); setCategories(cats || []); setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);
  const catList = ['Tous',...categories.map((c) => c.nom)];
  const catLabel = (nom: string) => categories.find((c) => c.nom === nom)?.label || nom;
  const filtered = menus.filter((m) => { if (filter!== 'Tous' && m.categorie!== filter) return false; if (search &&!m.nom.toLowerCase().includes(search.toLowerCase())) return false; return true; });
  const grouped = filtered.reduce<Record<string, Menu[]>>((acc, m) => { (acc[m.categorie] = acc[m.categorie] || []).push(m); return acc; }, {});
  const handleDelete = async (id: string) => { if (!confirm('Supprimer ce plat?')) return; await supabase.from('recette').delete().eq('menu_id', id); await supabase.from('menu').delete().eq('id', id); load(); };
  const toggleDispo = async (m: Menu) => { await supabase.from('menu').update({ disponible:!m.disponible }).eq('id', m.id); load(); };
  if (loading) return <LoadingSpinner />;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-bold text-white">Gestion du Menu</h2><button onClick={() => { setEditing(null); setShowForm(true); }} className="flex items-center gap-2 bg-[#FF6B00] text-white font-medium px-4 py-2.5 rounded-xl"><Plus className="w-4 h-4" /> Ajouter</button></div>
      <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." className="w-full bg-[#1A1A1A] text-white rounded-xl py-2.5 pl-10 pr-4 border border-gray-800" /></div>
      <div className="flex gap-2 overflow-x-auto pb-1">{catList.map((c) => (<button key={c} onClick={() => setFilter(c)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${filter === c? 'bg-[#FF6B00] text-white' : 'bg-[#1A1A1A] text-gray-400'}`}>{c === 'Tous'? 'Tous' : catLabel(c)}</button>))}</div>
      {Object.entries(grouped).map(([cat, items]) => (<div key={cat}><h3 className="text-lg font-bold text-[#FF6B00] mb-3">{catLabel(cat)}</h3><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{items.map((m) => { const recetteItems = recettes.filter((r) => r.menu_id === m.id); return (<div key={m.id} className="bg-[#1A1A1A] rounded-2xl overflow-hidden border border-gray-800"><div className="relative h-32 bg-gray-900">{m.image_url? <img src={m.image_url} alt={m.nom} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-10 h-10 text-gray-700" /></div>}<button onClick={() => toggleDispo(m)} className={`absolute top-2 right-2 px-2.5 py-1 rounded-lg text-xs font-medium ${m.disponible? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>{m.disponible? 'Disponible' : 'Indisponible'}</button></div><div className="p-3"><div className="flex items-start justify-between"><div><h4 className="text-white font-semibold text-sm">{m.nom}</h4><p className="text-[#FF6B00] font-bold">{Number(m.prix).toFixed(0)} DH</p></div><div className="flex gap-1"><button onClick={() => { setEditing(m); setShowForm(true); }} className="p-2 rounded-lg bg-gray-800 text-gray-300"><Edit3 className="w-4 h-4" /></button><button onClick={() => handleDelete(m.id)} className="p-2 rounded-lg bg-red-950 text-red-400"><Trash2 className="w-4 h-4" /></button></div></div></div></div>); })}</div></div>))}
      {showForm && <MenuForm menu={editing} matieres={matieres} recettes={recettes} categories={categories} onClose={() => { setShowForm(false); setEditing(null); }} onSaved={load} />}
    </div>
  );
}
function MenuForm({ menu, matieres, recettes, categories, onClose, onSaved }: any) {
  const [nom, setNom] = useState(menu?.nom || ''); const [prix, setPrix] = useState(menu? String(menu.prix) : ''); const [categorie, setCategorie] = useState(menu?.categorie || (categories[0]?.nom || 'Plats')); const [image_url, setImageUrl] = useState(menu?.image_url || ''); const [disponible, setDisponible] = useState(menu?.disponible?? true); const [ingredients, setIngredients] = useState<{ matiere_id: string; qte: string }[]>(menu? recettes.filter((r: any) => r.menu_id === menu.id).map((r: any) => ({ matiere_id: r.matiere_id, qte: String(r.qte_necessaire) })) : []); const [saving, setSaving] = useState(false);
  const handleImage = (e: any) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { const img = new Image(); img.onload = () => { const canvas = document.createElement('canvas'); let { width, height } = img; const maxW = 800; if (width > maxW) { height = (height * maxW) / width; width = maxW; } canvas.width = width; canvas.height = height; canvas.getContext('2d')?.drawImage(img, 0, 0, width, height); setImageUrl(canvas.toDataURL('image/jpeg', 0.8)); }; img.src = reader.result as string; }; reader.readAsDataURL(file); };
  const handleSave = async () => { if (!nom ||!prix) return; setSaving(true); const payload = { nom, prix: parseFloat(prix), categorie, image_url, disponible }; let menuId = menu?.id; if (menu) { await supabase.from('menu').update(payload).eq('id', menu.id); await supabase.from('recette').delete().eq('menu_id', menu.id); } else { const { data } = await supabase.from('menu').insert(payload).select().single(); menuId = data?.id; } if (menuId && ingredients.length > 0) { const rows = ingredients.filter((i) => i.matiere_id && parseFloat(i.qte) > 0).map((i) => ({ menu_id: menuId, matiere_id: i.matiere_id, qte_necessaire: parseFloat(i.qte) })); if (rows.length > 0) await supabase.from('recette').insert(rows); } setSaving(false); onSaved(); onClose(); };
  return (<div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto"><div className="bg-[#1A1A1A] rounded-2xl w-full max-w-lg border border-gray-800"><div className="flex items-center justify-between p-5 border-b border-gray-800"><h3 className="text-white font-semibold">{menu? 'Modifier' : 'Nouveau'}</h3><button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button></div><div className="p-5 space-y-3"><input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom" className="w-full bg-[#0A0A0A] text-white rounded-xl py-2.5 px-3 border border-gray-700" /><div className="grid grid-cols-2 gap-3"><input type="number" value={prix} onChange={(e) => setPrix(e.target.value)} placeholder="Prix" className="w-full bg-[#0A0A0A] text-white rounded-xl py-2.5 px-3 border border-gray-700" /><select value={categorie} onChange={(e) => setCategorie(e.target.value)} className="w-full bg-[#0A0A0A] text-white rounded-xl py-2.5 px-3 border border-gray-700">{categories.map((c: any) => (<option key={c.id} value={c.nom}>{c.label}</option>))}</select></div><label className="flex items-center gap-2 text-white"><input type="checkbox" checked={disponible} onChange={(e) => setDisponible(e.target.checked)} /> Disponible</label><div><label className="text-gray-400 text-sm">Image</label><input type="file" accept="image/*" onChange={handleImage} className="w-full text-gray-400" /></div><div className="border-t border-gray-800 pt-3"><div className="flex justify-between"><span className="text-gray-400 text-sm">Ingrédients</span><button onClick={() => setIngredients([...ingredients, { matiere_id: matieres[0]?.id || '', qte: '0.1' }])} className="text-[#FF6B00] text-sm flex items-center gap-1"><Plus className="w-4 h-4" /> Ajouter</button></div>{ingredients.map((ing, idx) => (<div key={idx} className="flex gap-2 mt-2"><select value={ing.matiere_id} onChange={(e) => { const n = [...ingredients]; n[idx].matiere_id = e.target.value; setIngredients(n); }} className="flex-1 bg-[#0A0A0A] text-white rounded-lg py-2 px-2 border border-gray-700 text-sm">{matieres.map((mp: any) => (<option key={mp.id} value={mp.id}>{mp.nom}</option>))}</select><input type="number" step="0.01" value={ing.qte} onChange={(e) => { const n = [...ingredients]; n[idx].qte = e.target.value; setIngredients(n); }} className="w-20 bg-[#0A0A0A] text-white rounded-lg py-2 px-2 border border-gray-700 text-sm" /><button onClick={() => setIngredients(ingredients.filter((_, i) => i!== idx))} className="p-2 bg-red-950 text-red-400 rounded-lg"><Trash2 className="w-4 h-4" /></button></div>))}</div></div><div className="p-5 border-t border-gray-800 flex gap-3"><button onClick={onClose} className="flex-1 bg-gray-800 text-white py-3 rounded-xl">Annuler</button><button onClick={handleSave} disabled={saving} className="flex-1 bg-[#FF6B00] text-white py-3 rounded-xl">{saving? '...' : 'Sauvegarder'}</button></div></div></div>);
}
function StockTab() {
  const [matieres, setMatieres] = useState<MatierePremiere[]>([]); const [loading, setLoading] = useState(true);
  useEffect(() => { const load = async () => { const { data } = await supabase.from('matiere_premiere').select('*').order('nom'); setMatieres(data || []); setLoading(false); }; load(); const i = setInterval(load, 5000); return () => clearInterval(i); }, []);
  if (loading) return <LoadingSpinner />;
  return (<div className="space-y-4"><h2 className="text-xl font-bold text-white">Stock</h2><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{matieres.map((mp) => (<div key={mp.id} className="bg-[#1A1A1A] rounded-2xl p-4 border border-gray-800"><h4 className="text-white font-semibold">{mp.nom}</h4><p className="text-gray-500 text-sm">{Number(mp.quantite).toFixed(2)} {mp.unite} - Seuil {mp.seuil_alerte}</p></div>))}</div></div>);
}
function CommandesTab() {
  const [commandes, setCommandes] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [filter, setFilter] = useState('Tous'); const [expanded, setExpanded] = useState<string | null>(null);
  useEffect(() => { const load = async () => { const { data: cmds } = await supabase.from('commandes').select('*').order('created_at', { ascending: false }).limit(100); if (cmds && cmds.length > 0) { const ids = cmds.map((c) => c.id); const { data: items } = await supabase.from('commande_items').select('*').in('commande_id', ids); const map: any = {}; (items || []).forEach((it) => { (map[it.commande_id] = map[it.commande_id] || []).push(it); }); setCommandes(cmds.
