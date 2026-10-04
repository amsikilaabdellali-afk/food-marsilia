// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { adminUsers } from '@/lib/adminUsers';
import { Plus, Edit3, Trash2, X, Upload } from 'lucide-react';

type Tab = 'menu'|'matiere'|'stock'|'users'|'rapports';
export default function Admin(){
  const [tab,setTab]=useState<Tab>('menu');
  return(
    <div className="min-h-screen bg-[#0A0A0A] pb-20">
      <div className="flex gap-1 p-2 bg-[#0A0A0A] border-b border-zinc-800 sticky top-0 z-30 overflow-x-auto">
        {[
          {id:'menu',label:'Menu + Photo Galerie + Ingrédients'},
          {id:'matiere',label:'Matière CRUD'},
          {id:'stock',label:'Stock'},
          {id:'users',label:'Serveur/Cuisine/Caisse'},
          {id:'rapports',label:'Rapports'},
        ].map((t:any)=><button key={t.id} onClick={()=>setTab(t.id)} className={`px-4 py-2.5 rounded-xl text-sm font-black whitespace-nowrap ${tab===t.id?'bg-[#FF6B00] text-white':'bg-zinc-900 text-gray-400'}`}>{t.label}</button>)}
      </div>
      <div className="p-4 max-w-6xl mx-auto">
        {tab==='menu'&&<MenuTab/>}
        {tab==='matiere'&&<MatiereTab/>}
        {tab==='stock'&&<StockTab/>}
        {tab==='users'&&<UsersTab/>}
        {tab==='rapports'&&<RapportsTab/>}
      </div>
    </div>
  );
}

function MenuTab(){
  const [menus,setMenus]=useState<any[]>([]);const [cats,setCats]=useState<any[]>([]);const [mats,setMats]=useState<any[]>([]);const [rec,setRec]=useState<any[]>([]);const [show,setShow]=useState(false);const [edit,setEdit]=useState<any>(null);
  const load=useCallback(async()=>{
    const a=await supabase.from('menu').select('*').order('nom');
    const b=await supabase.from('categories').select('*');
    const c=await supabase.from('matiere_premiere').select('*').order('nom');
    const d=await supabase.from('recette').select('*');
    setMenus(a.data||[]);setCats(b.data||[]);setMats(c.data||[]);setRec(d.data||[]);
  },[]);
  useEffect(()=>{load();},[load]);
  return <div className="space-y-3">
    <button onClick={()=>{setEdit(null);setShow(true);}} className="w-full bg-[#FF6B00] text-white py-4 rounded-2xl font-black">+ Ajouter Plat - Galerie + Ingrédients</button>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{menus.map((m:any)=>{
      const ings=rec.filter((r:any)=>r.menu_id===m.id);
      return <div key={m.id} className="bg-[#1A1A1A] rounded-2xl border border-zinc-800 overflow-hidden">
        <div className="h-40 bg-zinc-900">{m.image_url?<img src={m.image_url} className="w-full h-full object-cover"/>:<div className="h-full flex items-center justify-center text-zinc-600">Sans photo</div>}</div>
        <div className="p-3"><div className="flex justify-between"><div><div className="text-white font-bold">{m.nom} - {m.prix} DH</div><div className="text-[10px] text-zinc-500">{ings.map((i:any)=>{const mat=mats.find((x:any)=>x.id===i.matiere_id);return `${i.quantite}${i.unite||''} ${mat?.nom||''}`}).join(' + ')||'Sans ingrédients - zid ingrédients'}</div></div><div className="flex gap-1"><button onClick={()=>{setEdit(m);setShow(true);}} className="p-2 bg-zinc-800 rounded-lg"><Edit3 className="w-4 h-4 text-white"/></button><button onClick={async()=>{if(confirm('Supprimer?')){await supabase.from('menu').delete().eq('id',m.id);load();}}} className="p-2 bg-red-950 rounded-lg"><Trash2 className="w-4 h-4 text-red-400"/></button></div></div></div>
      </div>
    })}</div>
    {show&&<MenuForm menu={edit} categories={cats} matieres={mats} recs={rec.filter((r:any)=>r.menu_id===edit?.id)} onClose={()=>{setShow(false);setEdit(null);}} onSaved={load}/>}
  </div>
}

function MenuForm({menu,categories,matieres,recs,onClose,onSaved}:any){
  const [nom,setNom]=useState(menu?.nom||'');const [prix,setPrix]=useState(menu?String(menu.prix):'');const [cat,setCat]=useState(menu?.categorie||categories[0]?.nom||'plats');const [img,setImg]=useState(menu?.image_url||'');const [ings,setIngs]=useState<any[]>(recs||[]);const [sel,setSel]=useState(matieres[0]?.id||'');const [qte,setQte]=useState('1');const [up,setUp]=useState(false);
  const onFile=async(e:any)=>{
    const f=e.target.files?.[0];if(!f) return;setUp(true);
    try{
      const name=Date.now()+'_'+f.name;
      const {error}=await supabase.storage.from('menu-images').upload(name,f);
      if(error) throw error;
      const {data}=supabase.storage.from('menu-images').getPublicUrl(name);
      setImg(data.publicUrl);
    }catch{
      const rd=new FileReader();rd.onload=(ev)=>setImg(ev.target?.result as string);rd.readAsDataURL(f);
    }
    setUp(false);
  };
  const addIng=()=>{if(!sel) return;const ma=matieres.find((x:any)=>x.id===sel);setIngs([...ings,{matiere_id:sel,quantite:parseFloat(qte)||1,unite:ma?.unite||'kg',_nom:ma?.nom}]);};
  const save=async()=>{
    if(!nom) return alert('Nom');
    const p={nom,prix:parseFloat(prix)||0,categorie:cat,image_url:img,disponible:true};
    let id=menu?.id;
    if(menu){await supabase.from('menu').update(p).eq('id',menu.id);}else{const {data}=await supabase.from('menu').insert(p).select().single();id=data?.id;}
    if(id){await supabase.from('recette').delete().eq('menu_id',id);if(ings.length){await supabase.from('recette').insert(ings.map((x:any)=>({menu_id:id,matiere_id:x.matiere_id,quantite:x.quantite,unite:x.unite})));}}
    onSaved();onClose();
  };
  return <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-auto"><div className="bg-[#1A1A1A] rounded-2xl w-full max-w-lg border border-zinc-800">
    <div className="p-4 flex justify-between border-b border-zinc-800"><h3 className="text-white font-black">{menu?'Modifier':'Nouveau'} - Galerie + Ingrédients</h3><button onClick={onClose}><X className="w-5 h-5 text-gray-400"/></button></div>
    <div className="p-4 space-y-3 max-h-[75vh] overflow-auto">
      <input value={nom} onChange={e=>setNom(e.target.value)} placeholder="Nom plat" className="w-full bg-black text-white p-3 rounded-xl border border-zinc-700"/>
      <input value={prix} onChange={e=>setPrix(e.target.value)} placeholder="Prix" type="number" className="w-full bg-black text-white p-3 rounded-xl border border-zinc-700"/>
      <select value={cat} onChange={e=>setCat(e.target.value)} className="w-full bg-black text-white p-3 rounded-xl border border-zinc-700">{categories.map((c:any)=><option key={c.id} value={c.nom}>{c.label}</option>)}</select>
      <div className="bg-black border border-zinc-700 rounded-xl p-3"><div className="text-white text-xs font-bold mb-2">📸 Photo man Galerie / PC</div><label className="w-full bg-zinc-800 text-white py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer"><Upload className="w-4 h-4"/>{up?'Upload...':'Choisir Photo man Galerie'}<input type="file" accept="image/*" onChange={onFile} className="hidden"/></label><input value={img} onChange={e=>setImg(e.target.value)} placeholder="Wla lien https://..." className="w-full mt-2 bg-zinc-900 text-white p-2.5 rounded-xl border border-zinc-700 text-xs"/>{img&&<img src={img} className="w-full h-32 object-cover rounded-xl mt-2"/>}</div>
      <div className="bg-black border border-zinc-700 rounded-xl p-3"><div className="text-white text-xs font-bold mb-2">🧂 Ingrédients - yan9so auto mali serveur y-dawaz</div><div className="flex gap-2 mb-2"><select value={sel} onChange={e=>setSel(e.target.value)} className="flex-1 bg-zinc-900 text-white p-2.5 rounded-xl border border-zinc-700 text-sm">{matieres.map((m:any)=><option key={m.id} value={m.id}>{m.nom} ({m.quantite} {m.unite})</option>)}</select><input value={qte} onChange={e=>setQte(e.target.value)} type="number" className="w-20 bg-zinc-900 text-white p-2.5 rounded-xl border border-zinc-700"/><button onClick={addIng} className="bg-[#FF6B00] text-white px-4 rounded-xl font-black">+</button></div>{ings.map((ig:any,i:number)=><div key={i} className="flex justify-between bg-zinc-900 rounded-lg p-2 mb-1 text-xs"><span className="text-white">{ig.quantite} {ig.unite} {ig._nom||matieres.find((x:any)=>x.id===ig.matiere_id)?.nom}</span><button onClick={()=>setIngs(ings.filter((_:any,idx:number)=>idx!==i))} className="text-red-400">X</button></div>)}</div>
    </div>
    <div className="p-4 border-t border-zinc-800 flex gap-2"><button onClick={onClose} className="flex-1 bg-zinc-800 text-white py-3 rounded-xl">Annuler</button><button onClick={save} className="flex-1 bg-[#FF6B00] text-white py-3 rounded-xl font-black">Sauver</button></div>
  </div></div>
}

function MatiereTab(){const [mats,setMats]=useState<any[]>([]);const [show,setShow]=useState(false);const [edit,setEdit]=useState<any>(null);const load=useCallback(async()=>{const {data}=await supabase.from('matiere_premiere').select('*').order('nom');setMats(data||[]);},[]);useEffect(()=>{load();},[load]);return <div className="space-y-3"><div className="flex justify-between"><h2 className="text-white font-bold">Matière - Ajoute / Modifie / Supprime</h2><button onClick={()=>{setEdit(null);setShow(true);}} className="bg-[#FF6B00] text-white px-4 py-2 rounded-xl font-black">+ Matière</button></div>{mats.map((m:any)=><div key={m.id} className="bg-[#1A1A1A] p-4 rounded-xl border border-zinc-800 flex justify-between"><div><div className="text-white font-bold">{m.nom}</div><div className="text-zinc-500 text-xs">{m.quantite} {m.unite} - Seuil {m.seuil_alerte}</div></div><div className="flex gap-2"><button onClick={()=>{setEdit(m);setShow(true);}} className="p-2 bg-zinc-800 rounded-lg"><Edit3 className="w-4 h-4 text-white"/></button><button onClick={async()=>{if(confirm('Supprimer?')){await supabase.from('matiere_premiere').delete().eq('id',m.id);load();}}} className="p-2 bg-red-950 rounded-lg"><Trash2 className="w-4 h-4 text-red-400"/></button></div></div>)}{show&&<MatiereForm mat={edit} onClose={()=>{setShow(false);setEdit(null);}} onSaved={load}/>}</div>}
function MatiereForm({mat,onClose,onSaved}:any){const [nom,setNom]=useState(mat?.nom||'');const [qte,setQte]=useState(mat?String(mat.quantite):'10');const [unite,setUnite]=useState(mat?.unite||'kg');const [seuil,setSeuil]=useState(mat?String(mat.seuil_alerte):'2');const save=async()=>{const p={nom,quantite:parseFloat(qte)||0,unite,seuil_alerte:parseFloat(seuil)||0};if(mat) await supabase.from('matiere_premiere').update(p).eq('id',mat.id);else await supabase.from('matiere_premiere').insert(p);onSaved();onClose();};return <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"><div className="bg-[#1A1A1A] rounded-2xl w-full max-w-md border border-zinc-800 p-5 space-y-3"><h3 className="text-white font-bold">{mat?'Modifier':'Nouvelle'} Matière</h3><input value={nom} onChange={e=>setNom(e.target.value)} placeholder="Ex: Djaj, L7em, Zit" className="w-full bg-black text-white p-3 rounded-xl border border-zinc-700"/><div className="flex gap-2"><input value={qte} onChange={e=>setQte(e.target.value)} type="number" placeholder="Qte" className="flex-1 bg-black text-white p-3 rounded-xl border border-zinc-700"/><select value={unite} onChange={e=>setUnite(e.target.value)} className="w-24 bg-black text-white p-3 rounded-xl border border-zinc-700"><option>kg</option><option>g</option><option>L</option><option>ml</option><option>pcs</option></select></div><input value={seuil} onChange={e=>setSeuil(e.target.value)} type="number" placeholder="Seuil alerte" className="w-full bg-black text-white p-3 rounded-xl border border-zinc-700"/><div className="flex gap-2"><button onClick={onClose} className="flex-1 bg-zinc-800 text-white py-3 rounded-xl">Annuler</button><button onClick={save} className="flex-1 bg-[#FF6B00] text-white py-3 rounded-xl font-black">Sauver</button></div></div></div>}
function StockTab(){const [mats,setMats]=useState<any[]>([]);useEffect(()=>{supabase.from('matiere_premiere').select('*').order('quantite').then(({data})=>setMats(data||[]));},[]);return <div className="space-y-2">{mats.map((m:any)=><div key={m.id} className={`p-4 rounded-xl border ${Number(m.quantite)<=Number(m.seuil_alerte)?'bg-red-950 border-red-800':'bg-[#1A1A1A] border-zinc-800'}`}><div className="flex justify-between"><span className="text-white font-bold">{m.nom}</span><span className="text-white font-black">{m.quantite} {m.unite}</span></div></div>)}</div>}
function UsersTab(){const [users,setUsers]=useState<any[]>([]);const [show,setShow]=useState(false);const [edit,setEdit]=useState<any>(null);const load=useCallback(async()=>{const {data}=await supabase.from('utilisateurs').select('*').order('created_at',{ascending:false});setUsers(data||[]);},[]);useEffect(()=>{load();},[load]);return <div className="space-y-3"><button onClick={()=>{setEdit(null);setShow(true);}} className="w-full bg-[#FF6B00] text-white py-3 rounded-xl font-black">+ Serveur / Cuisine / Caisse</button>{users.map((u:any)=><div key={u.id} className="bg-[#1A1A1A] p-4 rounded-xl border border-zinc-800 flex justify-between"><div><div className="text-white font-bold">{u.nom} {u.role}</div><div className="text-zinc-500 text-xs">{u.identifiant}</div></div><div className="flex gap-2"><button onClick={()=>{setEdit(u);setShow(true);}} className="p-2 bg-zinc-800 rounded-lg"><Edit3 className="w-4 h-4 text-white"/></button><button onClick={async()=>{if(confirm('Supprimer?')){await adminUsers({action:'delete',id:u.id});load();}}} className="p-2 bg-red-950 rounded-lg"><Trash2 className="w-4 h-4 text-red-400"/></button></div></div>)}{show&&<UserForm user={edit} onClose={()=>{setShow(false);setEdit(null);}} onSaved={load}/>}</div>}
function UserForm({user,onClose,onSaved}:any){const [nom,setNom]=useState(user?.nom||'');const [id,setId]=useState(user?.identifiant||'');const [code,setCode]=useState('');const [role,setRole]=useState(user?.role||'serveur');const save=async()=>{const p=user?{action:'update',id:user.id,nom,role,...(code?{code}:{})}:{action:'create',nom,identifiant:id.toLowerCase(),code,role,actif:true};const err=await adminUsers(p);if(err) alert(err);else{onSaved();onClose();}};return <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"><div className="bg-[#1A1A1A] rounded-2xl w-full max-w-md border border-zinc-800 p-5 space-y-3"><input value={nom} onChange={e=>setNom(e.target.value)} placeholder="Nom" className="w-full bg-black text-white p-3 rounded-xl border border-zinc-700"/><input value={id} onChange={e=>setId(e.target.value)} disabled={!!user} placeholder="identifiant ex: serveur1, cuisine1, caisse1" className="w-full bg-black text-white p-3 rounded-xl border border-zinc-700"/><input value={code} onChange={e=>setCode(e.target.value)} type="password" placeholder="Code 1234" className="w-full bg-black text-white p-3 rounded-xl border border-zinc-700"/><div className="grid grid-cols-3 gap-2"><button onClick={()=>setRole('serveur')} className={`py-3 rounded-xl font-black ${role==='serveur'?'bg-blue-600 text-white':'bg-black text-gray-400 border border-zinc-700'}`}>SERVEUR</button><button onClick={()=>setRole('cuisinier')} className={`py-3 rounded-xl font-black ${role==='cuisinier'?'bg-orange-600 text-white':'bg-black text-gray-400 border border-zinc-700'}`}>CUISINE</button><button onClick={()=>setRole('caisse')} className={`py-3 rounded-xl font-black ${role==='caisse'?'bg-green-600 text-white':'bg-black text-gray-400 border border-zinc-700'}`}>CAISSE</button></div><div className="flex gap-2"><button onClick={onClose} className="flex-1 bg-zinc-800 text-white py-3 rounded-xl">Annuler</button><button onClick={save} className="flex-1 bg-[#FF6B00] text-white py-3 rounded-xl font-black">Sauver</button></div></div></div>}
function RapportsTab(){const [cs,setCs]=useState<any[]>([]);const [date,setDate]=useState(new Date().toISOString().split('T')[0]);const load=useCallback(async()=>{const {data}=await supabase.from('commandes').select('*').eq('statut','paye').gte('created_at',`${date}T00:00:00`).lte('created_at',`${date}T23:59:59`).order('created_at',{ascending:false});setCs(data||[]);},[date]);useEffect(()=>{load();},[load]);const total=cs.reduce((s,c)=>s+Number(c.total_final??c.total??0),0);return <div className="space-y-3"><input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full bg-[#1A1A1A] text-white p-3 rounded-xl border border-zinc-800"/><div className="bg-[#1A1A1A] p-3 rounded-xl border border-zinc-800 text-center"><div className="text-white font-black text-lg">{total} DH - {cs.length} cmd</div></div>{cs.map((c:any)=><div key={c.id} className="bg-[#1A1A1A] p-3 rounded-xl border border-zinc-800 flex justify-between"><span className="text-white text-sm">T{c.table_numero} {c.serveur_nom}</span><span className="text-white font-bold">{c.total_final??c.total} DH</span></div>)}<div className="bg-[#FF6B00] p-3 flex justify-between text-white font-black"><span>MAJMOU3</span><span>{total} DH</span></div></div>}
