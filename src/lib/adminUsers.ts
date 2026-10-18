// @ts-nocheck
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { adminUsers } from '@/lib/adminUsers';
import { Users, Plus, Trash2, Edit, Radio, BarChart3, ChefHat, DollarSign, Crown, Lock } from 'lucide-react';
import PatronLive from './PatronLive';
import StatsCommandes from './StatsCommandes';

export default function Admin() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showLive, setShowLive] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  
  const [form, setForm] = useState({
    nom: '',
    identifiant: '',
    code: '',
    role: 'serveur',
    actif: true
  });

  const loadUsers = async () => {
    setLoading(true);
    const { data } = await supabase.from('utilisateurs').select('*').order('created_at', { ascending: false });
    if(data) setUsers(data);
    setLoading(false);
  };

  useEffect(() => { loadUsers(); }, []);

  const handleCreate = async () => {
    if(!form.nom || !form.identifiant || !form.code){
      alert('3amar ga3 les champs!');
      return;
    }
    const err = await adminUsers({
      action: 'create',
      nom: form.nom,
      identifiant: form.identifiant,
      code: form.code,
      role: form.role,
      actif: form.actif
    });
    if(err){
      alert('Erreur: '+err);
    } else {
      alert('✅ Utilisateur tzad!');
      setShowCreate(false);
      setForm({ nom: '', identifiant: '', code: '', role: 'serveur', actif: true });
      loadUsers();
    }
  };

  const handleUpdate = async () => {
    if(!editing) return;
    const err = await adminUsers({
      action: 'update',
      id: editing.id,
      nom: editing.nom,
      role: editing.role,
      actif: editing.actif,
      code: editing.code_acces
    });
    if(err) alert(err);
    else {
      alert('✅ Tbadal!');
      setEditing(null);
      loadUsers();
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm('Bghiti tmsa7 had user?')) return;
    const err = await adminUsers({ action: 'delete', id });
    if(err) alert(err);
    else loadUsers();
  };

  if(showLive){
    return (
      <div className="min-h-screen bg-black">
        <div className="bg-red-600 text-white p-3 flex justify-between items-center sticky top-0 z-50">
          <span className="font-black text-sm">🔴 LIVE PATRON MODE</span>
          <button onClick={()=>setShowLive(false)} className="bg-black px-4 py-1 rounded-full text-xs font-bold">Kharaj ✕</button>
        </div>
        <PatronLive />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-3 pb-24">
      {/* HEADER */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-black text-lg flex items-center gap-2"><Crown className="w-5 h-5 text-yellow-400" /> ADMIN MARSILIA</h1>
            <p className="text-[10px] text-zinc-500 mt-1">{users.length} utilisateurs • Badge: •••••••• makhfi</p>
          </div>
          <button onClick={()=>setShowCreate(true)} className="bg-yellow-500 text-black px-4 py-2 rounded-full font-black text-xs flex items-center gap-1">
            <Plus className="w-4 h-4" /> Zid User
          </button>
        </div>
      </div>

      {/* STATS RAPIDE */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-2 text-center">
          <div className="text-[9px] text-zinc-500">TOTAL</div>
          <div className="font-black text-lg">{users.length}</div>
        </div>
        <div className="bg-blue-900/20 border border-blue-800 rounded-xl p-2 text-center">
          <div className="text-[9px] text-blue-400">SERVEUR</div>
          <div className="font-black text-lg text-blue-400">{users.filter(u=>u.role==='serveur').length}</div>
        </div>
        <div className="bg-orange-900/20 border border-orange-800 rounded-xl p-2 text-center">
          <div className="text-[9px] text-orange-400">CUISINE</div>
          <div className="font-black text-lg text-orange-400">{users.filter(u=>u.role==='cuisine').length}</div>
        </div>
        <div className="bg-green-900/20 border border-green-800 rounded-xl p-2 text-center">
          <div className="text-[9px] text-green-400">CAISSE</div>
          <div className="font-black text-lg text-green-400">{users.filter(u=>u.role==='caisse').length}</div>
        </div>
      </div>

      {/* LISTE USERS */}
      <div className="space-y-2">
        {loading ? (
          <div className="text-center py-10 text-zinc-600">Kaytchargi...</div>
        ) : users.map((u) => (
          <div key={u.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs ${
                u.role==='admin'?'bg-red-600': u.role==='caisse'?'bg-green-600': u.role==='cuisine'?'bg-orange-600':'bg-blue-600'
              }`}>
                {u.identifiant?.slice(0,2).toUpperCase()}
              </div>
              <div>
                <div className="font-bold text-sm flex items-center gap-2">
                  {u.nom}
                  {!u.actif && <span className="bg-red-600 text-[8px] px-1.5 py-0.5 rounded-full">OFF</span>}
                </div>
                <div className="text-[11px] text-zinc-400">
                  {u.identifiant} • {u.role} • ••••••••
                </div>
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={()=>setEditing(u)} className="bg-zinc-800 p-2 rounded-full">
                <Edit className="w-4 h-4" />
              </button>
              <button onClick={()=>handleDelete(u.id)} className="bg-red-600/20 border border-red-600 p-2 rounded-full">
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE MODAL */}
      {showCreate && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border-2 border-yellow-500 rounded-2xl p-5 w-full max-w-sm">
            <h3 className="font-black mb-4">Zid Utilisateur Jdid</h3>
            <div className="space-y-3">
              <input value={form.nom} onChange={e=>setForm({...form, nom: e.target.value})} placeholder="Smit (ex: Said Cuisine)" className="w-full bg-black border border-zinc-700 rounded-xl p-3 text-sm" />
              <input value={form.identifiant} onChange={e=>setForm({...form, identifiant: e.target.value.toLowerCase()})} placeholder="Identifiant (ex: said, s1, c1)" className="w-full bg-black border border-zinc-700 rounded-xl p-3 text-sm" />
              <input value={form.code} onChange={e=>setForm({...form, code: e.target.value})} type="password" placeholder="Code ••••••••" className="w-full bg-black border border-zinc-700 rounded-xl p-3 text-sm tracking-widest" />
              <select value={form.role} onChange={e=>setForm({...form, role: e.target.value})} className="w-full bg-black border border-zinc-700 rounded-xl p-3 text-sm">
                <option value="serveur">Serveur (s1, s2... / TPE)</option>
                <option value="cuisine">Cuisine (said)</option>
                <option value="caisse">Caisse (c1)</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={()=>setShowCreate(false)} className="flex-1 bg-zinc-800 py-3 rounded-xl font-bold text-sm">Annuler</button>
              <button onClick={handleCreate} className="flex-1 bg-yellow-500 text-black py-3 rounded-xl font-black text-sm">Zid ✅</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editing && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border-2 border-blue-500 rounded-2xl p-5 w-full max-w-sm">
            <h3 className="font-black mb-4">Badal {editing.identifiant}</h3>
            <div className="space-y-3">
              <input value={editing.nom} onChange={e=>setEditing({...editing, nom: e.target.value})} className="w-full bg-black border border-zinc-700 rounded-xl p-3 text-sm" />
              <select value={editing.role} onChange={e=>setEditing({...editing, role: e.target.value})} className="w-full bg-black border border-zinc-700 rounded-xl p-3 text-sm">
                <option value="serveur">Serveur</option>
                <option value="cuisine">Cuisine</option>
                <option value="caisse">Caisse</option>
                <option value="admin">Admin</option>
              </select>
              <input value={editing.code_acces} onChange={e=>setEditing({...editing, code_acces: e.target.value})} type="password" placeholder="Code jdid ••••••••" className="w-full bg-black border border-zinc-700 rounded-xl p-3 text-sm tracking-widest" />
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={editing.actif} onChange={e=>setEditing({...editing, actif: e.target.checked})} /> Actif
              </label>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={()=>setEditing(null)} className="flex-1 bg-zinc-800 py-3 rounded-xl font-bold text-sm">Annuler</button>
              <button onClick={handleUpdate} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-black text-sm">Save ✅</button>
            </div>
          </div>
        </div>
      )}

      {/* BOUTONS FIXED */}
      <StatsCommandes />
      
      <button
        onClick={()=>setShowLive(true)}
        className="fixed bottom-4 left-4 z-50 bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-full font-black text-xs shadow-2xl flex items-center gap-2 animate-pulse border-2 border-white"
      >
        <Radio className="w-4 h-4" /> LIVE PATRON 🔴
      </button>

      <div className="fixed bottom-4 right-20 z-40 bg-zinc-900 border border-zinc-700 px-3 py-2 rounded-full text-[9px] text-zinc-500">
        Badge makhfi ••••••••
      </div>
    </div>
  );
}
