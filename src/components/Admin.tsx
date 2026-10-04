// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Edit3, Trash2, X, Plus } from 'lucide-react';

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
const [items,setItems]=useState([]);const [numero,setNumero]=useState('');const [etage,setEtage]=useState('RDC');
const load=useCallback(async()=>{const {data}=await supabase.from('tables').select('*').order('etage').order('numero');setItems(data||[]);},[]);
useEffect(()=>{load();},[load]);
const save=async()=>{if(!numero)return;await supabase.from('tables').insert([{numero:Number(numero),etage,statut:'libre'}]);setNumero('');load();};
const del=async(id)=>{if(!confirm('Supprimer?'))return;await supabase.from('tables').delete().eq('id',id);load();};
return(<div><div className="flex gap-2 mb-4 bg-zinc-900 p-3 rounded-xl">
<input placeholder="N°" type="number" value={numero} onChange={e=>setNumero(e.target.value)} className="bg-black border border-zinc-700 rounded-xl px-3 py-3 w-20 text-center font-bold"/>
<select value={etage} onChange={e=>setEtage(e.target.value)} className="bg-black border border-zinc-700 rounded-xl px-3 py-3 flex-1 font-bold"><option value="RDC">RDC</option><option value="1er">1er Étage</option></select>
<button onClick={save} className="bg-orange-600 px-5 rounded-xl font-black">+ AJOUTER</button></div>
<div className="mb-2 font-black text-green-400">RDC - {items.filter((t:any)=>t.etage==='RDC'||!t.etage).length} tables</div>
<div className="grid grid-cols-3 gap-2 mb-6">{items.filter((t:any)=>t.etage==='RDC'||!t.etage).map((t:any)=><div key={t.id} className="bg-zinc-900 p-3 rounded-xl text-center border border-green-900/40"><div className="font-black">T{t.numero}</div><div className="text-[10px] text-zinc-500">{t.etage||'RDC'}</div><button onClick={()=>del(t.id)} className="text-red-400 text-xs mt-1">Suppr</button></div>)}</div>
<div className="mb-2 font-black text-blue-400">1er ÉTAGE - {items.filter((t:any)=>t.etage==='1er').length} tables</div>
<div className="grid grid-cols-3 gap-2">{items.filter((t:any)=>t.etage==='1er').map((t:any)=><div key={t.id} className="bg-zinc-900 p-3 rounded-xl text-center border border-blue-900/40"><div className="font-black">T{t.numero}</div><div className="text-[10px] text-blue-400">1er</div><button onClick={()=>del(t.id)} className="text-red-400 text-xs mt-1">Suppr</button></div>)}</div>
</div>);}

function MenuTab(){
  const [menus,setMenus]=useState<any[]>([]);const [cats,setCats]=useState<any[]>([]);const [mats,setMats]=useState<any[]>([]);const [rec,setRec]=useState<any[]>([]);const [show,setShow]=useState(false);const [edit,setEdit]=useState<any>(null);
  const load=useCallback(async()=>{const a=await supabase.from('menu').select('*').order('nom');const b=await supabase.from('categories').select('*').order('ordre');const c=await supabase.from('matiere_premiere').select('*').order('nom');const d=await supabase.from('recette').select('*');setMenus(a.data||[]);setCats(b.data||[]);setMats(c.data||[]);setRec(d.data||[]);},[]);
  useEffect(()=>{load();},[load]);
  return <div><div className="flex justify-between mb-3"><h2 className="font-bold">Menu {menus.length}</h2><button onClick={()=>{setEdit(null);setShow(true);}} className="bg-orange-600 px-4 py-2 rounded-xl font-bold">+ Plat</button></div><div className="grid md:grid-cols-2 gap-3">{menus.map((m:any)=>{const ings=rec.filter((r:any)=>r.menu_id===m.id);return <div key={m.id} className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden"><div className="h-40 bg-zinc-800">{m.image_url?<img src={m.image_url} className="w-full h-full object-cover"/>:<div className="h-full flex items-center justify-center text-xs text-zinc-500">Sans photo</div>}</div><div className="p-3"><div className="flex justify-between"><div><div className="font-bold">{m.nom} - {m.prix} DH</div><div className="text-xs text-zinc-400 mt-1">{ings.map((i:any)=>{const mat=mats.find((x:any)=>x.id===i.matiere_id); const qq=i.qte_necessaire||i.quantite||i.qte||0; return `${qq}${i.unite||'g'} ${mat?.nom||''}`}).join(' + ')||'Zid ing'}</div></div><div className="flex gap-1"><button onClick={()=>{setEdit(m);setShow(true);}} className="p-2 bg-zinc-800 rounded-lg"><Edit3 className="w-4 h-4"/></button><button onClick={async()=>{if(confirm('Supprimer?')){await supabase.from('menu').delete().eq('id',m.id);load();}}} className="p-2 bg-red-900 rounded-lg"><Trash2 className="w-4 h-4"/></button></div></div></div></div>})}</div>{show&&<MenuForm menu={edit} categories={cats} matieres={mats} recs={rec.filter((r:any)=>r.menu_id===edit?.id)} onClose={()=>{setShow(false);setEdit(null);}} onSaved={load}/>}</div>
  }
function MenuForm({menu,categories,matieres,recs,onClose,onSaved}:any){
  const [nom,setNom]=useState(menu?.nom||'');const [prix,setPrix]=useState(menu?String(menu.prix):'');const [cat,setCat]=useState(menu?.categorie||categories[0]?.nom||'');const [img,setImg]=useState(menu?.image_url||'');const [ings,setIngs]=useState<any[]>(recs||[]);const [sel,setSel]=useState('');const [qte,setQte]=useState('150');const [unite,setUnite]=useState('g');
  useEffect(()=>{ if(matieres.length &&!sel){ const first=matieres.find((m:any)=>!ings.some((i:any)=>i.matiere_id===m.id))||matieres[0]; setSel(first?.id||''); setUnite(first?.unite||'g'); } },[matieres]);
  const addIng=()=>{if(!sel) return; const q=parseFloat(qte); if(!q) return; const mat=matieres.find((x:any)=>x.id===sel); if(!mat) return; const newIngs=[...ings,{matiere_id:sel, qte_necessaire:q, _nom:mat.nom, unite}]; setIngs(newIngs); const next=matieres.find((m:any)=>!newIngs.some((i:any)=>i.matiere_id===m.id)); if(next){ setSel(next.id); setUnite(next.unite||'g'); } setQte('150');};
  const save=async()=>{if(!nom||!prix) return alert('Nom + Prix'); const p={nom,prix:parseFloat(prix)||0,categorie:cat,image_url:img,disponible:true}; let id=menu?.id; if(menu){await supabase.from('menu').update(p).eq('id',menu.id);}else{const {data}=await supabase.from('menu').insert(p).select().single(); id=data?.id;} if(id){await supabase.from('recette').delete().eq('menu_id',id); if(ings.length){await supabase.from('recette').insert(ings.map((x:any)=>({menu_id:id, matiere_id:x.matiere_id, qte_necessaire:x.qte_necessaire, unite:x.unite})));}} onSaved(); onClose();};
  return <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"><div className="bg-zinc-900 rounded-2xl w-full max-w-lg border border-zinc-800"><div className="p-4 flex justify-between border-b border-zinc-800"><h3 className="font-bold">Plat - {ings.length} ing</h3><button onClick={onClose}><X className="w-5 h-5"/></button></div><div className="p-4 space-y-3 max-h-[75vh] overflow-auto"><input value={nom} onChange={e=>setNom(e.target.value)} placeholder="Nom" className="w-full bg-black p-3 rounded-xl border border-zinc-700"/><div className="flex gap-2"><input value={prix} onChange={e=>setPrix(e.target.value)} type="number" placeholder="Prix" className="flex-1 bg-black p-3 rounded-xl border border-zinc-700"/><select value={cat} onChange={e=>setCat(e.target.value)} className="flex-1 bg-black p-3 rounded-xl border border-zinc-700">{categories.map((c:any)=><option key={c.id} value={c.nom}>{c.label}</option>)}</select></div><div className="bg-black border-2 border-orange-500/30 rounded-xl p-3"><select value={sel} onChange={e=>{setSel(e.target.value); const m=matieres.find((x:any)=>x.id===e.target.value); if(m) setUnite(m.unite);}} className="w-full bg-zinc-800 p-3.5 rounded-xl border border-zinc-700 mb-2 font-bold">{matieres.map((m:any)=>{const used=ings.some((i:any)=>i.matiere_id===m.id); return <option key={m.id} value={m.id}>{used?'✅ ':''}{m.nom}</option>})}</select><div className="flex gap-2 mb-2"><input value={qte} onChange={e=>setQte(e.target.value)} type="number" className="flex-1 bg-zinc-800 p-3.5 rounded-xl border border-zinc-700 text-center font-black text-lg"/><select value={unite} onChange={e=>setUnite(e.target.value)} className="w-20 bg-zinc-800 p-3.5 rounded-xl border border-zinc-700 font-bold"><option>g</option><option>kg</option><option>ml</option><option>L</option><option>pcs</option></select></div><button onClick={addIng} className="w-full bg-orange-600 py-4 rounded-xl font-black">+ Ajouter</button><div className="mt-3 space-y-1">{ings.map((ig:any,i:number)=><div key={i} className="flex justify-between bg-zinc-800 rounded-xl p-2.5 text-sm border border-zinc-700"><span className="font-bold">{i+1}. {ig.qte_necessaire} {ig.unite} - {ig._nom}</span><button onClick={()=>setIngs(ings.filter((_:any,idx:number)=>idx!==i))} className="text-red-400 font-black">X</button></div>)}</div></div></div><div className="p-4 border-t border-zinc-800 flex gap-2"><button onClick={onClose} className="flex-1 bg-zinc-800 py-3 rounded-xl">Annuler</button><button onClick={save} className="flex-1 bg-orange-600 py-3 rounded-xl font-bold">Sauver {ings.length}</button></div></div></div>
}
function UsersTab(){
  const [users,setUsers]=useState<any[]>([]);const [show,setShow]=useState(false);const [edit,setEdit]=useState<any>(null);
  const load=useCallback(async()=>{const {data}=await supabase.from('utilisateurs').select('*').order('created_at',{ascending:false});setUsers(data||[]);},[]);
  useEffect(()=>{load();},[load]);
  return <div><div className="flex justify-between mb-3"><h2 className="font-bold">Users {users.length}</h2><button onClick={()=>{setEdit(null);setShow(true);}} className="bg-orange-600 px-4 py-2 rounded-xl font-bold">+ User</button></div>{users.map((u:any)=><div key={u.id} className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 flex justify-between mb-2"><div><div className="font-bold">{u.nom} <span className="text-xs bg-zinc-800 px-2 py-1 rounded-lg ml-2">{u.role}</span></div><div className="text-xs text-zinc-500">ID: {u.identifiant} | {u.code_acces}</div></div><div className="flex gap-1"><button onClick={()=>{setEdit(u);setShow(true);}} className="p-2.5 bg-zinc-800 rounded-xl"><Edit3 className="w-4 h-4"/></button><button onClick={async()=>{if(confirm('Supprimer?')){await supabase.from('utilisateurs').delete().eq('id',u.id);load();}}} className="p-2.5 bg-red-900 rounded-xl"><Trash2 className="w-4 h-4"/></button></div></div>)}{show&&<UserForm user={edit} onClose={()=>{setShow(false);setEdit(null);}} onSaved={load}/>}</div>
}
function UserForm({user,onClose,onSaved}:any){
  const [nom,setNom]=useState(user?.nom||'');const [ident,setIdent]=useState(user?.identifiant||'');const [code,setCode]=useState(user?.code_acces||user?.code_d_acces||'');const [role,setRole]=useState(user?.role||'serveur');const [restId,setRestId]=useState(user?.restaurant_id||'');
  useEffect(()=>{ if(!restId){ supabase.from('restaurants').select('id').limit(1).single().then(({data})=>{ if(data) setRestId(data.id); }); } },[]);
  const save=async()=>{
    if(!nom||!ident||!code) return alert('3amar');
    const c=code.trim();
    const payload:any={ nom, identifiant: ident.trim(), code_acces:c, code_d_acces:c, mot_de_passe:c, role, restaurant_id: restId, actif:true };
    if(!restId){ const {data:rest}=await supabase.from('restaurants').select('id').limit(1).single(); if(rest) payload.restaurant_id=rest.id; }
    let error; if(user){ const res=await supabase.from('utilisateurs').update(payload).eq('id',user.id); error=res.error; } else { const res=await supabase.from('utilisateurs').insert(payload); error=res.error; }
    if(error){ alert(error.message); return; }
    onSaved(); onClose();
  };
  return <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"><div className="bg-zinc-900 rounded-2xl w-full max-w-md border border-zinc-800 p-5 space-y-3"><div className="flex justify-between"><h3 className="font-bold">{user?'Modifier':'Nouveau'} User</h3><button onClick={onClose}><X className="w-5 h-5"/></button></div><input value={nom} onChange={e=>setNom(e.target.value)} placeholder="Nom" className="w-full bg-black p-3.5 rounded-xl border border-zinc-700"/><input value={ident} onChange={e=>setIdent(e.target.value)} placeholder="Identifiant" className="w-full bg-black p-3.5 rounded-xl border border-zinc-700"/><input value={code} onChange={e=>setCode(e.target.value)} placeholder="Code" className="w-full bg-black p-3.5 rounded-xl border border-zinc-700"/><select value={role} onChange={e=>setRole(e.target.value)} className="w-full bg-black p-3.5 rounded-xl border border-zinc-700"><option value="admin">admin</option><option value="serveur">serveur</option><option value="cuisine">cuisine</option><option value="caisse">caisse</option></select><div className="flex gap-2"><button onClick={onClose} className="flex-1 bg-zinc-800 py-3.5 rounded-xl">Annuler</button><button onClick={save} className="flex-1 bg-orange-600 py-3.5 rounded-xl font-bold">Sauver</button></div></div></div>
    }
function MatiereTab(){const [mats,setMats]=useState<any[]>([]);const [show,setShow]=useState(false);const [edit,setEdit]=useState<any>(null);const load=useCallback(async()=>{const {data}=await supabase.from('matiere_premiere').select('*').order('nom');setMats(data||[]);},[]);useEffect(()=>{load();},[load]);return <div><div className="flex justify-between mb-2"><h2 className="font-bold">Matiere {mats.length}</h2><button onClick={()=>{setEdit(null);setShow(true);}} className="bg-orange-600 px-3 py-2 rounded-xl">+ Matiere</button></div>{mats.map((m:any)=><div key={m.id} className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 flex justify-between mb-2"><div><div className="font-bold">{m.nom}</div><div className="text-xs text-zinc-500">{m.quantite} {m.unite}</div></div><div className="flex gap-1"><button onClick={()=>{setEdit(m);setShow(true);}} className="p-2 bg-zinc-800 rounded-lg"><Edit3 className="w-4 h-4"/></button><button onClick={async()=>{if(confirm('Supprimer?')){await supabase.from('matiere_premiere').delete().eq('id',m.id);load();}}} className="p-2 bg-red-900 rounded-lg"><Trash2 className="w-4 h-4"/></button></div></div>)}{show&&<MatiereForm mat={edit} onClose={()=>{setShow(false);setEdit(null);}} onSaved={load}/>}</div>}
function MatiereForm({mat,onClose,onSaved}:any){const [nom,setNom]=useState(mat?.nom||'');const [qte,setQte]=useState(mat?String(mat.quantite):'10');const [unite,setUnite]=useState(mat?.unite||'kg');const save=async()=>{const p={nom,quantite:parseFloat(qte)||0,unite,seuil_alerte:2};if(mat) await supabase.from('matiere_premiere').update(p).eq('id',mat.id);else await supabase.from('matiere_premiere').insert(p);onSaved();onClose();};return <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"><div className="bg-zinc-900 rounded-2xl w-full max-w-md border border-zinc-800 p-5 space-y-3"><input value={nom} onChange={e=>setNom(e.target.value)} placeholder="Nom" className="w-full bg-black p-3 rounded-xl border border-zinc-700"/><div className="flex gap-2"><input value={qte} onChange={e=>setQte(e.target.value)} type="number" className="flex-1 bg-black p-3 rounded-xl border border-zinc-700"/><select value={unite} onChange={e=>setUnite(e.target.value)} className="w-24 bg-black p-3 rounded-xl border border-zinc-700"><option>kg</option><option>g</option><option>L</option><option>ml</option><option>pcs</option></select></div><div className="flex gap-2"><button onClick={onClose} className="flex-1 bg-zinc-800 py-3 rounded-xl">Annuler</button><button onClick={save} className="flex-1 bg-orange-600 py-3 rounded-xl font-bold">Sauver</button></div></div></div>}
function StockTab(){const [mats,setMats]=useState<any[]>([]);useEffect(()=>{supabase.from('matiere_premiere').select('*').order('nom').then(({data})=>setMats(data||[]));},[]);return <div>{mats.map((m:any)=><div key={m.id} className="p-3 rounded-xl border bg-zinc-900 border-zinc-800 flex justify-between mb-2"><span>{m.nom}</span><span className="font-bold">{m.quantite} {m.unite}</span></div>)}</div>}
function CategoriesTab(){const [cats,setCats]=useState<any[]>([]);const [show,setShow]=useState(false);const [edit,setEdit]=useState<any>(null);const load=useCallback(async()=>{const {data}=await supabase.from('categories').select('*').order('ordre');setCats(data||[]);},[]);useEffect(()=>{load();},[load]);return <div><div className="flex justify-between mb-2"><h2 className="font-bold">Categories</h2><button onClick={()=>{setEdit(null);setShow(true);}} className="bg-orange-600 px-3 py-2 rounded-xl">+ Cat</button></div>{cats.map((c:any)=><div key={c.id} className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 flex justify-between mb-2"><div><div className="font-bold">{c.label}</div><div className="text-xs text-zinc-500">{c.nom}</div></div><div className="flex gap-1"><button onClick={()=>{setEdit(c);setShow(true);}} className="p-2 bg-zinc-800 rounded-lg"><Edit3 className="w-4 h-4"/></button><button onClick={async()=>{if(confirm('Supprimer?')){await supabase.from('categories').delete().eq('id',c.id);load();}}} className="p-2 bg-red-900 rounded-lg"><Trash2 className="w-4 h-4"/></button></div></div>)}{show&&<CatForm cat={edit} onClose={()=>{setShow(false);setEdit(null);}} onSaved={load}/>}</div>}
function CatForm({cat,onClose,onSaved}:any){const [nom,setNom]=useState(cat?.nom||'');const [label,setLabel]=useState(cat?.label||'');const save=async()=>{if(!nom||!label) return alert('Nom+Label');const p={nom:nom.toLowerCase().replace(/\s/g,'_'),label,ordre:1};if(cat) await supabase.from('categories').update(p).eq('id',cat.id);else await supabase.from('categories').insert(p);onSaved();onClose();};return <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"><div className="bg-zinc-900 rounded-2xl w-full max-w-md border border-zinc-800 p-5 space-y-3"><input value={label} onChange={e=>{setLabel(e.target.value);if(!cat) setNom(e.target.value.toLowerCase().replace(/\s/g,'_'));}} placeholder="Label" className="w-full bg-black p-3 rounded-xl border border-zinc-700"/><input value={nom} onChange={e=>setNom(e.target.value)} placeholder="nom" className="w-full bg-black p-3 rounded-xl border border-zinc-700 text-xs"/><div className="flex gap-2"><button onClick={onClose} className="flex-1 bg-zinc-800 py-3 rounded-xl">Annuler</button><button onClick={save} className="flex-1 bg-orange-600 py-3 rounded-xl font-bold">Sauver</button></div></div></div>}
function RapportsTab(){
  const [date,setDate]=useState(new Date().toISOString().split('T')[0]);
  const [cmds,setCmds]=useState<any[]>([]);const [itemsMap,setItemsMap]=useState<any>({});const [tableMap,setTableMap]=useState<any>({});const [loading,setLoading]=useState(true);
  const load=useCallback(async()=>{
    setLoading(true);
    const start=new Date(date); start.setHours(0,0,0,0);const end=new Date(date); end.setHours(23,59,59,999);
    let {data}=await supabase.from('commandes').select('*').eq('statut','paye').gte('paye_at',start.toISOString()).lte('paye_at',end.toISOString()).order('paye_at',{ascending:true});
    if(!data||data.length===0){const {data:d2}=await supabase.from('commandes').select('*').eq('statut','paye').gte('created_at',start.toISOString()).lte('created_at',end.toISOString()).order('created_at',{ascending:true});data=d2||[];}
    let iMap:any={};let tMap:any={};
    if(data&&data.length){const ids=data.map((c:any)=>c.id);const tableIds=data.map((c:any)=>c.table_id).filter(Boolean);
      const [itemsRes,tablesRes]=await Promise.all([
        supabase.from('commande_items').select('*').in('commande_id',ids),
        tableIds.length?supabase.from('tables').select('*').in('id',tableIds):Promise.resolve({data:[]} as any)
      ]);
      (itemsRes.data||[]).forEach((it:any)=>{(iMap[it.commande_id]=iMap[it.commande_id]||[]).push(it);});
      (tablesRes.data||[]).forEach((t:any)=>{tMap[t.id]=t;});
    }
    setItemsMap(iMap);setTableMap(tMap);setCmds(data||[]);setLoading(false);
  },[date]);
  useEffect(()=>{load();},[load]);
  const getTableLabel=(c:any)=>{
    const t=tableMap[c.table_id];
    if(t) return `Table ${t.numero} - ${t.etage||'RDC'}`;
    if(c.table_numero) return `Table ${c.table_numero}`;
    return 'Table?';
  };
  const groups={
    espece:cmds.filter(c=>(c.payment_method||'espece')==='espece'),
    tpe:cmds.filter(c=>c.payment_method==='tpe'),
    cheque:cmds.filter(c=>c.payment_method==='cheque'),
    offert:cmds.filter(c=>c.payment_method==='offert'),
    remise:cmds.filter(c=>c.payment_method==='remise'),
  };
  const sum=(arr:any[])=>arr.reduce((s,c)=>s+Number(c.total_final??c.total??0),0);
  const sumReel=(arr:any[])=>arr.reduce((s,c)=>s+Number(c.total??0),0);
  const totalEncaisse=sum(groups.espece)+sum(groups.tpe)+sum(groups.cheque)+sum(groups.remise);
  const totalRemise=groups.remise.reduce((s,c)=>s+Number(c.remise||0),0);
  const viderToday=async()=>{if(!confirm(`Khwi ${date}?`))return;const start=new Date(date);start.setHours(0,0,0,0);const end=new Date(date);end.setHours(23,59,59,999);const {data}=await supabase.from('commandes').select('id').gte('created_at',start.toISOString()).lte('created_at',end.toISOString());const ids=(data||[]).map((x:any)=>x.id);if(ids.length){await supabase.from('commande_items').delete().in('commande_id',ids);await supabase.from('commandes').delete().in('id',ids);}load();};
  const viderTout=async()=>{if(!confirm('KHWI GA3?'))return;if(!confirm('Mta2akked?'))return;await supabase.from('commande_items').delete().neq('id','00000000-0000-0000-0000-000000000000');await supabase.from('commandes').delete().neq('id','00000000-0000-0000-0000-000000000000');load();};
  if(loading) return <div className="p-8 text-center">Chargement...</div>;
  return <div>
    <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-3 mb-2"/>
    <div className="grid grid-cols-2 gap-2 mb-3">
      <button onClick={viderToday} className="bg-yellow-900/40 border border-yellow-600 text-yellow-300 font-bold py-3 rounded-xl text-xs">KHWI {date}</button>
      <button onClick={viderTout} className="bg-red-900/50 border-2 border-red-600 text-red-300 font-black py-3 rounded-xl text-xs">KHWI GA3 ({cmds.length})</button>
    </div>
    <div className="bg-zinc-900 rounded-2xl p-4 text-center font-black text-xl mb-3 border border-zinc-700">{totalEncaisse.toFixed(0)} DH - {cmds.length} cmd</div>
    <div className="grid grid-cols-2 gap-2 mb-4 text-center">
      <div className="bg-green-900/30 border border-green-700 rounded-xl p-3"><div className="text-[10px] text-green-300">ESPECE</div><div className="font-bold text-green-400">{sum(groups.espece).toFixed(0)} DH</div><div className="text-xs">{groups.espece.length}</div></div>
      <div className="bg-blue-900/30 border border-blue-700 rounded-xl p-3"><div className="text-[10px] text-blue-300">TPE</div><div className="font-bold text-blue-400">{sum(groups.tpe).toFixed(0)} DH</div><div className="text-xs">{groups.tpe.length}</div></div>
      <div className="bg-purple-900/30 border border-purple-700 rounded-xl p-3"><div className="text-[10px] text-purple-300">CHEQUE</div><div className="font-bold text-purple-400">{sum(groups.cheque).toFixed(0)} DH</div><div className="text-xs">{groups.cheque.length}</div></div>
      <div className="bg-yellow-900/40 border-2 border-yellow-500 rounded-xl p-3"><div className="text-[10px] text-yellow-300 font-black">REMISE</div><div className="font-bold text-yellow-400">{sum(groups.remise).toFixed(0)} DH</div><div className="text-xs">{groups.remise.length} (-{totalRemise.toFixed(0)})</div></div>
      <div className="bg-orange-900/30 border border-orange-700 rounded-xl p-3 col-span-2"><div className="text-[10px] text-orange-300">OFFERT</div><div className="font-bold text-orange-400">{sumReel(groups.offert).toFixed(0)} DH perdu</div><div className="text-xs">{groups.offert.length} cmd</div></div>
    </div>
    <div>
      {Object.entries(groups).map(([k,list]:any)=>{
        if(!list.length) return null;
        let title='';let border='';
        if(k==='espece'){title=`ESPECE (${list.length}) - ${sum(list).toFixed(0)} DH`;border='border-green-600';}
        if(k==='tpe'){title=`TPE (${list.length}) - ${sum(list).toFixed(0)} DH`;border='border-blue-600';}
        if(k==='cheque'){title=`CHEQUE (${list.length}) - ${sum(list).toFixed(0)} DH`;border='border-purple-600';}
        if(k==='remise'){title=`REMISE (${list.length}) - ${sum(list).toFixed(0)} DH`;border='border-yellow-500';}
        if(k==='offert'){title=`OFFERT (${list.length}) - ${sumReel(list).toFixed(0)} DH perdu`;border='border-orange-600';}
        return <div key={k} className={`border-l-4 ${border} pl-2 mb-5`}>
          <h3 className="font-black py-2 text-sm">{title}</h3>
          {list.map((c:any)=>{
            const its=itemsMap[c.id]||[];
            return <div key={c.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 mb-2">
              <div className="flex justify-between font-bold text-sm"><span>{getTableLabel(c)} - {c.serveur_nom||'?'}</span><span className="text-orange-400">{Number(c.total_final??c.total??0).toFixed(0)} DH</span></div>
              <div className="text-[11px] text-zinc-500">{new Date(c.paye_at||c.created_at).toLocaleTimeString()} - {c.payment_method} {c.remise_percent?`- ${c.remise_percent}%`:''}</div>
              <div className="mt-2 bg-black/60 rounded-lg p-2">{its.map((it:any)=><div key={it.id} className="flex justify-between py-1 text-sm border-b border-zinc-800 last:border-0"><span>{it.qte||1}x {it.menu_nom||it.nom||'Plat'}</span><span>{(Number(it.qte||1)*Number(it.prix||0)).toFixed(0)} DH</span></div>)}</div>
            </div>
          })}
        </div>
      })}
    </div>
  </div>
}
