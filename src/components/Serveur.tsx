import { useState, useEffect, useCallback } from 'react';
import { supabase, type Menu, type MatierePremiere, type Recette, type TableResto, type Commande, type Category } from '@/lib/supabase';
import { ArrowLeft, ShoppingCart, Plus, Minus, Send, Search, UtensilsCrossed, Clock, CheckCircle2, Image as ImageIcon, Trash2 } from 'lucide-react';

export default function Serveur({ serveurNom }: { serveurNom: string }) {
  const [view, setView] = useState<'tables' | 'commande'>('tables');
  const [selectedTable, setSelectedTable] = useState<TableResto | null>(null);
  if (view === 'commande' && selectedTable) {
    return <CommandeView table={selectedTable} serveurNom={serveurNom} onBack={() => setView('tables')} />;
  }
  return <TablesView onSelectTable={(t) => { setSelectedTable(t); setView('commande'); }} />;
}

function TablesView({ onSelectTable }: { onSelectTable: (t: TableResto) => void }) {
  const [tables, setTables] = useState<TableResto[]>([]);
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    const [{ data: t }, { data: c }] = await Promise.all([
      supabase.from('tables').select('*').order('numero'),
      supabase.from('commandes').select('*').in('statut', ['en_attente', 'en_preparation', 'pret']),
    ]);
    setTables(t || []);
    setCommandes(c || []);
    setLoading(false);
  }, []);
  useEffect(() => { load(); const interval = setInterval(load, 3000); return () => clearInterval(interval); }, [load]);

  const handleVider = async () => {
    if(!confirm("T-mse7 ga3 les commandes 9odam client?")) return;
    await supabase.from('commande_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('commandes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('tables').update({ statut: 'libre' } as any).neq('id', '00000000-0000-0000-0000-000000000000');
    load();
  };

  const getTableStatus = (tableId: string) => {
    const tableCmds = commandes.filter((c) => c.table_id === tableId);
    if (tableCmds.some((c) => c.statut === 'pret')) return 'pret';
    if (tableCmds.length > 0) return 'en_cours';
    return 'libre';
  };
  if (loading) return <LoadingSpinner />;
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">Tables</h2>
        <button onClick={handleVider} className="flex items-center gap-2 bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-bold"><Trash2 className="w-4 h-4"/> Vider</button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {tables.map((t) => {
          const status = getTableStatus(t.id);
          const isPret = status === 'pret';
          const isEnCours = status === 'en_cours';
          return (
            <button key={t.id} onClick={() => onSelectTable(t)}
              className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center border-2 ${isPret? 'bg-green-900/40 border-green-500' : isEnCours? 'bg-blue-950/40 border-blue-600' : 'bg-[#1A1A1A] border-gray-800'}`}>
              <div className={`text-3xl font-bold ${isPret? 'text-green-400' : isEnCours? 'text-blue-400' : 'text-white'}`}>{t.numero}</div>
              <div className={`text-xs mt-1 ${isPret? 'text-green-400' : isEnCours? 'text-blue-400' : 'text-gray-500'}`}>{isPret? 'Prêt' : isEnCours? 'En cours' : 'Libre'}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CommandeView({ table, serveurNom, onBack }: { table: TableResto; serveurNom: string; onBack: () => void }) {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [matieres, setMatieres] = useState<MatierePremiere[]>([]);
  const [recettes, setRecettes] = useState<Recette[]>([]);
  const [dbCategories, setDbCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Tous');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    const [{ data: m }, { data: mp }, { data: r }, { data: cats }] = await Promise.all([
      supabase.from('menu').select('*').eq('disponible', true).order('categorie').order('nom'),
      supabase.from('matiere_premiere').select('*'),
      supabase.from('recette').select('*'),
      supabase.from('categories').select('*').order('ordre'),
    ]);
    setMenus(m || []); setMatieres(mp || []); setRecettes(r || []); setDbCategories(cats || []); setLoading(false);
  }, [table.id]);
  useEffect(() => { load(); }, [load]);

  const getRuptureMatiere = (menuId: string): string | null => {
    const recetteItems = (recettes as any[]).filter((r: any) => r.menu_id === menuId);
    if (recetteItems.length === 0) return null;
    for (const r of recetteItems) {
      const mp = (matieres as any[]).find((x: any) => x.id === r.matiere_id);
      if (!mp) continue;
      const stock = Number(mp.quantite_stock) || Number(mp.quantite) || 0;
      const besoin = Number(r.qte_necessaire?? r.quantite?? 0.1);
      if (stock < besoin) return mp.nom;
    }
    return null;
  };

  const catList = ['Tous',...dbCategories.map((c) => c.nom)];
  const catLabel = (nom: string) => dbCategories.find((c) => c.nom === nom)?.label || nom;
  const filtered = menus.filter((m) => {
    if (filter!== 'Tous' && m.categorie!== filter) return false;
    if (search &&!m.nom.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const grouped = filtered.reduce<Record<string, Menu[]>>((acc, m) => { (acc[m.categorie] = acc[m.categorie] || []).push(m); return acc; }, {});
  const cartItems = Object.entries(cart).filter(([, qte]) => qte > 0);
  const cartTotal = cartItems.reduce((sum, [menuId, qte]) => { const m = menus.find((x) => x.id === menuId); return sum + (m? Number(m.prix) * qte : 0); }, 0);
  const addToCart = (menuId: string) => { setCart((c) => ({...c, [menuId]: (c[menuId] || 0) + 1 })); };
  const removeFromCart = (menuId: string) => { setCart((c) => { const next = {...c }; if (next[menuId] > 1) next[menuId]--; else delete next[menuId]; return next; }); };
  const handleSend = async () => {
    if (cartItems.length === 0) return;
    setSending(true);
    try {
      const total = cartTotal;
      const { data: cmd } = await supabase.from('commandes').insert({ table_id: table.id, serveur_nom: serveurNom, statut: 'en_attente', total }).select().single();
      if (cmd) {
        const items = cartItems.map(([menuId, qte]) => {
          const m = menus.find((x) => x.id === menuId)!;
          return { commande_id: cmd.id, menu_id: menuId, menu_nom: m.nom, prix: m.prix, qte };
        });
        await supabase.from('commande_items').insert(items);
        await supabase.from('tables').update({ statut: 'en_cours' } as any).eq('id', table.id);
      }
    } catch (e: any) { console.error(e); }
    setSending(false);
    onBack();
  };
  if (loading) return <LoadingSpinner />;
  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-32">
      <div className="sticky top-0 z-30 bg-[#0A0A0A]/95 backdrop-blur border-b border-gray-800 px-4 py-3">
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          <button onClick={onBack} className="p-2 rounded-lg bg-[#1A1A1A] text-gray-300"><ArrowLeft className="w-5 h-5" /></button>
          <div><h2 className="text-white font-bold">Table {table.numero}</h2><p className="text-gray-500 text-xs">{serveurNom}</p></div>
        </div>
      </div>
      <div className="p-4 max-w-4xl mx-auto">
        <div className="flex gap-2 overflow-x-auto pb-1 mb-4">
          {catList.map((c) => (<button key={c} onClick={() => setFilter(c)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${filter === c? 'bg-[#FF6B00] text-white' : 'bg-[#1A1A1A] text-gray-400'}`}>{c === 'Tous'? 'Tous' : catLabel(c)}</button>))}
        </div>
        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} className="mb-6">
            <h3 className="text-lg font-bold text-[#FF6B00] mb-3">{catLabel(cat)}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {items.map((m) => {
                const ruptureMatiere = getRuptureMatiere(m.id); const isRupture =!!ruptureMatiere; const inCart = cart[m.id] || 0;
                return (
                  <div key={m.id} className={`bg-[#1A1A1A] rounded-2xl overflow-hidden border ${isRupture? 'border-red-700 opacity-60' : inCart > 0? 'border-[#FF6B00]' : 'border-gray-800'}`}>
                    <div className="relative h-24 bg-gray-900">
                      {m.image_url? <img src={m.image_url} alt={m.nom} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-8 h-8 text-gray-700" /></div>}
                      {inCart > 0 && <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-[#FF6B00] text-white text-xs font-bold flex items-center justify-center">{inCart}</div>}
                    </div>
                    <div className="p-2.5">
                      <h4 className="text-white text-sm font-semibold leading-tight">{m.nom}</h4>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[#FF6B00] font-bold text-sm">{Number(m.prix).toFixed(0)} DH</span>
                        {isRupture? <span className="text-red-400 text-xs">Rupture {ruptureMatiere}</span> : inCart > 0? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => removeFromCart(m.id)} className="w-6 h-6 rounded-lg bg-gray-800 text-white flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                            <span className="text-white text-sm font-bold w-5 text-center">{inCart}</span>
                            <button onClick={() => addToCart(m.id)} className="w-6 h-6 rounded-lg bg-[#FF6B00] text-white flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                          </div>
                        ) : (<button onClick={() => addToCart(m.id)} className="w-7 h-7 rounded-lg bg-[#FF6B00] text-white flex items-center justify-center"><Plus className="w-4 h-4" /></button>)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {cartItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#1A1A1A] border-t border-gray-800 p-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div><div className="text-gray-400 text-sm">{cartItems.length} article(s)</div><div className="text-white text-2xl font-bold">{cartTotal.toFixed(0)} DH</div></div>
            <button onClick={handleSend} disabled={sending} className="flex items-center gap-2 bg-[#FF6B00] text-white font-semibold px-6 py-3.5 rounded-xl disabled:opacity-50"><Send className="w-5 h-5" />{sending? 'Envoi...' : 'Envoyer'}</button>
          </div>
        </div>
      )}
    </div>
  );
}
function LoadingSpinner() { return <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin" /></div>; }
