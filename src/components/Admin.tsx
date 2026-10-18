// @ts-nocheck
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Edit3, Trash2, X, Image as ImageIcon, Upload, BarChart3, Users, MapPin, Clock, Utensils, AlertTriangle, Package, Plus, Minus, History } from 'lucide-react';

export default function Admin(){
  const [tab,setTab]=useState('gestion-stock');
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

// ===== 📦 GESTION STOCK TAB =====
function GestionStockTab(){
  const [mats,setMats]=useState<any[]>([]);
  const [recettes,setRecettes]=useState<any[]>([]);
  const [menus,setMenus]=useState<any[]>([]);
  const [commandeItems,setCommandeItems]=useState<any[]>([]);
  const [mouvements,setMouvements]=useState<any[]>([]);
  const [selected,setSelected]=useState<any>(null);
  const [showAdd,setShowAdd]=useState(false);
  const [edit,setEdit]=useState<any>(null);
  const [date,setDate]=useState(new Date().toISOString().split('T')[0]);
  const [filter,setFilter]=useState('all');
  const [qteMouvement,setQteMouvement]=useState('');
  const [typeMouvement,setTypeMouvement]=useState<'entree'|'sortie'>('entree');
  const [motif,setMotif]=useState('');

  const load=useCallback(async()=>{
    const [m,r,mu]=await Promise.all([
      supabase.from('matiere_premiere').select('*').order('nom'),
      supabase.from('recette').select('*'),
      supabase.from('menu').select('*')
    ]);
    setMats(m.data||[]); setRecettes(r.data||[]); setMenus(mu.data||[]);
    const start=new Date(date); start.setHours(0,0,0,0);
    const end=new Date(date); end.setHours(23,59,59,999);
    let items:any[]=[];
    const {data:cmds}=await supabase.from('commandes').select('id').eq('statut','paye').gte('paye_at',start.toISOString()).lte('paye_at',end.toISOString());
    if(cmds?.length){
      const {data}=await supabase.from('commande_items').select('*').in('commande_id',cmds.map((c:any)=>c.id));
      items=data||[];
    } else {
      const {data:cmds2}=await supabase.from('commandes').select('id').eq('statut','paye').gte('created_at',start.toISOString()).lte('created_at',end.toISOString());
      if(cmds2?.length){
        const {data}=await supabase.from('commande_items').select('*').in('commande_id',cmds2.map((c:any)=>c.id));
        items=data||[];
      }
    }
    setCommandeItems(items);
    const {data:mov}=await supabase.from('stock_mouvements').select('*').order('created_at',{ascending:false}).limit(100);
    setMouvements(mov||[]);
  },[date]);

  useEffect(()=>{load();},[load]);

  const getConso = (matiereId:string)=>{
    const recs = recettes.filter((r:any)=>r.matiere_id===matiereId);
    let totalQte=0, totalPlats=0;
    let details:any[]=[];
    recs.forEach((rec:any)=>{
      const menu = menus.find((m:any)=>m.id===rec.menu_id);
      if(!menu) return;
      const ventes = commandeItems.filter((ci:any)=> ci.menu_id===menu.id || ci.menu_nom===menu.nom || ci.nom===menu.nom);
      const qteVendue = ventes.reduce((s:any,v:any)=> s+Number(v.qte||1),0);
      const conso = qteVendue * Number(rec.qte_necessaire||0);
      totalQte+=conso; totalPlats+=qteVendue;
      details.push({menu_nom:menu.nom, qte_necessaire:rec.qte_necessaire, unite:rec.unite, qteVendue, conso});
    });
    return {totalQte, totalPlats, details, nbPlats:recs.length};
  };

  const filteredMats = mats.filter((m:any)=>{
    const {totalQte}=getConso(m.id);
    const stockRestant = Number(m.quantite) - totalQte;
    const seuil = Number(m.seuil_alerte||2);
    if(filter==='alerte') return stockRestant <= seuil;
    if(filter==='ok') return stockRestant > seuil;
    return true;
  });

  const handleMouvement = async ()=>{
    if(!selected || !qteMouvement) return;
    const qte = parseFloat(qteMouvement);
    if(!qte) return;
    const newQte = typeMouvement==='entree' ? Number(selected.quantite)+qte : Number(selected.quantite)-qte;
    if(newQte<0) return alert('Stock maymkanch ywali <0');
    await supabase.from('matiere_premiere').update({quantite:newQte}).eq('id',selected.id);
    try{ await supabase.from('stock_mouvements').insert([{matiere_id:selected.id, type:typeMouvement, quantite:qte, ancien_stock:selected.quantite, nouveau_stock:newQte, motif, date: new Date().toISOString()}]); }catch{}
    setQteMouvement(''); setMotif(''); setSelected({...selected, quantite:newQte}); load();
    alert(`${typeMouvement==='entree'?'Dakhal':'Kharaj'} ${qte} ${selected.unite} - Stock daba ${newQte} ${selected.unite}`);
  };

  return <div className="space-y-4">
    <div className="flex gap-2">
      <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-3 text-sm font-bold"/>
      <button onClick={()=>{setEdit(null);setShowAdd(true);}} className="bg-orange-600 px-4 rounded-xl font-black text-sm">+ MATIERE</button>
    </div>
    <div className="grid grid-cols-3 gap-2">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center"><div className="text-[10px] text-zinc-500">TOTAL MATIERES</div><div className="font-black text-xl">{mats.length}</div></div>
      <div className="bg-red-950/30 border border-red-800 rounded-xl p-3 text-center"><div className="text-[10px] text-red-400">ALERTE STOCK</div><div className="font-black text-xl text-red-400">{mats.filter((m:any)=>{const {totalQte}=getConso(m.id); return (Number(m.quantite)-totalQte) <= Number(m.seuil_alerte||2)}).length}</div></div>
      <div className="bg-green-950/30 border border-green-800 rounded-xl p-3 text-center"><div className="text-[10px] text-green-400">CONSOMMATION {date}</div><div className="font-black text-sm text-green-400">{mats.reduce((s:any,m:any)=>s+getConso(m.id).totalQte,0).toFixed(0)} unités</div></div>
    </div>
    <div className="flex gap-2">
      <button onClick={()=>setFilter('all')} className={`flex-1 py-2 rounded-xl text-xs font-bold ${filter==='all'?'bg-white text-black':'bg-zinc-800'}`}>TOUT ({mats.length})</button>
      <button onClick={()=>setFilter('alerte')} className={`flex-1 py-2 rounded-xl text-xs font-bold ${filter==='alerte'?'bg-red-600 text-white':'bg-zinc-800 text-red-400'}`}>⚠️ ALERTE</button>
      <button onClick={()=>setFilter('ok')} className={`flex-1 py-2 rounded-xl text-xs font-bold ${filter==='ok'?'bg-green-600 text-white':'bg-zinc-800 text-green-400'}`}>✅ OK</button>
    </div>
    <div className="space-y-2">
      {filteredMats.map((m:any)=>{
        const {totalQte, totalPlats, nbPlats}=getConso(m.id);
        const restant = Number(m.quantite) - totalQte;
        const seuil = Number(m.seuil_alerte||2);
        const isAlerte = restant <= seuil;
        const isCritique = restant <= 0;
        return (
          <div key={m.id} onClick={()=>setSelected(m)} className={`bg-zinc-900 p-4 rounded-xl border-2 cursor-pointer ${isCritique?'border-red-600 bg-red-950/20':isAlerte?'border-orange-600 bg-orange-950/10':selected?.id===m.id?'border-orange-500':'border-zinc-800'}`}>
            <div className="flex justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2"><span className="font-black text-white">{m.nom}</span>{isCritique && <span className="bg-red-600 text-white text-[9px] px-2 py-1 rounded-full font-black">RUPTURE</span>}{isAlerte && !isCritique && <span className="bg-orange-600 text-white text-[9px] px-2 py-1 rounded-full font-black">ALERTE</span>}</div>
                <div className="text-xs mt-1 flex gap-3"><span className="text-zinc-400">Stock: <b className="text-white">{Number(m.quantite).toFixed(1)} {m.unite}</b></span><span className="text-orange-400">Tkal lyum: <b>{totalQte.toFixed(1)} {m.unite}</b></span><span className={restant<=seuil?'text-red-400 font-black':'text-green-400'}>B9a: <b>{restant.toFixed(1)} {m.unite}</b></span></div>
                <div className="text-[11px] text-zinc-500 mt-1">{nbPlats} plats • {totalPlats} plats tba3o lyum • Seuil: {seuil} {m.unite}</div>
              </div>
              <div className="flex flex-col gap-1"><button onClick={(e)=>{e.stopPropagation(); setEdit(m); setShowAdd(true);}} className="p-2 bg-zinc-800 rounded-lg"><Edit3 className="w-4 h-4"/></button></div>
            </div>
          </div>
        )
      })}
    </div>
    {selected && (
      <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 overflow-auto">
        <div className="bg-zinc-900 rounded-2xl w-full max-w-lg border-2 border-orange-500 max-h-[90vh] overflow-auto">
          <div className="p-4 border-b border-zinc-800 flex justify-between sticky top-0 bg-zinc-900 z-10">
            <div><h3 className="font-black text-lg flex items-center gap-2"><Package className="w-5 h-5 text-orange-500"/>{selected.nom}</h3><div className="text-xs text-zinc-400">Stock: {selected.quantite} {selected.unite} • Seuil: {selected.seuil_alerte||2} {selected.unite}</div></div>
            <button onClick={()=>setSelected(null)}><X className="w-6 h-6"/></button>
          </div>
          <div className="p-4 space-y-4">
            <div className="bg-black rounded-xl p-4 border border-zinc-800">
              <h4 className="font-black text-sm mb-3 flex items-center gap-2"><Plus className="w-4 h-4"/> GESTION STOCK</h4>
              <div className="flex gap-2 mb-3"><button onClick={()=>setTypeMouvement('entree')} className={`flex-1 py-3 rounded-xl font-black text-sm ${typeMouvement==='entree'?'bg-green-600 text-white':'bg-zinc-800'}`}>+ ENTRÉE</button><button onClick={()=>setTypeMouvement('sortie')} className={`flex-1 py-3 rounded-xl font-black text-sm ${typeMouvement==='sortie'?'bg-red-600 text-white':'bg-zinc-800'}`}>- SORTIE</button></div>
              <div className="flex gap-2 mb-2"><input value={qteMouvement} onChange={e=>setQteMouvement(e.target.value)} type="number" placeholder={`Qte ${selected.unite}`} className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-3 text-center font-bold"/><button onClick={handleMouvement} className={`px-6 rounded-xl font-black ${typeMouvement==='entree'?'bg-green-600':'bg-red-600'}`}>{typeMouvement==='entree'?'+':'-'}</button></div>
              <input value={motif} onChange={e=>setMotif(e.target.value)} placeholder="Motif" className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm"/>
            </div>
            <div>
              {(()=>{
                const {totalQte, totalPlats, details}=getConso(selected.id);
                return <>
                  <div className="grid grid-cols-3 gap-2 mb-3"><div className="bg-black rounded-xl p-3 border border-zinc-800 text-center"><div className="text-[10px] text-zinc-500">PLATS</div><div className="font-black text-lg">{details.length}</div></div><div className="bg-black rounded-xl p-3 border border-green-800 text-center"><div className="text-[10px] text-green-400">TBA3O</div><div className="font-black text-lg text-green-400">{totalPlats}</div></div><div className="bg-black rounded-xl p-3 border border-orange-800 text-center"><div className="text-[10px] text-orange-400">TKAL</div><div className="font-black text-lg text-orange-400">{totalQte.toFixed(1)} {selected.unite}</div></div></div>
                  <h4 className="font-black text-sm mb-2">📋 Les repas li tkalo:</h4>
                  {details.map((d:any,i:any)=><div key={i} className="bg-black rounded-xl p-3 border border-zinc-800 mb-2"><div className="flex justify-between"><span className="font-bold text-sm">{d.menu_nom}</span><span className={`text-xs px-2 py-1 rounded-full font-bold ${d.qteVendue>0?'bg-green-600':'bg-zinc-700'}`}>{d.qteVendue} x</span></div><div className="text-xs text-zinc-400 mt-1 flex justify-between"><span>{d.qte_necessaire} {d.unite}/plat</span><span className="font-bold text-orange-400">{d.conso.toFixed(1)} {d.unite}</span></div></div>)}
                  <div className="bg-orange-950/30 border border-orange-700 rounded-xl p-3 mt-3"><div className="text-sm text-white">Stock: <b>{selected.quantite} {selected.unite}</b> - Tkal: <b>{totalQte.toFixed(1)}</b> - B9a: <b>{(Number(selected.quantite)-totalQte).toFixed(1)} {selected.unite}</b></div></div>
                </>
              })()}
            </div>
            <button onClick={()=>setSelected(null)} className="w-full bg-white text-black py-3 rounded-xl font-black">Sedd</button>
          </div>
        </div>
      </div>
    )}
    {showAdd&&<MatiereFormStock mat={edit} onClose={()=>{setShowAdd(false);setEdit(null);}} onSaved={()=>{load(); setShowAdd(false); setEdit(null);}}/>}
  </div>
}

function MatiereFormStock({mat,onClose,onSaved}:any){
  const [nom,setNom]=useState(mat?.nom||'');
  const [qte,setQte]=useState(mat?String(mat.quantite):'10');
  const [unite,setUnite]=useState(mat?.unite||'kg');
  const [seuil,setSeuil]=useState(mat?String(mat.seuil_alerte||2):'2');
  const save=async()=>{
    const p={nom,quantite:parseFloat(qte)||0,unite,seuil_alerte:parseFloat(seuil)||2};
    if(mat) await supabase.from('matiere_premiere').update(p).eq('id',mat.id);
    else await supabase.from('matiere_premiere').insert(p);
    onSaved();
  };
  return <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"><div className="bg-zinc-900 rounded-2xl w-full max-w-md border border-zinc-800 p-5 space-y-3"><h3 className="font-black">{mat?'Modifier':'Nouvelle'} Matière</h3><input value={nom} onChange={e=>setNom(e.target.value)} placeholder="Nom" className="w-full bg-black p-3 rounded-xl border border-zinc-700"/><div className="flex gap-2"><input value={qte} onChange={e=>setQte(e.target.value)} type="number" className="flex-1 bg-black p-3 rounded-xl border border-zinc-700"/><select value={unite} onChange={e=>setUnite(e.target.value)} className="w-24 bg-black p-3 rounded-xl border border-zinc-700"><option>kg</option><option>g</option><option>L</option><option>ml</option><option>pcs</option></select></div><input value={seuil} onChange={e=>setSeuil(e.target.value)} type="number" placeholder="Seuil" className="w-full bg-black p-3 rounded-xl border border-zinc-700"/><div className="flex gap-2"><button onClick={onClose} className="flex-1 bg-zinc-800 py-3 rounded-xl">Annuler</button><button onClick={save} className="flex-1 bg-orange-600 py-3 rounded-xl font-bold">Sauver</button></div></div></div>
}

function TablesTab(){
  const [items,setItems]=useState<any[]>([]);
  const [numero,setNumero]=useState('');
  const [etage,setEtage]=useState('RDC');
  const load=useCallback(async()=>{const {data}=await supabase.from('tables').select('*').order('etage').order('numero');setItems(data||[]);},[]);
  useEffect(()=>{load();},[load]);
  const save=async()=>{if(!numero)return;await supabase.from('tables').insert([{numero:Number(numero),etage,statut:'libre'}]);setNumero('');load();};
  const del=async(id:any)=>{if(!confirm('Supprimer?'))return;await supabase.from('tables').delete().eq('id',id);load();};
  return(<div><div className="flex gap-2 mb-4 bg-zinc-900 p-3 rounded-xl"><input placeholder="N°" type="number" value={numero} onChange={e=>setNumero(e.target.value)} className="bg-black border border-zinc-700 rounded-xl px-3 py-3 w-20 text-center font-bold"/><select value={etage} onChange={e=>setEtage(e.target.value)} className="bg-black border border-zinc-700 rounded-xl px-3 py-3 flex-1 font-bold"><option value="RDC">RDC</option><option value="1er">1er Étage</option><option value="Emporte">Emporte</option><option value="GLOVO">GLOVO</option></select><button onClick={save} className="bg-orange-600 px-5 rounded-xl font-black">+ AJOUTER</button></div><div className="grid grid-cols-3 gap-2">{items.map((t:any)=><div key={t.id} className="bg-zinc-900 p-3 rounded-xl text-center"><div className="font-black">T{t.numero} - {t.etage}</div><button onClick={()=>del(t.id)} className="text-red-400 text-xs mt-1">X</button></div>)}</div></div>);
}

// ===== MENU TAB JDID - FIHA PRIX NORMAL + PRIX GLOVO =====
function MenuTab(){
  const [menus,setMenus]=useState<any[]>([]);
  const [cats,setCats]=useState<any[]>([]);
  const [mats,setMats]=useState<any[]>([]);
  const [rec,setRec]=useState<any[]>([]);
  const [show,setShow]=useState(false);
  const [edit,setEdit]=useState<any>(null);
  const load=useCallback(async()=>{const a=await supabase.from('menu').select('*').order('nom');const b=await supabase.from('categories').select('*').order('ordre');const c=await supabase.from('matiere_premiere').select('*').order('nom');const d=await supabase.from('recette').select('*');setMenus(a.data||[]);setCats(b.data||[]);setMats(c.data||[]);setRec(d.data||[]);},[]);
  useEffect(()=>{load();},[load]);
  return <div><div className="flex justify-between mb-3"><h2 className="font-bold">Menu {menus.length} - Normal + Glovo</h2><button onClick={()=>{setEdit(null);setShow(true);}} className="bg-orange-600 px-4 py-2 rounded-xl font-bold">+ Plat</button></div><div className="grid md:grid-cols-2 gap-3">{menus.map((m:any)=>{const ings=rec.filter((r:any)=>r.menu_id===m.id);return <div key={m.id} className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden"><div className="h-40 bg-zinc-800">{m.image_url?<img src={m.image_url} className="w-full h-full object-cover"/>:<div className="h-full flex items-center justify-center text-xs text-zinc-500">Sans photo</div>}</div><div className="p-3"><div className="flex justify-between"><div><div className="font-bold">{m.nom}</div><div className="text-xs"><span className="text-white">{m.prix} DH Normal</span> {m.prix_glovo?<span className="text-yellow-400 ml-2">| {m.prix_glovo} DH Glovo 💰</span>:<span className="text-zinc-500 ml-2">| Glovo auto +30%</span>}</div><div className="text-[10px] text-zinc-500 mt-1">{ings.length} ingrédients • {m.categorie}</div></div><div className="flex gap-1"><button onClick={()=>{setEdit(m);setShow(true);}} className="p-2 bg-zinc-800 rounded-lg"><Edit3 className="w-4 h-4"/></button><button onClick={async()=>{if(confirm('Supprimer?')){await supabase.from('menu').delete().eq('id',m.id);load();}}} className="p-2 bg-red-900 rounded-lg"><Trash2 className="w-4 h-4"/></button></div></div></div></div>})}</div>{show&&<MenuForm menu={edit} categories={cats} matieres={mats} recs={rec.filter((r:any)=>r.menu_id===edit?.id)} onClose={()=>{setShow(false);setEdit(null);}} onSaved={load}/>}</div>
}

function MenuForm({menu,categories,matieres,recs,onClose,onSaved}:any){
  const [nom,setNom]=useState(menu?.nom||'');
  const [prix,setPrix]=useState(menu?String(menu.prix):'');
  const [prixGlovo,setPrixGlovo]=useState(menu?.prix_glovo?String(menu.prix_glovo):'');
  const [cat,setCat]=useState(menu?.categorie||categories[0]?.nom||'');
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
    if(!prixG || prixG<=0) prixG = Math.round(prixNormal*1.3); // auto +30% ila ma 3martich Glovo
    const p={nom,prix:prixNormal,prix_glovo:prixG,categorie:cat,image_url:img,disponible:true};
    let id=menu?.id;
    if(menu){await supabase.from('menu').update(p).eq('id',menu.id);}
    else{const {data}=await supabase.from('menu').insert(p).select().single(); id=data?.id;}
    if(id){await supabase.from('recette').delete().eq('menu_id',id); if(ings.length){await supabase.from('recette').insert(ings.map((x:any)=>({menu_id:id, matiere_id:x.matiere_id, qte_necessaire:x.qte_necessaire, unite:x.unite})));}}
    onSaved(); onClose();
  };
  return <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"><div className="bg-zinc-900 rounded-2xl w-full max-w-lg border border-zinc-800"><div className="p-4 flex justify-between border-b border-zinc-800"><h3 className="font-bold">Plat - {ings.length} ing - 2 Prix</h3><button onClick={onClose}><X className="w-5 h-5"/></button></div><div className="p-4 space-y-3 max-h-[75vh] overflow-auto">
    <input value={nom} onChange={e=>setNom(e.target.value)} placeholder="Nom du plat" className="w-full bg-black p-3 rounded-xl border border-zinc-700"/>
    <div className="grid grid-cols-2 gap-2">
      <div><label className="text-[10px] text-zinc-400 font-bold">PRIX NORMAL (RDC/1er/Emporte)</label><input value={prix} onChange={e=>setPrix(e.target.value)} type="number" placeholder="Ex: 30" className="w-full bg-black p-3 rounded-xl border border-zinc-700 mt-1"/><div className="text-[9px] text-zinc-500 mt-1">RDC / 1er / Emporte</div></div>
      <div><label className="text-[10px] text-yellow-400 font-black">PRIX GLOVO 💰 (+ cher)</label><input value={prixGlovo} onChange={e=>setPrixGlovo(e.target.value)} type="number" placeholder="Ex: 40 - Auto +30% si vide" className="w-full bg-yellow-950/30 border-2 border-yellow-600 p-3 rounded-xl mt-1 text-yellow-300 font-bold"/><div className="text-[9px] text-yellow-500 mt-1">Glovo - ila khlitiha khawya, auto +30%</div></div>
    </div>
    <select value={cat} onChange={e=>setCat(e.target.value)} className="w-full bg-black p-3 rounded-xl border border-zinc-700">{categories.map((c:any)=><option key={c.id} value={c.nom}>{c.label}</option>)}</select>
    <div className="bg-black border border-zinc-700 rounded-xl p-3"><div className="text-xs font-bold mb-2">Recette - Matières ({ings.length})</div><div className="flex gap-2 mb-2"><select value={sel} onChange={e=>{setSel(e.target.value); const mat=matieres.find((m:any)=>m.id===e.target.value); if(mat) setUnite(mat.unite);}} className="flex-1 bg-zinc-900 p-2.5 rounded-xl border border-zinc-700 text-xs"><option value="">Choisir matière</option>{matieres.filter((m:any)=>!ings.some((i:any)=>i.matiere_id===m.id)).map((m:any)=><option key={m.id} value={m.id}>{m.nom} ({m.quantite} {m.unite})</option>)}</select><input value={qte} onChange={e=>setQte(e.target.value)} type="number" className="w-20 bg-zinc-900 p-2.5 rounded-xl border border-zinc-700 text-xs"/><select value={unite} onChange={e=>setUnite(e.target.value)} className="w-16 bg-zinc-900 p-2.5 rounded-xl border border-zinc-700 text-xs"><option>g</option><option>kg</option><option>ml</option><option>L</option><option>pcs</option></select><button onClick={addIng} className="bg-orange-600 px-3 rounded-xl text-xs font-bold">+</button></div>{ings.map((ing:any,i:any)=><div key={i} className="flex justify-between bg-zinc-900 p-2 rounded-lg text-xs mb-1"><span>{ing._nom||matieres.find((m:any)=>m.id===ing.matiere_id)?.nom} - {ing.qte_necessaire} {ing.unite}</span><button onClick={()=>setIngs(ings.filter((_:any,idx:any)=>idx!==i))} className="text-red-400">X</button></div>)}</div>
    <div className="bg-black border-2 border-dashed border-orange-500/40 rounded-xl p-3"><label className="text-xs text-orange-400 font-bold flex items-center gap-1 mb-2"><ImageIcon className="w-4 h-4"/> PHOTO</label><div className="flex gap-2 items-center"><label className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-center cursor-pointer flex items-center justify-center gap-2"><Upload className="w-4 h-4"/><span className="text-sm font-bold">{uploading?'Upload...':'Choisir'}</span><input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" /></label>{preview && <img src={preview} className="w-16 h-16 rounded-xl object-cover border-2 border-orange-500" />}</div></div>
  </div><div className="p-4 border-t border-zinc-800 flex gap-2"><button onClick={onClose} className="flex-1 bg-zinc-800 py-3 rounded-xl">Annuler</button><button onClick={save} className="flex-1 bg-orange-600 py-3 rounded-xl font-bold">Sauver {prix} DH / {prixGlovo||Math.round((parseFloat(prix)||0)*1.3)} DH Glovo</button></div></div></div>
}

function CategoriesTab(){const [cats,setCats]=useState<any[]>([]);const [show,setShow]=useState(false);const [edit,setEdit]=useState<any>(null);const load=useCallback(async()=>{const {data}=await supabase.from('categories').select('*').order('ordre');setCats(data||[]);},[]);useEffect(()=>{load();},[load]);return <div><div className="flex justify-between mb-2"><h2 className="font-bold">Categories</h2><button onClick={()=>{setEdit(null);setShow(true);}} className="bg-orange-600 px-3 py-2 rounded-xl">+ Cat</button></div>{cats.map((c:any)=><div key={c.id} className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 flex justify-between mb-2"><div><div className="font-bold">{c.label}</div><div className="text-xs text-zinc-500">{c.nom}</div></div><div className="flex gap-1"><button onClick={()=>{setEdit(c);setShow(true);}} className="p-2 bg-zinc-800 rounded-lg"><Edit3 className="w-4 h-4"/></button><button onClick={async()=>{if(confirm('Supprimer?')){await supabase.from('categories').delete().eq('id',c.id);load();}}} className="p-2 bg-red-900 rounded-lg"><Trash2 className="w-4 h-4"/></button></div></div>)}{show&&<CatForm cat={edit} onClose={()=>{setShow(false);setEdit(null);}} onSaved={load}/>}</div>}
function CatForm({cat,onClose,onSaved}:any){const [nom,setNom]=useState(cat?.nom||'');const [label,setLabel]=useState(cat?.label||'');const save=async()=>{if(!nom||!label) return alert('Nom+Label');const p={nom:nom.toLowerCase().replace(/\s/g,'_'),label,ordre:1};if(cat) await supabase.from('categories').update(p).eq('id',cat.id);else await supabase.from('categories').insert(p);onSaved();onClose();};return <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"><div className="bg-zinc-900 rounded-2xl w-full max-w-md border border-zinc-800 p-5 space-y-3"><input value={label} onChange={e=>{setLabel(e.target.value);if(!cat) setNom(e.target.value.toLowerCase().replace(/\s/g,'_'));}} placeholder="Label" className="w-full bg-black p-3 rounded-xl border border-zinc-700"/><input value={nom} onChange={e=>setNom(e.target.value)} placeholder="nom" className="w-full bg-black p-3 rounded-xl border border-zinc-700 text-xs"/><div className="flex gap-2"><button onClick={onClose} className="flex-1 bg-zinc-800 py-3 rounded-xl">Annuler</button><button onClick={save} className="flex-1 bg-orange-600 py-3 rounded-xl font-bold">Sauver</button></div></div></div>}
function UsersTab(){const [users,setUsers]=useState<any[]>([]);const [show,setShow]=useState(false);const [edit,setEdit]=useState<any>(null);const load=useCallback(async()=>{const {data}=await supabase.from('utilisateurs').select('*').order('created_at',{ascending:false});setUsers(data||[]);},[]);useEffect(()=>{load();},[load]);return <div><div className="flex justify-between mb-3"><h2 className="font-bold">Users {users.length}</h2><button onClick={()=>{setEdit(null);setShow(true);}} className="bg-orange-600 px-4 py-2 rounded-xl font-bold">+ User</button></div>{users.map((u:any)=><div key={u.id} className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 flex justify-between mb-2"><div><div className="font-bold">{u.nom} <span className="text-xs bg-zinc-800 px-2 py-1 rounded-lg ml-2">{u.role}</span></div><div className="text-xs text-zinc-500">ID: {u.identifiant} | {u.code_acces}</div></div><div className="flex gap-1"><button onClick={()=>{setEdit(u);setShow(true);}} className="p-2.5 bg-zinc-800 rounded-xl"><Edit3 className="w-4 h-4"/></button><button onClick={async()=>{if(confirm('Supprimer?')){await supabase.from('utilisateurs').delete().eq('id',u.id);load();}}} className="p-2.5 bg-red-900 rounded-xl"><Trash2 className="w-4 h-4"/></button></div></div>)}{show&&<UserForm user={edit} onClose={()=>{setShow(false);setEdit(null);}} onSaved={load}/>}</div>}
function UserForm({user,onClose,onSaved}:any){const [nom,setNom]=useState(user?.nom||'');const [ident,setIdent]=useState(user?.identifiant||'');const [code,setCode]=useState(user?.code_acces||'');const [role,setRole]=useState(user?.role||'serveur');const save=async()=>{ if(!nom||!ident||!code) return alert('3amar'); const payload:any={ nom, identifiant: ident.trim(), code_acces: code.trim(), role }; let error; if(user){ const res=await supabase.from('utilisateurs').update(payload).eq('id',user.id); error=res.error; } else { const res=await supabase.from('utilisateurs').insert(payload); error=res.error; } if(error){ alert(error.message); return; } onSaved(); onClose(); };return <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"><div className="bg-zinc-900 rounded-2xl w-full max-w-md border border-zinc-800 p-5 space-y-3"><div className="flex justify-between"><h3 className="font-bold">{user?'Modifier':'Nouveau'} User</h3><button onClick={onClose}><X className="w-5 h-5"/></button></div><input value={nom} onChange={e=>setNom(e.target.value)} placeholder="Nom" className="w-full bg-black p-3.5 rounded-xl border border-zinc-700"/><input value={ident} onChange={e=>setIdent(e.target.value)} placeholder="Identifiant" className="w-full bg-black p-3.5 rounded-xl border border-zinc-700"/><input value={code} onChange={e=>setCode(e.target.value)} placeholder="Code" className="w-full bg-black p-3.5 rounded-xl border border-zinc-700"/><select value={role} onChange={e=>setRole(e.target.value)} className="w-full bg-black p-3.5 rounded-xl border border-zinc-700"><option value="admin">admin</option><option value="serveur">serveur</option><option value="cuisine">cuisine</option><option value="caisse">caisse</option></select><div className="flex gap-2"><button onClick={onClose} className="flex-1 bg-zinc-800 py-3.5 rounded-xl">Annuler</button><button onClick={save} className="flex-1 bg-orange-600 py-3.5 rounded-xl font-bold">Sauver</button></div></div></div>}

function RapportsTab(){
  const [date,setDate]=useState(new Date().toISOString().split('T')[0]);
  const [cmds,setCmds]=useState<any[]>([]);
  const [annules,setAnnules]=useState<any[]>([]);
  const [itemsMap,setItemsMap]=useState<any>({});
  const [annuleItemsMap,setAnnuleItemsMap]=useState<any>({});
  const [tableMap,setTableMap]=useState<any>({});
  const [loading,setLoading]=useState(true);
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
    let iMap:any={}; let aMap:any={}; let tMap:any={};
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
  useEffect(()=>{ load(); },[load]);
  const getTableLabel=(c:any)=>{ const t=tableMap[c.table_id]; if(t) return `T${t.numero} ${t.etage}`; if(c.table_numero) return `T${c.table_numero}`; return 'Table?'; };
  const getEtage=(c:any)=>{ const t=tableMap[c.table_id]; return t?.etage||'Inconnu'; };
  const stats=(()=>{
    let espece=0,tpe=0,cheque=0,offertReel=0,remiseEncaisse=0,remisePerte=0,totalReel=0,totalEncaisse=0,totalItems=0;
    let byHour:any={}; let byPlat:any={}; let byServeur:any={}; let byEtage:any={};
    cmds.forEach((c:any)=>{
      const hour=new Date(c.paye_at||c.created_at).getHours();
      byHour[hour]=(byHour[hour]||0)+Number(c.total_final??c.total??0);
      const serveur=c.serveur_nom||'Inconnu';
      byServeur[serveur]=(byServeur[serveur]||0)+Number(c.total_final??c.total??0);
      byServeur[serveur+'_count']=(byServeur[serveur+'_count']||0)+1;
      const etage=getEtage(c);
      byEtage[etage]=(byEtage[etage]||0)+Number(c.total_final??c.total??0);
      byEtage[etage+'_count']=(byEtage[etage+'_count']||0)+1;
      const method=(c.payment_method||'').toLowerCase();
      const its=itemsMap[c.id]||[];
      totalItems+=its.length;
      its.forEach((it:any)=>{
        const key=it.menu_nom||it.nom||'Autre';
        byPlat[key]=(byPlat[key]||0)+Number(it.qte||1);
        byPlat[key+'_ca']=(byPlat[key+'_ca']||0)+Number(it.qte||1)*Number(it.prix||0);
      });
      if(method==='mixte'){
        its.forEach((it:any)=>{
          const m=(it.payment_method||'espece').toLowerCase();
          const prix=Number(it.qte||1)*Number(it.prix||0);
          const perc=Number(it.remise_percent||0);
          const finalP=m==='offert'?0:m==='remise'?prix-prix*perc/100:prix;
          totalReel+=prix;
          if(m==='espece'){ espece+=finalP; totalEncaisse+=finalP; }
          else if(m==='tpe'){ tpe+=finalP; totalEncaisse+=finalP; }
          else if(m==='cheque'){ cheque+=finalP; totalEncaisse+=finalP; }
          else if(m==='offert'){ offertReel+=prix; }
          else if(m==='remise'){ remiseEncaisse+=finalP; remisePerte+=prix-finalP; totalEncaisse+=finalP; }
        });
      }else{
        const tot=Number(c.total_final??c.total??0);
        const totReel=Number(c.total??0);
        totalReel+=totReel;
        if(method==='espece'){ espece+=tot; totalEncaisse+=tot; }
        else if(method==='tpe'){ tpe+=tot; totalEncaisse+=tot; }
        else if(method==='cheque'){ cheque+=tot; totalEncaisse+=tot; }
        else if(method==='offert'){ offertReel+=totReel; }
        else if(method==='remise'){ remiseEncaisse+=tot; remisePerte+=totReel-tot; totalEncaisse+=tot; }
        else { espece+=tot; totalEncaisse+=tot; }
      }
    });
    return {espece,tpe,cheque,offertReel,remiseEncaisse,remisePerte,totalReel,totalEncaisse,totalItems,byHour,byPlat,byServeur,byEtage};
  })();
  const totalsAnnule=annules.reduce((s:any,c:any)=>{
    const its=annuleItemsMap[c.id]||[];
    const t=its.length? its.reduce((a:any,i:any)=>a+Number(i.qte||1)*Number(i.prix||0),0) : Number(c.total||0);
    return s+t;
  },0);
  const topPlats=Object.keys(stats.byPlat).filter(k=>!k.endsWith('_ca')).sort((a,b)=>stats.byPlat[b]-stats.byPlat[a]).slice(0,10);
  const topServeurs=Object.keys(stats.byServeur).filter(k=>!k.endsWith('_count')).sort((a,b)=>stats.byServeur[b]-stats.byServeur[a]);
  const topEtages=Object.keys(stats.byEtage).filter(k=>!k.endsWith('_count'));
  const hoursSorted=Object.keys(stats.byHour).sort((a,b)=>Number(a)-Number(b));
  if(loading) return <div className="p-8 text-center">Chargement...</div>;
  return <div className="space-y-4">
    <div className="flex gap-2"><input type="date" value={date} onChange={e=>setDate(e.target.value)} className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-3 font-bold"/><button onClick={load} className="bg-orange-600 px-4 rounded-xl font-black">Refresh</button></div>
    <div className="bg-gradient-to-br from-zinc-900 to-black rounded-2xl p-4 border-2 border-orange-500/30"><div className="flex justify-between items-center mb-3"><h2 className="font-black text-lg flex items-center gap-2"><BarChart3 className="w-5 h-5 text-orange-500"/> RAPPORT {date}</h2><span className="text-xs bg-zinc-800 px-2 py-1 rounded-full">{cmds.length} commandes</span></div><div className="grid grid-cols-2 gap-3"><div className="bg-black rounded-xl p-3 border border-green-800"><div className="text-[10px] text-zinc-400">CA ENCAISSÉ</div><div className="font-black text-2xl text-green-400">{stats.totalEncaisse.toFixed(0)} DH</div><div className="text-[10px] text-zinc-500">{cmds.length} tickets • {stats.totalItems} plats</div></div><div className="bg-black rounded-xl p-3 border border-zinc-700"><div className="text-[10px] text-zinc-400">CA RÉEL</div><div className="font-black text-xl text-white">{stats.totalReel.toFixed(0)} DH</div><div className="text-[10px] text-orange-400">Perte: {(stats.offertReel+stats.remisePerte).toFixed(0)} DH</div></div></div></div>
    <div className="grid grid-cols-3 gap-2"><div className="bg-green-950/40 border border-green-700 rounded-xl p-3 text-center"><div className="text-[10px] text-green-300">ESPECE</div><div className="font-black text-green-400">{stats.espece.toFixed(0)}</div></div><div className="bg-blue-950/40 border border-blue-700 rounded-xl p-3 text-center"><div className="text-[10px] text-blue-300">TPE</div><div className="font-black text-blue-400">{stats.tpe.toFixed(0)}</div></div><div className="bg-purple-950/40 border border-purple-700 rounded-xl p-3 text-center"><div className="text-[10px] text-purple-300">CHEQUE</div><div className="font-black text-purple-400">{stats.cheque.toFixed(0)}</div></div><div className="bg-yellow-950/40 border border-yellow-600 rounded-xl p-3 text-center"><div className="text-[10px] text-yellow-300">REMISE</div><div className="font-black text-yellow-400">{stats.remiseEncaisse.toFixed(0)}</div><div className="text-[9px] text-red-400">Perte {stats.remisePerte.toFixed(0)}</div></div><div className="bg-orange-950/40 border border-orange-700 rounded-xl p-3 text-center"><div className="text-[10px] text-orange-300">OFFERT</div><div className="font-black text-orange-400">{stats.offertReel.toFixed(0)}</div></div><div className="bg-red-950/50 border-2 border-red-600 rounded-xl p-3 text-center"><div className="text-[10px] text-red-300 font-black">ANNULE</div><div className="font-black text-red-400">{totalsAnnule.toFixed(0)}</div><div className="text-[9px] text-red-300">{annules.length} cmds</div></div></div>
    {hoursSorted.length>0 && (<div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800"><h3 className="font-black mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-orange-500"/> PAR HEURE</h3><div className="space-y-2">{hoursSorted.map((h:any)=>{const max=Math.max(...Object.values(stats.byHour) as any); const val=stats.byHour[h]; const pct=max? (val/max)*100 : 0; return <div key={h} className="flex items-center gap-2"><div className="w-12 text-xs font-bold">{h}h</div><div className="flex-1 bg-black rounded-full h-6 overflow-hidden"><div className="bg-orange-600 h-6 flex items-center justify-end pr-2 text-[10px] font-black" style={{width:`${pct}%`}}>{val.toFixed(0)} DH</div></div></div>})}</div></div>)}
    {topPlats.length>0 && (<div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800"><h3 className="font-black mb-3 flex items-center gap-2"><Utensils className="w-4 h-4 text-green-500"/> TOP 10 PLATS</h3><div className="space-y-2">{topPlats.map((plat:any,i:any)=>{const qte=stats.byPlat[plat]; const ca=stats.byPlat[plat+'_ca']||0; return <div key={plat} className="flex justify-between items-center bg-black rounded-xl p-2.5 border border-zinc-800"><div className="flex items-center gap-2"><span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${i===0?'bg-yellow-500 text-black':i===1?'bg-zinc-400 text-black':i===2?'bg-orange-600 text-white':'bg-zinc-800'}`}>{i+1}</span><span className="font-bold text-sm">{plat}</span></div><div className="text-right"><div className="font-black text-white">{qte}x</div><div className="text-[10px] text-zinc-400">{ca.toFixed(0)} DH</div></div></div>})}</div></div>)}
    <div className="grid grid-cols-2 gap-3"><div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800"><h3 className="font-black mb-3 flex items-center gap-2 text-sm"><Users className="w-4 h-4 text-blue-500"/> PAR SERVEUR</h3>{topServeurs.map((s:any)=><div key={s} className="flex justify-between py-1.5 border-b border-zinc-800 last:border-0"><div><div className="font-bold text-sm">{s}</div><div className="text-[10px] text-zinc-500">{stats.byServeur[s+'_count']} cmds</div></div><div className="font-black text-sm">{stats.byServeur[s].toFixed(0)} DH</div></div>)}</div><div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800"><h3 className="font-black mb-3 flex items-center gap-2 text-sm"><MapPin className="w-4 h-4 text-purple-500"/> PAR ÉTAGE</h3>{topEtages.map((e:any)=><div key={e} className="flex justify-between py-1.5 border-b border-zinc-800 last:border-0"><div><div className="font-bold text-sm">{e}</div><div className="text-[10px] text-zinc-500">{stats.byEtage[e+'_count']} cmds</div></div><div className="font-black text-sm">{stats.byEtage[e].toFixed(0)} DH</div></div>)}</div></div>
    <h3 className="font-black text-green-400">✅ PAYÉES ({cmds.length})</h3>
    {cmds.map((c:any)=>{const its=itemsMap[c.id]||[];return (<div key={c.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 mb-3"><div className="flex justify-between items-center mb-2"><div className="flex items-center gap-2"><span className="font-black text-white">{getTableLabel(c)}</span><span className="text-xs bg-zinc-800 px-2 py-1 rounded-full">{getEtage(c)}</span><span className="text-xs text-zinc-400">{c.serveur_nom}</span></div><div className="flex items-center gap-2"><span className={`px-2 py-1 rounded-full text-[10px] font-black ${c.payment_method==='espece'?'bg-green-600':c.payment_method==='tpe'?'bg-blue-600':c.payment_method==='cheque'?'bg-purple-600':c.payment_method==='offert'?'bg-orange-600':c.payment_method==='remise'?'bg-yellow-500 text-black':'bg-white text-black'}`}>{c.payment_method?.toUpperCase()}</span><span className="font-black text-orange-400">{Number(c.total_final??c.total??0).toFixed(0)} DH</span></div></div><div className="bg-black/60 rounded-lg p-2 space-y-1">{its.map((it:any)=>{const prix=Number(it.qte||1)*Number(it.prix||0); const m=(it.payment_method||'').toLowerCase(); const perc=Number(it.remise_percent||0); const finalP=m==='offert'?0:m==='remise'?prix-prix*perc/100:prix; return <div key={it.id} className="flex justify-between text-sm py-1 border-b border-zinc-800/50 last:border-0"><span className="text-white">{it.qte}x {it.menu_nom||it.nom}</span><span className="text-zinc-400">{c.payment_method==='mixte'?`${finalP.toFixed(0)}`:`${prix.toFixed(0)}`} DH</span></div>})}</div></div>)})}
  </div>
}
