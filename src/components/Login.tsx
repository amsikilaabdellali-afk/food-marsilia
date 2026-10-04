// @ts-nocheck
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LogOut, Users, Utensils, Table, BarChart3, Plus, Trash2, Edit } from 'lucide-react';

export default function Admin({ profil, onLogout }: any) {
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState<any[]>([]);
  const [menu, setMenu] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [newUser, setNewUser] = useState({ identifiant:'', nom:'', role:'serveur', code_acces:'' });
  const [newPlat, setNewPlat] = useState({ nom:'', prix:'', categorie:'plat', disponible:true });
  const [newTable, setNewTable] = useState({ numero:'', capacite:'4' });

  const loadAll = async () => {
    setLoading(true);
    const { data: u } = await supabase.from('utilisateurs').select('*').order('created_at',{ascending:false});
    const { data: m } = await supabase.from('menu').select('*').order('nom');
    const { data: t } = await supabase.from('tables').select('*').order('numero');
    if(u) setUsers(u);
    if(m) setMenu(m);
    if(t) setTables(t);
    setLoading(false);
  };

  useEffect(()=>{ loadAll(); },[]);

  const addUser = async () => {
    if(!newUser.identifiant || !newUser.code_acces) return alert('3amer identifiant + code');
    const { error } = await supabase.from('utilisateurs').insert([{ ...newUser, identifiant: newUser.identifiant.toLowerCase(), password: newUser.code_acces }]);
    if(error) alert(error.message); else { setNewUser({ identifiant:'', nom:'', role:'serveur', code_acces:'' }); loadAll(); }
  };

  const deleteUser = async (id:string) => {
    if(!confirm('Supprimer?')) return;
    await supabase.from('utilisateurs').delete().eq('id', id);
    loadAll();
  };

  const addPlat = async () => {
    if(!newPlat.nom || !newPlat.prix) return alert('Nom + prix');
    const { error } = await supabase.from('menu').insert([{ ...newPlat, prix: Number(newPlat.prix) }]);
    if(error) alert(error.message); else { setNewPlat({ nom:'', prix:'', categorie:'plat', disponible:true }); loadAll(); }
  };

  const deletePlat = async (id:string) => {
    if(!confirm('Supprimer plat?')) return;
    await supabase.from('menu').delete().eq('id', id);
    loadAll();
  };

  const addTable = async () => {
    if(!newTable.numero) return alert('Numero');
    const { error } = await supabase.from('tables').insert([{ numero: Number(newTable.numero), capacite: Number(newTable.capacite), statut:'libre' }]);
    if(error) alert(error.message); else { setNewTable({ numero:'', capacite:'4' }); loadAll(); }
  };

  const deleteTable = async (id:string) => {
    if(!confirm('Supprimer table?')) return;
    await supabase.from('tables').delete().eq('id', id);
    loadAll();
  };

  if(loading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"/></div>;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="sticky top-0 bg-black/90 border-b border-zinc-800 p-4 flex justify-between items-center">
        <h1 className="font-black text-orange-500">ADMIN - {profil?.user?.nom || 'Marsilia'}</h1>
        <div className="flex gap-2">
          <button onClick={loadAll} className="bg-zinc-800 px-3 py-1 rounded text-xs">Refresh</button>
          <button onClick={onLogout} className="bg-white text-black px-3 py-1 rounded text-xs font-bold flex items-center gap-1"><LogOut className="w-3 h-3"/>Logout</button>
        </div>
      </div>

      <div className="flex gap-2 p-4 overflow-auto">
        <button onClick={()=>setTab('users')} className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1 ${tab==='users'?'bg-white text-black':'bg-zinc-800'}`}><Users className="w-4 h-4"/>Users ({users.length})</button>
        <button onClick={()=>setTab('menu')} className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1 ${tab==='menu'?'bg-white text-black':'bg-zinc-800'}`}><Utensils className="w-4 h-4"/>Menu ({menu.length})</button>
        <button onClick={()=>setTab('tables')} className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1 ${tab==='tables'?'bg-white text-black':'bg-zinc-800'}`}><Table className="w-4 h-4"/>Tables ({tables.length})</button>
      </div>

      <div className="p-4 max-w-4xl mx-auto">
        {tab==='users' && (
          <div className="space-y-4">
            <div className="bg-[#1A1A1A] border border-zinc-800 rounded-2xl p-4">
              <h3 className="font-bold mb-3 flex items-center gap-2"><Plus className="w-4 h-4"/>Ajouter Utilisateur</h3>
              <div className="grid grid-cols-2 gap-2">
                <input value={newUser.identifiant} onChange={e=>setNewUser({...newUser, identifiant:e.target.value})} placeholder="identifiant ex: s2" className="bg-black border border-zinc-700 rounded-xl px-3 py-3 text-sm"/>
                <input value={newUser.nom} onChange={e=>setNewUser({...newUser, nom:e.target.value})} placeholder="Nom" className="bg-black border border-zinc-700 rounded-xl px-3 py-3 text-sm"/>
                <select value={newUser.role} onChange={e=>setNewUser({...newUser, role:e.target.value})} className="bg-black border border-zinc-700 rounded-xl px-3 py-3 text-sm">
                  <option value="serveur">Serveur</option>
                  <option value="cuisine">Cuisine</option>
                  <option value="caisse">Caisse (c1)</option>
                  <option value="admin">Admin</option>
                </select>
                <input value={newUser.code_acces} onChange={e=>setNewUser({...newUser, code_acces:e.target.value})} placeholder="code ex: 123456" className="bg-black border border-zinc-700 rounded-xl px-3 py-3 text-sm"/>
              </div>
              <button onClick={addUser} className="w-full mt-3 bg-orange-500 text-white font-bold py-3 rounded-xl">Ajouter</button>
            </div>
            <div className="space-y-2">
              {users.map(u=>(
                <div key={u.id} className="bg-[#1A1A1A] border border-zinc-800 rounded-xl p-3 flex justify-between items-center">
                  <div><div className="font-bold">{u.identifiant} - {u.nom}</div><div className="text-xs text-zinc-500">{u.role} | code: {u.code_acces}</div></div>
                  <button onClick={()=>deleteUser(u.id)} className="bg-red-900/50 text-red-400 p-2 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab==='menu' && (
          <div className="space-y-4">
            <div className="bg-[#1A1A1A] border border-zinc-800 rounded-2xl p-4">
              <h3 className="font-bold mb-3 flex items-center gap-2"><Plus className="w-4 h-4"/>Ajouter Plat</h3>
              <div className="grid grid-cols-2 gap-2">
                <input value={newPlat.nom} onChange={e=>setNewPlat({...newPlat, nom:e.target.value})} placeholder="Nom plat" className="bg-black border border-zinc-700 rounded-xl px-3 py-3 text-sm col-span-2"/>
                <input type="number" value={newPlat.prix} onChange={e=>setNewPlat({...newPlat, prix:e.target.value})} placeholder="Prix DH" className="bg-black border border-zinc-700 rounded-xl px-3 py-3 text-sm"/>
                <select value={newPlat.categorie} onChange={e=>setNewPlat({...newPlat, categorie:e.target.value})} className="bg-black border border-zinc-700 rounded-xl px-3 py-3 text-sm">
                  <option value="plat">Plat</option>
                  <option value="boisson">Boisson</option>
                  <option value="dessert">Dessert</option>
                  <option value="entree">Entrée</option>
                </select>
              </div>
              <button onClick={addPlat} className="w-full mt-3 bg-orange-500 text-white font-bold py-3 rounded-xl">Ajouter Plat</button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {menu.map(m=>(
                <div key={m.id} className="bg-[#1A1A1A] border border-zinc-800 rounded-xl p-3 flex justify-between items-center">
                  <div><div className="font-bold">{m.nom}</div><div className="text-xs text-zinc-500">{m.categorie} - {m.prix} DH</div></div>
                  <button onClick={()=>deletePlat(m.id)} className="bg-red-900/50 text-red-400 p-2 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab==='tables' && (
          <div className="space-y-4">
            <div className="bg-[#1A1A1A] border border-zinc-800 rounded-2xl p-4">
              <h3 className="font-bold mb-3 flex items-center gap-2"><Plus className="w-4 h-4"/>Ajouter Table</h3>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" value={newTable.numero} onChange={e=>setNewTable({...newTable, numero:e.target.value})} placeholder="Numero ex: 12" className="bg-black border border-zinc-700 rounded-xl px-3 py-3 text-sm"/>
                <input type="number" value={newTable.capacite} onChange={e=>setNewTable({...newTable, capacite:e.target.value})} placeholder="Capacité" className="bg-black border border-zinc-700 rounded-xl px-3 py-3 text-sm"/>
              </div>
              <button onClick={addTable} className="w-full mt-3 bg-orange-500 text-white font-bold py-3 rounded-xl">Ajouter Table</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {tables.map(t=>(
                <div key={t.id} className="bg-[#1A1A1A] border border-zinc-800 rounded-xl p-3 text-center">
                  <div className="font-black text-lg">T{t.numero}</div><div className="text-xs text-zinc-500">{t.capacite}p - {t.statut}</div>
                  <button onClick={()=>deleteTable(t.id)} className="mt-2 bg-red-900/50 text-red-400 px-2 py-1 rounded text-xs">Supprimer</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
      }
