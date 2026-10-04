// @ts-nocheck
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Admin() {
  const [tab, setTab] = useState('menu');
  const [menus, setMenus] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [matieres, setMatieres] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);

  useEffect(()=>{ loadAll(); }, []);
  const loadAll = async () => {
    const [{data: m}, {data: c}, {data: mat}, {data: t}] = await Promise.all([
      supabase.from('menus').select('*').order('nom'),
      supabase.from('categories').select('*').order('nom'),
      supabase.from('matieres').select('*').order('nom'),
      supabase.from('tables').select('*').order('numero'),
    ]);
    setMenus(m||[]); setCats(c||[]); setMatieres(mat||[]); setTables(t||[]);
  };

  const viderTout = async () => {
    if(!confirm('⛔️ T-msa7 GA3 commandes?')) return;
    if(!confirm('Mta2akked?')) return;
    await supabase.from('commande_items').delete().neq('id','00000000-0000-0000-0000-000000000000');
    await supabase.from('commandes').delete().neq('id','00000000-0000-0000-0000-000000000000');
    await supabase.from('tables').update({statut:'libre'}).neq('id','00000000-0000-0000-0000-000000000000');
    alert('✅ Tmsa7 ga3 - 0');
  };
  const viderToday = async () => {
    const start = new Date(); start.setHours(0,0,0,0);
    const {data} = await supabase.from('commandes').select('id').gte('created_at', start.toISOString());
    const ids=(data||[]).map((x:any)=>x.id);
    if(ids.length){
      await supabase.from('commande_items').delete().in('commande_id', ids);
      await supabase.from('commandes').delete().in('id', ids);
      alert(`Tmsa7 ${ids.length} lyoum`);
    } else alert('Ma kayn walou lyoum');
  };

  const deleteMenu = async (id:string) => {
    if(!confirm('Msa7 had plat?')) return;
    await supabase.from('menus').delete().eq('id', id); loadAll();
  };
  const deleteMatiere = async (id:string) => {
    if(!confirm('Msa7 matiere?')) return;
    await supabase.from('matieres').delete().eq('id', id); loadAll();
  };

  return (
    <div className="min-h-screen bg-black text-white p-3">
      <div className="max-w-6xl mx-auto space-y-4">
        <h1 className="text-2xl font-black">Admin - Marsilia Food</h1>

        {/* TABS */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            {k:'menu', l:'📋 Menu'},
            {k:'cat', l:'📂 Catégories'},
            {k:'mat', l:'🥕 Matière'},
            {k:'stock', l:'📦 Stock'},
            {k:'tables', l:'🪑 Tables'},
            {k:'clean', l:'🧹 Nettoyage'},
          ].map(t=>(
            <button key={t.k} onClick={()=>setTab(t.k)} className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap ${tab===t.k?'bg-orange-600':'bg-zinc-800'}`}>{t.l}</button>
          ))}
        </div>

        {/* MENU */}
        {tab==='menu' && (
          <div className="space-y-2">
            <div className="flex justify-between"><h2 className="font-bold">Plats ({menus.length})</h2><button onClick={()=>window.location.href='/admin/menu/new'} className="bg-green-700 px-3 py-1 rounded-lg text-sm">+ Ajouter Plat</button></div>
            {menus.map(m=>(
              <div key={m.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex justify-between">
                <div><div className="font-bold">{m.nom}</div><div className="text-xs text-zinc-400">{m.categorie} - {m.prix} DH - Stock: {m.stock?? '-'}</div></div>
                <button onClick={()=>deleteMenu(m.id)} className="text-red-400 text-sm">Suppr</button>
              </div>
            ))}
          </div>
        )}

        {/* CATEGORIES */}
        {tab==='cat' && (
          <div className="space-y-2">
            <h2 className="font-bold">Catégories ({cats.length})</h2>
            <div className="grid grid-cols-2 gap-2">
              {cats.map(c=>(
                <div key={c.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">{c.nom} - {c.ordre||0}</div>
              ))}
            </div>
          </div>
        )}

        {/* MATIERE */}
        {tab==='mat' && (
          <div className="space-y-2">
            <h2 className="font-bold">Matières Premières ({matieres.length})</h2>
            {matieres.map(m=>(
              <div key={m.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex justify-between">
                <div><div className="font-bold">{m.nom}</div><div className="text-xs text-zinc-400">{m.unite} - {m.stock_actuel?? 0} - Alerte: {m.seuil_alerte?? 0}</div></div>
                <button onClick={()=>deleteMatiere(m.id)} className="text-red-400">X</button>
              </div>
            ))}
          </div>
        )}

        {/* STOCK */}
        {tab==='stock' && (
          <div className="space-y-2">
            <h2 className="font-bold">Stock - Matière</h2>
            {matieres.filter(m=>(m.stock_actuel||0) <= (m.seuil_alerte||5)).map(m=>(
              <div key={m.id} className="bg-red-950/50 border border-red-700 rounded-xl p-3">
                ⚠️ <b>{m.nom}</b> - Ba9i {m.stock_actuel} {m.unite} - khassk t-zid!
              </div>
            ))}
            {matieres.filter(m=>(m.stock_actuel||0) > (m.seuil_alerte||5)).map(m=>(
              <div key={m.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex justify-between"><span>{m.nom}</span><span className="text-green-400">{m.stock_actuel} {m.unite}</span></div>
            ))}
          </div>
        )}

        {/* TABLES */}
        {tab==='tables' && (
          <div className="space-y-2">
            <h2 className="font-bold">Tables ({tables.length})</h2>
            <div className="grid grid-cols-3 gap-2">
              {tables.map(t=>(
                <div key={t.id} className={`rounded-xl p-4 text-center font-bold border ${t.statut==='occupee'?'bg-red-900/40 border-red-700':'bg-green-900/30 border-green-700'}`}>
                  Table {t.numero}<div className="text-xs">{t.statut}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NETTOYAGE */}
        {tab==='clean' && (
          <div className="bg-red-950/30 border-2 border-red-800 rounded-2xl p-5 space-y-4">
            <h2 className="font-black text-red-400 text-xl">🧹 Nettoyage Base</h2>
            <p className="text-sm text-zinc-400">Hna fin t-khwi commandes dyal test</p>
            <button onClick={viderToday} className="w-full bg-yellow-700 hover:bg-yellow-600 text-white font-bold py-4 rounded-xl">🗑️ Khwi ghir dyal LYOUМ</button>
            <button onClick={viderTout} className="w-full bg-red-700 hover:bg-red-600 text-white font-black py-4 rounded-xl border-2 border-red-500">⛔️ KHWI GA3 - BDA MEN 0</button>
            <div className="text-[11px] text-red-300 text-center">Kay-msa7 commandes + commande_items - Menu / Stock ma kay-tms7ouch</div>
          </div>
        )}
      </div>
    </div>
  );
            }
