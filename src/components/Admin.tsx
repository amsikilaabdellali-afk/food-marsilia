// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { adminUsers } from '@/lib/adminUsers';
import { Plus, Edit3, Trash2, X, Upload } from 'lucide-react';
type Tab = 'menu'|'matiere'|'stock'|'categories'|'users'|'rapports';
export default function Admin(){
  const [tab,setTab]=useState<Tab>('menu');
  const tabs=[
    {id:'menu',label:'Menu'},
    {id:'matiere',label:'Matière'},
    {id:'stock',label:'Stock'},
    {id:'categories',label:'Catégories'},
    {id:'users',label:'Utilisateurs'},
    {id:'rapports',label:'Rapports'},
  ];
  return(
    <div className="min-h-screen bg-[#0A0A0A] pb-20">
      <div className="flex gap-1 p-2 bg-[#0A0A0A] border-b border-zinc-800 sticky top-0 z-30 overflow-x-auto">
        {tabs.map((t:any)=><button key={t.id} onClick={()=>setTab(t.id as Tab)} className={`px-5 py-2.5 rounded-xl text-sm font-black whitespace-nowrap ${tab===t.id?'bg-[#FF6B00] text-white':'bg-zinc-900 text-gray-400'}`}>{t.label}</button>)}
      </div>
      <div className="p-4 max-w-6xl mx-auto">
        {tab==='menu'&&<MenuTab/>}
        {tab==='matiere'&&<MatiereTab/>}
        {tab==='stock'&&<StockTab/>}
        {tab==='categories'&&<CategoriesTab/>}
        {tab==='users'&&<UsersTab/>}
        {tab==='rapports'&&<RapportsTab/>}
      </div>
    </div>
  );
}
function MenuTab(){const [menus,setMenus]=useState<any[]>([]);const [cats,setCats]=useState<any[]>([]);const [mats,setMats]=useState<any[]>([]);const [rec,setRec]=useState<any[]>([]);const [show,setShow]=useState(false);const [edit,setEdit]=useState<any>(null);const load=useCallback(async()=>{const a=await supabase.from('menu').select('*').order('nom');const b=await supabase.from('categories').select('*').order('ordre');const c=await supabase.from('matiere_premiere').select('*').order('nom');const d=await supabase.from('recette').select('*');setMenus(a.data||[]);setCats(b.data||[]);setMats(c.data||[]);setRec(d.data||[]);},[]);useEffect(()=>{load();},[load]);return <div className="space-y-3"><div className="flex justify-between items-center"><h2 className="text-white font-black text-lg">Menu {menus.length}</h2><button onClick={()=>{setEdit(null);setShow(true);}} className="bg-[#FF6B00] text-white px-5 py-2.5 rounded-xl font-black">+ Menu</button></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{menus.map((m:any)=>{const ings=rec.filter((r:any)=>r.menu_id===m.id);return <div key={m.id} className="bg-[#1A1A1A] rounded-2xl border border-zinc-800 overflow-hidden"><div className="h-40 bg-zinc-900">{m.image_url?<img src={m.image_url} className="w-full h-full object-cover"/>:<div className="h-full flex items-center justify-center text-zinc-600 text-xs">Sans photo</div>}</div><div className="p-3"><div className="flex justify-between"><div className="flex-1"><div className="text-white font-bold">{m.nom} - {m.prix} DH</div><div className="text-[11px] text-zinc-400 mt-1">{ings.length? ings.map((i:any)=>{const mat=mats.find((x:any)=>x.id===i.matiere_id);return `${i.quantite}${i.unite} ${mat?.nom||''}`}).join(' + ') : '⚠️ Zid ingrédients bach yan9as stock'}</div></div><div className="flex gap-1 ml-2"><button onClick={()=>{setEdit(m);setShow(true);}} className="p-2 bg-zinc-800 rounded-lg"><Edit3 className="w-4 h-4 text-white"/></button><button onClick={async()=>{if(confirm('Supprimer?')){await supabase.from('menu').delete().eq('id',m.id);load();}}} className="p-2 bg-red-950 rounded-lg"><Trash2 className="w-4 h-4 text-red-400"/></button></div></div></div></div>})}</div>{show&&<MenuForm menu={edit} categories={cats} matieres={mats} recs={rec.filter((r:any)=>r.menu_id===edit?.id)} onClose={()=>{setShow(false);setEdit(null);}} onSaved={load}/>}</div>}

function MenuForm({menu,categories,matieres,recs,onClose,onSaved}:any){
  const [nom,setNom]=useState(menu?.nom||'');const [prix,setPrix]=useState(menu?String(menu.prix):'');const [cat,setCat]=useState(menu?.categorie||categories[0]?.nom||'plats');const [img,setImg]=useState(menu?.image_url||'');const [ings,setIngs]=useState<any[]>(recs||[]);const [sel,setSel]=useState(matieres[0]?.id||'');const [qte,setQte]=useState('100');const [up,setUp]=useState(false);

  useEffect(()=>{ if(matieres.length &&!sel) setSel(matieres[0].id); },[matieres]);

  const onFile=async(e:any)=>{
    const f=e.target.files?.[0];if(!f) return;setUp(true);
    try{const name=Date.now()+'_'+f.name.replace(/\s/g,'_');const {error}=await supabase.storage.from('menu-images').upload(name,f,{upsert:true});if(error) throw error;const {data}=supabase.storage.from('menu-images').getPublicUrl(name);setImg(data.publicUrl);}catch{const rd=new FileReader();rd.onload=(ev)=>setImg(ev.target?.result as string);rd.readAsDataURL(f);}setUp(false);
  };

  const addIng=()=>{
    if(!sel){ alert('Khtar matière'); return; }
    const q=parseFloat(qte); if(!q){ alert('Dir quantité'); return; }
    const mat=matieres.find((x:any)=>x.id===sel); if(!mat) return;
    // Ila deja kayn - zid 3lih - MAY-MCHICH man liste
    const idx=ings.findIndex((x:any)=>x.matiere_id===sel);
    if(idx>=0){
      const cp=[...ings]; cp[idx]={...cp[idx], quantite: cp[idx].quantite + q};
      setIngs(cp);
    }else{
      setIngs([...ings,{matiere_id:sel, quantite:q, unite:mat.unite, _nom:mat.nom}]);
    }
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
      if(ings.length){
        const rows=ings.map((x:any)=>({menu_id:id, matiere_id:x.matiere_id, quantite:x.quantite, unite:matieres.find((m:any)=>m.id===x.matiere_id)?.unite||x.unite||'g'}));
        await supabase.from('recette').insert(rows);
      }
    }
    onSaved();onClose();
  };

  return <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-auto"><div className="bg-[#1A1A1A] rounded-2xl w-full max-w-lg border border-zinc-800">
    <div className="p-4 flex justify-between border-b border-zinc-800"><h3 className="text-white font-black">Menu - {ings.length} ingrédients</h3><button onClick={onClose}><X className="w-5 h-5 text-gray-400"/></button></div>
    <div className="p-4 space-y-3 max-h-[75vh] overflow-auto">
      <input value={nom} onChange={e=>setNom(e.target.value)} placeholder="Nom plat" className="w-full bg-black text-white p-3 rounded-xl border border-zinc-700"/>
      <div className="flex gap-2"><input value={prix} onChange={e=>setPrix(e.target.value)} placeholder="Prix DH" type="number" className="flex-1 bg-black text-white p-3 rounded-xl border border-zinc-700"/><select value={cat} onChange={e=>setCat(e.target.value)} className="flex-1 bg-black text-white p-3 rounded-xl border border-zinc-700">{categories.map((c:any)=><option key={c.id} value={c.nom}>{c.label}</option>)}</select></div>
      <div className="bg-black border border-zinc-700 rounded-xl p-3"><div className="text-white text-xs font-bold mb-2">📸 Photo Galerie / PC</div><label className="w-full bg-zinc-800 text-white py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer font-bold"><Upload className="w-4 h-4"/>{up?'Upload...':'Choisir Photo'}<input type="file" accept="image/*" onChange={onFile} className="hidden"/></label>{img&&<img src={img} className="w-full h-36 object-cover rounded-xl mt-2"/>}</div>

      <div className="bg-black border border-zinc-700 rounded-xl p-3">
        <div className="text-white text-xs font-bold mb-2">🧂 Ingrédients - YAB9A w yan9as man Stock mali serveur y-sifet</div>
        {matieres.length===0? <div className="text-red-400 text-xs">⚠️ Sir Matière zid Ognion, Tomate...</div> :
          <div className="flex gap-2 mb-3">
            <select value={sel} onChange={e=>setSel(e.target.value)} className="flex-1 bg-zinc-900 text-white p-3 rounded-xl border border-zinc-700 text-sm">
              {matieres.map((m:any)=><option key={m.id} value={m.id}>{m.nom} - {m.quantite} {m.unite} f stock</option>)}
            </select>
            <input value={qte} onChange={e=>setQte(e.target.value)} type="number" className="w-20 bg-zinc-900 text-white p-3 rounded-xl border border-zinc-700 text-center font-bold"/>
            <button onClick={addIng} className="bg-[#FF6B00] text-white w-12 rounded-xl font-black text-xl">+</button>
          </div>
        }
        <div className="space-y-1.5">
          {ings.length===0&&<div className="text-zinc-600 text-xs text-center py-3 border border-dashed border-zinc-700 rounded-xl">Khtar matière w dir +<br/>T9der tzid bzaf - 5,10 ingrédients<br/>Yab9a f liste may-mchich</div>}
          {ings.map((ig:any,i:number)=>{
            const mat=matieres.find((x:any)=>x.id===ig.matiere_id);
            return <div key={i} className="flex justify-between items-center bg-zinc-900 rounded-xl p-3 text-sm border border-zinc-800">
              <span className="text-white font-bold">{ig.quantite} {mat?.unite||ig.unite} - {mat?.nom||ig._nom} {ings.filter((x:any)=>x.matiere_id===ig.matiere_id).length>1?'':''}</span>
              <div className="flex gap-2"><input type="number" value={ig.quantite} onChange={e=>{const cp=[...ings];cp[i].quantite=parseFloat(e.target.value)||0;setIngs(cp);}} className="w-16 bg-black text-white p-1.5 rounded-lg border border-zinc-700 text-center text-xs"/><button onClick={()=>setIngs(ings.filter((_:any,idx:number)=>idx!==i))} className="bg-red-900/50 text-red-400 w-7 h-7 rounded-full font-bold">X</button></div>
            </div>
          })}
        </div>
        {ings.length>0&&<div className="text-[10px] text-green-400 mt-2">✅ Had {ings.length} ingrédients ghadi yan9so auto man Stock mali serveur y-dir "Envoyer" - daba yab9a f stock may-n9asch</div>}
      </div>
    </div>
    <div className="p-4 border-t border-zinc-800 flex gap-2"><button onClick={onClose} className="flex-1 bg-zinc-800 text-white py-3 rounded-xl font-bold">Annuler</button><button onClick={save} className="flex-1 bg-[#FF6B00] text-white py-3 rounded-xl font-black">Sauver {ings.length} ingrédients</button></div>
  </div></div>
}
function CategoriesTab(){const [cats,setCats]=useState<any[]>([]);const [show,setShow]=useState(false);const [edit,setEdit]=useState<any>(null);const load=useCallback(async()=>{const {data}=await supabase.from('categories').select('*').order('ordre');setCats(data||[]);},[]);useEffect(()=>{load();},[load]);return <div className="space-y-3"><div className="flex justify-between items-center"><h2 className="text-white font-black">Catégories {cats.length}</h2><button onClick={()=>{setEdit(null);setShow(true);}} className="bg-[#FF6B00] text-white px-5 py-2.5 rounded-xl font-black">+ Catégorie</button></div><div className="grid gap-2">{cats.map((c:any)=><div key={c.id} className="bg-[#1A1A1A] p-4 rounded-xl border border-zinc-800 flex justify-between"><div><div className="text-white font-bold">{c.label}</div><div className="text-zinc-500 text-xs">{c.nom}</div></div><div className="flex gap-2"><button onClick={()=>{setEdit(c);setShow(true);}} className="p-2.5 bg-zinc-800 rounded-xl"><Edit3 className="w-4 h-4 text-white"/></button><button onClick={async()=>{if(confirm('Supprimer?')){await supabase.from('categories').delete().eq('id',c.id);load();}}} className="p-2.5 bg-red-950 rounded-xl"><Trash2 className="w-4 h-4 text-red-400"/></button></div></div>)}</div>{show&&<CatForm cat={edit} onClose={()=>{setShow(false);setEdit(null);}} onSaved={load}/>}</div>}
function CatForm({cat,onClose,onSaved}:any){const [nom,setNom]=useState(cat?.nom||'');const [label,setLabel]=useState(cat?.label||'');const [ordre,setOrdre]=useState(cat?String(cat.ordre):'1');const save=async()=>{if(!nom||!label) return alert('Nom + Label');const p={nom:nom.toLowerCase().replace(/\s/g,'_'),label,ordre:parseInt(ordre)||1};if(cat) await supabase.from('categories').update(p).eq('id',cat.id);else await supabase.from('categories').insert(p);onSaved();onClose();};return <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"><div className="bg-[#1A1A1A] rounded-2xl w-full max-w-md border border-zinc-800 p-5 space-y-3"><h3 className="text-white font-black">{cat?'Modifier':'Nouvelle'} Catégorie</h3><input value={label} onChange={e=>{setLabel(e.target.value);if(!cat) setNom(e.target.value.toLowerCase().replace(/\s/g,'_'));}} placeholder="Label" className="w-full bg-black text-white p-3 rounded-xl border border-zinc-700"/><input value={nom} onChange={e=>setNom(e.target.value)} placeholder="nom" className="w-full bg-black text-white p-3 rounded-xl border border-zinc-700 text-xs"/><input value={ordre} onChange={e=>setOrdre(e.target.value)} type="number" className="w-full bg-black text-white p-3 rounded-xl border border-zinc-700"/><div className="flex gap-2"><button onClick={onClose} className="flex-1 bg-zinc-800 text-white py-3 rounded-xl">Annuler</button><button onClick={save} className="flex-1 bg-[#FF6B00] text-white py-3 rounded-xl font-black">Sauver</button></div></div></div>}
function MatiereTab(){const [mats,setMats]=useState<any[]>([]);const [show,setShow]=useState(false);const [edit,setEdit]=useState<any>(null);const load=useCallback(async()=>{const {data}=await supabase.from('matiere_premiere').select('*').order('nom');setMats(data||[]);},[]);useEffect(()=>{load();},[load]);return <div className="space-y-3"><div className="flex justify-between"><h2 className="text-white font-black">Matière {mats.length}</h2><button onClick={()=>{setEdit(null);setShow(true);}} className="bg-[#FF6B00] text-white px-5 py-2.5 rounded-xl font-black">+ Matière</button></div>{mats.map((m:any)=><div key={m.id} className="bg-[#1A1A1A] p-4 rounded-xl border border-zinc-800 flex justify-between"><div><div className="text-white font-bold">{m.nom}</div><div className="text-zinc-500 text-xs">{m.quantite} {m.unite}</div></div><div className="flex gap-2"><button onClick={()=>{setEdit(m);setShow(true);}} className="p-2 bg-zinc-800 rounded-lg"><Edit3 className="w-4 h-4 text-white"/></button><button onClick={async()=>{if(confirm('Supprimer?')){await supabase.from('matiere_premiere').delete().eq('id',m.id);load();}}} className="p-2 bg-red-950 rounded-lg"><Trash2 className="w-4 h-4 text-red-400"/></button></div></div>)}{show&&<MatiereForm mat={edit} onClose={()=>{setShow(false);setEdit(null);}} onSaved={load}/>}</div>}
function MatiereForm({mat,onClose,onSaved}:any){const [nom,setNom]=useState(mat?.nom||'');const [qte,setQte]=useState(mat?String(mat.quantite):'10');const [unite,setUnite]=useState(mat?.unite||'g');const save=async()=>{const p={nom,quantite:parseFloat(qte)||0,unite,seuil_alerte:2};if(mat) await supabase.from('matiere_premiere').update(p).eq('id',mat.id);else await supabase.from('matiere_premiere').insert(p);onSaved();onClose();};return <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"><div className="bg-[#1A1A1A] rounded-2xl w-full max-w-md border border-zinc-800 p-5 space-y-3"><input value={nom} onChange={e=>setNom(e.target.value)} placeholder="Nom ex: Ognion" className="w-full bg-black text-white p-3 rounded-xl border border-zinc-700"/><div className="flex gap-2"><input value={qte} onChange={e=>setQte(e.target.value)} type="number" className="flex-1 bg-black text-white p-3 rounded-xl border border-zinc-700"/><select value={unite} onChange={e=>setUnite(e.target.value)} className="w-24 bg-black text-white p-3 rounded-xl border border-zinc-700"><option>kg</option><option>g</option><option>L</option><option>ml</option><option>pcs</option></select></div><div className="flex gap-2"><button onClick={onClose} className="flex-1 bg-zinc-800 text-white py-3 rounded-xl">Annuler</button><button onClick={save} className="flex-1 bg-[#FF6B00] text-white py-3 rounded-xl font-black">Sauver</button></div></div></div>}
function StockTab(){const [mats,setMats]=useState<any[]>([]);useEffect(()=>{supabase.from('matiere_premiere').select('*').order('quantite').then(({data})=>setMats(data||[]));},[]);return <div className="space-y-2">{mats.map((m:any)=><div key={m.id} className="p-4 rounded-xl border bg-[#1A1A1A] border-zinc-800"><div className="flex justify-between"><span className="text-white font-bold">{m.nom}</span><span className="text-white font-black">{m.quantite} {m.unite}</span></div></div>)}</div>}
function UsersTab(){const [users,setUsers]=useState<any[]>([]);const [show,setShow]=useState(false);const [edit,setEdit]=useState<any>(null);const load=useCallback(async()=>{const {data}=await supabase.from('utilisateurs').select('*').order('created_at',{ascending:false});setUsers(data||[]);},[]);useEffect(()=>{load();},[load]);return <div className="space-y-3"><div className="flex justify-between items-center"><h2 className="text-white font-black">Utilisateurs {users.length}</h2><button onClick={()=>{setEdit(null);setShow(true);}} className="bg-[#FF6B00] text-white px-5 py-2.5 rounded-xl font-black">+ Utilisateur</button></div>{users.map((u:any)=><div key={u.id} className="bg-[#1A1A1A] p-4 rounded-xl border border-zinc-800 flex justify-between"><div><div className="text-white font-bold">{u.nom} {u.role}</div><div className="text-zinc-500 text-xs">{u.identifiant}</div></div><div className="flex gap-2"><button onClick={()=>{setEdit(u);setShow(true);}} className="p-2 bg-zinc-800 rounded-lg"><Edit3 className="w-4 h-4 text-white"/></button><button onClick={async()=>{if(confirm('Supprimer?')){await adminUsers({action:'delete',id:u.id});load();}}} className="p-2 bg-red-950 rounded-lg"><Trash2 className="w-4 h-4 text-red-400"/></button></div></div>)}{show&&<UserForm user={edit} onClose={()=>{setShow(false);setEdit(null);}} onSaved={load}/>}</div>}
function UserForm({user,onClose,onSaved}:any){const [nom,setNom]=useState(user?.nom||'');const [id,setId]=useState(user?.identifiant||'');const [code,setCode]=useState('');const [role,setRole]=useState(user?.role||'serveur');const save=async()=>{const p=user?{action:'update',id:user.id,nom,role,...(code?{code}:{})}:{action:'create',nom,identifiant:id.toLowerCase(),code,role,actif:true};const err=await adminUsers(p);if(err) alert(err);else{onSaved();onClose();}};return <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"><div className="bg-[#1A1A1A] rounded-2xl w-full max-w-md border border-zinc-800 p-5 space-y-3"><h3 className="text-white font-black">Utilisateurs</h3><input value={nom} onChange={e=>setNom(e.target.value)} placeholder="Nom" className="w-full bg-black text-white p-3 rounded-xl border border-zinc-700"/><input value={id} onChange={e=>setId(e.target.value)} disabled={!!user} placeholder="identifiant" className="w-full bg-black text-white p-3 rounded-xl border border-zinc-700"/><input value={code} onChange={e=>setCode(e.target.value)} type="password" placeholder="Code" className="w-full bg-black text-white p-3 rounded-xl border border-zinc-700"/><div className="grid grid-cols-3 gap-2"><button onClick={()=>setRole('serveur')} className={`py-3 rounded-xl font-black ${role==='serveur'?'bg-blue-600 text-white':'bg-black text-gray-400 border border-zinc-700'}`}>SERVEUR</button><button onClick={()=>setRole('cuisinier')} className={`py-3 rounded-xl font-black ${role==='cuisinier'?'bg-orange-600 text-white':'bg-black text-gray-400 border border-zinc-700'}`}>CUISINE</button><button onClick={()=>setRole('caisse')} className={`py-3 rounded-xl font-black ${role==='caisse'?'bg-green-600 text-white':'bg-black text-gray-400 border border-zinc-700'}`}>CAISSE</button></div><div className="flex gap-2"><button onClick={onClose} className="flex-1 bg-zinc-800 text-white py-3 rounded-xl">Annuler</button><button onClick={save} className="flex-1 bg-[#FF6B00] text-white py-3 rounded-xl font-black">Sauver</button></div></div></div>}
funct
