// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Edit3, Trash2, X, Image as ImageIcon, Upload, BarChart3, Users, MapPin, Clock, Utensils, Package, Plus, ArrowLeft } from 'lucide-react';

export default function Admin(){
  const [tab,setTab]=useState('rapports');
  return(
    <div className="min-h-screen bg-black text-white pb-20">
      <div className="flex gap-1 p-2 border-b border-zinc-800 sticky top-0 bg-black z-20 overflow-x-auto">
        {[
          {id:'menu',label:'MENU'},
          {id:'gestion-stock',label:'📦 GESTION STOCK'},
          {id:'categories',label:'CATEGORIES'},
          {id:'tables',label:'TABLES'},
          {id:'users',label:'USERS'},
          {id:'rapports',label:'RAPPORTS'}
        ].map((t)=><button key={t.id} onClick={()=>setTab(t.id)} className={`px-3 py-2.5 rounded-xl text-[11px] font-black whitespace-nowrap ${tab===t.id?'bg-orange-600 text-white':'bg-zinc-800 text-zinc-400'}`}>{t.label}</button>)}
      </div>
      <div className="p-4 max-w-5xl mx-auto">
        {tab==='menu'&&<MenuTab/>}
        {tab==='gestion-stock'&&<GestionStockTab/>}
        {tab==='categories'&&<CategoriesTab/>}
        {tab==='tables'&&<TablesTab/>}
        {tab==='users'&&<UsersTab/>}
        {tab==='rapports'&&<RapportsTab/>}
      </div>
    </div>
  );
}

// ===== MENU - CATEGORIES LAWAL =====
function MenuTab(){
  const [menus,setMenus]=useState<any[]>([]);
  const [cats,setCats]=useState<any[]>([]);
  const [mats,setMats]=useState<any[]>([]);
  const [rec,setRec]=useState<any[]>([]);
  const [show,setShow]=useState(false);
  const [edit,setEdit]=useState<any>(null);
  const [selectedCat,setSelectedCat]=useState<string | null>(null);
  const [search,setSearch]=useState('');
  const load=useCallback(async()=>{
    const a=await supabase.from('menu').select('*').order('nom');
    const b=await supabase.from('categories').select('*').order('ordre');
    const c=await supabase.from('matiere_premiere').select('*').order('nom');
    const d=await supabase.from('recette').select('*');
    setMenus(a.data||[]);setCats(b.data||[]);setMats(c.data||[]);setRec(d.data||[]);
  },[]);
  useEffect(()=>{load();},[load]);
  const filteredMenus = menus.filter((m:any)=>{
    if(!selectedCat) return false;
    return (m.categorie===selectedCat) && (search ? m.nom.toLowerCase().includes(search.toLowerCase()) : true);
  });
  return <div>
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center gap-2">
        {selectedCat && <button onClick={()=>{setSelectedCat(null); setSearch('');}} className="bg-zinc-800 p-2 rounded-full"><ArrowLeft className="w-4 h-4"/></button>}
        <h2 className="font-bold text-sm">{selectedCat ? `${selectedCat} - ${filteredMenus.length} plats` : `Menu ${menus.length} - Categories (${cats.length})`}</h2>
      </div>
      <button onClick={()=>{setEdit(null);setShow(true);}} className="bg-orange-600 px-4 py-2 rounded-xl font-bold text-xs">+ Plat</button>
    </div>
    {!selectedCat ? (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {cats.map((cat:any)=>{
          const count = menus.filter((m:any)=>m.categorie===cat.nom).length;
          const first = menus.find((m:any)=>m.categorie===cat.nom);
          return <button key={cat.id} onClick={()=>setSelectedCat(cat.nom)} className="bg-zinc-900 border-2 border-zinc-800 hover:border-orange-500 rounded-2xl overflow-hidden text-left">
            <div className="h-36 bg-zinc-800 relative">{first?.image_url ? <img src={first.image_url} className="w-full h-full object-cover"/> : <div className="h-full flex items-center justify-center text-zinc-600 text-[11px]">Sans photo</div>}<div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"/><div className="absolute bottom-2 left-3"><div className="font-black text-white text-sm">{cat.label}</div><div className="text-[10px] text-zinc-300">{count} plats →</div></div></div>
            <div className="p-2.5 bg-[#1a1a1a] text-[10px] text-zinc-500">{cat.nom}</div>
          </button>
        })}
      </div>
    ) : (
      <div><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={`Qalleb f ${selectedCat}...`} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm mb-3"/>
        <div className="grid md:grid-cols-2 gap-3">{filteredMenus.map((m:any)=>{const ings=rec.filter((r:any)=>r.menu_id===m.id); return <div key={m.id} className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden"><div className="h-40 bg-zinc-800">{m.image_url?<img src={m.image_url} className="w-full h-full object-cover"/>:<div className="h-full flex items-center justify-center text-xs text-zinc-500">Sans photo</div>}</div><div className="p-3 flex justify-between"><div><div className="font-bold text-sm">{m.nom}</div><div className="text-xs"><span>{m.prix} DH</span><span className="text-yellow-400 ml-2">| {m.prix_glovo} DH Glovo</span></div><div className="text-[10px] text-zinc-500">{ings.length} ing • {m.categorie}</div></div><div className="flex gap-1"><button onClick={()=>{setEdit(m);setShow(true);}} className="p-2 bg-zinc-800 rounded-lg"><Edit3 className="w-4 h-4"/></button><button onClick={async()=>{if(confirm('Supprimer?')){await supabase.from('menu').delete().eq('id',m.id);load();}}} className="p-2 bg-red-900 rounded-lg"><Trash2 className="w-4 h-4"/></button></div></div></div>})}</div></div>
    )}
    {show&&<MenuForm menu={edit} categories={cats} matieres={mats} recs={rec.filter((r:any)=>r.menu_id===edit?.id)} onClose={()=>{setShow(false);setEdit(null);}} onSaved={load} defaultCategorie={selectedCat}/>}
  </div>
}

function MenuForm({menu,categories,matieres,recs,onClose,onSaved,defaultCategorie}:any){
  const [nom,setNom]=useState(menu?.nom||'');const [prix,setPrix]=useState(menu?String(menu.prix):'');const [prixGlovo,setPrixGlovo]=useState(menu?.prix_glovo?String(menu.prix_glovo):'');const [cat,setCat]=useState(menu?.categorie||defaultCategorie||categories[0]?.nom||'');const [img,setImg]=useState(menu?.image_url||'');const [ings,setIngs]=useState<any[]>(recs||[]);const [sel,setSel]=useState('');const [qte,setQte]=useState('150');const [unite,setUnite]=useState('g');const [preview,setPreview]=useState(menu?.image_url||'');
  const addIng=()=>{if(!sel) return; const mat=matieres.find((x:any)=>x.id===sel); if(!mat) return; setIngs([...ings,{matiere_id:sel,qte_necessaire:parseFloat(qte),_nom:mat.nom,unite}]); setQte('150');};
  const save=async()=>{
    if(!nom||!prix) return alert('Nom + Prix');
    const p={nom,prix:parseFloat(prix),prix_glovo:parseFloat(prixGlovo)||Math.round(parseFloat(prix)*1.3),categorie:cat,image_url:img,disponible:true};
    let id=menu?.id; if(menu){await supabase.from('menu').update(p).eq('id',menu.id);} else{const {data}=await supabase.from('menu').insert(p).select().single(); id=data?.id;}
    if(id){await supabase.from('recette').delete().eq('menu_id',id); if(ings.length){await supabase.from('recette').insert(ings.map((x:any)=>({menu_id:id,matiere_id:x.matiere_id,qte_necessaire:x.qte_necessaire,unite:x.unite})));}}
    onSaved(); onClose();
  };
  return <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"><div className="bg-zinc-900 rounded-2xl w-full max-w-lg border border-zinc-800"><div className="p-4 flex justify-between border-b border-zinc-800"><h3 className="font-bold">Plat</h3><button onClick={onClose}><X className="w-5 h-5"/></button></div><div className="p-4 space-y-3"><input value={nom} onChange={e=>setNom(e.target.value)} placeholder="Nom" className="w-full bg-black p-3 rounded-xl border border-zinc-700"/><div className="grid grid-cols-2 gap-2"><input value={prix} onChange={e=>setPrix(e.target.value)} type="number" placeholder="Prix Normal" className="bg-black p-3 rounded-xl border border-zinc-700"/><input value={prixGlovo} onChange={e=>setPrixGlovo(e.target.value)} type="number" placeholder="Prix Glovo" className="bg-black p-3 rounded-xl border-2 border-yellow-600"/></div><select value={cat} onChange={e=>setCat(e.target.value)} className="w-full bg-black p-3 rounded-xl border border-zinc-700">{categories.map((c:any)=><option key={c.id} value={c.nom}>{c.label}</option>)}</select></div><div className="p-4 border-t border-zinc-800 flex gap-2"><button onClick={onClose} className="flex-1 bg-zinc-800 py-3 rounded-xl">Annuler</button><button onClick={save} className="flex-1 bg-orange-600 py-3 rounded-xl font-bold">Sauver</button></div></div></div>
}

// ===== RAPPORTS - KAMIL B DETAIL MODE PAIEMENT =====
function RapportsTab(){
  const [date,setDate]=useState(new Date().toISOString().split('T')[0]);
  const [cmds,setCmds]=useState<any[]>([]);
  const [annules,setAnnules]=useState<any[]>([]);
  const [itemsMap,setItemsMap]=useState<any>({});
  const [annuleItemsMap,setAnnuleItemsMap]=useState<any>({});
  const [tableMap,setTableMap]=useState<any>({});
  const [loading,setLoading]=useState(true);
  const [filter,setFilter]=useState('all');

  const load=useCallback(async()=>{
    setLoading(true);
    const start=new Date(date); start.setHours(0,0,0,0);
    const end=new Date(date); end.setHours(23,59,59,999);
    let {data}=await supabase.from('commandes').select('*').eq('statut','paye').gte('paye_at',start.toISOString()).lte('paye_at',end.toISOString()).order('paye_at',{ascending:true});
    if(!data||data.length===0){
      const {data:d2}=await supabase.from('commandes').select('*').eq('statut','paye').gte('created_at',start.toISOString()).lte('created_at',end.toISOString()).order('created_at',{ascending:true});
      data=d2||[];
    }
    let {data:annuleData}=await supabase.from('commandes').select('*').in('statut',['annule','annulee']).gte('created_at',start.toISOString()).lte('created_at',end.toISOString()).order('created_at',{ascending:true});
    let iMap:any={}, aMap:any={}, tMap:any={};
    const allIds=[...(data||[]).map((c:any)=>c.id), ...(annuleData||[]).map((c:any)=>c.id)];
    const tableIds=[...(data||[]).map((c:any)=>c.table_id), ...(annuleData||[]).map((c:any)=>c.table_id)].filter(Boolean);
    if(allIds.length){
      const [itemsRes,tablesRes]=await Promise.all([
        supabase.from('commande_items').select('*').in('commande_id',allIds),
        tableIds.length?supabase.from('tables').select('*').in('id',tableIds):Promise.resolve({data:[] as any})
      ]);
      (itemsRes.data||[]).forEach((it:any)=>{ 
        if((data||[]).some((c:any)=>c.id===it.commande_id)){ (iMap[it.commande_id]=iMap[it.commande_id]||[]).push(it); }
        else { (aMap[it.commande_id]=aMap[it.commande_id]||[]).push(it); }
      });
      (tablesRes.data||[]).forEach((t:any)=>{ tMap[t.id]=t; });
    }
    setItemsMap(iMap); setAnnuleItemsMap(aMap); setTableMap(tMap); setCmds(data||[]); setAnnules(annuleData||[]); setLoading(false);
  },[date]);
  useEffect(()=>{load();},[load]);

  const getTable=(c:any)=>{ const t=tableMap[c.table_id]; if(t) return `T${t.numero} ${t.etage}`; return c.table_numero? `T${c.table_numero}` : c.id_table? `T${c.id_table}` : 'Table?'; };
  const getHeure=(c:any)=> new Date(c.paye_at||c.created_at).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});

  const stats=(()=>{
    let espece=0,tpe=0,cheque=0,offert=0,remise=0,remisePerte=0,totalReel=0,totalEnc=0;
    cmds.forEach((c:any)=>{
      const its=itemsMap[c.id]||[];
      const method=(c.payment_method||'espece').toLowerCase();
      if(method==='mixte'){
        its.forEach((it:any)=>{
          const m=(it.payment_method||'espece').toLowerCase();
          const prix=Number(it.qte||1)*Number(it.prix||0);
          const perc=Number(it.remise_percent||0);
          const finalP=m==='offert'?0:m==='remise'?prix-prix*perc/100:prix;
          totalReel+=prix;
          if(m==='espece') espece+=finalP; else if(m==='tpe') tpe+=finalP; else if(m==='cheque') cheque+=finalP; else if(m==='offert') offert+=prix; else if(m==='remise'){remise+=finalP; remisePerte+=prix-finalP;}
          if(m!=='offert') totalEnc+=finalP;
        });
      }else{
        const tot=Number(c.total_final??c.total??0); const totReel=Number(c.total??0); totalReel+=totReel;
        if(method==='espece'){espece+=tot; totalEnc+=tot;} else if(method==='tpe'){tpe+=tot; totalEnc+=tot;} else if(method==='cheque'){cheque+=tot; totalEnc+=tot;} else if(method==='offert'){offert+=totReel;} else if(method==='remise'){remise+=tot; remisePerte+=totReel-tot; totalEnc+=tot;} else {espece+=tot; totalEnc+=tot;}
      }
    });
    return {espece,tpe,cheque,offert,remise,remisePerte,totalReel,totalEnc};
  })();

  const totalsAnnule=annules.reduce((s:any,c:any)=>{const its=annuleItemsMap[c.id]||[]; return s+(its.length? its.reduce((a:any,i:any)=>a+Number(i.qte||1)*Number(i.prix||0),0) : Number(c.total||0));},0);
  const filtered = cmds.filter(c=>{
    if(filter==='all') return true;
    if(c.payment_method===filter) return true;
    if(c.payment_method==='mixte'){ const its=itemsMap[c.id]||[]; return its.some((it:any)=>it.payment_method===filter); }
    return false;
  });

  if(loading) return <div className="p-8 text-center">Chargement...</div>;
  return <div className="space-y-4">
    <div className="flex gap-2"><input type="date" value={date} onChange={e=>setDate(e.target.value)} className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-3 font-bold text-sm"/><button onClick={load} className="bg-orange-600 px-5 rounded-xl font-black text-sm">Refresh</button></div>

    <div className="bg-zinc-900 rounded-2xl p-4 border border-orange-500/30">
      <div className="flex justify-between mb-3"><h2 className="font-black flex items-center gap-2"><BarChart3 className="w-5 h-5 text-orange-500"/> RAPPORT {date}</h2><span className="text-[10px] bg-zinc-800 px-2 py-1 rounded-full">{cmds.length} cmds</span></div>
      <div className="grid grid-cols-2 gap-2"><div className="bg-black rounded-xl p-3 border border-green-800"><div className="text-[10px] text-zinc-400">CA ENCAISSÉ</div><div className="font-black text-2xl text-green-400">{stats.totalEnc.toFixed(0)} DH</div></div><div className="bg-black rounded-xl p-3 border border-zinc-700"><div className="text-[10px] text-zinc-400">CA RÉEL</div><div className="font-black text-xl">{stats.totalReel.toFixed(0)} DH</div><div className="text-[10px] text-orange-400">Perte {(stats.offert+stats.remisePerte).toFixed(0)} DH</div></div></div>
    </div>

    {/* FILTRES MODE PAIEMENT */}
    <div className="grid grid-cols-3 gap-2">
      <button onClick={()=>setFilter('all')} className={`p-3 rounded-xl border text-center ${filter==='all'?'bg-white text-black border-white':'bg-zinc-900 border-zinc-800'}`}><div className="text-[10px]">TOUT</div><div className="font-black">{cmds.length}</div></button>
      <button onClick={()=>setFilter('espece')} className={`p-3 rounded-xl border ${filter==='espece'?'border-green-500 bg-green-950':'bg-green-950/20 border-green-800'}`}><div className="text-[10px] text-green-300">ESPECE</div><div className="font-black text-green-400">{stats.espece.toFixed(0)}</div></button>
      <button onClick={()=>setFilter('tpe')} className={`p-3 rounded-xl border ${filter==='tpe'?'border-blue-500 bg-blue-950':'bg-blue-950/20 border-blue-800'}`}><div className="text-[10px] text-blue-300">TPE</div><div className="font-black text-blue-400">{stats.tpe.toFixed(0)}</div></button>
      <button onClick={()=>setFilter('cheque')} className={`p-3 rounded-xl border ${filter==='cheque'?'border-purple-500 bg-purple-950':'bg-purple-950/20 border-purple-800'}`}><div className="text-[10px] text-purple-300">CHEQUE</div><div className="font-black text-purple-400">{stats.cheque.toFixed(0)}</div></button>
      <button onClick={()=>setFilter('remise')} className={`p-3 rounded-xl border ${filter==='remise'?'border-yellow-500 bg-yellow-950':'bg-yellow-950/20 border-yellow-800'}`}><div className="text-[10px] text-yellow-300">REMISE</div><div className="font-black text-yellow-400">{stats.remise.toFixed(0)}</div></button>
      <button onClick={()=>setFilter('offert')} className={`p-3 rounded-xl border ${filter==='offert'?'border-orange-500 bg-orange-950':'bg-orange-950/20 border-orange-800'}`}><div className="text-[10px] text-orange-300">OFFERT</div><div className="font-black text-orange-400">{stats.offert.toFixed(0)}</div></button>
    </div>
    <div className="bg-red-950/30 border border-red-800 rounded-xl p-3 flex justify-between"><div><div className="text-[10px] text-red-300">ANNULÉ</div><div className="font-black text-red-400">{totalsAnnule.toFixed(0)} DH - {annules.length} cmds</div></div><div className="text-[10px] text-red-300">Perte directe</div></div>

    {/* DETAIL TICKETS */}
    <h3 className="font-black text-sm pt-4">✅ TICKETS DÉTAILLÉS - {filtered.length} / {cmds.length} (filtre: {filter})</h3>
    {filtered.map((c:any)=>{
      const its=itemsMap[c.id]||[];
      const isMixte=c.payment_method==='mixte';
      return (
        <div key={c.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
          <div className="flex justify-between">
            <div><div className="font-black text-sm">{getTable(c)} <span className="text-[10px] text-zinc-400 ml-2">{getHeure(c)} • {c.serveur_nom||'?'}</span></div><div className="text-[10px] text-zinc-500">#{c.id.slice(0,8)} • {isMixte?'MIXTE':c.payment_method?.toUpperCase()}</div></div>
            <div className="text-right"><span className={`text-[9px] px-2 py-1 rounded-full font-black ${c.payment_method==='espece'?'bg-green-600':c.payment_method==='tpe'?'bg-blue-600':c.payment_method==='cheque'?'bg-purple-600':c.payment_method==='offert'?'bg-orange-600':c.payment_method==='remise'?'bg-yellow-500 text-black':'bg-white text-black'}`}>{(c.payment_method||'ESPECE').toUpperCase()}</span><div className="font-black text-orange-400 text-sm mt-1">{Number(c.total_final??c.total??0).toFixed(0)} DH</div></div>
          </div>
          <div className="bg-black rounded-lg p-2 mt-2 space-y-1">
            {its.map((it:any)=>{
              const prix=Number(it.qte||1)*Number(it.prix||0);
              const m=(it.payment_method||c.payment_method||'espece').toLowerCase();
              const perc=Number(it.remise_percent||0);
              const finalP=m==='offert'?0:m==='remise'?prix-prix*perc/100:prix;
              return <div key={it.id} className="flex justify-between text-xs py-1 border-b border-zinc-800/50 last:border-0">
                <span>{it.qte}x {it.menu_nom||it.nom} {isMixte && <span className={`ml-2 text-[8px] px-1.5 py-0.5 rounded-full font-black ${m==='espece'?'bg-green-700':m==='tpe'?'bg-blue-700':m==='cheque'?'bg-purple-700':m==='offert'?'bg-orange-700':m==='remise'?'bg-yellow-600 text-black':'bg-zinc-700'}`}>{m.toUpperCase()} {m==='remise'?`${perc}%`:''}</span>}</span>
                <span className={m==='offert'?'text-orange-400 line-through':'text-zinc-300'}>{m==='offert'?`${prix.toFixed(0)}→0`:`${finalP.toFixed(0)}`} DH</span>
              </div>
            })}
            {its.length===0 && <div className="text-[11px] text-zinc-500">Ancien format - {Number(c.total||0).toFixed(0)} DH</div>}
          </div>
        </div>
      )
    })}

    {annules.length>0 && <div className="pt-6"><h3 className="font-black text-red-400 text-sm mb-3">❌ ANNULÉS - {totalsAnnule.toFixed(0)} DH</h3>{annules.map((c:any)=>{const its=annuleItemsMap[c.id]||[]; return <div key={c.id} className="bg-red-950/20 border border-red-900 rounded-xl p-3 mb-2"><div className="flex justify-between"><span className="font-bold">{getTable(c)} • {getHeure(c)}</span><span className="font-black text-red-400">{(its.reduce((a:any,i:any)=>a+Number(i.qte||1)*Number(i.prix||0),0) || Number(c.total||0)).toFixed(0)} DH</span></div><div className="bg-black/50 rounded p-2 mt-2 text-xs">{its.map((it:any)=><div key={it.id} className="flex justify-between"><span>{it.qte}x {it.menu_nom}</span><span>{(Number(it.qte||1)*Number(it.prix||0)).toFixed(0)} DH</span></div>)}</div></div>})}</div>}
  </div>
}

// --- STOCK / CATEGORIES / TABLES / USERS (nafs l9dam) ---
function GestionStockTab(){const [mats,setMats]=useState<any[]>([]);const [showAdd,setShowAdd]=useState(false);const [edit,setEdit]=useState<any>(null);const [date,setDate]=useState(new Date().toISOString().split('T')[0]);const load=useCallback(async()=>{const {data}=await supabase.from('matiere_premiere').select('*').order('nom');setMats(data||[]);},[]);useEffect(()=>{load();},[load]);return <div className="space-y-3"><div className="flex gap-2"><input type="date" value={date} onChange={e=>setDate(e.target.value)} className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-3 text-sm"/><button onClick={()=>{setEdit(null);setShowAdd(true);}} className="bg-orange-600 px-4 rounded-xl">+ MATIERE</button></div>{mats.map((m:any)=><div key={m.id} className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 flex justify-between"><div><div className="font-bold">{m.nom}</div><div className="text-xs text-zinc-500">{m.quantite} {m.unite}</div></div><button onClick={()=>{setEdit(m);setShowAdd(true);}} className="p-2 bg-zinc-800 rounded-lg"><Edit3 className="w-4 h-4"/></button></div>)}</div>}
function CategoriesTab(){const [cats,setCats]=useState<any[]>([]);const [show,setShow]=useState(false);const [edit,setEdit]=useState<any>(null);const load=useCallback(async()=>{const {data}=await supabase.from('categories').select('*').order('ordre');setCats(data||[]);},[]);useEffect(()=>{load();},[load]);return <div><div className="flex justify-between mb-2"><h2 className="font-bold">Categories</h2><button onClick={()=>{setEdit(null);setShow(true);}} className="bg-orange-600 px-3 py-2 rounded-xl">+ Cat</button></div>{cats.map((c:any)=><div key={c.id} className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 flex justify-between mb-2"><div><div className="font-bold">{c.label}</div><div className="text-xs text-zinc-500">{c.nom}</div></div></div>)}{show&&<CatForm cat={edit} onClose={()=>{setShow(false);setEdit(null);}} onSaved={load}/>}</div>}
function CatForm({cat,onClose,onSaved}:any){const [nom,setNom]=useState(cat?.nom||'');const [label,setLabel]=useState(cat?.label||'');const save=async()=>{const p={nom:nom.toLowerCase().replace(/\s/g,'_'),label,ordre:1};if(cat) await supabase.from('categories').update(p).eq('id',cat.id);else await supabase.from('categories').insert(p);onSaved();onClose();};return <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"><div className="bg-zinc-900 rounded-2xl w-full max-w-md border border-zinc-800 p-5 space-y-3"><input value={label} onChange={e=>setLabel(e.target.value)} placeholder="Label" className="w-full bg-black p-3 rounded-xl border border-zinc-700"/><input value={nom} onChange={e=>setNom(e.target.value)} placeholder="nom" className="w-full bg-black p-3 rounded-xl border border-zinc-700 text-xs"/><div className="flex gap-2"><button onClick={onClose} className="flex-1 bg-zinc-800 py-3 rounded-xl">Annuler</button><button onClick={save} className="flex-1 bg-orange-600 py-3 rounded-xl font-bold">Sauver</button></div></div></div>}
function TablesTab(){const [items,setItems]=useState<any[]>([]);const [numero,setNumero]=useState('');const [etage,setEtage]=useState('RDC');const load=useCallback(async()=>{const {data}=await supabase.from('tables').select('*').order('numero');setItems(data||[]);},[]);useEffect(()=>{load();},[load]);const save=async()=>{await supabase.from('tables').insert([{numero:Number(numero),etage,statut:'libre'}]);setNumero('');load();};return(<div><div className="flex gap-2 mb-4 bg-zinc-900 p-3 rounded-xl"><input placeholder="N°" type="number" value={numero} onChange={e=>setNumero(e.target.value)} className="bg-black border border-zinc-700 rounded-xl px-3 py-3 w-20"/><select value={etage} onChange={e=>setEtage(e.target.value)} className="bg-black border border-zinc-700 rounded-xl px-3 py-3 flex-1"><option>RDC</option><option>1er</option><option>Emporte</option><option>GLOVO</option></select><button onClick={save} className="bg-orange-600 px-5 rounded-xl">+ AJOUTER</button></div><div className="grid grid-cols-3 gap-2">{items.map((t:any)=><div key={t.id} className="bg-zinc-900 p-3 rounded-xl text-center">T{t.numero} - {t.etage}</div>)}</div></div>);}
function UsersTab(){const [users,setUsers]=useState<any[]>([]);const load=useCallback(async()=>{const {data}=await supabase.from('utilisateurs').select('*').order('created_at',{ascending:false});setUsers(data||[]);},[]);useEffect(()=>{load();},[load]);return <div>{users.map((u:any)=><div key={u.id} className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 flex justify-between mb-2"><div><div className="font-bold">{u.nom} <span className="text-xs bg-zinc-800 px-2 py-1 rounded ml-2">{u.role}</span></div><div className="text-xs text-zinc-500">{u.identifiant} | {u.code_acces}</div></div></div>)}</div>}
