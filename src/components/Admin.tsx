// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Edit3, Trash2, X, Upload, Camera } from 'lucide-react';

const adminUsers = async (p:any)=>{
  try{ const mod=await import('@/lib/adminUsers'); return await mod.adminUsers(p); }
  catch{
    if(p.action==='delete'){ await supabase.from('utilisateurs').delete().eq('id',p.id); return null; }
    if(p.action==='create'){ const {error}=await supabase.from('utilisateurs').insert({nom:p.nom, identifiant:p.identifiant, code:p.code, role:p.role, actif:true}); if(error) return error.message; return null; }
    if(p.action==='update'){ const upd:any={nom:p.nom, role:p.role}; if(p.code) upd.code=p.code; const {error}=await supabase.from('utilisateurs').update(upd).eq('id',p.id); if(error) return error.message; return null; }
  }
};

type Tab='menu'|'matiere'|'stock'|'categories'|'users'|'rapports';
export default function Admin(){
  const [tab,setTab]=useState<Tab>('menu');
  return(
    <div className="min-h-screen bg-[#0A0A0A] text-white pb-20">
      <div className="flex gap-1 p-2 border-b border-zinc-800 sticky top-0 bg-[#0A0A0A] z-30 overflow-x-auto">
        {[{id:'menu',label:'🍽️ Menu'},{id:'matiere',label:'🧂 Matière'},{id:'stock',label:'📦 Stock'},{id:'categories',label:'🏷️ Catégories'},{id:'users',label:'👤 Users'},{id:'rapports',label:'📊 Rapports'}].map((t:any)=><button key={t.id} onClick={()=>setTab(t.id as Tab)} className={`px-5 py-2.5 rounded-xl text-sm font-black whitespace-nowrap ${tab===t.id?'bg-[#FF6B00] text-white':'bg-zinc-900 text-gray-400'}`}>{t.label}</button>)}
      </div>
      <div className="p-4 max-w-6xl mx-auto">
        {tab==='menu'&&<MenuTab/>}{tab==='matiere'&&<MatiereTab/>}{tab==='stock'&&<StockTab/>}{tab==='categories'&&<CategoriesTab/>}{tab==='users'&&<UsersTab/>}{tab==='rapports'&&<RapportsTab/>}
      </div>
    </div>
  );
}

// ===== MENU TAB - Loula li bghiti - ga3 repas y-bano b ingrédients dyalhom =====
function MenuTab(){
  const [menus,setMenus]=useState<any[]>([]);const [cats,setCats]=useState<any[]>([]);const [mats,setMats]=useState<any[]>([]);const [rec,setRec]=useState<any[]>([]);const [show,setShow]=useState(false);const [edit,setEdit]=useState<any>(null);
  const load=useCallback(async()=>{
    const a=await supabase.from('menu').select('*').order('nom');
    const b=await supabase.from('categories').select('*').order('ordre');
    const c=await supabase.from('matiere_premiere').select('*').order('nom');
    const d=await supabase.from('recette').select('*');
    setMenus(a.data||[]);setCats(b.data||[]);setMats(c.data||[]);setRec(d.data||[]);
  },[]);
  useEffect(()=>{load();},[load]);
  return <div className="space-y-4">
    <div className="flex justify-between items-center"><h2 className="text-white font-black text-xl">Menu - {menus.length} plats - li dazo y-bano kamlin</h2><button onClick={()=>{setEdit(null);setShow(true);}} className="bg-[#FF6B00] text-white px-6 py-3 rounded-xl font-black">+ Plat Jdid</button></div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {menus.map((m:any)=>{
        const ings=rec.filter((r:any)=>r.menu_id===m.id);
        return <div key={m.id} className="bg-[#1A1A1A] rounded-2xl border border-zinc-800 overflow-hidden">
          <div className="h-44 bg-zinc-900 relative">{m.image_url?<img src={m.image_url} className="w-full h-full object-cover"/>:<div className="h-full flex items-center justify-center text-zinc-600">Sans photo</div>}<div className="absolute top-2 left-2 bg-black/70 px-3 py-1 rounded-full text-xs font-bold">{m.categorie}</div><div className="absolute top-2 right-2 bg-[#FF6B00] px-3 py-1 rounded-full text-xs font-black">{m.prix} DH</div></div>
          <div className="p-4"><div className="flex justify-between items-start"><div className="flex-1"><div className="text-white font-black text-lg">{m.nom}</div>
            <div className="mt-2 bg-black rounded-xl p-2 border border-zinc-800">
              <div className="text-[10px] text-[#FF6B00] font-black mb-1">🧂 {ings.length} INGRÉDIENTS LI DAZO F HAD PLAT:</div>
              {ings.length===0?<div className="text-zinc-500 text-xs">⚠️ Mazal ma zedti walo - sir Modifier w zid ingrédients</div>:
                <div className="flex flex-wrap gap-1">{ings.map((i:any,idx:number)=>{const mat=mats.find((x:any)=>x.id===i.matiere_id);return <span key={idx} className="bg-zinc-900 border border-zinc-700 text-white text-[11px] px-2 py-1 rounded-full font-bold">{i.quantite}{i.unite} {mat?.nom||''}</span>})}</div>
              }
            </div>
          </div><div className="flex gap-1 ml-2"><button onClick={()=>{setEdit(m);setShow(true);}} className="p-2.5 bg-zinc-800 rounded-xl"><Edit3 className="w-4 h-4 text-white"/></button><button onClick={async()=>{if(confirm('Supprimer plat?')){await supabase.from('menu').delete().eq('id',m.id);load();}}} className="p-2.5 bg-red-950 rounded-xl"><Trash2 className="w-4 h-4 text-red-400"/></button></div></div></div>
        </div>
      })}
    </div>
    {show&&<MenuForm menu={edit} categories={cats} matieres={mats} recs={rec.filter((r:any)=>r.menu_id===edit?.id)} onClose={()=>{setShow(false);setEdit(null);}} onSaved={load}/>}
  </div>
}

// ===== FORMULAIRE JDID - fih Taswira Galerie + Ingrédients chaine =====
function MenuForm({menu,categories,matieres,recs,onClose,onSaved}:any){
  const [nom,setNom]=useState(menu?.nom||'');const [prix,setPrix]=useState(menu?String(menu.prix):'');const [cat,setCat]=useState(menu?.categorie||categories[0]?.nom||'');const [img,setImg]=useState(menu?.image_url||'');const [ings,setIngs]=useState<any[]>(recs||[]);const [sel,setSel]=useState('');const [qte,setQte]=useState('100');const [up,setUp]=useState(false);

  useEffect(()=>{ if(matieres.length &&!sel){ const free=matieres.find((m:any)=>!ings.some((i:any)=>i.matiere_id===m.id)); setSel(free? free.id : matieres[0].id); } },[matieres]);

  const onFile=async(e:any)=>{
    const f=e.target.files?.[0];if(!f) return;setUp(true);
    try{
      const name=Date.now()+'_'+f.name.replace(/\s/g,'_');
      const {error}=await supabase.storage.from('menu-images').upload(name,f,{upsert:true});
      if(error) throw error;
      const {data}=supabase.storage.from('menu-images').getPublicUrl(name);
      setImg(data.publicUrl);
    }catch{
      const rd=new FileReader();rd.onload=(ev)=>setImg(ev.target?.result as string);rd.readAsDataURL(f);
    }
    setUp(false);
  };

  const addIng=()=>{
    if(!sel) return; const q=parseFloat(qte)||0; if(!q) return;
    if(ings.some((x:any)=>x.matiere_id===sel)){ alert('Deja kayn'); return; }
    const mat=matieres.find((x:any)=>x.id===sel); if(!mat) return;
    const newIngs=[...ings,{matiere_id:sel,quantite:q,unite:mat.unite,_nom:mat.nom}];
    setIngs(newIngs);
    // CHAINE AUTO - y-doze l li mazal ma tzadch
    const free=matieres.filter((m:any)=>!newIngs.some((i:any)=>i.matiere_id===m.id));
    if(free.length) setSel(free[0].id);
    setQte('100');
  };

  const save=async()=>{
    if(!nom||!prix) return alert('Nom + Prix');
    const p={nom,prix:parseFloat(prix)||0,categorie:cat,image_url:img,disponible:true};
    let id=menu?.id;
    if(menu){await supabase.from('menu').update(p).eq('id',menu.id);}
    else{const {data}=await supabase.from('menu').insert(p).select().single();id=data?.id;}
    if(id){
      await supabase.from('recette').delete().eq('menu_id',id);
      if(ings.length){ await supabase.from('recette').insert(ings.map((x:any)=>({menu_id:id,matiere_id:x.matiere_id,quantite:x.quantite,unite:matieres.find((m:any)=>m.id===x.matiere_id)?.unite||x.unite||'g'}))); }
    }
    onSaved();onClose();
  };

  const freeMats=matieres.filter((m:any)=>!ings.some((i:any)=>i.matiere_id===m.id));

  return <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-auto"><div className="bg-[#1A1A1A] rounded-2xl w-full max-w-xl border border-zinc-800">
    <div className="p-4 flex justify-between border-b border-zinc-800"><h3 className="text-white font-black text-lg">{menu?'Modifier':'Jdid'} Plat - {ings.length} ingrédients</h3><button onClick={onClose}><X className="w-6 h-6 text-gray-400"/></button></div>
    <div className="p-4 space-y-4 max-h-[80vh] overflow-auto">
      {/* Taswira Galerie */}
      <div className="bg-black border border-zinc-700 rounded-xl p-3">
        <div className="text-white text-xs font-bold mb-2 flex items-center gap-2"><Camera className="w-4 h-4"/> Taswira - Galerie / Camera</div>
        <label className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer font-bold border border-dashed border-zinc-600"><Upload className="w-5 h-5"/>{up?'Kay-tla3...':'Khtar Taswira man Galerie'}<input type="file" accept="image/*" capture="environment" onChange={onFile} className="hidden"/></label>
        {img&&<img src={img} className="w-full h-40 object-cover rounded-xl mt-3 border border-zinc-700"/>}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <input value={nom} onChange={e=>setNom(e.target.value)} placeholder="Nom plat ex: Sandwich Poulet" className="col-span-2 w-full bg-black text-white p-3.5 rounded-xl border border-zinc-700 font-bold"/>
        <input value={prix} onChange={e=>setPrix(e.target.value)} type="number" placeholder="Prix DH" className="bg-black text-white p-3.5 rounded-xl border border-zinc-700 font-black text-lg"/><select value={cat} onChange={e=>setCat(e.target.value)} className="bg-black text-white p-3.5 rounded-xl border border-zinc-700">{categories.map((c:any)=><option key={c.id} value={c.nom}>{c.label}</option>)}</select>
      </div>

      {/* Ingrédients Chaine */}
      <div className="bg-black border-2 border-[#FF6B00]/30 rounded-xl p-3">
        <div className="text-white text-sm font-black mb-3">🧂 Ingrédients - Zid bzaf - chaine auto - {freeMats.length} ba9in</div>
        {matieres.length===0?<div className="text-red-400 text-xs bg-red-950/30 p-3 rounded-xl">Sir lwl Matière w zid Ognion, Poulet...</div>: freeMats.length===0? <div className="text-green-400 text-sm text-center py-3 bg-green-950/30 rounded-xl font-bold">✅ Saliti ga3 - {ings.length} ingrédients - t9der Sauver daba</div> :
        <div className="flex gap-2 mb-3">
          <select value={sel} onChange={e=>setSel(e.target.value)} className="flex-1 bg-zinc-900 text-white p-3.5 rounded-xl border border-zinc-700 text-sm font-bold border-l-4 border-l-[#FF6B00]">{freeMats.map((m:any)=><option key={m.id} value={m.id}>➡️ {m.nom} ({m.quantite} {m.unite}) - STOCK</option>)}</select>
          <input value={qte} onChange={e=>setQte(e.target.value)} type="number" className="w-24 bg-zinc-900 text-white p-3.5 rounded-xl border border-zinc-700 text-center font-black text-lg"/><button onClick={addIng} className="bg-[#FF6B00] text-white w-14 rounded-xl font-black text-2xl">+</button>
        </div>}
        <div className="space-y-2 max-h-64 overflow-auto">
          {ings.map((ig:any,i:number)=>{const mat=matieres.find((x:any)=>x.id===ig.matiere_id);return <div key={i} className="flex justify-between items-center bg-zinc-900 rounded-xl p-3 border border-zinc-800"><span className="text-white font-bold"><span className="bg-[#FF6B00] text-white text-[10px] px-2 py-1 rounded-full mr-2">{i+1}</span>{ig.quantite} {mat?.unite||ig.unite} - {mat?.nom||ig._nom}</span><button onClick={()=>setIngs(ings.filter((_:any,idx:number)=>idx!==i))} className="bg-red-900/50 text-red-400 w-8 h-8 rounded-full font-black">X</button></div>})}
          {ings.length===0&&<div className="text-zinc-500 text-xs text-center py-6 border border-dashed border-zinc-700 rounded-xl">1. Khtar Ognion 100 + <br/>2. Y-doze auto l Poulet 200 + <br/>3. Y-doze l Salade 50 + <br/>7ta tsali ga3 ingrédients</div>}
        </div>
        <div className="text-[11px] text-green-400 mt-3 bg-green-950/20 p-2 rounded-lg">✅ Had {ings.length} ingrédients ghadi y-n9so auto man Stock mali serveur y-dir "Envoyer" f Serveur - daba yab9aw f stock</div>
      </div>
    </div>
    <div className="p-4 border-t border-zinc-800 flex gap-2"><button onClick={onClose} className="flex-1 bg-zinc-800 text-white py-3.5 rounded-xl font-bold">Annuler</button><button onClick={save} className="flex-1 bg-[#FF6B00] text-white py-3.5 rounded-xl font-black text-lg">Sauver {ings.length} ingrédients</button></div>
  </div></div>
}

function MatiereTab(){const [mats,setMats]=useState<any[]>([]);const [show,setShow]=useState(false);const [edit,setEdit]=useState<any>(null);const load=useCallback(async()=>{const {data}=await supabase.from('matiere_premiere').select('*').order('nom');setMats(data||[]);},[]);useEffect(()=>{load();},[load]);return <div className="space-y-3"><div className="flex justify-between"><h2 className="text-white font-black">Matière - ga3 li kayn f stock</h2><button onClick={()=>{setEdit(null);setShow(true);}} className="bg-[#FF6B00] text-white px-5 py-2.5 rounded-xl font-black">+ Matière</button></div>{mats.map((m:any)=><div key={m.id} className="bg-[#1A1A1A] p-4 rounded-xl border border-zinc-800 flex justify-between"><div><div className="text-white font-bold text-lg">{m.nom}</div><div className="text-zinc-500 text-xs">{m.quantite} {m.unite} f stock</div></div><div className="flex gap-2"><button onClick={()=>{setEdit(m);setShow(true);}} className="p-2.5 bg-zinc-800 rounded-xl"><Edit3 className="w-4 h-4 text-white"/></button><button onClick={async()=>{if(confirm('Supprimer?')){await supabase.from('matiere_premiere').delete().eq('id',m.id);load();}}} className="p-2.5 bg-red-950 rounded-xl"><Trash2 className="w-4 h-4 text-red-400"/></button></div></div>)}{show&&<MatiereForm mat={edit} onClose={()=>{setShow(false);setEdit(null);}} onSaved={load}/>}</div>}
function MatiereForm({mat,onClose,onSaved}:any){const [nom,setNom]=useState(mat?.nom||'');const [qte,setQte]=useState(mat?String(mat.quantite):'10');const [unite,setUnite]=useState(mat?.unite||'kg');const save=async()=>{const p={nom,quantite:parseFloat(qte)||0,unite,seuil_alerte:2};if(mat) await supabase.from('matiere_premiere').update(p).eq('id',mat.id);else await supabase.from('matiere_premiere').insert(p);onSaved();onClose();};return <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"><div className="bg-[#1A1A1A] rounded-2xl w-full max-w-md border border-zinc-800 p-5 space-y-3"><h3 className="text-white font-black">Matière</h3><input value={nom} onChange={e=>setNom(e.target.value)} placeholder="Nom ex: Ognion, Poulet, Salade, Tomate, Sauce" className="w-full bg-black text-white p-3.5 rounded-xl border border-zinc-700 font-bold"/><div className="flex gap-2"><input value={qte} onChange={e=>setQte(e.target.value)} type="number" className="flex-1 bg-black text-white p-3.5 rounded-xl border border-zinc-700 font-black"/><select value={unite} onChange={e=>setUnite(e.target.value)} className="w-28 bg-black text-white p-3.5 rounded-xl border border-zinc-700"><option>kg</option><option>g</option><option>L</option><option>ml</option><option>pcs</option></select></div><div className="flex gap-2"><button onClick={onClose} className="flex-1 bg-zinc-800 text-white py-3 rounded-xl">Annuler</button><button onClick={save} className="flex-1 bg-[#FF6B00] text-white py-3 rounded-xl font-black">Sauver</button></div></div></div>}
function StockTab(){const [mats,setMats]=useState<any[]>([]);useEffect(()=>{supabase.from('matiere_premiere').select('*').order('quantite').then(({data})=>setMats(data||[]));},[]);return <div className="space-y-2"><div className="text-white font-black mb-2">Stock daba - yan9as mali serveur y-sifet</div>{mats.map((m:any)=><div key={m.id} className="p-4 rounded-xl border bg-[#1A1A1A] border-zinc-800 flex justify-between"><span className="text-white font-bold">{m.nom}</span><span className={`font-black ${m.quantite<2?'text-red-400':'text-white'}`}>{m.quantite} {m.unite}</span></div>)}</div>}
function CategoriesTab(){const [cats,setCats]=useState<any[]>([]);const [show,setShow]=useState(false);const [edit,setEdit]=useState<any>(null);const load=useCallback(async()=>{const {data}=await supabase.from('categories').select('*').order('ordre');setCats(data||[]);},[]);useEffect(()=>{load();},[load]);return <div className="space-y-3"><div className="flex justify-between"><h2 className="text-white font-black">Catégories</h2><button onClick={()=>{setEdit(null);setShow(true);}} className="bg-[#FF6B00] text-white px-4 py-2 rounded-xl font-black">+ Catégorie</button></div>{cats.map((c:any)=><div key={c.id} className="bg-[#1A1A1A] p-4 rounded-xl border border-zinc-800 flex justify-between"><div><div className="text-white font-bold">{c.label}</div><div className="text-zinc-500 text-xs">{c.nom}</div></div><div className="flex gap-2"><button onClick={()=>{setEdit(c);setShow(true);}} className="p-2 bg-zinc-800 rounded-lg"><Edit3 className="w-4 h-4 text-white"/></button><button onClick={async()=>{if(confirm('Supprimer?')){await supabase.from('categories').delete().eq('id',c.id);load();}}} className="p-2 bg-red-950 rounded-lg"><Trash2 className="w-4 h-4 text-red-400"/></button></div></div>)}{show&&<CatForm cat={edit} onClose={()=>{setShow(false);setEdit(null);}} onSaved={load}/>}</div>}
function CatForm({cat,onClose,onSaved}:any){const [nom,setNom]=useState(cat?.nom||'');const [label,setLabel]=useState(cat?.label||'');const save=async()=>{if(!nom||!label) return alert('Nom+Label');const p={nom:nom.toLowerCase().replace(/\s/g,'_'),label,ordre:1};if(cat) await supabase.from('categories').update(p).eq('id',cat.id);else await supabase.from('categories').insert(p);onSaved();onClose();};return <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"><div className="bg-[#1A1A1A] rounded-2xl w-full max-w-md border border-zinc-800 p-5 space-y-3"><input value={label} onChange={e=>{setLabel(e.target.value);if(!cat) setNom(e.target.value.toLowerCase().replace(/\s/g,'_'));}} placeholder="Label" className="w-full bg-black text-white p-3 rounded-xl border border-zinc-700"/><input value={nom} onChange={e=>setNom(e.target.value)} placeholder="nom" className="w-full bg-black text-white p-3 rounded-xl border border-zinc-700 text-xs"/><div className="flex gap-2"><button onClick={onClose} className="flex-1 bg-zinc-800 text-white py-3 rounded-xl">Annuler</button><button onClick={save} className="flex-1 bg-[#FF6B00] text-white py-3 rounded-xl font-black">Sauver</button></div></div></div>}
function UsersTab(){const [users,setUsers]=useState<any[]>([]);const [show,setShow]=useState(false);const [edit,setEdit]=useState<any>(null);const load=useCallback(async()=>{const {data}=await supabase.from('utilisateurs').select('*').order('created_at',{ascending:false});setUsers(data||[]);},[]);useEffect(()=>{load();},[load]);return <div className="space-y-3"><div className="flex justify-between"><h2 className="text-white font-black">Utilisateurs</h2><button onClick={()=>{setEdit(null);setShow(true);}} className="bg-[#FF6B00] text-white px-4 py-2 rounded-xl font-black">+ Utilisateur</button></div>{users.map((u:any)=><div key={u.id} className="bg-[#1A1A1A] p-4 rounded-xl border border-zinc-800 flex justify-between"><div><div className="text-white font-bold">{u.nom} {u.role}</div><div className="text-zinc-500 text-xs">{u.identifiant}</div></div><div className="flex gap-2"><button onClick={()=>{setEdit(u);setShow(true);}} className="p-2 bg-zinc-800 rounded-lg"><Edit3 className="w-4 h-4 text-white"/></button><button onClick={async()=>{if(confirm('Supprimer?')){await adminUsers({action:'delete',id:u.id});load();}}} className="p-2 bg-red-950 rounded-lg"><Trash2 className="w-4 h-4 text-red-400"/></button></div></div>)}{show&&<UserForm user={edit} onClose={()=>{setShow(false);setEdit(null);}} onSaved={load}/>}</div>}
function UserForm({user,onClose,onSaved}:any){const [nom,setNom]=useState(user?.nom||'');const [id,setId]=useState(user?.identifiant||'');const [code,setCode]=useState('');co
