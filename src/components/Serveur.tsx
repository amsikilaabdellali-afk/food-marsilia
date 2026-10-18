// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Plus, Minus, Send, Image as ImageIcon, LogOut, MessageSquare, ChefHat, MapPin } from 'lucide-react';

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
  const [selectedEtage, setSelectedEtage] = useState<string | null>(null);

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

  const etages = [
    { id: 'RDC', label: 'RDC', count: rdc.length, color: 'bg-green-600', icon: '🏠', desc: 'Rez-de-chaussée' },
    { id: '1er', label: '1er ÉTAGE', count: premier.length, color: 'bg-blue-600', icon: '🏢', desc: 'Premier étage' },
    { id: 'Emporte', label: 'EMPORTE', count: emporte.length, color: 'bg-orange-600', icon: '🥡', desc: 'À emporter' },
    { id: 'GLOVO', label: 'GLOVO 💰', count: glovo.length, color: 'bg-yellow-500', icon: '🛵', desc: 'Prix majorés +30%' },
  ];

  // ETAPE 1: Choisir Etage
  if (!selectedEtage) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="bg-yellow-500 text-black p-3 flex justify-between items-center sticky top-0 z-20">
          <div className="font-black text-sm">SERVEUR: {profil?.user?.nom} ({profil?.user?.identifiant})</div>
          <button onClick={onLogout} className="bg-black text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1"><LogOut className="w-4 h-4"/>Logout</button>
        </div>
        <div className="p-4 max-w-4xl mx-auto">
          <h2 className="text-2xl font-black text-white mb-2 text-center">Choisir Zone</h2>
          <p className="text-zinc-500 text-center text-sm mb-6">Fin ghadi tkhdam daba?</p>
          
          <div className="grid grid-cols-2 gap-4">
            {etages.map((etage) => (
              <button
                key={etage.id}
                onClick={() => setSelectedEtage(etage.id)}
                className={`${etage.id==='GLOVO'?'bg-gradient-to-br from-yellow-400 to-amber-500 text-black':'bg-[#1A1A1A] border border-zinc-800 text-white'} rounded-[24px] p-6 aspect-square flex flex-col items-center justify-center relative overflow-hidden active:scale-95 transition-all`}
              >
                <div className="text-5xl mb-3">{etage.icon}</div>
                <div className="font-black text-lg">{etage.label}</div>
                <div className={`text-xs mt-1 ${etage.id==='GLOVO'?'text-black/60':'text-zinc-500'}`}>{etage.desc}</div>
                <div className={`mt-3 px-3 py-1 rounded-full text-xs font-black ${etage.id==='GLOVO'?'bg-black text-yellow-400':'bg-zinc-800 text-white'}`}>{etage.count} tables</div>
                {etage.id==='GLOVO' && <div className="absolute top-3 right-3 bg-black text-yellow-400 text-[9px] px-2 py-1 rounded-full font-black">💰 +30%</div>}
              </button>
            ))}
          </div>

          <div className="mt-8 bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
            <div className="text-xs text-zinc-500 text-center">TOTAL TABLES: {tables.length} • RDC {rdc.length} • 1er {premier.length} • Emporte {emporte.length} • Glovo {glovo.length}</div>
          </div>
        </div>
      </div>
    );
  }

  // ETAPE 2: Choisir Table dyal dak Etage
  const filteredTables = tables.filter((t:any)=>{
    if(selectedEtage==='RDC') return t.etage==='RDC' || !t.etage;
    if(selectedEtage==='1er') return t.etage==='1er';
    if(selectedEtage==='Emporte') return t.etage==='Emporte' || t.etage==='EMPORTE';
    if(selectedEtage==='GLOVO') return t.etage==='GLOVO';
    return false;
  });

  const etageInfo = etages.find(e=>e.id===selectedEtage);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className={`${selectedEtage==='GLOVO'?'bg-yellow-500 text-black':'bg-zinc-900 text-white'} p-3 flex justify-between items-center sticky top-0 z-20 border-b ${selectedEtage==='GLOVO'?'border-yellow-600':'border-zinc-800'}`}>
        <div className="flex items-center gap-2">
          <button onClick={()=>setSelectedEtage(null)} className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedEtage==='GLOVO'?'bg-black text-white':'bg-white/10'}`}><ArrowLeft className="w-4 h-4"/></button>
          <div className="font-black text-sm">{etageInfo?.icon} {selectedEtage} - {filteredTables.length} tables {selectedEtage==='GLOVO'&&'💰'}</div>
        </div>
        <button onClick={onLogout} className={`${selectedEtage==='GLOVO'?'bg-black text-white':'bg-white text-black'} px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1`}><LogOut className="w-4 h-4"/>Logout</button>
      </div>
      
      <div className="p-4 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-black">Tables {selectedEtage} - {filteredTables.length}</h2>
          <button onClick={()=>setSelectedEtage(null)} className="text-xs bg-zinc-800 px-3 py-2 rounded-full">← Changer Zone</button>
        </div>
        
        {filteredTables.length===0 && <div className="text-center text-zinc-500 mt-20">Aucune table dans {selectedEtage}<br/><button onClick={()=>setSelectedEtage(null)} className="mt-4 bg-orange-600 px-4 py-2 rounded-xl text-sm font-bold">Retour</button></div>}
        
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {filteredTables.map((t) => {
            const s = getStatus(t.id);
            return (
              <button key={t.id} onClick={() => onSelectTable(t)} className={`aspect-square rounded-2xl flex flex-col items-center justify-center border-2 active:scale-95 transition-all
                ${s==='pret'?'bg-green-900/40 border-green-500':s==='en_cours'?'bg-blue-950/40 border-blue-600': selectedEtage==='GLOVO'?'bg-[#1A1A1A] border-yellow-900/50':selectedEtage==='RDC'?'bg-[#1A1A1A] border-green-900/30':selectedEtage==='1er'?'bg-[#1A1A1A] border-blue-900/30':'bg-[#1A1A1A] border-orange-900/30'}`}>
                <div className="text-3xl font-black text-white">{t.numero}</div>
                <div className={`text-[10px] font-bold mt-1 ${selectedEtage==='GLOVO'?'text-yellow-400':selectedEtage==='RDC'?'text-green-400':selectedEtage==='1er'?'text-blue-400':'text-orange-400'}`}>{selectedEtage} {selectedEtage==='GLOVO'&&'💰'}</div>
                <div className={`text-[10px] mt-1 px-2 py-0.5 rounded-full font-bold ${s==='libre'?'bg-zinc-800 text-zinc-400':s==='en_cours'?'bg-blue-600 text-white':'bg-green-600 text-white'}`}>{s}</div>
              </button>
            )
          })}
        </div>
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
  const [cart, setCart] = useState<Record<string, {qte:number, note:string}>>({});
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string|null>(null);
  const [tempNote, setTempNote] = useState("");

  const isGlovo = table.etage === 'GLOVO';
  const getPrix = (menu:any)=>{
    if(isGlovo){
      if(menu.prix_glovo && Number(menu.prix_glovo)>0) return Number(menu.prix_glovo);
      return Math.round(Number(menu.prix)*1.3);
    }
    return Number(menu.prix);
  };

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
  const cartTotal = cartItems.reduce((s, [id, v]) => { const mm = menus.find((x) => x.id === id); return s + (mm? getPrix(mm) * v.qte : 0); }, 0);

  const add = (id: string) => {
    const rupt = checkRupture(id, 1);
    if (rupt) { alert(`Stock na9es! ${rupt.nom} ba9i ${rupt.restant.toFixed(2)}`); return; }
    setCart((c) => ({...c, [id]: { qte: (c[id]?.qte || 0) + 1, note: c[id]?.note || "" } }));
  };
  const remove = (id: string) => setCart((c) => { const n = {...c }; if (n[id]?.qte > 1) n[id].qte--; else delete n[id]; return n; });
  const saveNote = (id:string) => {
    setCart(c => ({...c, [id]: {...c[id], note: tempNote }}));
    setEditingNoteId(null); setTempNote("");
  };

  const buildTicketHtml = () => {
    const date = new Date().toLocaleString('fr-MA');
    const lines = cartItems.map(([id,v])=>{
      const mm = menus.find(x=>x.id===id);
      const prix = getPrix(mm);
      const notePart = v.note ? `<div style="font-size:15px; font-weight:900; color:#000; background:#ffeb3b; padding:3px 6px; margin-top:5px; border:2px solid #000;">⚠️ ${v.note.toUpperCase()}</div>` : '';
      return `<div style="font-size:19px; font-weight:900; margin:12px 0; border-bottom:1px dotted #999; padding-bottom:8px;"><div>${v.qte}x ${mm?.nom} - ${prix} DH</div>${notePart}</div>`;
    }).join('');
    return `<html><head><title>TABLE ${table.numero} - ${table.etage}</title><style>@page{size:80mm auto; margin:0} body{margin:0; font-family:monospace; width:72mm; padding:5mm;}</style></head><body>
      <div style="text-align:center; font-size:22px; font-weight:900;">🍳 CUISINE - ${table.etage}</div>
      <div style="text-align:center; font-size:13px;">MARSILIA FOOD - ${isGlovo?'GLOVO 💰':table.etage}</div>
      <div style="border-top:2px dashed #000; margin:8px 0;"></div>
      <div style="font-size:28px; font-weight:900; text-align:center;">TABLE ${table.numero} - ${table.etage}</div>
      <div style="text-align:center; font-size:11px;">${date} | ${serveurNom} | TOTAL ${cartTotal.toFixed(0)} DH</div>
      <div style="border-top:2px dashed #000; margin:8px 0;"></div>${lines}
      <div style="border-top:2px dashed #000; margin:8px 0;"></div><div style="text-align:center; font-size:22px; font-weight:900;">A PREPARER - ${cartTotal.toFixed(0)} DH</div></body></html>`;
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
      const { data: cmd } = await supabase.from('commandes').insert({ table_id: table.id, serveur_nom: serveurNom, statut: 'en_attente', total: cartTotal, etage: table.etage }).select().single();
      if (cmd) {
        const items = cartItems.map(([id, v]) => { const mm = menus.find((m) => m.id === id)!; return { commande_id: cmd.id, menu_id: id, qte: Number(v.qte), prix: getPrix(mm), menu_nom: mm.nom, note: v.note || null }; });
        await supabase.from('commande_items').insert(items as any).then(async ({error})=>{
          if(error){
            const itemsMin = cartItems.map(([id, v]) => { const mm = menus.find((m) => m.id === id)!; return { commande_id: cmd.id, menu_id: id, qte: Number(v.qte), prix: getPrix(mm) }; });
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

  // ETAPE 3: Categories
  if (!selectedCat) {
    const catIcons: any = {
      'FTOUR': '🍳', 'PETIT-DÉJEUNER': '🍳', 'PETIT-DEJEUNER': '🍳',
      'BOISSONS CHAUDES': '☕', 'À LA CARTE': '📋', 'A LA CARTE': '📋',
      'LES SALADES': '🥗', 'NOS SALADES': '🥗',
      'CHAWARMA': '🌯', 'POULET': '🍗', 'SNACKS': '🍔', 'PIZZA': '🍕',
      'PLATS MAROCAINS': '🍲', 'SODA': '🥤', 'LES JUS': '🧃',
      'JUS SPÉCIAUX': '🍹', 'CREPE SALE': '🫓', 'CREPE SUCRE': '🥞',
      'DESSERT': '🍰', 'ZAKARIYA': '⭐'
    };
    return (
      <div className="min-h-screen bg-[#050505] text-white pb-28">
        <div className={`sticky top-0 z-30 backdrop-blur-xl border-b px-4 py-3 ${isGlovo?'bg-yellow-500 text-black border-yellow-600':'bg-[#050505]/90 border-white/[0.08] text-white'}`}>
          <div className="flex items-center gap-3 max-w-4xl mx-auto">
            <button onClick={onBack} className={`w-9 h-9 rounded-full flex items-center justify-center ${isGlovo?'bg-black text-white':'bg-white/[0.08]'}`}><ArrowLeft className="w-5 h-5" /></button>
            <div><h2 className="font-black text-[14px]">TABLE {table.numero} • {table.etage} {isGlovo&&'💰 GLOVO'}</h2><p className={`text-[11px] ${isGlovo?'text-black/70':'text-white/40'}`}>{serveurNom} • {isGlovo?'Prix Glovo':'Choisir Catégorie'}</p></div>
          </div>
        </div>
        <div className="p-3 max-w-4xl mx-auto">
          <div className="grid grid-cols-2 gap-3 mt-2">
            {dbCategories.map((cat) => {
              const isZak = cat.nom.toUpperCase().includes('ZAKARIYA');
              const icon = catIcons[cat.nom] || catIcons[cat.nom.toUpperCase()] || '🍽️';
              return (
                <button key={cat.id} onClick={() => setSelectedCat(cat.nom)} className={`group relative h-[86px] rounded-[16px] p-[1px] text-left active:scale-[0.97] ${isZak ? 'bg-gradient-to-br from-yellow-300 to-amber-500' : 'bg-gradient-to-br from-blue-900/50 via-blue-800/20 to-transparent'}`}>
                  <div className={`w-full h-full rounded-[15px] flex items-center gap-3 px-4 ${isZak ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 'bg-[#121212]'}`}>
                    <div className="text-[28px]">{icon}</div>
                    <div className="flex-1 min-w-0"><div className={`font-black text-[11px] uppercase ${isZak ? 'text-black' : 'text-white'}`}>{cat.nom}</div></div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
        {cartItems.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#121212]/95 backdrop-blur border-t border-white/10 p-4">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div><div className="text-white/40 text-xs">{cartItems.reduce((a,b)=>a+b[1].qte,0)} articles</div><div className="text-white text-xl font-black">{cartTotal.toFixed(0)} DH</div></div>
              <button onClick={send} disabled={sending} className={`px-7 py-3.5 rounded-full font-black flex items-center gap-2 ${isGlovo?'bg-yellow-500 text-black':'bg-[#FF6B00] text-white'}`}><Send className="w-5 h-5" />{sending? 'Envoi...' : 'Envoyer'}</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ETAPE 4: Les Repas
  const filteredMenus = menus.filter(m => m.categorie === selectedCat);
  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-44">
      <div className={`sticky top-0 z-30 border-b px-4 py-3 ${isGlovo?'bg-yellow-500 border-yellow-600 text-black':'bg-[#0A0A0A]/95 border-gray-800 text-white'}`}>
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          <button onClick={() => setSelectedCat(null)} className={`p-2 rounded-lg ${isGlovo?'bg-black text-white':'bg-[#1A1A1A]'}`}><ArrowLeft className="w-5 h-5" /></button>
          <div><h2 className="font-bold">{catLabel(selectedCat)} - T{table.numero} {isGlovo&&'💰'}</h2><p className={`text-xs ${isGlovo?'text-black/70':'text-gray-500'}`}>{filteredMenus.length} plats • {table.etage}</p></div>
        </div>
      </div>
      <div className="p-4 max-w-4xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filteredMenus.map((m) => {
            const rupt = checkRupture(m.id, 0); const isRupt = !!rupt; const inCart = cart[m.id]?.qte || 0; const prix = getPrix(m); const prixNormal = Number(m.prix);
            return (
              <div key={m.id} className={`bg-[#1A1A1A] rounded-2xl overflow-hidden border ${isRupt? 'border-red-700 opacity-60' : inCart? 'border-[#FF6B00]' : 'border-gray-800'}`}>
                <div className="relative h-24 bg-gray-900">{m.image_url? <img src={m.image_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-8 h-8 text-gray-700" /></div>}{inCart > 0 && <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-[#FF6B00] text-white text-xs font-bold flex items-center justify-center">{inCart}</div>}{isGlovo && <div className="absolute bottom-1 left-1 bg-yellow-500 text-black text-[9px] px-1.5 py-0.5 rounded-full font-black">GLOVO</div>}</div>
                <div className="p-2.5"><h4 className="text-white text-sm font-semibold truncate">{m.nom}</h4><div className="flex items-center justify-between mt-1.5"><div><span className="text-[#FF6B00] font-bold text-sm">{prix.toFixed(0)} DH</span>{isGlovo && prix!==prixNormal && <span className="text-zinc-500 text-[10px] line-through ml-1">{prixNormal.toFixed(0)}</span>}</div>
                  {isRupt? <span className="text-red-400 text-[9px] font-bold">RUPTURE</span> : inCart? <div className="flex items-center gap-1"><button onClick={() => remove(m.id)} className="w-6 h-6 rounded-lg bg-gray-800 text-white flex items-center justify-center"><Minus className="w-3 h-3" /></button><span className="text-white text-sm w-5 text-center">{inCart}</span><button onClick={() => add(m.id)} className="w-6 h-6 rounded-lg bg-[#FF6B00] text-white flex items-center justify-center"><Plus className="w-3 h-3" /></button></div> : <button onClick={() => add(m.id)} className="w-7 h-7 rounded-lg bg-[#FF6B00] text-white flex items-center justify-center"><Plus className="w-4 h-4" /></button>}
                </div></div>
              </div>
            );
          })}
        </div>
      </div>
      {cartItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#121212] border-t border-white/10 max-h-[55vh] overflow-auto">
          <div className="p-3 max-w-4xl mx-auto">
            <div className="space-y-2 mb-3">
              {cartItems.map(([id, v]) => {
                const mm = menus.find(x=>x.id===id);
                return (
                  <div key={id} className="bg-black/60 rounded-xl p-2.5 flex flex-col gap-1.5 border border-white/5">
                    <div className="flex justify-between items-center">
                      <div className="text-white text-sm font-bold">{v.qte}x {mm?.nom} - {getPrix(mm)} DH</div>
                      <button onClick={() => { setEditingNoteId(id); setTempNote(v.note); }} className={`text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1 font-bold ${v.note? 'bg-yellow-400 text-black' : 'bg-white/10 text-white/60'}`}><MessageSquare className="w-3 h-3"/>{v.note? v.note.slice(0,15) : 'Note'}</button>
                    </div>
                    {editingNoteId===id && (<div className="flex gap-2 mt-1"><input autoFocus value={tempNote} onChange={e=>setTempNote(e.target.value)} placeholder="Ex: bla bsla" className="flex-1 bg-[#1E1E1E] border border-white/10 rounded-full px-4 py-2.5 text-sm text-white outline-none"/><button onClick={()=>saveNote(id)} className="bg-[#FF6B00] px-4 rounded-full text-sm font-black">OK</button><button onClick={()=>setEditingNoteId(null)} className="bg-white/10 px-3 rounded-full text-sm">X</button></div>)}
                  </div>
                )
              })}
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <div><div className="text-white/40 text-xs">{cartItems.reduce((a,b)=>a+b[1].qte,0)} articles</div><div className="text-white text-xl font-black">{cartTotal.toFixed(0)} DH</div></div>
              <button onClick={send} disabled={sending} className={`px-7 py-3.5 rounded-full font-black flex items-center gap-2 ${isGlovo?'bg-yellow-500 text-black':'bg-[#FF6B00] text-white'}`}><Send className="w-5 h-5" />{sending? 'Envoi...' : 'Envoyer'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
