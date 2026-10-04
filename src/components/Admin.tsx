// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { adminUsers } from '@/lib/adminUsers';
import { LayoutDashboard, UtensilsCrossed, Package, ClipboardList, Leaf, Tags, Users, FileBarChart, Plus, Edit3, Trash2, X, Upload } from 'lucide-react';

type Tab = 'dashboard'|'menu'|'stock'|'commandes'|'matiere'|'categories'|'utilisateurs'|'rapports';
export default function Admin(){
  const [tab,setTab]=useState<Tab>('menu');
  const tabs=[
    {id:'dashboard',label:'Dashboard',icon:LayoutDashboard},
    {id:'menu',label:'Menu',icon:UtensilsCrossed},
    {id:'stock',label:'Stock',icon:Package},
    {id:'matiere',label:'Matière',icon:Leaf},
    {id:'categories',label:'Catégories',icon:Tags},
    {id:'utilisateurs',label:'Utilisateurs',icon:Users},
    {id:'rapports',label:'Rapports',icon:FileBarChart},
  ];
  return(
    <div className="min-h-screen bg-[#0A0A0A] pb-20">
      <div className="sticky top-0 z-30 bg-[#0A0A0A]/95 border-b border-gray-800 flex gap-1 px-2 py-2 overflow-x-auto">
        {tabs.map(t=>{const I=t.icon; return <button key={t.id} onClick={()=>setTab(t.id as Tab)} className={`px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap ${tab===t.id?'bg-[#FF6B00] text-white':'text-gray-400 bg-zinc-900'}`}>{t.label}</button>})}
      </div>
      <div className="p-4 max-w-6xl mx-auto">
        {tab==='dashboard'&&<DashboardTab/>}
        {tab==='menu'&&<MenuTab/>}
        {tab==='stock'&&<StockTab/>}
        {tab==='matiere'&&<MatiereTab/>}
        {tab==='categories'&&<CategoriesTab/>}
        {tab==='utilisateurs'&&<UtilisateursTab/>}
        {tab==='rapports'&&<RapportsTab/>}
      </div>
    </div>
  );
}

function DashboardTab(){const [cs,setCs]=useState<any[]>([]);useEffect(()=>{const d=new Date().toISOString().split('T')[0];supabase.from('commandes').select('*').gte('created_at',d+'T00:00:00').then(({data})=>setCs(data||[]));},[]);const t=cs.filter(c=>c.statut==='paye').reduce((s,c)=>s+Number(c.total_final??c.total??0),0);return <div className="bg-[#1A1A1A] p-4 rounded-xl border border-gray-800"><div className="text-white font-black text-xl">{t} DH</div><div className="text-gray-500 text-xs">{cs.length} commandes lyoum</div></div>}

// ===== MENU AVEC GALERIE + INGREDIENTS =====
function MenuTab(){
  const [ms,setMs]=useState<any[]>([]);const [cats,setCats]=useState<any[]>([]);const [mats,setMats]=useState<any[]>([]);const [recettes,setRecettes]=useState<any[]>([]);const [show,setShow]=useState(false);const [edit,setEdit]=useState<any>(null);
  const load=useCallback(async()=>{
    const [r1,r2,r3,r4]=await Promise.all([
      supabase.from('menu').select('*').order('nom'),
      supabase.from('categories').select('*').order('ordre'),
      supabase.from('matiere_premiere').select('*').order('nom'),
      supabase.from('recette').select('*')
    ]);
    setMs(r1.data||[]); setCats(r2.data||[]); setMats(r3.data||[]); setRecettes(r4.data||[]);
  },[]);
  useEffect(()=>{load();},[load]);
  return <div className="space-y-3">
    <div className="flex justify-between items-center"><h2 className="text-white font-bold text-lg">Menu {ms.length}</h2><button onClick={()=>{setEdit(null);setShow(true);}} className="bg-[#FF6B00] text-white px-5 py-2.5 rounded-xl font-black flex gap-2"><Plus className="w-5 h-5"/>+ Plat + Photo Galerie + Ingrédients</button></div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {ms.map((m:any)=>{
        const ings = recettes.filter((r:any)=>r.menu_id===m.id);
        return <div key={m.id} className="bg-[#1A1A1A] rounded-2xl border border-gray-800 overflow-hidden">
          <div className="h-36 bg-zinc-900 relative">{m.image_url?<img src={m.image_url} className="w-full h-full object-cover"/>:<div className="h-full flex items-center justify-center text-zinc-700 text-xs">Sans photo</div>}</div>
          <div className="p-3"><div className="flex justify-between"><div><div className="text-white font-bold text-sm">{m.nom}</div><div className="text-[#FF6B00] font-black">{m.prix} DH - {m.categorie}</div><div className="text-[10px] text-zinc-500 mt-1">{ings.length? ings.map((i:any)=>`${i.quantite}${i.unite||''} ${mats.find((x:any)=>x.id===i.matiere_id)?.nom||''}`).join(' + ') : 'Sans ingrédients'}</div></div><div className="flex gap-1"><button onClick={()=>{setEdit(m);setShow(true);}} className="p-2 bg-zinc-800 rounded-lg"><Edit3 className="w-4 h-4 text-white"/></button><button onClick={async()=>{if(confirm('Supprimer?')){await supabase.from('menu').delete().eq('id',m.id);load();}}} className="p-2 bg-red-950 rounded-lg"><Trash2 className="w-4 h-4 text-red-400"/></button></div></div></div>
        </div>
      })}
    </div>
    {show&&<MenuForm menu={edit} categories={cats} matieres={mats} recettes={recettes.filter((r:any)=>r.menu_id===edit?.id)} onClose={()=>{setShow(false);setEdit(null);}} onSaved={load}/>}
  </div>
}

function MenuForm({menu,categories,matieres,recettes:initialRecettes,onClose,onSaved}:any){
  const [nom,setNom]=useState(menu?.nom||'');const [prix,setPrix]=useState(menu?String(menu.prix):'');const [cat,setCat]=useState(menu?.categorie||categories[0]?.nom||'plats');const [img,setImg]=useState(menu?.image_url||'');const [uploading,setUploading]=useState(false);
  const [ings,setIngs]=useState<any[]>(initialRecettes||[]);const [selMat,setSelMat]=useState(matieres[0]?.id||'');const [qte,setQte]=useState('1');

  const handleFile = async (e:any)=>{
    const file = e.target.files?.[0]; if(!file) return; setUploading(true);
    try{
      const ext = file.name.split('.').pop();
      const name = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const {error} = await supabase.storage.from('menu-images').upload(name, file, {upsert:true});
      if(error){
        const reader = new FileReader();
        reader.onload = (ev)=>{ setImg(ev.target?.result as string); setUploading(false); };
        reader.readAsDataURL(file); return;
      }
      const {data} = supabase.storage.from('menu-images').getPublicUrl(name);
      setImg(data.publicUrl);
    }catch{
      const reader = new FileReader(); reader.onload=(ev)=>{setImg(ev.target?.result as string);}; reader.readAsDataURL(file);
    }
    setUploading(false);
  };

  const addIng = ()=>{ if(!selMat) return; const mat = matieres.find((m:any)=>m.id===selMat); setIngs([...ings,{matiere_id:selMat, quantite:parseFloat(qte)||1, unite:mat?.unite||'g', _nom:mat?.nom}]); };
  const removeIng = (i:number)=> setIngs(ings.filter((_:any,idx:number)=>idx!==i));

  const save=async()=>{
    if(!nom||!prix) {alert('Nom + Prix'); return;}
    const payload={nom,prix:parseFloat(prix)||0,categorie:cat,image_url:img,disponible:true};
    let menuId = menu?.id;
    if(menu){ await supabase.from('menu').update(payload).eq('id',menu.id); }
    else { const {data}=await supabase.from('menu').insert(payload).select().single(); menuId=data?.id; }
    if(menuId){
      await supabase.from('recette').delete().eq('menu_id',menuId);
      if(ings.length){ const rows = ings.map((ig:any)=>({menu_id:menuId, matiere_id:ig.matiere_id, quantite:ig.quantite, unite:ig.unite})); await supabase.from('recette').insert(rows); }
    }
    onSaved(); onClose();
  };

  return <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto"><div className="bg-[#1A1A1A] rounded-2xl w-full max-w-lg border border-gray-800 my-8">
    <div className="p-5 border-b border-gray-800 flex justify-between"><h3 className="text-white font-black">{menu?'Modifier Plat':'Nouveau Plat - Galerie + Ingrédients'}</h3><button onClick={onClose}><X className="w-5 h-5 text-gray-400"/></button></div>
    <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
      <input value={nom} onChange={e=>setNom(e.target.value)} placeholder="Nom plat" className="w-full bg-black text-white rounded-xl p-3 border border-gray-700"/>
      <input type="number" value={prix} onChange={e=>setPrix(e.target.value)} placeholder="Prix DH" className="w-full bg-black text-white rounded-xl p-3 border border-gray-700"/>
      <select value={cat} onChange={e=>setCat(e.target.value)} className="w-full bg-black text-white rounded-xl p-3 border border-gray-700">{categories.map((c:any)=><option key={c.id} value={c.nom}>{c.label}</option>)}</select>

      <div className="bg-black rounded-xl p-3 border border-gray-700">
        <div className="text-white text-xs font-bold mb-2">📸 Tsawira man Galerie / PC</div>
        <div className="flex gap-2">
          <label className="flex-1 bg-zinc-800 text-white py-3 rounded-xl text-center cursor-pointer flex items-center justify-center gap-2"><Upload className="w-4 h-4"/>{uploading?'Chargement...':'Choisir man Galerie / PC'}<input type="file" accept="image/*" onChange={handleFile} className="hidden"/></label>
        </div>
        <input value={img} onChange={e=>setImg(e.target.value)} placeholder="Wla lien https://..." className="w-full mt-2 bg-zinc-900 text-white rounded-xl p-2.5 border border-gray-700 text-xs"/>
        {img&&<img src={img} className="w-full h-32 object-cover rounded-xl mt-2"/>}
      </div>

      <div className="bg-black rounded-xl p-3 border border-gray-700">
        <div className="text-white text-xs font-bold mb-2">🧂 Ingrédients - Bach yan9as Stock automatique</div>
        <div className="flex gap-2 mb-2">
          <select value={selMat} onChange={e=>setSelMat(e.target.value)} className="flex-1 bg-zinc-900 text-white rounded-xl p-2.5 border border-gray-700 text-sm">{matieres.map((m:any)=><option key={m.id} value={m.id}>{m.nom} ({m.quantite} {m.unite})</option>)}</select>
          <input type="number" value={qte} onChange={e=>setQte(e.target.value)} className="w-20 bg-zinc-900 text-white rounded-xl p-2.5 border border-gray-700" placeholder="Qte"/>
          <button onClick={addIng} className="bg-[#FF6B00] text-white px-3 rounded-xl font-bold">+</button>
        </div>
        {ings.map((ig:any,i:number)=><div key={i} className="flex justify-between items-center bg-zinc-900 rounded-lg p-2 mb-1 text-xs"><span className="text-white">{ig.quantite} {ig.unite} {ig._nom||matieres.find((x:any)=>x.id===ig.matiere_id)?.nom}</span><button onClick={()=>removeIng(i)} className="text-red-400">X</button></div>)}
        <div className="text-[10px] text-zinc-500 mt-1">Mali serveur y-dawaz commande, had ingrédients ghadi yan9so automatic man Stock</div>
      </div>
    </div>
    <div className="p-5 border-t border-gray-800 flex gap-2"><button onClick={onClose} className="flex-1 bg-zinc-800 text-white py-3 rounded-xl">Annuler</button><button onClick={save} className="flex-1 bg-[#FF6B00] text-white py-3 rounded-xl font-black">Sauver + Ingrédients</button></div>
  </div></div>
}

// ===== MATIERE AVEC CRUD KAMEL =====
function MatiereTab(){
  const [mats,setMats]=useState<any[]>([]);const [show,setShow]=useState(false);const [edit,setEdit]=useState<any>(null);
  const load=useCallback(async()=>{const {data}=await supabase.from('matiere_premiere').select('*').order('nom');setMats(data||[]);},[]);
  useEffect(()=>{load();},[load]);
  return <div className="space-y-3"><div className="flex justify-between"><h2 className="text-white font-bold text-lg">Matière Première - Tzid / Bdel / Mse7</h2><button onClick={()=>{setEdit(null);setShow(true);}} className="bg-[#FF6B00] text-white px-4 py-2 rounded-xl font-bold">+ Matière</button></div><div className="grid grid-cols-1 gap-2">{mats.map((m:any)=><div key={m.id} className="bg-[#1A1A1A] p-4 rounded-xl border border-gray-800 flex justify-between"><div><div className="text-white font-bold">{m.nom}</div><div className="text-zinc-400 text-xs">{m.quantite} {m.unite} - Seuil: {m.seuil_alerte}</div></div><div className="flex gap-2"><button onClick={()=>{setEdit(m);setShow(true);}} className="p-2 bg-zinc-800 rounded-lg"><Edit3 className="w-4 h-4 text-white"/></button><button onClick={async()=>{if(confirm('Supprimer?')){await supabase.from('matiere_premiere').delete().eq('id',m.id);load();}}} className="p-2 bg-red-950 rounded-lg"><Trash2 className="w-4 h-4 text-red-400"/></button></div></div>)}</div>{show&&<MatiereForm mat={edit} onClose={()=>{setShow(false);setEdit(null);}} onSaved={load}/>}</div>
}
function MatiereForm({mat,onClose,onSaved}:any){
  const [nom,setNom]=useState(mat?.nom||'');const [qte,setQte]=useState(mat?String(mat.quantite):'10');const [unite,setUnite]=useState(mat?.unite||'kg');const [seuil,setSeuil]=useState(mat?String(mat.seuil_alerte):'2');
  const save=async()=>{const p={nom,quantite:parseFloat(qte)||0,unite,seuil_alerte:parseFloat(seuil)||0};if(mat) await supabase.from('matiere_premiere').update(p).eq('id',mat.id); else await supabase.from('matiere_premiere').insert(p); onSaved(); onClose();};
  return <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"><div className="bg-[#1A1A1A] rounded-2xl w-full max-w-md border border-gray-800 p-5 space-y-3"><h3 className="text-white font-bold">{mat?'Modifier':'Nouvelle Matière'}</h3><input value={nom} onChange={e=>setNom(e.target.value)} placeholder="Nom ex: Djaj, Zit..." className="w-full bg-black text-white rounded-xl p-3 border border-gray-700"/><div className="flex gap-2"><input type="number" value={qte} onChange={e=>setQte(e.target.value)} placeholder="Quantité" className="flex-1 bg-black text-white rounded-xl p-3 border border-gray-700"/><select value={unite} onChange={e=>setUnite(e.target.value)} className="w-24 bg-black text-white rounded-xl p-3 border border-gray-700"><option>kg</option><option>g</option><option>L</option><option>ml</option><option>pcs</option></select></div><input type="number" value={seuil} onChange={e=>setSeuil(e.target.value)} placeholder="Seuil alerte" className="w-full bg-black text-white rounded-xl p-3 border border-gray-700"/><div className="flex gap-2"><button onClick={onClose} className="flex-1 bg-zinc-800 text-white py-3 rounded-xl">Annuler</button><button onClick={save} className="flex-1 bg-[#FF6B00] text-white py-3 rounded-xl font-black">Sauver</button></div></div></div>
}

function StockTab(){const [mats,setMats]=useState<any[]>([]);useEffect(()=>{supabase.from('matiere_premiere').select('*').order('quantite').then(({data})=>setMats(data||[]));},[]);return <div className="space-y-2">{mats.map((m:any)=><div key={m.id} className={`p-4 rounded-xl border ${Number(m.quantite)<=Number(m.seuil_alerte)?'bg-red-950 border-red-800':'bg-[#1A1A1A] border-gray-800'}`}><div className="flex justify-between"><span className="text-white font-bold">{m.nom}</span><span className={`${Number(m.quantite)<=Number(m.seuil_alerte)?'text-red-400':'text-white'} font-black`}>{m.quantite} {m.unite}</span></div>{Number(m.quantite)<=Number(m.seuil_alerte)&&<div className="text-red-400 text-xs mt-1">⚠️ Stock na9es!</div>}</div>)}</div>}
function CategoriesTab(){const [cs,setCs]=useState<any[]>([]);useEffect(()=>{supabase.from('categories').select('*').order('ordre').then(({data})=>setCs(data||[]));},[]);return <div className="space-y-2">{cs.map((c:any)=><div key={c.id} className="bg-[#1A1A1A] p-4 rounded-xl border border-gray-800 text-white">{c.label}</div>)}</div>}
function UtilisateursTab(){const [users,setUsers]=useState<any[]>([]);const [editing,setEditing]=useState<any>(null);const [show,setShow]=useState(false);const load=useCallback(async()=>{const {data}=await supabase.from('utilisateurs').select('*').order('created_at',{ascending:false});setUsers(data||[]);},[]);useEffect(()=>{load();},[load]);return <div className="space-y-3"><div className="flex justify-between"><h2 className="text-white font-bold">Serveur / Cuisine / Caisse</h2><button onClick={()=>{setEditing(null);setShow(true);}} className="bg-[#FF6B00] text-white px-4 py-2 rounded-xl font-bold">+ Utilisateur</button></div>{users.map((u:any)=><div key={u.id} className="bg-[#1A1A1A] p-4 rounded-xl border border-gray-800 flex justify-between"><div><div className="text-white font-bold">{u.nom} <span className="text-xs bg-zinc-800 px-2 py-1 rounded-full ml-2">{u.role}</span></div><div className="text-gray-500 text-xs">{u.identifiant}</div></div><div className="flex gap-2"><button onClick={()=>{setEditing(u);setShow(true);}} className="p-2 bg-zinc-800 rounded-lg"><Edit3 className="w-4 h-4 text-white"/></button><button onClick={async()=>{if(confirm('supprimer?')){await adminUsers({action:'delete',id:u.id});load();}}} className="p-2 bg-red-950 rounded-lg"><Trash2 className="w-4 h-4 text-red-400"/></button></div></div>)}{show&&<UserForm user={editing} onClose={()=>{setShow(false);setEditing(null);}} onSaved={load}/>}</div>}
function UserForm({user,onClose,onSaved}:any){const [nom,setNom]=useState(user?.nom||'');const [identifiant,setIdentifiant]=useState(user?.identifiant||'');const [code,setCode]=useState('');const [role,setRole]=useState(user?.role||'serveur');const save=async()=>{const p=user?{action:'update',id:user.id,nom,role,...(code?{code}:{})}:{action:'create',nom,identifiant:identifiant.toLowerCase(),code,role,actif:true};const err=await adminUsers(p);if(err) alert(err); else{onSaved();onClose();}};return <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"><div className="bg-[#1A1A1A] rounded-2xl w-full max-w-md border border-gray-800 p-5 space-y-3"><input value={nom} onChange={e=>setNom(e.target.value)} placeholder="Nom" className="w-full bg-black text-white rounded-xl p-3 border border-gray-700"/><input value={identifiant} onChange={e=>setIdentifiant(e.target.value)} disabled={!!user} placeholder="identifiant" className="w-full bg-black text-white rounded-xl p-3 border border-gray-700"/><input type="password" value={code} onChange={e=>setCode(e.target.value)} placeholder="Code" className="w-full bg-black text-white rounded-xl p-3 border border-gray-700"/><div className="grid grid-cols-3 gap-2"><button onClick={()=>setRole('serveur')} className={`py-3 rounded-xl font-black text-sm ${role==='serveur'?'bg-blue-600 text-white':'bg-black text-gray-400 border border-gray-700'}`}>SERVEUR</button><button onClick={()=>setRole('cuisinier')} className={`py-3 rounded-xl font-black text-sm ${role==='cuisinier'||role==='cuisine'?'bg-orange-600 text-white':'bg-black text-gray-400 border border-gray-700'}`}>CUISINE</button><button onClick={()=>setRole('caisse')} className={`py-3 rounded-xl font-black text-sm ${role==='caisse'?'bg-green-600 text-white':'bg-black text-gray-400 border border-gray-700'}`}>CAISSE</button></div><div className="flex gap-2"><button onClick={onClose} className="flex-1 bg-zinc-800 text-white py-3 rounded-xl">Annuler</button><button onClick={save} className="flex-1 bg-[#FF6B00] text-white py-3 rounded-xl font-black">Sauver</button></div></div></div>}
function RapportsTab(){const [cs,setCs]=useState<any[]>([]);const [date,setDate]=useState(new Date().toISOString().split('T')[0]);const load=useCallback(async()=>{const {data}=await supabase.from('commandes').select('*').eq('statut','paye').gte('created_at',`${date}T00:00:00`).lte('created_at',`${date}T23:59:59`).order('created_at',{ascending:false});setCs(data||[]);},[date]);useEffect(()=>{load();},[load]);const total=cs.reduce((s,c)=>s+Number(c.total_final??c.total??0),0);return <div className="space-y-3"><input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full bg-[#1A1A1A] text-white p-3 rounded-xl border border-gray-800"/><div className="bg-[#1A1A1A] p-3 rounded-xl border border-gray-800 text-center"><div className="text-white font-black text-lg">{total} DH</div><div className="text-xs text-gray-500">{cs.length} commandes</div></div><div className="bg-[#1A1A1A] rounded-xl border border-gray-800 overflow-hidden">{cs.map((c:any)=><div key={c.id} className="p-3 border-b border-zinc-800 flex justify-between"><span className="text-white text-sm">T{c.table_numero} {c.serveur_nom}</span><span className="text-white font-bold">{Number(c.total_final??c.total??0)} DH</span></div>)}<div classN
