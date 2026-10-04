// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Edit3, Trash2, X, Upload, Plus } from 'lucide-react';

export default function Admin(){
  const [tab,setTab]=useState('menu');
  return(
    <div className="min-h-screen bg-black text-white pb-20">
      <div className="flex gap-1 p-2 border-b border-zinc-800 sticky top-0 bg-black z-20 overflow-x-auto">
        {['menu','matiere','stock','categories','users','rapports'].map((t)=><button key={t} onClick={()=>setTab(t)} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap ${tab===t?'bg-orange-600':'bg-zinc-800'}`}>{t}</button>)}
      </div>
      <div className="p-4 max-w-5xl mx-auto">
        {tab==='menu'&&<MenuTab/>}{tab==='matiere'&&<MatiereTab/>}{tab==='stock'&&<StockTab/>}{tab==='categories'&&<CategoriesTab/>}{tab==='users'&&<UsersTab/>}{tab==='rapports'&&<RapportsTab/>}
      </div>
    </div>
  );
}

function MenuTab(){
  const [menus,setMenus]=useState<any[]>([]);const [cats,setCats]=useState<any[]>([]);const [mats,setMats]=useState<any[]>([]);const [rec,setRec]=useState<any[]>([]);const [show,setShow]=useState(false);const [edit,setEdit]=useState<any>(null);
  const load=useCallback(async()=>{const a=await supabase.from('menu').select('*').order('nom');const b=await supabase.from('categories').select('*').order('ordre');const c=await supabase.from('matiere_premiere').select('*').order('nom');const d=await supabase.from('recette').select('*');setMenus(a.data||[]);setCats(b.data||[]);setMats(c.data||[]);setRec(d.data||[]);},[]);
  useEffect(()=>{load();},[load]);
  return <div><div className="flex justify-between mb-3"><h2 className="font-bold">Menu {menus.length}</h2><button onClick={()=>{setEdit(null);setShow(true);}} className="bg-orange-600 px-4 py-2 rounded-xl font-bold">+ Plat</button></div><div className="grid md:grid-cols-2 gap-3">{menus.map((m:any)=>{const ings=rec.filter((r:any)=>r.menu_id===m.id);return <div key={m.id} className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden"><div className="h-40 bg-zinc-800">{m.image_url?<img src={m.image_url} className="w-full h-full object-cover"/>:<div className="h-full flex items-center justify-center text-xs text-zinc-500">Sans photo</div>}</div><div className="p-3"><div className="flex justify-between"><div><div className="font-bold">{m.nom} - {m.prix} DH</div><div className="text-xs text-zinc-400 mt-1">{ings.map((i:any)=>{const mat=mats.find((x:any)=>x.id===i.matiere_id); const qq=i.qte_necessaire||i.quantite||i.qte||0; return `${qq}${i.unite||'g'} ${mat?.nom||''}`}).join(' + ')||'Zid ing'}</div></div><div className="flex gap-1"><button onClick={()=>{setEdit(m);setShow(true);}} className="p-2 bg-zinc-800 rounded-lg"><Edit3 className="w-4 h-4"/></button><button onClick={async()=>{if(confirm('Supprimer?')){await supabase.from('menu').delete().eq('id',m.id);load();}}} className="p-2 bg-red-900 rounded-lg"><Trash2 className="w-4 h-4"/></button></div></div></div></div>})}</div>{show&&<MenuForm menu={edit} categories={cats} matieres={mats} recs={rec.filter((r:any)=>r.menu_id===edit?.id)} onClose={()=>{setShow(false);setEdit(null);}} onSaved={load}/>}</div>
}

function MenuForm({menu,categories,matieres,recs,onClose,onSaved}:any){
  const [nom,setNom]=useState(menu?.nom||'');const [prix,setPrix]=useState(menu?String(menu.prix):'');const [cat,setCat]=useState(menu?.categorie||categories[0]?.nom||'');const [img,setImg]=useState(menu?.image_url||'');const [ings,setIngs]=useState<any[]>(recs||[]);const [sel,setSel]=useState('');const [qte,setQte]=useState('150');const [unite,setUnite]=useState('g');const [up,setUp]=useState(false);
  useEffect(()=>{ if(matieres.length &&!sel){ const first=matieres.find((m:any)=>!ings.some((i:any)=>i.matiere_id===m.id))||matieres[0]; setSel(first?.id||''); setUnite(first?.unite||'g'); } },[matieres]);
  const onFile=async(e:any)=>{const f=e.target.files?.[0]; if(!f) return; setUp(true); try{const name=Date.now()+'_'+f.name.replace(/\s/g,'_'); await supabase.storage.from('menu-images').upload(name,f,{upsert:true}); const {data}=supabase.storage.from('menu-images').getPublicUrl(name); setImg(data.publicUrl);}catch{const rd=new FileReader(); rd.onload=(ev)=>setImg(ev.target?.result as string); rd.readAsDataURL(f);} setUp(false);};
  const addIng=()=>{if(!sel) return; const q=parseFloat(qte); if(!q){ alert('Dakhal quantité'); return; } const mat=matieres.find((x:any)=>x.id===sel); if(!mat) return; const newIngs=[...ings,{matiere_id:sel, qte_necessaire:q, _nom:mat.nom, unite}]; setIngs(newIngs); const next=matieres.find((m:any)=>!newIngs.some((i:any)=>i.matiere_id===m.id)); if(next){ setSel(next.id); setUnite(next.unite||'g'); } setQte('150');};
  const save=async()=>{if(!nom||!prix) return alert('Nom + Prix'); const p={nom,prix:parseFloat(prix)||0,categorie:cat,image_url:img,disponible:true}; let id=menu?.id; try{if(menu){await supabase.from('menu').update(p).eq('id',menu.id);}else{const {data}=await supabase.from('menu').insert(p).select().single(); id=data?.id;} if(id){await supabase.from('recette').delete().eq('menu_id',id); if(ings.length){await supabase.from('recette').insert(ings.map((x:any)=>({menu_id:id, matiere_id:x.matiere_id, qte_necessaire:x.qte_necessaire, unite:x.unite})));}} onSaved(); onClose();}catch(e:any){alert(e.message);}};
  return <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"><div className="bg-zinc-900 rounded-2xl w-full max-w-lg border border-zinc-800"><div className="p-4 flex justify-between border-b border-zinc-800"><h3 className="font-bold">Plat - {ings.length} ing</h3><button onClick={onClose}><X className="w-5 h-5"/></button></div><div className="p-4 space-y-3 max-h-[75vh] overflow-auto"><input value={nom} onChange={e=>setNom(e.target.value)} placeholder="Nom" className="w-full bg-black p-3 rounded-xl border border-zinc-700"/><div className="flex gap-2"><input value={prix} onChange={e=>setPrix(e.target.value)} type="number" placeholder="Prix" className="flex-1 bg-black p-3 rounded-xl border border-zinc-700"/><select value={cat} onChange={e=>setCat(e.target.value)} className="flex-1 bg-black p-3 rounded-xl border border-zinc-700">{categories.map((c:any)=><option key={c.id} value={c.nom}>{c.label}</option>)}</select></div><div className="bg-black border-2 border-orange-500/30 rounded-xl p-3"><select value={sel} onChange={e=>{setSel(e.target.value); const m=matieres.find((x:any)=>x.id===e.target.value); if(m) setUnite(m.unite);}} className="w-full bg-zinc-800 p-3.5 rounded-xl border border-zinc-700 mb-2 font-bold">{matieres.map((m:any)=>{const used=ings.some((i:any)=>i.matiere_id===m.id); return <option key={m.id} value={m.id}>{used?'✅ ':''}{m.nom}</option>})}</select><div className="flex gap-2 mb-2"><input value={qte} onChange={e=>setQte(e.target.value)} type="number" className="flex-1 bg-zinc-800 p-3.5 rounded-xl border border-zinc-700 text-center font-black text-lg"/><select value={unite} onChange={e=>setUnite(e.target.value)} className="w-20 bg-zinc-800 p-3.5 rounded-xl border border-zinc-700 font-bold"><option>g</option><option>kg</option><option>ml</option><option>L</option><option>pcs</option></select></div><button onClick={addIng} className="w-full bg-orange-600 py-4 rounded-xl font-black">+ Ajouter {qte} {unite} {matieres.find((x:any)=>x.id===sel)?.nom||''}</button><div className="mt-3 space-y-1">{ings.map((ig:any,i:number)=><div key={i} className="flex justify-between bg-zinc-800 rounded-xl p-2.5 text-sm border border-zinc-700"><span className="font-bold">{i+1}. {ig.qte_necessaire} {ig.unite} - {ig._nom}</span><button onClick={()=>setIngs(ings.filter((_:any,idx:number)=>idx!==i))} className="text-red-400 font-black">X</button></div>)}</div></div></div><div className="p-4 border-t border-zinc-800 flex gap-2"><button onClick={onClose} className="flex-1 bg-zinc-800 py-3 rounded-xl">Annuler</button><button onClick={save} className="flex-1 bg-orange-600 py-3 rounded-xl font-bold">Sauver {ings.length}</button></div></div></div>
}

// USERS TAB - JDID KAMEL - FIHI AJOUTER / MODIFIER / SUPPRIMER
function UsersTab(){
  const [users,setUsers]=useState<any[]>([]);
  const [show,setShow]=useState(false);
  const [edit,setEdit]=useState<any>(null);
  const load=useCallback(async()=>{
    const {data,error}=await supabase.from('utilisateurs').select('*').order('created_at',{ascending:false});
    console.log('USERS:',data,error);
    setUsers(data||[]);
  },[]);
  useEffect(()=>{load();},[load]);
  return <div>
    <div className="flex justify-between mb-3 items-center">
      <h2 className="font-bold text-lg">Users {users.length}</h2>
      <button onClick={()=>{setEdit(null);setShow(true);}} className="bg-orange-600 px-4 py-2 rounded-xl font-bold flex items-center gap-2"><Plus className="w-4 h-4"/>+ User</button>
    </div>
    {users.length===0 && <div className="text-zinc-500 text-sm bg-zinc-900 p-4 rounded-xl border border-zinc-800">Ma kayn 7ta user - warrek + User</div>}
    {users.map((u:any)=><div key={u.id} className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 flex justify-between items-center mb-2">
      <div>
        <div className="font-bold">{u.nom} <span className="text-xs bg-zinc-800 px-2 py-1 rounded-lg ml-2">{u.role}</span></div>
        <div className="text-xs text-zinc-500 mt-1">ID: {u.identifiant} | Code: {u.code_acces}</div>
      </div>
      <div className="flex gap-1">
        <button onClick={()=>{setEdit(u);setShow(true);}} className="p-2.5 bg-zinc-800 rounded-xl"><Edit3 className="w-4 h-4"/></button>
        <button onClick={async()=>{if(confirm(`Supprimer ${u.nom}?`)){const {error}=await supabase.from('utilisateurs').delete().eq('id',u.id); if(error) alert(error.message); load();}}} className="p-2.5 bg-red-900 rounded-xl"><Trash2 className="w-4 h-4"/></button>
      </div>
    </div>)}
    {show&&<UserForm user={edit} onClose={()=>{setShow(false);setEdit(null);}} onSaved={load}/>}
  </div>
}

function UserForm({user,onClose,onSaved}:any){
  const [nom,setNom]=useState(user?.nom||'');
  const [ident,setIdent]=useState(user?.identifiant||'');
  const [code,setCode]=useState(user?.code_acces||'');
  const [role,setRole]=useState(user?.role||'serveur');
  const [restId,setRestId]=useState(user?.restaurant_id||'');
  const [loading,setLoading]=useState(false);

  useEffect(()=>{
    // Jib restaurant_id dyal marsilia ila ma kaynach
    if(!restId){
      supabase.from('restaurants').select('id').or('code.eq.marsilia,slug.eq.marsilia').limit(1).single().then(({data})=>{
        if(data) setRestId(data.id);
      });
    }
  },[]);

  const save=async()=>{
    if(!nom||!ident||!code) return alert('3amar Nom + Identifiant + Code');
    setLoading(true);
    try{
      const payload:any={
        nom: nom,
        identifiant: ident.trim(),
        code_acces: code.trim(),
        role: role,
        restaurant_id: restId || undefined
      };
      // Ila ma l9inach restaurant_id, n7awlo bla bih
      if(!restId){
        const {data:rest}=await supabase.from('restaurants').select('id').limit(1).single();
        if(rest) payload.restaurant_id=rest.id;
      }

      let error;
      if(user){
        const res=await supabase.from('utilisateurs').update(payload).eq('id',user.id);
        error=res.error;
      }else{
        const res=await supabase.from('utilisateurs').insert(payload);
        error=res.error;
      }
      if(error) throw error;
      onSaved(); onClose();
      alert(user? '✅ T-modifa!' : '✅ Tzada user jdide!');
    }catch(e:any){
      alert('Erreur: '+e.message+'\n\nDir had SQL f Supabase: ALTER TABLE utilisateurs DISABLE ROW LEVEL SECURITY;');
      console.error(e);
    }
    setLoading(false);
  };

  return <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
    <div className="bg-zinc-900 rounded-2xl w-full max-w-md border border-zinc-800 p-5 space-y-3">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-lg">{user? 'Modifier User' : 'Nouveau User'}</h3>
        <button onClick={onClose}><X className="w-5 h-5"/></button>
      </div>

      <input value={nom} onChange={e=>setNom(e.target.value)} placeholder="Nom complet - ex: Said Cuisine" className="w-full bg-black p-3.5 rounded-xl border border-zinc-700"/>
      <input value={ident} onChange={e=>setIdent(e.target.value)} placeholder="Identifiant - ex: said" className="w-full bg-black p-3.5 rounded-xl border border-zinc-700"/>
      <input value={code} onChange={e=>setCode(e.target.value)} placeholder="Code d'accès - ex: 1234" className="w-full bg-black p-3.5 rounded-xl border border-zinc-700"/>

      <div>
        <label className="text-xs text-zinc-400 mb-1 block">Role</label>
        <select value={role} onChange={e=>setRole(e.target.value)} className="w-full bg-black p-3.5 rounded-xl border border-zinc-700">
          <option value="admin">admin - Admin</option>
          <option value="serveur">serveur - Serveur</option>
          <option value="cuisine">cuisine - Cuisine</option>
          <option value="caisse">caisse - Caisse</option>
          <option value="plateforme">plateforme - Plateforme</option>
        </select>
      </div>

      <div className="flex gap-2 pt-2">
        <button onClick={onClose} className="flex-1 bg-zinc-800 py-3.5 rounded-xl font-bold">Annuler</button>
        <button onClick={save} disabled={loading} className="flex-1 bg-orange-600 py-3.5 rounded-xl font-bold">{loading?'...': user? 'Modifier' : 'Ajouter'}</button>
      </div>
    </div>
  </div>
}

function MatiereTab(){const [mats,setMats]=useState<any[]>([]);const [show,setShow]=useState(false);const [edit,setEdit]=useState<any>(null);const load=useCallback(async()=>{const {data}=await supabase.from('matiere_premiere').select('*').order('nom');setMats(data||[]);},[]);useEffect(()=>{load();},[load]);return <div><div className="flex justify-between mb-2"><h2 className="font-bold">Matiere {mats.length}</h2><button onClick={()=>{setEdit(null);setShow(true);}} className="bg-orange-600 px-3 py-2 rounded-xl">+ Matiere</button></div>{mats.map((m:any)=><div key={m.id} className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 flex justify-between mb-2"><div><div className="font-bold">{m.nom}</div><div className="text-xs text-zinc-500">{m.quantite} {m.unite}</div></div><div className="flex gap-1"><button onClick={()=>{setEdit(m);setShow(true);}} className="p-2 bg-zinc-800 rounded-lg"><Edit3 className="w-4 h-4"/></button><button onClick={async()=>{if(confirm('Supprimer?')){await supabase.from('matiere_premiere').delete().eq('id',m.id);load();}}} className="p-2 bg-red-900 rounded-lg"><Trash2 className="w-4 h-4"/></button></div></div>)}{show&&<MatiereForm mat={edit} onClose={()=>{setShow(false);setEdit(null);}} onSaved={load}/>}</div>}
function MatiereForm({mat,onClose,onSaved}:any){const [nom,setNom]=useState(mat?.nom||'');const [qte,setQte]=useState(mat?String(mat.quantite):'10');const [unite,setUnite]=useState(mat?.unite||'kg');const save=async()=>{const p={nom,quantite:parseFloat(qte)||0,unite,seuil_alerte:2};if(mat) await supabase.from('matiere_premiere').update(p).eq('id',mat.id);else await supabase.from('matiere_premiere').insert(p);onSaved();onClose();};return <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"><div className="bg-zinc-900 rounded-2xl w-full max-w-md border border-zinc-800 p-5 space-y-3"><input value={nom} onChange={e=>setNom(e.target.value)} placeholder="Nom" className="w-full bg-black p-3 rounded-xl border border-zinc-700"/><div className="flex gap-2"><input value={qte} onChange={e=>setQte(e.target.value)} type="number" className="flex-1 bg-black p-3 rounded-xl border border-zinc-700"/><select value={unite} onChange={e=>setUnite(e.target.value)} className="w-24 bg-black p-3 rounded-xl border border-zinc-700"><option>kg</option><option>g</option><option>L</option><option>ml</option><option>pcs</option></select></div><div className="flex gap-2"><button onClick={onClose} className="flex-1 bg-zinc-800 py-3 rounded-xl">Annuler</button><button onClick={save} className="flex-1 bg-orange-600 py-3 rounded-xl font-bold">Sauver</button></div></div></div>}
function StockTab(){const [mats,setMats]=useState<any[]>([]);useEffect(()=>{supabase.from('matiere_premiere').select('*').order('nom').then(({data})=>setMats(data||[]));},[]);return <div>{mats.map((m:any)=><div key={m.id} className="p-3 rounded-xl border bg-zinc-900 border-zinc-800 flex justify-between mb-2"><span>{m.nom}</span><span className="font-bold">{m.quantite} {m.unite}</span></div>)}</div>}
function CategoriesTab(){const [cats,setCats]=useState<any[]>([]);const [show,setShow]=useState(false);const [edit,setEdit]=useState<any>(null);const load=useCallback(async()=>{const {data}=await supabase.from('categories').select('*').order('ordre');setCats(data||[]);},[]);useEffect(()=>{load();},[load]);return <div><div className="flex justify-between mb-2"><h2 className="font-bold">Categories</h2><button onClick={()=>{setEdit(null);setShow(true);}} className="bg-orange-600 px-3 py-2 rounded-xl">+ Cat</button></div>{cats.map((c:any)=><div key={c.id} className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 flex justify-between mb-2"><div><div className="font-bold">{c.label}</div><div className="text-xs text-zinc-500">{c.nom}</div></div><div className="flex gap-1"><button onClick={()=>{setEdit(c);setShow(true);}} className="p-2 bg-zinc-800 rounded-lg"><Edit3 className="w-4 h-4"/></button><button onClick={async()=>{if(confirm('Supprimer?')){await supabase.from('categories').delete().eq('id',c.id);load();}}} className="p-2 bg-red-900 rounded-lg"><Trash2 className="w-4 h-4"/></button></div></div>)}{show&&<CatForm cat={edit} onClose={()=>{setShow(false);setEdit(null);}} onSaved={load}/>}</div>}
function CatForm({cat,onClose,onSaved}:any){const [nom,setNom]=useState(cat?.nom||'');const [label,setLabel]=useState(cat?.label||'');const save=async()=>{if(!nom||!label) return alert('Nom+Label');const p={nom:nom.toLowerCase().replace(/\s/g,'_'),label,ordre:1};if(cat) await supabase.from('categories').update(p).eq('id',cat.id);else await supabase.from('categories').insert(p);onSaved();onClose();};return <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"><div className="bg-zinc-900 rounded-2xl w-full max-w-md border border-zinc-800 p-5 space-y-3"><input value={label} onChange={e=>{setLabel(e.target.value);if(!cat) setNom(e.target.value.toLowerCase().replace(/\s/g,'_'));}} placeholder="Label" className="w-full bg-black p-3 rounded-xl border border-zinc-700"/><input value={nom} onChange={e=>setNom(e.target.value)} placeholder="nom" className="w-full bg-black p-3 rounded-xl border border-zinc-700 text-xs"/><div className="flex gap-2"><button onClick={onClose} className="flex-1 bg-zinc-800 py-3 rounded-xl">Annuler</button><button onClick={save} className="flex-1 bg-orange-600 py-3 rounded-xl font-bold">Sauver</button></div></div></div>}
function RapportsTab(){const [cs,setCs]=useState<any[]>([]);const [date,setDate]=useState(new Date().toISOString().split('T')[0]);const load=useCallback(async()=>{const {data}=await supabase.from('commandes').select('*').eq('statut','paye').gte('created_at',`${date}T00:00:00`).lte('created_at',`${date}T23:59:59`).order('created_at',{ascending:false});setCs(data||[]);},[date]);useEffect(()=>{load();},[load]);const total=cs.reduce((s,c)=>s+Number(c.total_final??c.total??0),0);return <div><input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full bg-zinc-900 p-3 rounded-xl border border-zinc-800 mb-2"/><div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 text-center font-bold mb-2">{total} DH - {cs.length} cmd</div></div>}
