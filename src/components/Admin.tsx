badal fi hada la9dim ndir copie colle // @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Edit3, Trash2, X, Image as ImageIcon, Upload, BarChart3, Package, Plus, ArrowLeft } from 'lucide-react';

export default function Admin(){
  const [tab,setTab]=useState('menu');
  return(
    <div className="min-h-screen bg-black text-white pb-20">
      <div className="flex gap-1 p-2 border-b border-zinc-800 sticky top-0 bg-black z-20 overflow-x-auto">
        {[
          {id:'menu',label:'MENU'},
          {id:'gestion-stock',label:'📦 STOCK'},
          {id:'suivi-matieres',label:'🔍 SUIVI MATIERES'},
          {id:'categories',label:'CATEGORIES'},
          {id:'tables',label:'TABLES'},
          {id:'users',label:'USERS'},
          {id:'rapports',label:'RAPPORTS'}
        ].map((t)=><button key={t.id} onClick={()=>setTab(t.id)} className={`px-3 py-2.5 rounded-xl text-[11px] font-black whitespace-nowrap ${tab===t.id?'bg-orange-600 text-white':'bg-zinc-800 text-zinc-400'}`}>{t.label}</button>)}
      </div>
      <div className="p-4 max-w-5xl mx-auto">
        {tab==='menu'&&<MenuTab/>}
        {tab==='gestion-stock'&&<GestionStockTab/>}
        {tab==='suivi-matieres'&&<SuiviMatieresTab/>}
        {tab==='categories'&&<CategoriesTab/>}
        {tab==='tables'&&<TablesTab/>}
        {tab==='users'&&<UsersTab/>}
        {tab==='rapports'&&<RapportsTab/>}
      </div>
    </div>
  );
}

// ===== MENU - CATEGORIES LAWAL + PHOTO RAJ3A =====
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
  const filteredMenus = menus.filter((m:any)=>{if(!selectedCat) return false; return (m.categorie===selectedCat) && (search ? m.nom.toLowerCase().includes(search.toLowerCase()) : true);});
  return <div>
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center gap-2">
        {selectedCat && <button onClick={()=>{setSelectedCat(null); setSearch('');}} className="bg-zinc-800 p-2 rounded-full"><ArrowLeft className="w-4 h-4"/></button>}
        <h2 className="font-bold text-sm">{selectedCat ? `${selectedCat} - ${filteredMenus.length} plats` : `Menu ${menus.length} - ${cats.length} cat`}</h2>
      </div>
      <button onClick={()=>{setEdit(null);setShow(true);}} className="bg-orange-600 px-4 py-2 rounded-xl font-bold text-xs">+ Plat</button>
    </div>
    {!selectedCat ? (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {cats.map((cat:any)=>{
          const count = menus.filter((m:any)=>m.categorie===cat.nom).length;
          const first = menus.find((m:any)=>m.categorie===cat.nom);
          return <button key={cat.id} onClick={()=>setSelectedCat(cat.nom)} className="bg-zinc-900 border-2 border-zinc-800 hover:border-orange-500 rounded-2xl overflow-hidden text-left"><div className="h-36 bg-zinc-800 relative">{first?.image_url ? <img src={first.image_url} className="w-full h-full object-cover"/> : <div className="h-full flex items-center justify-center text-zinc-600 text-[11px]">Sans photo</div>}<div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"/><div className="absolute bottom-2 left-3"><div className="font-black text-white text-sm">{cat.label}</div><div className="text-[10px] text-zinc-300">{count} plats →</div></div></div></button>
        })}
      </div>
    ) : (
      <div><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={`Qalleb f ${selectedCat}...`} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm mb-3"/><div className="grid md:grid-cols-2 gap-3">{filteredMenus.map((m:any)=>{const ings=rec.filter((r:any)=>r.menu_id===m.id);return <div key={m.id} className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden"><div className="h-40 bg-zinc-800">{m.image_url?<img src={m.image_url} className="w-full h-full object-cover"/>:<div className="h-full flex items-center justify-center text-xs text-zinc-500">Sans photo</div>}</div><div className="p-3 flex justify-between"><div><div className="font-bold text-sm">{m.nom}</div><div className="text-xs"><span>{m.prix} DH</span><span className="text-yellow-400 ml-2">| {m.prix_glovo} DH Glovo 💰</span></div><div className="text-[10px] text-zinc-500">{ings.length} ingrédients • {m.categorie}</div></div><div className="flex gap-1"><button onClick={()=>{setEdit(m);setShow(true);}} className="p-2 bg-zinc-800 rounded-lg"><Edit3 className="w-4 h-4"/></button><button onClick={async()=>{if(confirm('Supprimer?')){await supabase.from('menu').delete().eq('id',m.id);load();}}} className="p-2 bg-red-900 rounded-lg"><Trash2 className="w-4 h-4"/></button></div></div></div>})}</div></div>
    )}
    {show&&<MenuForm menu={edit} categories={cats} matieres={mats} recs={rec.filter((r:any)=>r.menu_id===edit?.id)} onClose={()=>{setShow(false);setEdit(null);}} onSaved={load} defaultCategorie={selectedCat}/>}
  </div>
}

function MenuForm({menu,categories,matieres,recs,onClose,onSaved,defaultCategorie}:any){
  const [nom,setNom]=useState(menu?.nom||'');
  const [prix,setPrix]=useState(menu?String(menu.prix):'');
  const [prixGlovo,setPrixGlovo]=useState(menu?.prix_glovo?String(menu.prix_glovo):'');
  const [cat,setCat]=useState(menu?.categorie||defaultCategorie||categories[0]?.nom||'');
  const [img,setImg]=useState(menu?.image_url||'');
  const [ings,setIngs]=useState<any[]>(recs||[]);
  const [sel,setSel]=useState('');
  const [qte,setQte]=useState('150');
  const [unite,setUnite]=useState('g');
  const [uploading,setUploading]=useState(false);
  const [preview,setPreview]=useState(menu?.image_url||'');
  useEffect(()=>{ if(matieres.length &&!sel){ const first=matieres.find((m:any)=>!ings.some((i:any)=>i.matiere_id===m.id))||matieres[0]; setSel(first?.id||''); setUnite(first?.unite||'g'); } },[matieres]);

  const handleImageUpload = async (e:any) => {
    const file = e.target.files?.[0]; if(!file) return;
    setPreview(URL.createObjectURL(file)); setUploading(true);
    try{
      const fileName = `menu_${Date.now()}_${file.name.replace(/\s/g,'_')}`;
      const { data, error } = await supabase.storage.from('menu-images').upload(fileName, file, { upsert:true });
      if(error){ const reader = new FileReader(); reader.onload = () => { setImg(reader.result as string); setUploading(false); }; reader.readAsDataURL(file); return; }
      const { data: urlData } = supabase.storage.from('menu-images').getPublicUrl(data.path);
      setImg(urlData.publicUrl);
    }catch{} setUploading(false);
  };
  const addIng=()=>{if(!sel) return; const q=parseFloat(qte); if(!q) return; const mat=matieres.find((x:any)=>x.id===sel); if(!mat) return; const newIngs=[...ings,{matiere_id:sel, qte_necessaire:q, _nom:mat.nom, unite}]; setIngs(newIngs); const next=matieres.find((m:any)=>!newIngs.some((i:any)=>i.matiere_id===m.id)); if(next){ setSel(next.id); setUnite(next.unite||'g'); } setQte('150');};
  const save=async()=>{
    if(!nom||!prix) return alert('Nom + Prix Normal');
    const prixNormal = parseFloat(prix)||0;
    let prixG = parseFloat(prixGlovo);
    if(!prixG || prixG<=0) prixG = Math.round(prixNormal*1.3);
    const p={nom,prix:prixNormal,prix_glovo:prixG,categorie:cat,image_url:img,disponible:true};
    let id=menu?.id;
    if(menu){await supabase.from('menu').update(p).eq('id',menu.id);}
    else{const {data}=await supabase.from('menu').insert(p).select().single(); id=data?.id;}
    if(id){await supabase.from('recette').delete().eq('menu_id',id); if(ings.length){await supabase.from('recette').insert(ings.map((x:any)=>({menu_id:id, matiere_id:x.matiere_id, qte_necessaire:x.qte_necessaire, unite:x.unite})));}}
    onSaved(); onClose();
  };
  return <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"><div className="bg-zinc-900 rounded-2xl w-full max-w-lg border border-zinc-800"><div className="p-4 flex justify-between border-b border-zinc-800"><h3 className="font-bold">Plat - {ings.length} ing - 2 Prix - PHOTO</h3><button onClick={onClose}><X className="w-5 h-5"/></button></div><div className="p-4 space-y-3 max-h-[75vh] overflow-auto">
    <input value={nom} onChange={e=>setNom(e.target.value)} placeholder="Nom du plat" className="w-full bg-black p-3 rounded-xl border border-zinc-700"/>
    <div className="grid grid-cols-2 gap-2">
      <div><label className="text-[10px] text-zinc-400 font-bold">PRIX NORMAL</label><input value={prix} onChange={e=>setPrix(e.target.value)} type="number" placeholder="Ex: 30" className="w-full bg-black p-3 rounded-xl border border-zinc-700 mt-1"/></div>
      <div><label className="text-[10px] text-yellow-400 font-black">PRIX GLOVO 💰</label><input value={prixGlovo} onChange={e=>setPrixGlovo(e.target.value)} type="number" placeholder="Auto +30%" className="w-full bg-yellow-950/30 border-2 border-yellow-600 p-3 rounded-xl mt-1 text-yellow-300 font-bold"/></div>
    </div>
    <select value={cat} onChange={e=>setCat(e.target.value)} className="w-full bg-black p-3 rounded-xl border border-zinc-700">{categories.map((c:any)=><option key={c.id} value={c.nom}>{c.label}</option>)}</select>
    <div className="bg-black border border-zinc-700 rounded-xl p-3"><div className="text-xs font-bold mb-2">Recette - Matières ({ings.length})</div><div className="flex gap-2 mb-2"><select value={sel} onChange={e=>{setSel(e.target.value); const mat=matieres.find((m:any)=>m.id===e.target.value); if(mat) setUnite(mat.unite);}} className="flex-1 bg-zinc-900 p-2.5 rounded-xl border border-zinc-700 text-xs"><option value="">Choisir matière</option>{matieres.filter((m:any)=>!ings.some((i:any)=>i.matiere_id===m.id)).map((m:any)=><option key={m.id} value={m.id}>{m.nom} ({m.quantite} {m.unite})</option>)}</select><input value={qte} onChange={e=>setQte(e.target.value)} type="number" className="w-20 bg-zinc-900 p-2.5 rounded-xl border border-zinc-700 text-xs"/><select value={unite} onChange={e=>setUnite(e.target.value)} className="w-16 bg-zinc-900 p-2.5 rounded-xl border border-zinc-700 text-xs"><option>g</option><option>kg</option><option>ml</option><option>L</option><option>pcs</option></select><button onClick={addIng} className="bg-orange-600 px-3 rounded-xl text-xs font-bold">+</button></div>{ings.map((ing:any,i:any)=><div key={i} className="flex justify-between bg-zinc-900 p-2 rounded-lg text-xs mb-1"><span>{ing._nom||matieres.find((m:any)=>m.id===ing.matiere_id)?.nom} - {ing.qte_necessaire} {ing.unite}</span><button onClick={()=>setIngs(ings.filter((_:any,idx:any)=>idx!==i))} className="text-red-400">X</button></div>)}</div>
    <div className="bg-black border-2 border-dashed border-orange-500/40 rounded-xl p-3"><label className="text-xs text-orange-400 font-bold flex items-center gap-1 mb-2"><ImageIcon className="w-4 h-4"/> PHOTO DU PLAT - RAJ3AT</label><div className="flex gap-2 items-center"><label className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-center cursor-pointer flex items-center justify-center gap-2"><Upload className="w-4 h-4"/><span className="text-sm font-bold">{uploading?'Upload...':'Choisir photo'}</span><input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" /></label>{preview && <img src={preview} className="w-16 h-16 rounded-xl object-cover border-2 border-orange-500" />}</div>{img && <div className="text-[10px] text-green-400 mt-2 truncate">✓ {img.slice(0,50)}...</div>}</div>
  </div><div className="p-4 border-t border-zinc-800 flex gap-2"><button onClick={onClose} className="flex-1 bg-zinc-800 py-3 rounded-xl">Annuler</button><button onClick={save} className="flex-1 bg-orange-600 py-3 rounded-xl font-bold">Sauver</button></div></div></div>
}

// ===== 🔍 SUIVI MATIERES =====
function SuiviMatieresTab(){
  const [mats,setMats]=useState<any[]>([]);const [recettes,setRecettes]=useState<any[]>([]);const [menus,setMenus]=useState<any[]>([]);const [search,setSearch]=useState('');const [selected,setSelected]=useState<any>(null);const [filterEtat,setFilterEtat]=useState('all');
  const load=useCallback(async()=>{const [m,r,mu]=await Promise.all([supabase.from('matiere_premiere').select('*').order('nom'),supabase.from('recette').select('*'),supabase.from('menu').select('*').order('nom')]);setMats(m.data||[]);setRecettes(r.data||[]);setMenus(mu.data||[]);},[]);
  useEffect(()=>{load();},[load]);
  const getRepas = (matiereId:string)=>{return recettes.filter((r:any)=>r.matiere_id===matiereId).map((rec:any)=>{const menu = menus.find((m:any)=>m.id===rec.menu_id);return menu ? {menu, qte: rec.qte_necessaire, unite: rec.unite} : null;}).filter(Boolean);};
  const getEtat = (m:any)=>{const qte = Number(m.quantite||0);const seuil = Number(m.seuil_alerte||2);if(qte<=0) return {label:'RUPTURE', color:'bg-red-600', border:'border-red-600', text:'text-red-400'};if(qte<=seuil) return {label:'ALERTE', color:'bg-orange-600', border:'border-orange-600', text:'text-orange-400'};return {label:'OK', color:'bg-green-600', border:'border-green-600', text:'text-green-400'};};
  const filtered = mats.filter((m:any)=>{const matchSearch = m.nom.toLowerCase().includes(search.toLowerCase());const etat = getEtat(m).label.toLowerCase();if(filterEtat==='all') return matchSearch;return matchSearch && etat===filterEtat;});
  return <div className="space-y-3">
    <div className="flex justify-between items-center"><h2 className="font-black text-[13px]">SUIVI MATIERES - {mats.length} matières - ETAT STOCK</h2><button onClick={load} className="bg-zinc-800 px-3 py-2 rounded-xl text-[11px]">Refresh</button></div>
    <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Qalleb: poulet, fromage..." className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm"/>
    <div className="flex gap-2"><button onClick={()=>setFilterEtat('all')} className={`flex-1 py-2 rounded-xl text-[11px] font-black ${filterEtat==='all'?'bg-white text-black':'bg-zinc-800'}`}>TOUT</button><button onClick={()=>setFilterEtat('rupture')} className={`flex-1 py-2 rounded-xl text-[11px] font-black ${filterEtat==='rupture'?'bg-red-600':'bg-zinc-800 text-red-400'}`}>RUPTURE</button><button onClick={()=>setFilterEtat('alerte')} className={`flex-1 py-2 rounded-xl text-[11px] font-black ${filterEtat==='alerte'?'bg-orange-600':'bg-zinc-800 text-orange-400'}`}>ALERTE</button><button onClick={()=>setFilterEtat('ok')} className={`flex-1 py-2 rounded-xl text-[11px] font-black ${filterEtat==='ok'?'bg-green-600':'bg-zinc-800 text-green-400'}`}>OK</button></div>
    <div className="space-y-2">{filtered.map((m:any)=>{const repas = getRepas(m.id);const etat = getEtat(m);return <div key={m.id} className={`bg-zinc-900 rounded-xl border-2 ${etat.border} p-3`}><div className="flex justify-between"><div className="flex-1"><div className="flex items-center gap-2"><span className="font-black text-white text-sm">{m.nom}</span><span className={`text-[9px] px-2 py-1 rounded-full font-black text-white ${etat.color}`}>{etat.label}</span></div><div className="text-xs mt-1"><span className="text-white font-bold">Stock: {Number(m.quantite).toFixed(1)} {m.unite}</span><span className="text-zinc-500 ml-3">Seuil: {m.seuil_alerte} {m.unite}</span></div><div className="mt-2 flex flex-wrap gap-1">{repas.slice(0,5).map((r:any,i:any)=><span key={i} className="bg-black border border-zinc-700 text-[10px] px-2 py-1 rounded-full">{r.menu.nom} • {r.qte}{r.unite}</span>)}{repas.length>5 && <span className="text-[10px] text-zinc-500">+{repas.length-5}</span>}{repas.length===0 && <span className="text-[10px] text-zinc-600">Ma dakhla f 7ta repas</span>}</div></div><button onClick={()=>setSelected(m)} className="bg-orange-600 h-fit px-4 py-2 rounded-xl text-[11px] font-black ml-2">VOIR</button></div></div>})}</div>
    {selected && <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"><div className="bg-zinc-900 rounded-2xl w-full max-w-lg border-2 border-orange-500 max-h-[90vh] overflow-auto"><div className="p-4 border-b border-zinc-800 flex justify-between sticky top-0 bg-zinc-900"><div><h3 className="font-black text-lg flex items-center gap-2"><Package className="w-5 h-5 text-orange-500"/>{selected.nom}</h3><div className="text-xs text-zinc-400">{Number(selected.quantite).toFixed(1)} {selected.unite} • {getEtat(selected).label}</div></div><button onClick={()=>setSelected(null)}><X className="w-6 h-6"/></button></div><div className="p-4 space-y-3"><div className="grid grid-cols-2 gap-2"><div className="bg-black rounded-xl p-3 border border-zinc-800 text-center"><div className="text-[10px] text-zinc-500">STOCK ACTUEL</div><div className="font-black text-xl">{Number(selected.quantite).toFixed(1)} {selected.unite}</div></div><div className={`bg-black rounded-xl p-3 border text-center ${getEtat(selected).border}`}><div className="text-[10px]">ETAT STOCK</div><div className={`font-black text-lg ${getEtat(selected).text}`}>{getEtat(selected).label}</div></div></div><h4 className="font-black text-sm">🍽️ Les repas li fiha {selected.nom} ({getRepas(selected.id).length}):</h4>{getRepas(selected.id).map((r:any,i:any)=><div key={i} className="bg-black border border-zinc-800 rounded-xl p-3 flex justify-between"><div><div className="font-bold text-sm">{r.menu.nom}</div><div className="text-[11px] text-zinc-500">{r.menu.categorie} • {r.menu.prix} DH</div></div><div className="font-black text-orange-400">{r.qte} {r.unite}</div></div>)}{getRepas(selected.id).length===0 && <div className="text-center py-6 text-zinc-500 text-xs">Ma dakhla f 7ta repas</div>}<button onClick={()=>setSelected(null)} className="w-full bg-white text-black py-3 rounded-xl font-black">Sedd</button></div></div></div>}
  </div>
}

function GestionStockTab(){const [mats,setMats]=useState<any[]>([]);const load=useCallback(async()=>{const {data}=await supabase.from('matiere_premiere').select('*').order('nom');setMats(data||[]);},[]);useEffect(()=>{load();},[load]);return <div className="space-y-3">{mats.map((m:any)=><div key={m.id} className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 flex justify-between"><div><div className="font-bold">{m.nom}</div><div className="text-xs text-zinc-500">{m.quantite} {m.unite}</div></div></div>)}</div>}
function CategoriesTab(){const [cats,setCats]=useState<any[]>([]);const load=useCallback(async()=>{const {data}=await supabase.from('categories').select('*').order('ordre');setCats(data||[]);},[]);useEffect(()=>{load();},[load]);return <div>{cats.map((c:any)=><div key={c.id} className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 mb-2"><div className="font-bold">{c.label}</div></div>)}</div>}
function TablesTab(){const [items,setItems]=useState<any[]>([]);const load=useCallback(async()=>{const {data}=await supabase.from('tables').select('*').order('numero');setItems(data||[]);},[]);useEffect(()=>{load();},[load]);return <div className="grid grid-cols-3 gap-2">{items.map((t:any)=><div key={t.id} className="bg-zinc-900 p-3 rounded-xl text-center">T{t.numero}</div>)}</div>}
function UsersTab(){const [users,setUsers]=useState<any[]>([]);const load=useCallback(async()=>{const {data}=await supabase.from('utilisateurs').select('*').order('created_at',{ascending:false});setUsers(data||[]);},[]);useEffect(()=>{load();},[load]);return <div>{users.map((u:any)=><div key={u.id} className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 mb-2"><div className="font-bold">{u.nom} - {u.role}</div></div>)}</div>}
function RapportsTab(){
  const [date,setDate]=useState(new Date().toISOString().split('T')[0]);const [cmds,setCmds]=useState<any[]>([]);const [itemsMap,setItemsMap]=useState<any>({});const [tableMap,setTableMap]=useState<any>({});const [loading,setLoading]=useState(true);const [filter,setFilter]=useState('all');
  const load=useCallback(async()=>{setLoading(true);const start=new Date(date);start.setHours(0,0,0,0);const end=new Date(date);end.setHours(23,59,59,999);let {data}=await supabase.from('commandes').select('*').eq('statut','paye').gte('paye_at',start.toISOString()).lte('paye_at',end.toISOString()).order('paye_at',{ascending:true});if(!data||data.length===0){const {data:d2}=await supabase.from('commandes').select('*').eq('statut','paye').gte('created_at',start.toISOString()).lte('created_at',end.toISOString()).order('created_at',{ascending:true});data=d2||[];}let iMap:any={},tMap:any={};const allIds=(data||[]).map((c:any)=>c.id);const tableIds=(data||[]).map((c:any)=>c.table_id).filter(Boolean);if(allIds.length){const [itemsRes,tablesRes]=await Promise.all([supabase.from('commande_items').select('*').in('commande_id',allIds),tableIds.length?supabase.from('tables').select('*').in('id',tableIds):Promise.resolve({data:[] as any})]);(itemsRes.data||[]).forEach((it:any)=>{(iMap[it.commande_id]=iMap[it.commande_id]||[]).push(it);});(tablesRes.data||[]).forEach((t:any)=>{tMap[t.id]=t;});}setItemsMap(iMap);setTableMap(tMap);setCmds(data||[]);setLoading(false);},[date]);
  useEffect(()=>{load();},[load]);
  const getTable=(c:any)=>{const t=tableMap[c.table_id];if(t) return `T${t.numero} ${t.etage}`;return `Table?`;};
  if(loading) return <div className="p-8 text-center">Chargement...</div>;
  return <div className="space-y-3"><div className="flex gap-2"><input type="date" value={date} onChange={e=>setDate(e.target.value)} className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-3"/><button onClick={load} className="bg-orange-600 px-4 rounded-xl">Refresh</button></div>{cmds.map((c:any)=>{const its=itemsMap[c.id]||[];return <div key={c.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3"><div className="flex justify-between"><span className="font-bold">{getTable(c)} • {c.payment_method}</span><span className="font-black text-orange-400">{c.total_final} DH</span></div><div className="bg-black rounded p-2 mt-2 text-xs">{its.map((it:any)=><div key={it.id} className="flex justify-between"><span>{it.qte}x {it.menu_nom}</span><span>{it.prix} DH ({it.payment_method||c.payment_method})</span></div>)}</div></div>})}</div>
}
