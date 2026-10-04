// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Plus, Minus, Send, Image as ImageIcon, LogOut } from 'lucide-react';

export default function Serveur({ profil, onLogout, serveurNom }: any) {
  const name = profil?.user?.nom || serveurNom || 'Serveur';
  const [view, setView] = useState<'tables' | 'commande'>('tables');
  const [selectedTable, setSelectedTable] = useState<any>(null);
  if (view === 'commande' && selectedTable) return <CommandeView table={selectedTable} serveurNom={name} onBack={() => setView('tables')} />;
  return <TablesView onSelectTable={(t) => { setSelectedTable(t); setView('commande'); }} profil={profil} onLogout={onLogout} />;
}

function TablesView({ onSelectTable, profil, onLogout }: any) {
  const [tables, setTables] = useState<any[]>([]);
  const [commandes, setCommandes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    const [{ data: t }, { data: c }] = await Promise.all([
      supabase.from('tables').select('*').order('etage').order('numero'),
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
  const rdc = tables.filter((t:any)=>t.etage==='RDC'||!t.etage);
  const premier = tables.filter((t:any)=>t.etage==='1er');
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="bg-yellow-500 text-black p-3 flex justify-between items-center sticky top-0 z-20">
        <div className="font-black">SERVEUR: {profil?.user?.nom} ({profil?.user?.identifiant})</div>
        <button onClick={onLogout} className="bg-black text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1"><LogOut className="w-4 h-4"/>Logout</button>
      </div>
      <div className="p-4 max-w-4xl mx-auto">
        <h2 className="text-xl font-bold text-white mb-4">Tables - {tables.length}</h2>
        {rdc.length>0 && (
          <>
            <div className="flex items-center gap-2 mb-3"><div className="w-2 h-2 bg-green-500 rounded-full"></div><h3 className="font-black text-green-400 text-sm">RDC - {rdc.length} tables</h3></div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-8">
              {rdc.map((t) => {
                const s = getStatus(t.id);
                return <button key={t.id} onClick={() => onSelectTable(t)} className={`aspect-square rounded-2xl flex flex-col items-center justify-center border-2 ${s==='pret'?'bg-green-900/40 border-green-500':s==='en_cours'?'bg-blue-950/40 border-blue-600':'bg-[#1A1A1A] border-gray-800'}`}><div className="text-3xl font-bold text-white">{t.numero}</div><div className="text-[10px] text-zinc-500">RDC</div><div className="text-xs mt-1 text-gray-500">{s}</div></button>
              })}
            </div>
          </>
        )}
        {premier.length>0 && (
          <>
            <div className="flex items-center gap-2 mb-3"><div className="w-2 h-2 bg-blue-500 rounded-full"></div><h3 className="font-black text-blue-400 text-sm">1er ÉTAGE - {premier.length} tables</h3></div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {premier.map((t) => {
                const s = getStatus(t.id);
                return <button key={t.id} onClick={() => onSelectTable(t)} className={`aspect-square rounded-2xl flex flex-col items-center justify-center border-2 ${s==='pret'?'bg-green-900/40 border-green-500':s==='en_cours'?'bg-blue-900/40 border-blue-500':'bg-[#1A1A1A] border-blue-900/30'}`}><div className="text-3xl font-bold text-white">{t.numero}</div><div className="text-[10px] text-blue-400">1er</div><div className="text-xs mt-1 text-gray-500">{s}</div></button>
              })}
            </div>
          </>
        )}
        {tables.length===0 && <div className="text-center text-zinc-500 py-10">Ma kayn 7ta table - zidhom f Admin → Tables</div>}
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
    return Number(mp.quantite?? 0);
  };

  const checkRupture = (menuId: string, addQte = 1) => {
    const recs = recettes.filter((r: any) => r.menu_id === menuId);
    if (recs.length === 0) return null;
    for (let k=0;k<recs.length;k++) {
      const r = recs[k];
      const stock = getStock(r.matiere_id);
      let inCart = 0;
      const cartKeys = Object.keys(cart);
      for (let c=0;c<cartKeys.length;c++) {
        const mid = cartKeys[c];
        const q = cart[mid];
        const rr: any = recettes.find((x: any) => x.menu_id === mid && x.matiere_id === r.matiere_id);
        if (rr) inCart += Number(rr.qte_necessaire?? 0) * q;
      }
      const need = Number(r.qte_necessaire?? 0) * addQte;
      const rest = stock - inCart;
      if (rest < need - 0.001) {
        const mp: any = matieres.find((x: any) => x.id === r.matiere_id);
        return { nom: mp?.nom, restant: rest };
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
      const { data: cmd, error: cmdErr } = await supabase.from('commandes').insert({
        table_id: table.id,
        serveur_nom: serveurNom,
        statut: 'en_attente',
        total: cartTotal
      }).select().single();
      if(cmdErr){ alert('Erreur commande: '+cmdErr.message); setSending(false); return; }
      if (cmd) {
        const items = cartItems.map((x: any) => {
          const mm = menus.find((m) => m.id === x[0])!;
          return {
            commande_id: cmd.id,
            menu_id: x[0],
            qte: Number(x[1]),
            prix: Number(mm.prix),
            menu_nom: mm.nom
          };
        });
        const { error: itemsErr } = await supabase.from('commande_items').insert(items as any);
        if(itemsErr){
          const itemsMin = cartItems.map((x: any) => {
            const mm = menus.find((m) => m.id === x[0])!;
            return {
              commande_id: cmd.id,
              menu_id: x[0],
              qte: Number(x[1]),
              prix: Number(mm.prix)
            };
          });
          const { error: errMin } = await supabase.from('commande_items').insert(itemsMin as any);
          if(errMin){ alert('Erreur finale items: '+errMin.message); setSending(false); return; }
        }
        await supabase.from('tables').update({ statut: 'en_cours' }).eq('id', table.id);
        for (let i = 0; i < cartItems.length; i++) {
          const menuId = cartItems[i][0] as string;
          const qte = cartItems[i][1] as number;
          const recs = recettes.filter((r: any) => r.menu_id === menuId);
          for (let j = 0; j < recs.length; j++) {
            const r = recs[j];
            const mp: any = matieres.find((x: any) => x.id === r.matiere_id);
            if (!mp) continue;
            const nouveau = Math.max(0, Number(mp.quantite || 0) - Number(r.qte_necessaire || 0) * qte);
            await supabase.from('matiere_premiere').update({ quantite: nouveau } as any).eq('id', mp.id);
          }
        }
      }
    } catch (e:any) { console.error(e); alert('Erreur: '+e.message); }
    setSending(false);
    onBack();
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin" /></div>;
  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-32">
      <div className="sticky top-0 z-30 bg-[#0A0A0A]/95 border-b border-gray-800 px-4 py-3"><div className="flex items-center gap-3 max-w-4xl mx-auto"><button onClick={onBack} className="p-2 rounded-lg bg-[#1A1A1A] text-gray-300"><ArrowLeft className="w-5 h-5" /></button><div><h2 className="text-white font-bold">Table {table.numero} - {table.etage||'RDC'}</h2><p className="text-gray-500 text-xs">{serveurNom}</p></div></div></div>
      <div className="p-4 max-w-4xl mx-auto">
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">{catList.map((c) => <button key={c} onClick={() => setFilter(c)} className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap ${filter === c? 'bg-[#FF6B00] text-white' : 'bg-[#1A1A1A] text-gray-400'}`}>{c === 'Tous'? 'Tous' : catLabel(c)}</button>)}</div>
        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} className="mb-6"><h3 className="text-lg font-bold text-[#FF6B00] mb-3">{catLabel(cat)}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {items.map((m) => {
                const rupt = checkRupture(m.id, 0);
                const isRupt =!!rupt;
                const inCart = cart[m.id] || 0;
                return (
                  <div key={m.id} className={`bg-[#1A1A1A] rounded-2xl overflow-hidden border ${isRupt? 'border-red-700 opacity-60' : inCart? 'border-[#FF6B00]' : 'border-gray-800'}`}>
                    <div className="relative h-24 bg-gray-900">{m.image_url? <img src={m.image_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-8 h-8 text-gray-700" /></div>}{inCart > 0 && <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-[#FF6B00] text-white text-xs font-bold flex items-center justify-center">{inCart}</div>}</div>
                    <div className="p-2.5"><h4 className="text-white text-sm font-semibold">{m.nom}</h4><div className="flex items-center justify-between mt-1.5"><span className="text-[#FF6B00] font-bold text-sm">{Number(m.prix).toFixed(0)} DH</span>
                      {isRupt? <span className="text-red-400 text-[9px] font-bold">RUPTURE</span> : inCart? <div className="flex items-center gap-1"><button onClick={() => remove(m.id)} className="w-6 h-6 rounded-lg bg-gray-800 text-white flex items-center justify-center"><Minus className="w-3 h-3" /></button><span className="text-white text-sm w-5 text-center">{inCart}</span><button onClick={() => add(m.id)} className="w-6 h-6 rounded-lg bg-[#FF6B00] text-white flex items-center justify-center"><Plus className="w-3 h-3" /></button></div> : <button onClick={() => add(m.id)} className="w-7 h-7 rounded-lg bg-[#FF6B00] text-white flex items-center justify-center"><Plus className="w-4 h-4" /></button>}
                    </div></div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {cartItems.length > 0 && <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#1A1A1A] border-t border-gray-800 p-4"><div className="max-w-4xl mx-auto flex items-center justify-between"><div><div className="text-gray-400 text-sm">{cartItems.length} articles</div><div className="text-white text-2xl font-bold">{cartTotal.toFixed(0)} DH</div></div><button onClick={send} disabled={sending} className="flex items-center gap-2 bg-[#FF6B00] text-white px-6 py-3.5 rounded-xl"><Send className="w-5 h-5" />{sending? 'Envoi...' : 'Envoyer'}</button></div></div>}
    </div>
  );
        }
