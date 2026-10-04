// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { adminUsers } from '@/lib/adminUsers';
import { Plus, Edit3, Trash2, X } from 'lucide-react';

export function UtilisateursTab(){
  const [users,setUsers]=useState<any[]>([]);
  const [editing,setEditing]=useState<any>(null);
  const [show,setShow]=useState(false);

  const load=useCallback(async()=>{
    const {data}=await supabase.from('utilisateurs').select('*').order('created_at',{ascending:false});
    setUsers(data||[]);
  },[]);
  useEffect(()=>{load();},[load]);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-white font-bold text-xl">Utilisateurs - Serveur / Cuisine / Caisse</h2>
        <button onClick={()=>{setEditing(null); setShow(true);}} className="bg-[#FF6B00] text-white px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold">
          <Plus className="w-4 h-4"/> + Serveur / Cuisine / Caisse
        </button>
      </div>

      <div className="grid gap-2">
        {users.map((u:any)=>(
          <div key={u.id} className="bg-[#1A1A1A] rounded-2xl p-4 border border-gray-800 flex justify-between items-center">
            <div>
              <div className="text-white font-bold flex items-center gap-2">
                {u.nom}
                <span className={`text-[10px] px-2 py-1 rounded-full font-black ${
                  u.role==='serveur'?'bg-blue-900 text-blue-300':
                  u.role==='cuisine'?'bg-orange-900 text-orange-300':
                  u.role==='cuisinier'?'bg-orange-900 text-orange-300':
                  u.role==='caisse'?'bg-green-900 text-green-300':
                  'bg-gray-800 text-gray-300'
                }`}>
                  {u.role?.toUpperCase()}
                </span>
                {!u.actif && <span className="text-[10px] bg-red-900 text-red-300 px-2 py-1 rounded-full">OFF</span>}
              </div>
              <div className="text-gray-500 text-xs mt-1">ID: <span className="text-white font-mono">{u.identifiant}</span></div>
            </div>
            <div className="flex gap-2">
              <button onClick={()=>{setEditing(u); setShow(true);}} className="p-2.5 bg-gray-800 rounded-xl hover:bg-gray-700">
                <Edit3 className="w-4 h-4 text-white"/>
              </button>
              <button onClick={async()=>{
                if(confirm(`Supprimer ${u.nom} (${u.role})?`)){
                  const err = await adminUsers({action:'delete', id:u.id});
                  if(err) alert(err);
                  else load();
                }
              }} className="p-2.5 bg-red-950 rounded-xl hover:bg-red-900">
                <Trash2 className="w-4 h-4 text-red-400"/>
              </button>
            </div>
          </div>
        ))}
      </div>

      {users.length===0 && <div className="bg-[#1A1A1A] p-10 rounded-2xl border border-gray-800 text-center text-gray-600">Mazal ma kayn 7ta utilisateur - zid serveur / cuisinier / caisse</div>}

      {show && <UtilisateurForm user={editing} onClose={()=>{setShow(false); setEditing(null);}} onSaved={load}/>}
    </div>
  );
}

function UtilisateurForm({user,onClose,onSaved}:any){
  const [nom,setNom]=useState(user?.nom||'');
  const [identifiant,setIdentifiant]=useState(user?.identifiant||'');
  const [code,setCode]=useState('');
  const [role,setRole]=useState(user?.role||'serveur');
  const [actif,setActif]=useState(user?.actif??true);
  const [loading,setLoading]=useState(false);

  const save=async()=>{
    if(!user && (!nom ||!identifiant || code.length < 4)){
      alert('Khassk: Nom + Identifiant + Code 4+');
      return;
    }
    setLoading(true);
    const payload:any = user
     ? {action:'update', id:user.id, nom, role, actif,...(code?{code}:{})}
      : {action:'create', nom, identifiant:identifiant.toLowerCase().trim(), code, role, actif};

    const err = await adminUsers(payload);
    setLoading(false);
    if(err){
      alert('Erreur: '+err);
    } else {
      onSaved();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur flex items-center justify-center p-4">
      <div className="bg-[#1A1A1A] rounded-2xl w-full max-w-md border border-gray-800 shadow-2xl">
        <div className="p-5 border-b border-gray-800 flex justify-between items-center">
          <h3 className="text-white font-black text-lg">{user? 'Modifier':'Nouveau - Serveur / Cuisine / Caisse'}</h3>
          <button onClick={onClose} className="p-2 bg-gray-800 rounded-xl"><X className="w-5 h-5 text-gray-400"/></button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Nom complet</label>
            <input value={nom} onChange={e=>setNom(e.target.value)} placeholder="Ex: Ahmed" className="w-full bg-[#0A0A0A] text-white rounded-xl py-3 px-4 border border-gray-700 focus:border-[#FF6B00] outline-none"/>
          </div>

          <div>
            <label className="text-gray-400 text-xs mb-1 block">Identifiant (kay-dkhel bih)</label>
            <input value={identifiant} onChange={e=>setIdentifiant(e.target.value)} disabled={!!user} placeholder="Ex: ahmed1, caisse1, cuisine1" className="w-full bg-[#0A0A0A] text-white rounded-xl py-3 px-4 border border-gray-700 focus:border-[#FF6B00] outline-none disabled:opacity-50"/>
          </div>

          <div>
            <label className="text-gray-400 text-xs mb-1 block">{user? 'Nouveau code (khlli khawi ila ma bghitich tbdl)':'Code secret - 4 ar9am minimum'}</label>
            <input type="password" value={code} onChange={e=>setCode(e.target.value)} placeholder={user? '••••': 'Ex: 1234'} className="w-full bg-[#0A0A0A] text-white rounded-xl py-3 px-4 border border-gray-700 focus:border-[#FF6B00] outline-none"/>
          </div>

          <div>
            <label className="text-gray-400 text-xs mb-1 block">Chno ghadi y-dir? - Choisi ROLE</label>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={()=>setRole('serveur')} className={`py-3 rounded-xl font-black text-sm border ${role==='serveur'?'bg-blue-600 border-blue-500 text-white':'bg-[#0A0A0A] border-gray-700 text-gray-400'}`}>SERVEUR</button>
              <button onClick={()=>setRole('cuisinier')} className={`py-3 rounded-xl font-black text-sm border ${role==='cuisinier' || role==='cuisine'?'bg-orange-600 border-orange-500 text-white':'bg-[#0A0A0A] border-gray-700 text-gray-400'}`}>CUISINE</button>
              <button onClick={()=>setRole('caisse')} className={`py-3 rounded-xl font-black text-sm border ${role==='caisse'?'bg-green-600 border-green-500 text-white':'bg-[#0A0A0A] border-gray-700 text-gray-400'}`}>CAISSE</button>
            </div>
            <div className="text-[11px] text-gray-500 mt-2">
              {role==='serveur' && '→ Kay-dir commandes f salle'}
              {role==='cuisinier' && '→ Kay-chouf commandes f cuisine'}
              {role==='cuisine' && '→ Kay-chouf commandes f cuisine'}
              {role==='caisse' && '→ Kay-khallas flos f caisse'}
            </div>
          </div>

          <label className="flex items-center gap-3 bg-[#0A0A0A] p-3 rounded-xl border border-gray-800 cursor-pointer">
            <input type="checkbox" checked={actif} onChange={e=>setActif(e.target.checked)} className="w-5 h-5"/>
            <div><div className="text-white text-sm font-bold">Actif</div><div className="text-gray-500 text-xs">Ila OFF ma ghadi y-9derch y-dkhel</div></div>
          </label>
        </div>

        <div className="p-5 border-t border-gray-800 flex gap-3">
          <button onClick={onClose} disabled={loading} className="flex-1 bg-gray-800 text-white py-3.5 rounded-xl font-bold">Annuler</button>
          <button onClick={save} disabled={loading} className="flex-1 bg-[#FF6B00] text-white py-3.5 rounded-xl font-black disabled:opacity-50">
            {loading? '...':'Sauver - '+role.toUpperCase()}
          </button>
        </div>
      </div>
    </div>
  );
      }
