// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Plus, Minus, Send, Image as ImageIcon } from 'lucide-react';

export default function Serveur({ serveurNom }: { serveurNom: string }) {
  const [view, setView] = useState<'tables' | 'commande'>('tables');
  const [selectedTable, setSelectedTable] = useState<any>(null);
  if (view === 'commande' && selectedTable) return <CommandeView table={selectedTable} serveurNom={serveurNom} onBack={() => setView('tables')} />;
  return <TablesView onSelectTable={(t) => { setSelectedTable(t); setView('commande'); }} />;
}

function TablesView({ onSelectTable }: { onSelectTable: (t: any) => void }) {
  const [tables, setTables] = useState<any[]>([]);
  const [commandes, setCommandes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    const [{ data: t }, { data: c }] = await Promise.all([
      supabase.from('tables').select('*').order('numero'),
      supabase.from('commandes').select('*').in('statut', ['en_attente', 'en_preparation', 'pret']),
    ]);
    setTables(t || []); setCommandes(c || []); setLoading(false);
  }, []);
  useEffect(() => { load(); const i = setInterval(load, 3000); return () => clearInterval(i); }, [load]);
  const getStatus = (id: string) => {
    const cmds = commandes.filter((c) => c.table_id === id);
    if (cmds.some((c) => c.statut === 'pret')) return 'pret';
    if (cmds.length > 0) return 'en_cours';
    return 'libre';
  };
  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin" /></div>;
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-xl font-bold text-white mb-4">Tables</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {tables.map((t) => {
          const s = getStatus(t.id);
          return <button key={t.id} onClick={() => onSelectTable(t)} className={`aspect-square rounded-2xl flex flex-col items-center justify-center border-2 ${s==='pret'?'bg-green-900/40 border-green-500':s==='en_cours'?'bg-blue-950/40 border-blue-600':'bg-[#1A1A1A] border-gray-800'}`}><div className="text-3xl font-bold text-white">{t.numero}</div><div className="text-xs mt-1 text-gray-500">{s}</div></button>
        })}
      </div>
    </div>
  );
}

function CommandeView({ table, serveurNom, onBack }: { table: any; serveurNom: string; onBack: () => void }) {
  const [menus, setMenus] = useState<any[]>([]);
  const [matieres, setMatieres] = useState<any[]>([]);
  const [recettes, setRecettes] = useState<any[]>([]);
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Record<string, number>>({});
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
  }, []);
  useEffect(() => { load(); }, [load]);

  const getStock = (id: string) => {
    const mp: any = matieres.find((x: any) => x.id === id);
    if (!mp) return 0;
    return Number(mp.quantite?? mp.quantite_stock?? mp.stock?? 0);
  };

  const checkRupture = (menuId: string, addQte = 1) => {
    const recs = recettes.filter((r: any) => r.menu_id === menuId);
    if (recs.length === 0) return null;
    for (const r of recs) {
      const stock = getStock(r.matiere_id);
      let inCart = 0;
      for (const [mid, q] of Object.entries(cart)) {
        const rr: any = recettes.find((x: any) => x.menu_id === mid && x.matiere_id === r.matiere_id);
        if (rr) inCart += Number(rr.qte_necessaire?? 0) * q;
      }
      const need = Number(r.qte_necessaire?? 0) * addQte;
      const rest = stock - inCart;
      if (addQte === 0) {
        if (rest < 0.001) {
          const mp: any = matieres.find((x: any) => x.id === r.matiere_id);
          return { nom: mp?.nom, restant: rest };
        }
      } else {
        if (rest < need - 0.001) {
          const mp: any = matieres.find((x: any) => x.id === r.matiere_id);
          return { nom: mp?.nom, restant: rest };
        }
      }
    }
    return null;
  };

  const catList = ['Tous',...dbCategories.map((c: any) => c.nom)];
  const catLabel = (n: string) => dbCategories.find((c: any) => c.nom === n)?.label || n;
  const filtered = menus.filter((m) => filter === 'Tous'? true : m.categorie === filter);
  const grouped = filtered.reduce<Record<string, any[]>>((a, m) => { (a[m.categorie] = a[m.categorie] || []).push(m); return a; }, {});
  const cartItems = Object.entries(cart).filter(([, q]) => q > 0);
  const cartTotal = cartItems.reduce((s, [id, q]) => { const mm = menus.find((x) => x.id === id); return s + (mm? Number(mm.prix) * q : 0); }, 0);

  const add = (id: string) => {
    const rupt = checkRupture(id, 1);
    if (rupt) { alert(`Stock na9es! ${rupt.nom} ba9i ${rupt.restant.toFixed(2)}`); return; }
    setCart((c) => ({...c, [id]: (c[id] || 0) + 1 }));
  };
  const remove = (id: string) => setCart((c) => { const n = {...c }; if (n[id] > 1) n[id]--; else delete n[id]; return n; });

  const send = async () => {
    if (cartItems.length === 0) return;
    setSending(true);
    try {
      // 1. Verification akhir
      for (const [menuId, qte] of cartItems) {
        const rupt = checkRupture(menuId, qte);
        if (rupt) { alert(`Stock na9es! ${rupt.nom} ba9i ${rupt.restant.toFixed(2)}`); setSending(false); return; }
      }
      // 2. Dawaz commande
      const { data: cmd } = await supabase.from('commandes').insert({ table_id: table.id, serveur_nom: serveurNom, statut: 'en_attente', total: cartTotal }).select().single();
      if (cmd) {
        const items = cartItems.map(([menu_id, qte]) => { const
