// @ts-nocheck
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
const tabs=['menu','categories','tables','stock','users','rapports'];
export default function Admin(){
const [tab,setTab]=useState('rapports');
return(<div className="min-h-screen bg-black text-white">
<div className="flex gap-1 p-2 bg-zinc-900 overflow-x-auto">
{tabs.map(t=>(<button key={t} onClick={()=>setTab(t)} className={'px-3 py-2 rounded-lg text-xs font-bold uppercase whitespace-nowrap '+(tab===t?'bg-orange-500 text-black':'bg-zinc-800')}>{t}</button>))}
</div>
{tab==='menu'&&<MenuTab/>}{tab==='categories'&&<CategoriesTab/>}{tab==='tables'&&<TablesTab/>}
{tab==='stock'&&<StockTab/>}{tab==='users'&&<UsersTab/>}{tab==='rapports'&&<RapportsTab/>}
</div>);}
function MenuTab(){
const [items,setItems]=useState([]);const [cats,setCats]=useState([]);
const [form,setForm]=useState({nom:'',prix:'',categorie_id:'',disponible:true});
useEffect(()=>{load();},[]);
const load=async()=>{let {data}=await supabase.from('menus').select('*').order('nom');setItems(data||[]);let {data:c}=await supabase.from('categories').select('*');setCats(c||[]);};
const save=async()=>{if(!form.nom||!form.prix)return;await supabase.from('menus').insert([{...form,prix:Number(form.prix)}]);setForm({nom:'',prix:'',categorie_id:'',disponible:true});load();};
const del=async(id)=>{if(!confirm('Supprimer?'))return;await supabase.from('menus').delete().eq('id',id);load();};
return(<div className="p-3"><div className="bg-zinc-900 p-3 rounded-xl mb-3 grid gap-2">
<input placeholder="Nom" value={form.nom} onChange={e=>setForm({...form,nom:e.target.value})} className="bg-black border border-zinc-700 rounded-lg px-3 py-2"/>
<input placeholder="Prix" type="number" value={form.prix} onChange={e=>setForm({...form,prix:e.target.value})} className="bg-black border border-zinc-700 rounded-lg px-3 py-2"/>
<select value={form.categorie_id} onChange={e=>setForm({...form,categorie_id:e.target.value})} className="bg-black border border-zinc-700 rounded-lg px-3 py-2">
<option value="">Categorie</option>{cats.map(c=><option key={c.id} value={c.id}>{c.nom}</option>)}
</select>
<button onClick={save} className="bg-orange-500 text-black font-bold py-2 rounded-lg">Ajouter Menu</button></div>
{items.map(m=><div key={m.id} className="flex justify-between bg-zinc-900 p-3 rounded-lg mb-2"><span>{m.nom} - {m.prix} DH</span><button onClick={()=>del(m.id)} className="text-red-400">X</button></div>)}
</div>);}
function CategoriesTab(){
const [items,setItems]=useState([]);const [nom,setNom]=useState('');
useEffect(()=>{load();},[]);const load=async()=>{let {data}=await supabase.from('categories').select('*').order('nom');setItems(data||[]);};
const save=async()=>{if(!nom)return;await supabase.from('categories').insert([{nom}]);setNom('');load();};
const del=async(id)=>{if(!confirm('Supprimer?'))return;await supabase.from('categories').delete().eq('id',id);load();};
return(<div className="p-3"><div className="flex gap-2 mb-3"><input placeholder="Nom categorie" value={nom} onChange={e=>setNom(e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 flex-1"/><button onClick={save} className="bg-orange-500 text-black font-bold px-4 rounded-lg">+</button></div>
{items.map(c=><div key={c.id} className="flex justify-between bg-zinc-900 p-3 rounded-lg mb-2"><span>{c.nom}</span><button onClick={()=>del(c.id)} className="text-red-400">X</button></div>)}
</div>);}
function TablesTab(){
const [items,setItems]=useState([]);const [numero,setNumero]=useState('');
useEffect(()=>{load();},[]);const load=async()=>{let {data}=await supabase.from('tables').select('*').order('numero');setItems(data||[]);};
const save=async()=>{if(!numero)return;await supabase.from('tables').insert([{numero:Number(numero)}]);setNumero('');load();};
const del=async(id)=>{if(!confirm('Supprimer?'))return;await supabase.from('tables').delete().eq('id',id);load();};
return(<div className="p-3"><div className="flex gap-2 mb-3"><input placeholder="Numero table" type="number" value={numero} onChange={e=>setNumero(e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 flex-1"/><button onClick={save} className="bg-orange-500 text-black font-bold px-4 rounded-lg">+</button></div>
<div className="grid grid-cols-3 gap-2">{items.map(t=><div key={t.id} className="bg-zinc-900 p-3 rounded-lg text-center">Table {t.numero}<button onClick={()=>del(t.id)} className="block w-full text-red-400 text-xs mt-1">Supprimer</button></div>)}</div>
</div>);}
function StockTab(){
const [items,setItems]=useState([]);const [form,setForm]=useState({nom:'',quantite:'',unite:'kg',seuil:'5'});
useEffect(()=>{load();},[]);const load=async()=>{let {data}=await supabase.from('matieres').select('*').order('nom');setItems(data||[]);};
const save=async()=>{if(!form.nom)return;await supabase.from('matieres').insert([{...form,quantite:Number(form.quantite),seuil:Number(form.seuil)}]);setForm({nom:'',quantite:'',unite:'kg',seuil:'5'});load();};
const del=async(id)=>{if(!confirm('Supprimer?'))return;await supabase.from('matieres').delete().eq('id',id);load();};
return(<div className="p-3"><div className="bg-zinc-900 p-3 rounded-xl mb-3 grid gap-2">
<input placeholder="Nom matiere" value={form.nom} onChange={e=>setForm({...form,nom:e.target.value})} className="bg-black border border-zinc-700 rounded-lg px-3 py-2"/>
<div className="flex gap-2"><input placeholder="Qte" type="number" value={form.quantite} onChange={e=>setForm({...form,quantite:e.target.value})} className="bg-black border border-zinc-700 rounded-lg px-3 py-2 flex-1"/><input value={form.unite} onChange={e=>setForm({...form,unite:e.target.value})} className="bg-black border border-zinc-700 rounded-lg px-3 py-2 w-20"/><input placeholder="Seuil" type="number" value={form.seuil} onChange={e=>setForm({...form,seuil:e.target.value})} className="bg-black border border-zinc-700 rounded-lg px-3 py-2 w-20"/></div>
<button onClick={save} className="bg-orange-500 text-black font-bold py-2 rounded-lg">Ajouter Matiere</button></div>
{items.map(m=><div key={m.id} className="flex justify-between bg-zinc-900 p-3 rounded-lg mb-2"><span>{m.nom} - {m.quantite} {m.unite} {Number(m.quantite)<=Number(m.seuil)?'⚠️':''}</span><button onClick={()=>del(m.id)} className="text-red-400">X</button></div>)}
</div>);}
function UsersTab(){
const [items,setItems]=useState([]);const [form,setForm]=useState({nom:'',email:'',password:'',role:'serveur'});
useEffect(()=>{load();},[]);const load=async()=>{let {data}=await supabase.from('users').select('*').order('nom');setItems(data||[]);};
const save=async()=>{if(!form.nom||!form.email)return;await supabase.from('users').insert([form]);setForm({nom:'',email:'',password:'',role:'serveur'});load();};
const del=async(id)=>{if(!confirm('Supprimer?'))return;await supabase.from('users').delete().eq('id',id);load();};
return(<div className="p-3"><div className="bg-zinc-900 p-3 rounded-xl mb-3 grid gap-2">
<input placeholder="Nom" value={form.nom} onChange={e=>setForm({...form,nom:e.target.value})} className="bg-black border border-zinc-700 rounded-lg px-3 py-2"/>
<input placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="bg-black border border-zinc-700 rounded-lg px-3 py-2"/>
<input placeholder="Password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} className="bg-black border border-zinc-700 rounded-lg px-3 py-2"/>
<select value={form.role} onChange={e=>setForm({...form,role:e.target.value})} className="bg-black border border-zinc-700 rounded-lg px-3 py-2"><option value="serveur">Serveur</option><option value="cuisine">Cuisine</option><option value="admin">Admin</option></select>
<button onClick={save} className="bg-orange-500 text-black font-bold py-2 rounded-lg">Ajouter User</button></div>
{items.map(u=><div key={u.id} className="flex justify-between bg-zinc-900 p-3 rounded-lg mb-2"><span>{u.nom} - {u.role}</span><button onClick={()=>del(u.id)} className="text-red-400">X</button></div>)}
</div>);}
function RapportsTab(){
const [date,setDate]=useState(new Date().toISOString().split('T')[0]);
const [cmds,setCmds]=useState([]);const [itemsMap,setItemsMap]=useState({});const [tablesMap,setTablesMap]=useState({});const [loading,setLoading]=useState(true);
const load=async()=>{setLoading(true);const s=new Date(date);s.setHours(0,0,0,0);const e=new Date(date);e.setHours(23,59,59,999);
let {data}=await supabase.from('commandes').select('*').eq('statut','paye').gte('paye_at',s.toISOString()).lte('paye_at',e.toISOString()).order('paye_at',{ascending:true});
if(!data||!data.length){let r2=await supabase.from('commandes').select('*').eq('statut','paye').gte('created_at',s.toISOString()).lte('created_at',e.toISOString()).order('created_at',{ascending:true});data=r2.data||[];}
let iMap={};let tMap={};if(data&&data.length){const ids=data.map(c=>c.id);const {data:items}=await supabase.from('commande_items').select('*').in('commande_id',ids);(items||[]).forEach(it=>{if(!iMap[it.commande_id])iMap[it.commande_id]=[];iMap[it.commande_id].push(it);});const tableIds=[...new Set(data.map(c=>c.table_id).filter(Boolean))];if(tableIds.length){const {data:tables}=await supabase.from('tables').select('*').in('id',tableIds);(tables||[]).forEach(t=>{tMap[t.id]=t;});}}
setItemsMap(iMap);setTablesMap(tMap);setCmds(data||[]);setLoading(false);};
useEffect(()=>{load();},[date]);
const viderToday=async()=>{if(!confirm('Khwi '+date+'?'))return;const s=new Date(date);s.setHours(0,0,0,0);const e=new Date(date);e.setHours(23,59,59,999);const {data}=await supabase.from('commandes').select('id').gte('created_at',s.toISOString()).lte('created_at',e.toISOString());const ids=(data||[]).map(x=>x.id);if(ids.length){await supabase.from('commande_items').delete().in('commande_id',ids);await supabase.from('commandes').delete().in('id',ids);}load();};
const viderTout=async()=>{if(!confirm('KHWI GA3?'))return;await supabase.from('commande_items').delete().neq('id','00000000-0000-0000-0000-000000000000');await supabase.from('commandes').delete().neq('id','00000000-0000-0000-0000-000000000000');load();};
const sum=(arr)=>arr.reduce((s,c)=>s+Number(c.total_final||c.total||0),0);const sumReel=(arr)=>arr.reduce((s,c)=>s+Number(c.total||0),0);
const groups={espece:cmds.filter(c=>(c.payment_method||'espece')==='espece'),tpe:cmds.filter(c=>c.payment_method==='tpe'),cheque:cmds.filter(c=>c.payment_method==='cheque'),offert:cmds.filter(c=>c.payment_method==='offert'),remise:cmds.filter(c=>c.payment_method==='remise'),};
const totalRemise=groups.remise.reduce((s,c)=>s+Number(c.remise||0),0);const total=sum(groups.espece)+sum(groups.tpe)+sum(groups.cheque)+sum(groups.remise);
if(loading)return<div className="p-8 text-center text-white">Chargement...</div>;
return(<div className="p-3">
<input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-3 mb-2"/>
<div className="grid grid-cols-2 gap-2 mb-3"><button onClick={viderToday} className="bg-yellow-900/50 border border-yellow-600 text-yellow-300 font-bold py-3 rounded-xl text-xs">Khwi {date}</button><button onClick={viderTout} className="bg-red-900/60 border-2 border-red-600 text-red-300 font-black py-3 rounded-xl text-xs">KHWI GA3 - {cmds.length}</button></div>
<div className="bg-zinc-900 rounded-2xl p-4 text-center font-black text-xl mb-3">{total.toFixed(0)} DH - {cmds.length} cmd</div>
<div className="grid grid-cols-2 gap-2 text-center mb-3">
<div className="bg-green-900/30 border border-green-700 rounded-xl p-3"><div className="text-[10px] text-green-300">ESPECE</div><div className="font-bold text-green-400">{sum(groups.espece).toFixed(0)} DH</div><div className="text-xs">{groups.espece.length} cmd</div></div>
<div className="bg-blue-900/30 border border-blue-700 rounded-xl p-3"><div className="text-[10px] text-blue-300">TPE</div><div className="font-bold text-blue-400">{sum(groups.tpe).toFixed(0)} DH</div><div className="text-xs">{groups.tpe.length} cmd</div></div>
<div className="bg-purple-900/30 border border-purple-700 rounded-xl p-3"><div className="text-[10px] text-purple-300">CHEQUE</div><div className="font-bold text-purple-400">{sum(groups.cheque).toFixed(0)} DH</div><div className="text-xs">{groups.cheque.length} cmd</div></div>
<div className="bg-yellow-900/40 border-2 border-yellow-500 rounded-xl p-3"><div className="text-[10px] text-yellow-300 font-black">REMISE</div><div className="font-bold text-yellow-400">{sum(groups.remise).toFixed(0)} DH</div><div className="text-xs">{groups.remise.length} cmd</div></div>
<div className="bg-orange-900/30 border border-orange-700 rounded-xl p-3 col-span-2"><div className="text-[10px] text-orange-300">OFFERT</div><div className="font-bold text-orange-400">{sumReel(groups.offert).toFixed(0)} DH perdu</div><div className="text-xs">{groups.offert.length} cmd</div></div></div>
  <div>
{Object.keys(groups).map(k=>{
const list=groups[k];if(list.length===0) return null;
let title='';let border='';
if(k==='espece'){title='ESPECE ('+list.length+') - '+sum(list).toFixed(0)+' DH';border='border-green-600';}
if(k==='tpe'){title='TPE ('+list.length+') - '+sum(list).toFixed(0)+' DH';border='border-blue-600';}
if(k==='cheque'){title='CHEQUE ('+list.length+') - '+sum(list).toFixed(0)+' DH';border='border-purple-600';}
if(k==='remise'){title='REMISE ('+list.length+') - '+sum(list).toFixed(0)+' DH';border='border-yellow-500';}
if(k==='offert'){title='OFFERT ('+list.length+') - '+sumReel(list).toFixed(0)+' DH perdu';border='border-orange-600';}
return(
<div key={k} className={'border-l-4 '+border+' pl-2 mb-4'}>
<h3 className="font-black py-2 text-sm">{title}</h3>
{list.map(c=>{
const its=itemsMap[c.id]||[];const tableNum=c.table_numero || (c.table_id? tablesMap[c.table_id]?.numero : null) || '?';
return(
<div key={c.id} className="bg-[#1A1A1A] border border-zinc-800 rounded-xl p-3 mb-2">
<div className="flex justify-between font-bold"><span>Table {tableNum} - {c.serveur_nom||'?'}</span><span className="text-orange-400">{Number(c.total_final||c.total||0).toFixed(0)} DH</span></div>
<div className="text-[11px] text-zinc-500">{new Date(c.paye_at||c.created_at).toLocaleTimeString()} - {c.payment_method}</div>
<div className="mt-2 bg-black/50 rounded-xl p-2">
{its.map(it=><div key={it.id} className="flex justify-between py-1 text-sm"><span>{it.qte||1}x {it.menu_nom||'Plat'}</span><span>{(Number(it.qte||1)*Number(it.prix||0)).toFixed(0)} DH</span></div>)}
</div>
</div>
);
})}
</div>
);
})}
</div>
</div>
);
}
