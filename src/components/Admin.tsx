// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Edit3, Trash2, X, Image as ImageIcon, Upload } from 'lucide-react';

export default function Admin(){
  const [tab,setTab]=useState('rapports');
  return(
    <div className="min-h-screen bg-black text-white pb-20">
      <div className="flex gap-1 p-2 border-b border-zinc-800 sticky top-0 bg-black z-20 overflow-x-auto">
        {['menu','matiere','stock','categories','tables','users','rapports'].map((t)=><button key={t} onClick={()=>setTab(t)} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap ${tab===t?'bg-orange-600':'bg-zinc-800'}`}>{t.toUpperCase()}</button>)}
      </div>
      <div className="p-4 max-w-5xl mx-auto">
        {tab==='menu'&&<MenuTab/>}{tab==='matiere'&&<MatiereTab/>}{tab==='stock'&&<StockTab/>}{tab==='categories'&&<CategoriesTab/>}{tab==='tables'&&<TablesTab/>}{tab==='users'&&<UsersTab/>}{tab==='rapports'&&<RapportsTab/>}
      </div>
    </div>
  );
}

function TablesTab(){
  const [items,setItems]=useState<any[]>([]);
  const [numero,setNumero]=useState('');
  const [etage,setEtage]=useState('RDC');
  const load=useCallback(async()=>{const {data}=await supabase.from('tables').select('*').order('etage').order('numero');setItems(data||[]);},[]);
  useEffect(()=>{load();},[load]);
  const save=async()=>{if(!numero)return;await supabase.from('tables').insert([{numero:Number(numero),etage,statut:'libre'}]);setNumero('');load();};
  const del=async(id:any)=>{if(!confirm('Supprimer?'))return;await supabase.from('tables').delete().eq('id',id);load();};
  return(<div><div className="flex gap-2 mb-4 bg-zinc-900 p-3 rounded-xl">
  <input placeholder="N°" type="number" value={numero} onChange={e=>setNumero(e.target.value)} className="bg-black border border-zinc-700 rounded-xl px-3 py-3 w-20 text-center font-bold"/>
  <select value={etage} onChange={e=>setEtage(e.target.value)} className="bg-black border border-zinc-700 rounded-xl px-3 py-3 flex-1 font-bold"><option value="RDC">RDC</option><option value="1er">1er Étage</option><option value="Emporte">Emporte</option><option value="GLOVO">GLOVO</option></select>
  <button onClick={save} className="bg-orange-600 px-5 rounded-xl font-black">+ AJOUTER</button></div>
  <div className="grid grid-cols-3 gap-2">{items.map((t:any)=><div key={t.id} className="bg-zinc-900 p-3 rounded-xl text-center"><div className="font-black">T{t.numero} - {t.etage}</div><button onClick={()=>del(t.id)} className="text-red-400 text-xs mt-1">X</button></div>)}</div>
  </div>);
}

function MenuTab(){
  const [menus,setMenus]=useState<any[]>([]);
  const [cats,setCats]=useState<any[]>([]);
  const [mats,setMats]=useState<any[]>([]);
  const [rec,setRec]=useState<any[]>([]);
  const [show,setShow]=useState(false);
  const [edit,setEdit]=useState<any>(null);
  const load=useCallback(async()=>{const a=await supabase.from('menu').select('*').order('nom');const b=await supabase.from('categories').select('*').order('ordre');const c=await supabase.from('matiere_premiere').select('*').order('nom');const d=await supabase.from('recette').select('*');setMenus(a.data||[]);setCats(b.data||[]);setMats(c.data||[]);setRec(d.data||[]);},[]);
  useEffect(()=>{load();},[load]);
  return <div><div className="flex justify-between mb-3"><h2 className="font-bold">Menu {menus.length}</h2><button onClick={()=>{setEdit(null);setShow(true);}} className="bg-orange-600 px-4 py-2 rounded-xl font-bold">+ Plat</button></div><div className="grid md:grid-cols-2 gap-3">{menus.map((m:any)=>{const ings=rec.filter((r:any)=>r.menu_id===m.id);return <div key={m.id} className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden"><div className="h-40 bg-zinc-800">{m.image_url?<img src={m.image_url} className="w-full h-full object-cover"/>:<div className="h-full flex items-center justify-center text-xs text-zinc-500">Sans photo</div>}</div><div className="p-3"><div className="flex justify-between"><div><div className="font-bold">{m.nom} - {m.prix} DH</div></div><div className="flex gap-1"><button onClick={()=>{setEdit(m);setShow(true);}} className="p-2 bg-zinc-800 rounded-lg"><Edit3 className="w-4 h-4"/></button><button onClick={async()=>{if(confirm('Supprimer?')){await supabase.from('menu').delete().eq('id',m.id);load();}}} className="p-2 bg-red-900 rounded-lg"><Trash2 className="w-4 h-4"/></button></div></div></div></div>})}</div>{show&&<MenuForm menu={edit} categories={cats} matieres={mats} recs={rec.filter((r:any)=>r.menu_id===edit?.id)} onClose={()=>{setShow(false);setEdit(null);}} onSaved={load}/>}</div>
}

function MenuForm({menu,categories,matieres,recs,onClose,onSaved}:any){
  const [nom,setNom]=useState(menu?.nom||'');
  const [prix,setPrix]=useState(menu?String(menu.prix):'');
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
  const save=async()=>{if(!nom||!prix) return alert('Nom + Prix'); const p={nom,prix:parseFloat(prix)||0,categorie:cat,image_url:img,disponible:true}; let id=menu?.id; if(menu){await supabase.from('menu').update(p).eq('id',menu.id);}else{const {data}=await supabase.from('menu').insert(p).select().single(); id=data?.id;} if(id){await supabase.from('recette').delete().eq('menu_id',id); if(ings.length){await supabase.from('recette').insert(ings.map((x:any)=>({menu_id:id, matiere_id:x.matiere_id, qte_necessaire:x.qte_necessaire, unite:x.unite})));}} onSaved(); onClose();};
  return <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"><div className="bg-zinc-900 rounded-2xl w-full max-w-lg border border-zinc-800"><div className="p-4 flex justify-between border-b border-zinc-800"><h3 className="font-bold">Plat - {ings.length} ing</h3><button onClick={onClose}><X className="w-5 h-5"/></button></div><div className="p-4 space-y-3 max-h-[75vh] overflow-auto"><input value={nom} onChange={e=>setNom(e.target.value)} placeholder="Nom" className="w-full bg-black p-3 rounded-xl border border-zinc-700"/><div className="flex gap-2"><input value={prix} onChange={e=>setPrix(e.target.value)} type="number" placeholder="Prix" className="flex-1 bg-black p-3 rounded-xl border border-zinc-700"/><select value={cat} onChange={e=>setCat(e.target.value)} className="flex-1 bg-black p-3 rounded-xl border border-zinc-700">{categories.map((c:any)=><option key={c.id} value={c.nom}>{c.label}</option>)}</select></div><div className="bg-black border-2 border-dashed border-orange-500/40 rounded-xl p-3"><label className="text-xs text-orange-400 font-bold flex items-center gap-1 mb-2"><ImageIcon className="w-4 h-4"/> PHOTO</label><div className="flex gap-2 items-center"><label className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-center cursor-pointer flex items-center justify-center gap-2"><Upload className="w-4 h-4"/><span className="text-sm font-bold">{uploading?'Upload...':'Choisir'}</span><input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" /></label>{preview && <img src={preview} className="w-16 h-16 rounded-xl object-cover border-2 border-orange-500" />}</div><input value={img} onChange={e=>{setImg(e.target.value); setPreview(e.target.value);}} placeholder="Ou URL" className="mt-2 w-full bg-zinc-900 p-2.5 rounded-xl border border-zinc-700 text-xs" /></div></div><div className="p-4 border-t border-zinc-800 flex gap-2"><button onClick={onClose} className="flex-1 bg-zinc-800 py-3 rounded-xl">Annuler</button><button onClick={save} className="flex-1 bg-orange-600 py-3 rounded-xl font-bold">Sauver {ings.length}</button></div></div></div>
}

function MatiereTab(){const [mats,setMats]=useState<any[]>([]);const [show,setShow]=useState(false);const [edit,setEdit]=useState<any>(null);const load=useCallback(async()=>{const {data}=await supabase.from('matiere_premiere').select('*').order('nom');setMats(data||[]);},[]);useEffect(()=>{load();},[load]);return <div><div className="flex justify-between mb-2"><h2 className="font-bold">Matiere {mats.length}</h2><button onClick={()=>{setEdit(null);setShow(true);}} className="bg-orange-600 px-3 py-2 rounded-xl">+ Matiere</button></div>{mats.map((m:any)=><div key={m.id} className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 flex justify-between mb-2"><div><div className="font-bold">{m.nom}</div><div className="text-xs text-zinc-500">{m.quantite} {m.unite}</div></div><div className="flex gap-1"><button onClick={()=>{setEdit(m);setShow(true);}} className="p-2 bg-zinc-800 rounded-lg"><Edit3 className="w-4 h-4"/></button><button onClick={async()=>{if(confirm('Supprimer?')){await supabase.from('matiere_premiere').delete().eq('id',m.id);load();}}} className="p-2 bg-red-900 rounded-lg"><Trash2 className="w-4 h-4"/></button></div></div>)}{show&&<MatiereForm mat={edit} onClose={()=>{setShow(false);setEdit(null);}} onSaved={load}/>}</div>}
function MatiereForm({mat,onClose,onSaved}:any){const [nom,setNom]=useState(mat?.nom||'');const [qte,setQte]=useState(mat?String(mat.quantite):'10');const [unite,setUnite]=useState(mat?.unite||'kg');const save=async()=>{const p={nom,quantite:parseFloat(qte)||0,unite,seuil_alerte:2};if(mat) await supabase.from('matiere_premiere').update(p).eq('id',mat.id);else await supabase.from('matiere_premiere').insert(p);onSaved();onClose();};return <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"><div className="bg-zinc-900 rounded-2xl w-full max-w-md border border-zinc-800 p-5 space-y-3"><input value={nom} onChange={e=>setNom(e.target.value)} placeholder="Nom" className="w-full bg-black p-3 rounded-xl border border-zinc-700"/><div className="flex gap-2"><input value={qte} onChange={e=>setQte(e.target.value)} type="number" className="flex-1 bg-black p-3 rounded-xl border border-zinc-700"/><select value={unite} onChange={e=>setUnite(e.target.value)} className="w-24 bg-black p-3 rounded-xl border border-zinc-700"><option>kg</option><option>g</option><option>L</option><option>ml</option><option>pcs</option></select></div><div className="flex gap-2"><button onClick={onClose} className="flex-1 bg-zinc-800 py-3 rounded-xl">Annuler</button><button onClick={save} className="flex-1 bg-orange-600 py-3 rounded-xl font-bold">Sauver</button></div></div></div>}
function StockTab(){const [mats,setMats]=useState<any[]>([]);useEffect(()=>{supabase.from('matiere_premiere').select('*').order('nom').then(({data})=>setMats(data||[]));},[]);return <div>{mats.map((m:any)=><div key={m.id} className="p-3 rounded-xl border bg-zinc-900 border-zinc-800 flex justify-between mb-2"><span>{m.nom}</span><span className="font-bold">{m.quantite} {m.unite}</span></div>)}</div>}
function CategoriesTab(){const [cats,setCats]=useState<any[]>([]);const [show,setShow]=useState(false);const [edit,setEdit]=useState<any>(null);const load=useCallback(async()=>{const {data}=await supabase.from('categories').select('*').order('ordre');setCats(data||[]);},[]);useEffect(()=>{load();},[load]);return <div><div className="flex justify-between mb-2"><h2 className="font-bold">Categories</h2><button onClick={()=>{setEdit(null);setShow(true);}} className="bg-orange-600 px-3 py-2 rounded-xl">+ Cat</button></div>{cats.map((c:any)=><div key={c.id} className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 flex justify-between mb-2"><div><div className="font-bold">{c.label}</div><div className="text-xs text-zinc-500">{c.nom}</div></div><div className="flex gap-1"><button onClick={()=>{setEdit(c);setShow(true);}} className="p-2 bg-zinc-800 rounded-lg"><Edit3 className="w-4 h-4"/></button><button onClick={async()=>{if(confirm('Supprimer?')){await supabase.from('categories').delete().eq('id',c.id);load();}}} className="p-2 bg-red-900 rounded-lg"><Trash2 className="w-4 h-4"/></button></div></div>)}{show&&<CatForm cat={edit} onClose={()=>{setShow(false);setEdit(null);}} onSaved={load}/>}</div>}
function CatForm({cat,onClose,onSaved}:any){const [nom,setNom]=useState(cat?.nom||'');const [label,setLabel]=useState(cat?.label||'');const save=async()=>{if(!nom||!label) return alert('Nom+Label');const p={nom:nom.toLowerCase().replace(/\s/g,'_'),label,ordre:1};if(cat) await supabase.from('categories').update(p).eq('id',cat.id);else await supabase.from('categories').insert(p);onSaved();onClose();};return <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"><div className="bg-zinc-900 rounded-2xl w-full max-w-md border border-zinc-800 p-5 space-y-3"><input value={label} onChange={e=>{setLabel(e.target.value);if(!cat) setNom(e.target.value.toLowerCase().replace(/\s/g,'_'));}} placeholder="Label" className="w-full bg-black p-3 rounded-xl border border-zinc-700"/><input value={nom} onChange={e=>setNom(e.target.value)} placeholder="nom" className="w-full bg-black p-3 rounded-xl border border-zinc-700 text-xs"/><div className="flex gap-2"><button onClick={onClose} className="flex-1 bg-zinc-800 py-3 rounded-xl">Annuler</button><button onClick={save} className="flex-1 bg-orange-600 py-3 rounded-xl font-bold">Sauver</button></div></div></div>}
function UsersTab(){const [users,setUsers]=useState<any[]>([]);const [show,setShow]=useState(false);const [edit,setEdit]=useState<any>(null);const load=useCallback(async()=>{const {data}=await supabase.from('utilisateurs').select('*').order('created_at',{ascending:false});setUsers(data||[]);},[]);useEffect(()=>{load();},[load]);return <div><div className="flex justify-between mb-3"><h2 className="font-bold">Users {users.length}</h2><button onClick={()=>{setEdit(null);setShow(true);}} className="bg-orange-600 px-4 py-2 rounded-xl font-bold">+ User</button></div>{users.map((u:any)=><div key={u.id} className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 flex justify-between mb-2"><div><div className="font-bold">{u.nom} <span className="text-xs bg-zinc-800 px-2 py-1 rounded-lg ml-2">{u.role}</span></div><div className="text-xs text-zinc-500">ID: {u.identifiant} | {u.code_acces}</div></div><div className="flex gap-1"><button onClick={()=>{setEdit(u);setShow(true);}} className="p-2.5 bg-zinc-800 rounded-xl"><Edit3 className="w-4 h-4"/></button><button onClick={async()=>{if(confirm('Supprimer?')){await supabase.from('utilisateurs').delete().eq('id',u.id);load();}}} className="p-2.5 bg-red-900 rounded-xl"><Trash2 className="w-4 h-4"/></button></div></div>)}{show&&<UserForm user={edit} onClose={()=>{setShow(false);setEdit(null);}} onSaved={load}/>}</div>}
function UserForm({user,onClose,onSaved}:any){const [nom,setNom]=useState(user?.nom||'');const [ident,setIdent]=useState(user?.identifiant||'');const [code,setCode]=useState(user?.code_acces||'');const [role,setRole]=useState(user?.role||'serveur');const save=async()=>{ if(!nom||!ident||!code) return alert('3amar'); const payload:any={ nom, identifiant: ident.trim(), code_acces: code.trim(), role }; let error; if(user){ const res=await supabase.from('utilisateurs').update(payload).eq('id',user.id); error=res.error; } else { const res=await supabase.from('utilisateurs').insert(payload); error=res.error; } if(error){ alert(error.message); return; } onSaved(); onClose(); };return <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"><div className="bg-zinc-900 rounded-2xl w-full max-w-md border border-zinc-800 p-5 space-y-3"><div className="flex justify-between"><h3 className="font-bold">{user?'Modifier':'Nouveau'} User</h3><button onClick={onClose}><X className="w-5 h-5"/></button></div><input value={nom} onChange={e=>setNom(e.target.value)} placeholder="Nom" className="w-full bg-black p-3.5 rounded-xl border border-zinc-700"/><input value={ident} onChange={e=>setIdent(e.target.value)} placeholder="Identifiant" className="w-full bg-black p-3.5 rounded-xl border border-zinc-700"/><input value={code} onChange={e=>setCode(e.target.value)} placeholder="Code" className="w-full bg-black p-3.5 rounded-xl border border-zinc-700"/><select value={role} onChange={e=>setRole(e.target.value)} className="w-full bg-black p-3.5 rounded-xl border border-zinc-700"><option value="admin">admin</option><option value="serveur">serveur</option><option value="cuisine">cuisine</option><option value="caisse">caisse</option></select><div className="flex gap-2"><button onClick={onClose} className="flex-1 bg-zinc-800 py-3.5 rounded-xl">Annuler</button><button onClick={save} className="flex-1 bg-orange-600 py-3.5 rounded-xl font-bold">Sauver</button></div></div></div>}

// ===== RAPPORTS TAB JDID - FIHA ANNULE + COMMANDE KAMLA + ESPECE/TPE/CHEQUE/OFFERT/REMISE =====
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

  const getTableLabel=(c:any)=>{ const t=tableMap[c.table_id]; if(t) return `T${t.numero} ${t.etage||'RDC'}`; if(c.table_numero) return `T${c.table_numero}`; return 'Table?'; };

  const getBadge=(method:any, remise:any)=>{
    const m=(method||'').toLowerCase();
    if(m==='espece') return <span className="bg-green-600 text-white px-2 py-1 rounded-full text-[10px] font-black">ESPECE</span>;
    if(m==='tpe') return <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-[10px] font-black">TPE</span>;
    if(m==='cheque') return <span className="bg-purple-600 text-white px-2 py-1 rounded-full text-[10px] font-black">CHEQUE</span>;
    if(m==='offert') return <span className="bg-orange-600 text-white px-2 py-1 rounded-full text-[10px] font-black">OFFERT</span>;
    if(m==='remise') return <span className="bg-yellow-500 text-black px-2 py-1 rounded-full text-[10px] font-black">REMISE {remise||0}%</span>;
    if(m==='mixte') return <span className="bg-white text-black border-2 border-orange-500 px-2 py-1 rounded-full text-[10px] font-black">MIXTE</span>;
    if(m==='annule') return <span className="bg-red-600 text-white px-2 py-1 rounded-full text-[10px] font-black">ANNULE</span>;
    return <span className="bg-zinc-700 px-2 py-1 rounded-full text-[10px]">{m.toUpperCase()}</span>;
  };

  const getItemBadge=(it:any)=>{
    const m=(it.payment_method||'espece').toLowerCase();
    const p=it.remise_percent||0;
    if(m==='espece') return <span className="bg-green-900 text-green-300 px-1.5 py-0.5 rounded text-[9px] font-bold ml-1">ESP</span>;
    if(m==='tpe') return <span className="bg-blue-900 text-blue-300 px-1.5 py-0.5 rounded text-[9px] font-bold ml-1">TPE</span>;
    if(m==='cheque') return <span className="bg-purple-900 text-purple-300 px-1.5 py-0.5 rounded text-[9px] font-bold ml-1">CHQ</span>;
    if(m==='offert') return <span className="bg-orange-900 text-orange-300 px-1.5 py-0.5 rounded text-[9px] font-bold ml-1">OFF</span>;
    if(m==='remise') return <span className="bg-yellow-900 text-yellow-300 px-1.5 py-0.5 rounded text-[9px] font-bold ml-1">-{p}%</span>;
    return null;
  };

  const totals=(()=>{
    let espece=0,tpe=0,cheque=0,offert=0,remise=0;
    cmds.forEach((c:any)=>{
      const method=(c.payment_method||'').toLowerCase();
      const its=itemsMap[c.id]||[];
      if(method==='mixte'){
        its.forEach((it:any)=>{
          const m=(it.payment_method||'espece').toLowerCase();
          const prix=Number(it.qte||1)*Number(it.prix||0);
          const perc=Number(it.remise_percent||0);
          const finalP=m==='offert'?0:m==='remise'?prix-prix*perc/100:prix;
          if(m==='espece') espece+=finalP;
          else if(m==='tpe') tpe+=finalP;
          else if(m==='cheque') cheque+=finalP;
          else if(m==='offert') offert+=prix;
          else if(m==='remise') remise+=finalP;
        });
      }else{
        const tot=Number(c.total_final??c.total??0);
        const totReel=Number(c.total??0);
        if(method==='espece') espece+=tot;
        else if(method==='tpe') tpe+=tot;
        else if(method==='cheque') cheque+=tot;
        else if(method==='offert') offert+=totReel;
        else if(method==='remise') remise+=tot;
      }
    });
    return {espece,tpe,cheque,offert,remise,total:espece+tpe+cheque+remise};
  })();

  const totalsAnnule=annules.reduce((s:any,c:any)=>{
    const its=annuleItemsMap[c.id]||[];
    const t=its.length? its.reduce((a:any,i:any)=>a+Number(i.qte||1)*Number(i.prix||0),0) : Number(c.total||0);
    return s+t;
  },0);

  if(loading) return <div className="p-8 text-center">Chargement...</div>;

  return <div>
    <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-3 mb-3"/>
    
    <div className="bg-zinc-900 rounded-2xl p-4 text-center font-black text-xl mb-3 border border-zinc-700">
      {totals.total.toFixed(0)} DH - {cmds.length} PAYE + {annules.length} ANNULE
    </div>

    <div className="grid grid-cols-3 gap-2 mb-4 text-center">
      <div className="bg-green-900/30 border border-green-700 rounded-xl p-2"><div className="text-[9px] text-green-300">ESPECE</div><div className="font-bold text-green-400 text-sm">{totals.espece.toFixed(0)}</div></div>
      <div className="bg-blue-900/30 border border-blue-700 rounded-xl p-2"><div className="text-[9px] text-blue-300">TPE</div><div className="font-bold text-blue-400 text-sm">{totals.tpe.toFixed(0)}</div></div>
      <div className="bg-purple-900/30 border border-purple-700 rounded-xl p-2"><div className="text-[9px] text-purple-300">CHEQUE</div><div className="font-bold text-purple-400 text-sm">{totals.cheque.toFixed(0)}</div></div>
      <div className="bg-yellow-900/40 border border-yellow-600 rounded-xl p-2"><div className="text-[9px] text-yellow-300">REMISE</div><div className="font-bold text-yellow-400 text-sm">{totals.remise.toFixed(0)}</div></div>
      <div className="bg-orange-900/30 border border-orange-700 rounded-xl p-2"><div className="text-[9px] text-orange-300">OFFERT</div><div className="font-bold text-orange-400 text-sm">{totals.offert.toFixed(0)}</div></div>
      <div className="bg-red-950/50 border-2 border-red-600 rounded-xl p-2"><div className="text-[9px] text-red-300 font-black">ANNULE</div><div className="font-bold text-red-400 text-sm">{totalsAnnule.toFixed(0)}</div><div className="text-[9px] text-red-300">{annules.length} cmd</div></div>
    </div>

    {annules.length>0 && (
      <div className="mb-6">
        <h3 className="font-black text-red-400 mb-2">🚫 ANNULÉES ({annules.length}) - {totalsAnnule.toFixed(0)} DH</h3>
        {annules.map((c:any)=>{
          const its=annuleItemsMap[c.id]||[];
          const totalCmd=its.length? its.reduce((s:any,i:any)=>s+Number(i.qte||1)*Number(i.prix||0),0) : Number(c.total||0);
          return (
            <div key={c.id} className="bg-red-950/20 border-2 border-red-800 rounded-xl p-3 mb-2">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2"><span className="font-black">{getTableLabel(c)}</span><span className="text-xs text-zinc-400">{c.serveur_nom}</span><span className="text-[10px] text-zinc-500">{new Date(c.created_at).toLocaleTimeString()}</span></div>
                <div className="flex items-center gap-2">{getBadge('annule',0)}<span className="font-black text-red-400">{totalCmd.toFixed(0)} DH</span></div>
              </div>
              <div className="bg-black/60 rounded-lg p-2 space-y-1">
                {its.map((it:any)=><div key={it.id} className="flex justify-between text-sm"><span className="text-zinc-300">{it.qte}x {it.menu_nom||it.nom}</span><span className="text-zinc-500">{(Number(it.qte)*Number(it.prix)).toFixed(0)} DH</span></div>)}
                {its.length===0 && <div className="text-xs text-zinc-500">Commande annulée - {totalCmd.toFixed(0)} DH</div>}
              </div>
            </div>
          )
        })}
      </div>
    )}

    <h3 className="font-black text-green-400 mb-2">✅ PAYÉES ({cmds.length}) - {totals.total.toFixed(0)} DH</h3>
    {cmds.map((c:any)=>{
      const its=itemsMap[c.id]||[];
      return (
        <div key={c.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 mb-3">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2"><span className="font-black text-white">{getTableLabel(c)}</span><span className="text-xs text-zinc-400">{c.serveur_nom}</span><span className="text-[10px] text-zinc-500">{new Date(c.paye_at||c.created_at).toLocaleTimeString()}</span></div>
            <div className="flex items-center gap-2">{getBadge(c.payment_method, c.remise_percent)}<span className="font-black text-orange-400">{Number(c.total_final??c.total??0).toFixed(0)} DH</span></div>
          </div>
          {(c.payment_method==='offert' || c.payment_method==='remise') && (
            <div className={`mb-2 p-2 rounded-lg text-xs font-bold ${c.payment_method==='offert'?'bg-orange-900/50 text-orange-300':'bg-yellow-900/50 text-yellow-300'}`}>
              {c.payment_method==='offert'? '🎁 COMMANDE OFFERTE' : `🏷️ REMISE ${c.remise_percent}% - Reel ${Number(c.total).toFixed(0)} DH → Payé ${Number(c.total_final).toFixed(0)} DH`}
            </div>
          )}
          <div className="bg-black/60 rounded-lg p-2 space-y-1.5">
            {its.map((it:any)=>{
              const prix=Number(it.qte||1)*Number(it.prix||0);
              const perc=Number(it.remise_percent||0);
              const m=(it.payment_method||'').toLowerCase();
              const finalP=m==='offert'?0:m==='remise'? prix-prix*perc/100 : prix;
              return (
                <div key={it.id} className="flex justify-between items-center py-1 border-b border-zinc-800/50 last:border-0">
                  <div className="flex items-center gap-1"><span className="bg-zinc-800 text-white text-xs font-bold w-6 h-6 rounded flex items-center justify-center">{it.qte}</span><span className="text-sm text-white">{it.menu_nom||it.nom}</span>{getItemBadge(it)}</div>
                  <div className="text-right"><div className="text-sm font-bold text-white">{c.payment_method==='mixte'? `${finalP.toFixed(0)} DH` : `${prix.toFixed(0)} DH`}</div></div>
                </div>
              )
            })}
          </div>
          <div className="mt-2 flex justify-between text-xs text-zinc-500"><span>{its.length} articles • {c.payment_method==='mixte'? 'Ticket mixte détaillé' : `Payé en ${c.payment_method}`}</span><span className="font-bold text-white">TOTAL: {Number(c.total_final??c.total).toFixed(0)} DH</span></div>
        </div>
      )
    })}
  </div>
}
