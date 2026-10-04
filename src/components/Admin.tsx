// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { adminUsers } from '@/lib/adminUsers';
import { LayoutDashboard, UtensilsCrossed, Package, ClipboardList, Leaf, Tags, Users, FileBarChart, Plus, Edit3, Trash2, X, Search, Image as ImageIcon } from 'lucide-react';

type Tab = 'dashboard'|'menu'|'stock'|'commandes'|'matiere'|'categories'|'utilisateurs'|'rapports';
export default function Admin(){
  const [tab,setTab]=useState<Tab>('dashboard');
  const tabs=[
    {id:'dashboard',label:'Dashboard',icon:LayoutDashboard},
    {id:'menu',label:'Menu',icon:UtensilsCrossed},
    {id:'stock',label:'Stock',icon:Package},
    {id:'commandes',label:'Commandes',icon:ClipboardList},
    {id:'matiere',label:'Matière',icon:Leaf},
    {id:'categories',label:'Catégories',icon:Tags},
    {id:'utilisateurs',label:'Utilisateurs',icon:Users},
    {id:'rapports',label:'Rapports',icon:FileBarChart},
  ];
  return(
    <div className="min-h-screen bg-[#0A0A0A] pb-20">
      <div className="sticky top-0 z-30 bg-[#0A0A0A]/95 border-b border-gray-800">
        <div className="flex gap-1 px-2 py-2 overflow-x-auto">
          {tabs.map(t=>{const I=t.icon; return <button key={t.id} onClick={()=>setTab(t.id as Tab)} className={`flex gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap ${tab===t.id?'bg-[#FF6B00] text-white':'text-gray-400 bg-zinc-900'}`}><I className="w-4 h-4"/>{t.label}</button>})}
        </div>
      </div>
      <div className="p-4 max-w-6xl mx-auto">
        {tab==='dashboard'&&<DashboardTab/>}
        {tab==='menu'&&<MenuTab/>}
        {tab==='stock'&&<StockTab/>}
        {tab==='commandes'&&<CommandesTab/>}
        {tab==='matiere'&&<MatiereTab/>}
        {tab==='categories'&&<CategoriesTab/>}
        {tab==='utilisateurs'&&<UtilisateursTab/>}
        {tab==='rapports'&&<RapportsTab/>}
      </div>
    </div>
  );
}
function DashboardTab(){const [cs,setCs]=useState<any[]>([]);useEffect(()=>{const d=new Date().toISOString().split('T')[0];supabase.from('commandes').select('*').gte('created_at',d+'T00:00:00').then(({data})=>setCs(data||[]));},[]);const t=cs.filter(c=>c.statut==='paye').reduce((s,c)=>s+Number(c.total_final??c.total??0),0);return <div className="bg-[#1A1A1A] p-4 rounded-xl border border-gray-800"><div className="text-white font-black text-xl">{t} DH</div><div className="text-gray-500 text-xs">{cs.length} commandes lyoum</div></div>}
function MenuTab(){
  const [ms,setMs]=useState<any[]>([]);
  const [cats,setCats]=useState<any[]>([]);
  const [show,setShow]=useState(false);
  const [edit,setEdit]=useState<any>(null);
  const load=useCallback(async()=>{
    const res1 = await supabase.from('menu').select('*').order('nom');
    const res2 = await supabase.from('categories').select('*').order('ordre');
    setMs(res1.data||[]);
    setCats(res2.data||[]);
  },[]);
  useEffect(()=>{load();},[load]);
  return <div className="space-y-3"><div className="flex justify-between"><h2 className="text-white font-bold">Menu {ms.length}</h2><button onClick={()=>{setEdit(null);setShow(true);}} className="bg-[#FF6B00] text-white px-4 py-2 rounded-xl flex gap-2"><Plus className="w-4 h-4"/>Ajouter + Photo</button></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{ms.map((m:any)=><div key={m.id} className="bg-[#1A1A1A] rounded-xl border border-gray-800 overflow-hidden"><div className="h-32 bg-zinc-900">{m.image_url?<img src={m.image_url} className="w-full h-full object-cover"/>:<div className="h-full flex items-center justify-center"><ImageIcon className="w-6 h-6 text-zinc-700"/></div>}</div><div className="p-3 flex justify-between"><div><div className="text-white text-sm">{m.nom}</div><div className="text-[#FF6B00] font-bold">{m.prix} DH</div></div><div className="flex gap-1"><button onClick={()=>{setEdit(m);setShow(true);}} className="p-2 bg-zinc-800 rounded-lg"><Edit3 className="w-4 h-4 text-white"/></button><button onClick={async()=>{if(confirm('supprimer?')){await supabase.from('menu').delete().eq('id',m.id);load();}}} className="p-2 bg-red-950 rounded-lg"><Trash2 className="w-4 h-4 text-red-400"/></button></div></div></div>)}</div>{show&&<MenuForm menu={edit} categories={cats} onClose={()=>{setShow(false);setEdit(null);}} onSaved={load}/>}</div>
}
function MenuForm({menu,categories,onClose,onSaved}:any){const [nom,setNom]=useState(menu?.nom||'');const [prix,setPrix]=useState(menu?String(menu.prix):'');const [cat,setCat]=useState(menu?.categorie||categories[0]?.nom||'');const [img,setImg]=useState(menu?.image_url||'');const save=async()=>{const p={nom,prix:parseFloat(prix)||0,categorie:cat,image_url:img};if(menu) await supabase.from('menu').update(p).eq('id',menu.id); else await supabase.from('menu').insert(p); onSaved(); onClose();};return <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"><div className="bg-[#1A1A1A] rounded-2xl w-full max-w-md border border-gray-800 p-5 space-y-3"><h3 className="text-white font-bold">{menu?'Modifier':'Nouveau + photo'}</h3><input value={nom} onChange={e=>setNom(e.target.value)} placeholder="Nom" className="w-full bg-black text-white rounded-xl p-3 border border-gray-700"/><input type="number" value={prix} onChange={e=>setPrix(e.target.value)} placeholder="Prix" className="w-full bg-black text-white rounded-xl p-3 border border-gray-700"/><select value={cat} onChange={e=>setCat(e.target.value)} className="w-full bg-black text-white rounded-xl p-3 border border-gray-700">{categories.map((c:any)=><option key={c.id} value={c.nom}>{c.label}</option>)}</select><input value={img} onChange={e=>setImg(e.target.value)} placeholder="Lien taswira https://..." className="w-full bg-black text-white rounded-xl p-3 border border-gray-700"/><div className="flex gap-2"><button onClick={onClose} className="flex-1 bg-zinc-800 text-white py-3 rounded-xl">Annuler</button><button onClick={save} className="flex-1 bg-[#FF6B00] text-white py-3 rounded-xl">Sauver</button></div></div></div>}
function StockTab(){const [ms,setMs]=useState<any[]>([]);useEffect(()=>{supabase.from('matiere_premiere').select('*').order('nom').then(({data})=>setMs(data||[]));},[]);return <div className="grid grid-cols-2 gap-3">{ms.map((m:any)=><div key={m.id} className="bg-[#1A1A1A] p-4 rounded-xl border border-gray-800"><div className="text-white">{m.nom}</div><div className="text-white font-bold">{m.quantite} {m.unite}</div></div>)}</div>}
function CommandesTab(){const [cs,setCs]=useState<any[]>([]);useEffect(()=>{supabase.from('commandes').select('*').order('created_at',{ascending:false}).limit(50).then(({data})=>setCs(data||[]));},[]);return <div className="space-y-2">{cs.map((c:any)=><div key={c.id} className="bg-[#1A1A1A] p-4 rounded-xl border border-gray-800 flex justify-between"><span className="text-white text-sm">{c.serveur_nom} T{c.table_numero}</span><span className="text-white font-bold">{c.total} DH</span></div>)}</div>}
function MatiereTab(){const [ms,setMs]=useState<any[]>([]);useEffect(()=>{supabase.from('matiere_premiere').select('*').order('nom').then(({data})=>setMs(data||[]));},[]);return <div className="space-y-2">{ms.map((m:any)=><div key={m.id} className="bg-[#1A1A1A] p-3 rounded-xl border border-gray-800 flex justify-between"><span className="text-white">{m.nom}</span><span className="text-gray-400">{m.quantite} {m.unite}</span></div>)}</div>}
function CategoriesTab(){const [cs,setCs]=useState<any[]>([]);useEffect(()=>{supabase.from('categories').select('*').order('ordre').then(({data})=>setCs(data||[]));},[]);return <div className="space-y-2">{cs.map((c:any)=><div key={c.id} className="bg-[#1A1A1A] p-4 rounded-xl border border-gray-800 text-white">{c.label}</div>)}</div>}
function UtilisateursTab(){
  const [users,setUsers]=useState<any[]>([]);const [editing,setEditing]=useState<any>(null);const [show,setShow]=useState(false);
  const load=useCallback(async()=>{const {data}=await supabase.from('utilisateurs').select('*').order('created_at',{ascending:false});setUsers(data||[]);},[]);
  useEffect(()=>{load();},[load]);
  return <div className="space-y-3"><div className="flex justify-between"><h2 className="text-white font-bold text-lg">Utilisateurs</h2><button onClick={()=>{setEditing(null);setShow(true);}} className="bg-[#FF6B00] text-white px-4 py-2 rounded-xl font-bold">+ Serveur / Cuisine / Caisse</button></div>{users.map((u:any)=><div key={u.id} className="bg-[#1A1A1A] p-4 rounded-xl border border-gray-800 flex justify-between"><div><div className="text-white font-bold">{u.nom} <span className={`text-[10px] px-2 py-1 rounded-full ml-2 ${u.role==='serveur'?'bg-blue-900 text-blue-300':u.role==='cuisine'||u.role==='cuisinier'?'bg-orange-900 text-orange-300':'bg-green-900 text-green-300'}`}>{u.role.toUpperCase()}</span></div><div className="text-gray-500 text-xs">{u.identifiant}</div></div><div className="flex gap-2"><button onClick={()=>{setEditing(u);setShow(true);}} className="p-2 bg-zinc-800 rounded-lg"><Edit3 className="w-4 h-4 text-white"/></button><button onClick={async()=>{if(confirm('supprimer?')){await adminUsers({action:'delete',id:u.id});load();}}} className="p-2 bg-red-950 rounded-lg"><Trash2 className="w-4 h-4 text-red-400"/></button></div></div>)}{show&&<UserForm user={editing} onClose={()=>{setShow(false);setEditing(null);}} onSaved={load}/>}</div>
}
function UserForm({user,onClose,onSaved}:any){
  const [nom,setNom]=useState(user?.nom||'');const [identifiant,setIdentifiant]=useState(user?.identifiant||'');const [code,setCode]=useState('');const [role,setRole]=useState(user?.role||'serveur');const [actif,setActif]=useState(user?.actif??true);
  const save=async()=>{if(!user&&(!nom||!identifiant||code.length<4)){alert('Nom + identifiant + code 4');return;}const p=user?{action:'update',id:user.id,nom,role,actif,...(code?{code}:{})}:{action:'create',nom,identifiant:identifiant.toLowerCase(),code,role,actif};const err=await adminUsers(p);if(err) alert(err); else{onSaved();onClose();}};
  return <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"><div className="bg-[#1A1A1A] rounded-2xl w-full max-w-md border border-gray-800 p-5 space-y-3"><h3 className="text-white font-black">{user?'Modifier':'Nouveau Serveur / Cuisine / Caisse'}</h3><input value={nom} onChange={e=>setNom(e.target.value)} placeholder="Nom" className="w-full bg-black text-white rounded-xl p-3 border border-gray-700"/><input value={identifiant} onChange={e=>setIdentifiant(e.target.value)} disabled={!!user} placeholder="identifiant ex: serveur1, cuisine1, caisse1" className="w-full bg-black text-white rounded-xl p-3 border border-gray-700"/><input type="password" value={code} onChange={e=>setCode(e.target.value)} placeholder={user?'Nouveau code (vide=inchangé)':'Code 1234'} className="w-full bg-black text-white rounded-xl p-3 border border-gray-700"/><div className="grid grid-cols-3 gap-2"><button onClick={()=>setRole('serveur')} className={`py-3 rounded-xl font-black text-sm ${role==='serveur'?'bg-blue-600 text-white':'bg-black text-gray-400 border border-gray-700'}`}>SERVEUR</button><button onClick={()=>setRole('cuisinier')} className={`py-3 rounded-xl font-black text-sm ${role==='cuisinier'||role==='cuisine'?'bg-orange-600 text-white':'bg-black text-gray-400 border border-gray-700'}`}>CUISINE</button><button onClick={()=>setRole('caisse')} className={`py-3 rounded-xl font-black text-sm ${role==='caisse'?'bg-green-600 text-white':'bg-black text-gray-400 border border-gray-700'}`}>CAISSE</button></div><label className="flex gap-2 text-gray-400 text-sm"><input type="checkbox" checked={actif} onChange={e=>setActif(e.target.checked)}/> Actif</label><div className="flex gap-2"><button onClick={onClose} className="flex-1 bg-zinc-800 text-white py-3 rounded-xl">Annuler</button><button onClick={save} className="flex-1 bg-[#FF6B00] text-white py-3 rounded-xl font-black">Sauver {role.toUpperCase()}</button></div></div></div>
}
function RapportsTab(){
  const [commandes,setCommandes]=useState<any[]>([]);const [loading,setLoading]=useState(true);const [date,setDate]=useState(new Date().toISOString().split('T')[0]);
  const load=useCallback(async()=>{setLoading(true);const {data}=await supabase.from('commandes').select('*').eq('statut','paye').gte('created_at',`${date}T00:00:00`).lte('created_at',`${date}T23:59:59`).order('created_at',{ascending:false}).limit(200);if(data?.length){const ids=data.map((c:any)=>c.id);const {data:items}=await supabase.from('commande_items').select('*').in('commande_id',ids);const m:any={};(items||[]).forEach((it:any)=>{(m[it.commande_id]=m[it.commande_id]||[]).push(it);});setCommandes(data.map((c:any)=>({...c,items:m[c.id]||[]}))) } else setCommandes([]);setLoading(false);},[date]);
  useEffect(()=>{load();},[load]);const total=commandes.reduce((s,c)=>s+Number(c.total_final??c.total??0),0);
  if(loading) return <div className="text-white text-center py-10">Chargement...</div>;
  return <div className="space-y-3"><h2 className="text-white font-bold">Rapports</h2><input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full bg-[#1A1A1A] text-white p-3 rounded-xl border border-gray-800"/><div className="bg-[#1A1A1A] p-3 rounded-xl border border-gray-800 text-center"><div className="text-white font-black text-lg">{total} DH</div><div className="text-xs text-gray-500">{commandes.length} commandes</div></div><div className="bg-[#1A1A1A] rounded-xl border border-gray-800 overflow-hidden">{commandes.map((c:any)=><div key={c.id} className="p-3 border-b border-zinc-800"><div className="flex justify-between"><span className="text-white text-sm">T{c.table_numero} {c.serveur_nom} - {c.payment_method||'espece'}</span><span className="text-white font-bold">{Number(c.total_final??c.total??0)} DH</span></div><div className="text-[11px] text-zinc-500">{c.items?.map((i:any)=>`${i.qte}x ${i.menu_nom}`).join(', ')}</div></div>)}{commandes.length===0&&<div className="p-8 text-center text-zinc-600">Walo f {date}</div>}<div className="bg-[#FF6B00] p-3 flex justify-between text-white font-black"><span>MAJMOU3</span><span>{total} DH</span></div></div></div>
}
