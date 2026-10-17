// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Plus, Minus, Send, Image as ImageIcon, LogOut, MessageSquare } from 'lucide-react';

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
  const emporte = tables.filter((t:any)=>t.etage==='Emporte' || t.etage==='EMPORTE');
  const glovo = tables.filter((t:any)=>t.etage==='GLOVO');

  const renderTables = (list:any[], color:string, label:string) => (
    list.length>0 && (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3"><div className={`w-2 h-2 rounded-full bg-${color}-500`}></div><h3 className={`font-black text-${color}-400 text-sm`}>{label} - {list.length} tables</h3></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {list.map((t) => {
            const s = getStatus(t.id);
            return <button key={t.id} onClick={() => onSelectTable(t)} className={`aspect-square rounded-2xl flex flex-col items-center justify-center border-2 ${s==='pret'?'bg-green-900/40 border-green-500':s==='en_cours'?'bg-blue-950/40 border-blue-600':'bg-[#1A1A1A] border-gray-800'}`}><div className="text-3xl font-bold text-white">{t.numero}</div><div className="text-[10px] text-zinc-500">{t.etage}</div><div className="text-xs mt-1 text-gray-500">{s}</div></button>
          })}
        </div>
      </div>
    )
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="bg-yellow-500 text-black p-3 flex justify-between items-center sticky top-0 z-20">
        <div className="font-black">SERVEUR: {profil?.user?.nom} ({profil?.user?.identifiant})</div>
        <button onClick={onLogout} className="bg-black text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1"><LogOut className="w-4 h-4"/>Logout</button>
      </div>
      <div className="p-4 max-w-4xl mx-auto">
        <h2 className="text-xl font-bold text-white mb-4">Tables - {tables.length}</h2>
        {renderTables(rdc, 'green', 'RDC')}
        {renderTables(premier, 'blue', '1er ÉTAGE')}
        {renderTables(emporte, 'orange', 'EMPORTE')}
        {renderTables(glovo, 'yellow', 'GLOVO')}
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
  // CART JDID: fih qte + note
  const [cart, setCart] = useState<Record<string, {qte:number, note:string}>>({});
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string|null>(null);
  const [tempNote, setTempNote] = useState("");

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

  const getStock = (id: string) => { const mp: any = matieres.find((x: any) => x.id === id); return Number(mp?.quantite?? 0); };
  const checkRupture = (menuId: string, addQte = 1) => {
    const recs = recettes.filter((r: any) => r.menu_id === menuId);
    if (recs.length === 0) return null;
    for (let k=0;k<recs.length;k++) {
      const r = recs[k];
      const stock = getStock(r.matiere_id);
      let inCart = 0;
      Object.keys(cart).forEach(mid => {
        const rr: any = recettes.find((x: any) => x.menu_id === mid && x.matiere_id === r.matiere_id);
        if (rr) inCart += Number(rr.qte_necessaire?? 0) * (cart[mid]?.qte||0);
      });
      if (stock - inCart < Number(r.qte_necessaire?? 0) * addQte - 0.001) {
        const mp: any = matieres.find((x: any) => x.id === r.matiere_id);
        return { nom: mp?.nom, restant: stock - inCart };
      }
    }
    return null;
  };

  const catLabel = (n: string) => dbCategories.find((c: any) => c.nom === n)?.label || n;
  const cartItems = Object.entries(cart).filter(([, v]) => v.qte > 0);
  const cartTotal = cartItems.reduce((s, [id, v]) => { const mm = menus.find((x) => x.id === id); return s + (mm? Number(mm.prix) * v.qte : 0); }, 0);

  const add = (id: string) => {
    const rupt = checkRupture(id, 1);
    if (rupt) { alert(`Stock na9es! ${rupt.nom} ba9i ${rupt.restant.toFixed(2)}`); return; }
    setCart((c) => ({...c, [id]: { qte: (c[id]?.qte || 0) + 1, note: c[id]?.note || "" } }));
  };
  const remove = (id: string) => setCart((c) => { const n = {...c }; if (n[id]?.qte > 1) n[id].qte--; else delete n[id]; return n; });
  
  const saveNote = (id:string) => {
    setCart(c => ({...c, [id]: {...c[id], note: tempNote }}));
    setEditingNoteId(null);
    setTempNote("");
  };

  const buildTicketHtml = () => {
    const date = new Date().toLocaleString('fr-MA');
    const lines = cartItems.map(([id,v])=>{
      const mm = menus.find(x=>x.id===id);
      const notePart = v.note ? `<div style="font-size:14px; font-weight:700; color:#000; background:#ffeb3b; padding:2px 6px; margin-top:4px;">⚠️ ${v.note.toUpperCase()}</div>` : '';
      return `<div style="font-size:19px; font-weight:900; margin:10px 0; border-bottom:1px dotted #999; padding-bottom:6px;"><div>${v.qte}x ${mm?.nom}</div>${notePart}</div>`;
    }).join('');
    return `<html><head><title>TABLE ${table.numero}</title><style>@page{size:80mm auto; margin:0} body{margin:0; font-family:monospace; width:72mm; padding:5mm;}</style></head><body>
      <div style="text-align:center; font-size:22px; font-weight:900;">🍳 CUISINE</div>
      <div style="text-align:center; font-size:13px;">MARSILIA FOOD</div>
      <div style="border-top:2px dashed #000; margin:8px 0;"></div>
      <div style="font-size:26px; font-weight:900; text-align:center;">TABLE ${table.numero} - ${table.etage||'RDC'}</div>
      <div style="text-align:center; font-size:12px;">${date} - ${serveurNom}</div>
      <div style="border-top:2px dashed #000; margin:8px 0;"></div>${lines}
      <div style="border-top:2px dashed #000; margin:8px 0;"></div><div style="text-align:center; font-size:22px; font-weight:900;">A PREPARER</div></body></html>`;
  };
  const printTicket = (html: string) => {
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed; right:0; bottom:0; width:0; height:0; border:0;';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document; if(!doc) return;
    doc.open(); doc.write(html); doc.close(); iframe.contentWindow?.focus();
    setTimeout(() => { iframe.contentWindow?.print(); setTimeout(() => { try{ document.body.removeChild(iframe);}catch(e){}}, 1000); }, 300);
  };
  const send = async () => {
    if (cartItems.length === 0) return;
    const ticketHtml = buildTicketHtml();
    setSending(true);
    try {
      const { data: cmd } = await supabase.from('commandes').insert({ table_id: table.id, serveur_nom: serveurNom, statut: 'en_attente', total: cartTotal }).select().single();
      if (cmd) {
        const items = cartItems.map(([id, v]) => { const mm = menus.find((m) => m.id === id)!; return { commande_id: cmd.id, menu_id: id, qte: Number(v.qte), prix: Number(mm.prix), menu_nom: mm.nom, note: v.note || null }; });
        await supabase.from('commande_items').insert(items as any).then(async ({error})=>{
          if(error){
            const itemsMin = cartItems.map(([id, v]) => { const mm = menus.find((m) => m.id === id)!; return { commande_id: cmd.id, menu_id: id, qte: Number(v.qte), prix: Number(mm.prix) }; });
            await supabase.from('commande_items').insert(itemsMin as any);
          }
        });
        await supabase.from('tables').update({ statut: 'en_cours' }).eq('id', table.id);
        for (let i=0;i<cartItems.length;i++){
          const menuId = cartItems[i][0] as string; const qte = cartItems[i][1].qte as number;
          const recs = recettes.filter((r: any) => r.menu_id === menuId);
          for (let j=0;j<recs.length;j++){ const r=recs[j]; const mp:any=matieres.find((x:any)=>x.id===r.matiere_id); if(!mp) continue; const nouveau=Math.max(0, Number(mp.quantite||0)-Number(r.qte_necessaire||0)*qte); await supabase.from('matiere_premiere').update({quantite:nouveau} as any).eq('id', mp.id); }
        }
        printTicket(ticketHtml);
      }
    } catch (e:any){ alert('Erreur: '+e.message); }
    setSending(false); onBack();
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin" /></div>;

  if (!selectedCat) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white pb-24">
        <div className="sticky top-0 z-30 bg-[#0A0A0A]/95 border-b border-gray-800 px-4 py-3">
          <div className="flex items-center gap-3 max-w-4xl mx-auto">
            <button onClick={onBack} className="p-2 rounded-lg bg-[#1A1A1A]"><ArrowLeft className="w-5 h-5" /></button>
            <div><h2 className="font-bold">Table {table.numero} - {table.etage}</h2><p className="text-gray-500 text-xs">{serveurNom} • Choisir Catégorie</p></div>
          </div>
        </div>
        <div className="p-4 max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-3 mt-4">
            {dbCategories.map((cat) => (
              <button key={cat.id} onClick={() => setSelectedCat(cat.nom)} className="group relative h-[62px]">
                <div className="absolute inset-0 bg-[#1A1A1A] border-2 border-blue-900/60 group-active:bg-[#FF6B00] group-active:border-[#FF6B00]" style={{ transform: 'skew(-18deg)', borderRadius: '6px' }}></div>
                <div className="absolute inset-0 flex items-center justify-center"><span className="text-white font-black text-[12px] uppercase px-1 text-center">{catLabel(cat.nom)}</span></div>
              </button>
            ))}
          </div>
        </div>
        {cartItems.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#1A1A1A] border-t border-gray-800 p-4">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div><div className="text-gray-400 text-sm">{cartItems.length} articles</div><div className="text-white text-2xl font-bold">{cartTotal.toFixed(0)} DH</div></div>
              <button onClick={send} disabled={sending} className="bg-[#FF6B00] text-white px-6 py-3.5 rounded-xl font-bold flex items-center gap-2"><Send className="w-5 h-5" />{sending? 'Envoi...' : 'Envoyer'}</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const filteredMenus = menus.filter(m => m.categorie === selectedCat);
  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-40">
      <div className="sticky top-0 z-30 bg-[#0A0A0A]/95 border-b border-gray-800 px-4 py-3">
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          <button onClick={() => setSelectedCat(null)} className="p-2 rounded-lg bg-[#1A1A1A]"><ArrowLeft className="w-5 h-5" /></button>
          <div><h2 className="font-bold">{catLabel(selectedCat)} - T{table.numero}</h2><p className="text-gray-500 text-xs">{filteredMenus.length} plats</p></div>
        </div>
      </div>

      <div className="p-4 max-w-4xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filteredMenus.map((m) => {
            const rupt = checkRupture(m.id, 0); const isRupt = !!rupt; const inCart = cart[m.id]?.qte || 0;
            return (
              <div key={m.id} className={`bg-[#1A1A1A] rounded-2xl overflow-hidden border ${isRupt? 'border-red-700 opacity-60' : inCart? 'border-[#FF6B00]' : 'border-gray-800'}`}>
                <div className="relative h-24 bg-gray-900">{m.image_url? <img src={m.image_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-8 h-8 text-gray-700" /></div>}{inCart > 0 && <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-[#FF6B00] text-white text-xs font-bold flex items-center justify-center">{inCart}</div>}</div>
                <div className="p-2.5"><h4 className="text-white text-sm font-semibold truncate">{m.nom}</h4><div className="flex items-center justify-between mt-1.5"><span className="text-[#FF6B00] font-bold text-sm">{Number(m.prix).toFixed(0)} DH</span>
                  {isRupt? <span className="text-red-400 text-[9px] font-bold">RUPTURE</span> : inCart? <div className="flex items-center gap-1"><button onClick={() => remove(m.id)} className="w-6 h-6 rounded-lg bg-gray-800 text-white flex items-center justify-center"><Minus className="w-3 h-3" /></button><span className="text-white text-sm w-5 text-center">{inCart}</span><button onClick={() => add(m.id)} className="w-6 h-6 rounded-lg bg-[#FF6B00] text-white flex items-center justify-center"><Plus className="w-3 h-3" /></button></div> : <button onClick={() => add(m.id)} className="w-7 h-7 rounded-lg bg-[#FF6B00] text-white flex items-center justify-center"><Plus className="w-4 h-4" /></button>}
                </div></div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PANIER + NOTES */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#1A1A1A] border-t border-gray-800 max-h-[55vh] overflow-auto">
          <div className="p-3 max-w-4xl mx-auto">
            <div className="space-y-2 mb-3">
              {cartItems.map(([id, v]) => {
                const mm = menus.find(x=>x.id===id);
                return (
                  <div key={id} className="bg-black/50 rounded-xl p-2 flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <div className="text-white text-sm font-bold">{v.qte}x {mm?.nom}</div>
                      <button onClick={() => { setEditingNoteId(id); setTempNote(v.note); }} className={`text-[11px] px-2 py-1 rounded flex items-center gap-1 ${v.note? 'bg-yellow-400 text-black' : 'bg-gray-800 text-gray-300'}`}><MessageSquare className="w-3 h-3"/>{v.note? 'Note: '+v.note : 'Ajouter note'}</button>
                    </div>
                    {editingNoteId===id && (
                      <div className="flex gap-2 mt-1">
                        <input autoFocus value={tempNote} onChange={e=>setTempNote(e.target.value)} placeholder="Ex: bla bsla, bla maticha, zayd har" className="flex-1 bg-[#1A1A1A] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"/>
                        <button onClick={()=>saveNote(id)} className="bg-[#FF6B00] px-3 rounded-lg text-sm font-bold">OK</button>
                        <button onClick={()=>setEditingNoteId(null)} className="bg-gray-800 px-3 rounded-lg text-sm">X</button>
                      </div>
                    )}
                    {v.note && editingNoteId!==id && <div className="text-yellow-300 text-xs">⚠️ {v.note}</div>}
                  </div>
                )
              })}
            </div>
            <div className="flex items-center justify-between">
              <div><div className="text-gray-400 text-xs">{cartItems.length} articles</div><div className="text-white text-xl font-bold">{cartTotal.toFixed(0)} DH</div></div>
              <button onClick={send} disabled={sending} className="bg-[#FF6B00] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2"><Send className="w-5 h-5" />{sending? 'Envoi...' : 'Envoyer + Ticket'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
