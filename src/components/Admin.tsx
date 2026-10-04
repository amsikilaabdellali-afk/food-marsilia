// @ts-nocheck
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Admin(){
  const [tab,setTab]=useState('rapports');
  const tabs=['menu','matiere','stock','categories','users','rapports'];
  return(
    <div className="min-h-screen bg-black text-white pb-20">
      <div className="flex gap-1 p-2 border-b border-zinc-800 sticky top-0 bg-black z-20 overflow-x-auto">
        {tabs.map((t)=><button key={t} onClick={()=>setTab(t)} className={`px-3 py-2 rounded-xl text-xs font-bold ${tab===t?'bg-orange-600':'bg-zinc-800'}`}>{t.toUpperCase()}</button>)}
      </div>
      <div className="p-3 max-w-5xl mx-auto">
        {tab==='rapports'&&<RapportsTab/>}
        {tab!=='rapports'&&<div className="p-10 text-center text-zinc-500">Tab {tab} - ghadi n-raj3oha mor ma y-khdam Rapports</div>}
      </div>
    </div>
  );
}

function RapportsTab(){
  const [date,setDate]=useState(new Date().toISOString().split('T')[0]);
  const [cmds,setCmds]=useState([]);
  const [itemsMap,setItemsMap]=useState({});
  const [loading,setLoading]=useState(true);

  const load=async()=>{
    setLoading(true);
    const s=new Date(date); s.setHours(0,0,0,0);
    const e=new Date(date); e.setHours(23,59,59,999);
    let r=await supabase.from('commandes').select('*').eq('statut','paye').gte('paye_at',s.toISOString()).lte('paye_at',e.toISOString()).order('paye_at',{ascending:true});
    let data=r.data;
    if(!data||!data.length){
      let r2=await supabase.from('commandes').select('*').eq('statut','paye').gte('created_at',s.toISOString()).lte('created_at',e.toISOString()).order('created_at',{ascending:true});
      data=r2.data||[];
    }
    let iMap={};
    if(data&&data.length){
      const ids=data.map(c=>c.id);
      let ir=await supabase.from('commande_items').select('*').in('commande_id',ids);
      (ir.data||[]).forEach(it=>{ if(!iMap[it.commande_id]) iMap[it.commande_id]=[]; iMap[it.commande_id].push(it); });
    }
    setItemsMap(iMap); setCmds(data||[]); setLoading(false);
  };
  useEffect(()=>{load();},[date]);

  const groups={
    espece: cmds.filter(c=> (c.payment_method||'espece')==='espece'),
    tpe: cmds.filter(c=> c.payment_method==='tpe'),
    cheque: cmds.filter(c=> c.payment_method==='cheque'),
    offert: cmds.filter(c=> c.payment_method==='offert'),
    remise: cmds.filter(c=> c.payment_method==='remise'),
  };
  const sum=(arr)=>arr.reduce((s,c)=>s+Number(c.total_final||c.total||0),0);
  const sumReel=(arr)=>arr.reduce((s,c)=>s+Number(c.total||0),0);
  const totalRemise=groups.remise.reduce((s,c)=>s+Number(c.remise||0),0);
  const total=sum(groups.espece)+sum(groups.tpe)+sum(groups.cheque)+sum(groups.remise);

  const viderTout=async()=>{
    if(!confirm('KHWI GA3?')) return;
    if(!confirm('Mta2akked?')) return;
    await supabase.from('commande_items').delete().neq('id','00000000-0000-0000-0000-000000000000');
    await supabase.from('commandes').delete().neq('id','00000000-0000-0000-0000-000000000000');
    alert('Khwa'); load();
  };
  const viderToday=async()=>{
    if(!confirm('Khwi '+date+'?')) return;
    const s=new Date(date); s.setHours(0,0,0,0);
    const e=new Date(date); e.setHours(23,59,59,999);
    const {data}=await supabase.from('commandes').select('id').gte('created_at',s.toISOString()).lte('created_at',e.toISOString());
    const ids=(data||[]).map(x=>x.id);
    if(ids.length){ await supabase.from('commande_items').delete().in('commande_id',ids); await supabase.from('commandes').delete().in('id',ids); }
    alert('Tmsa7 '+ids.length); load();
  };

  if(loading) return <div className="p-8 text-center">Chargement...</div>;

  return(
    <div className="space-y-3">
      <div className="flex gap-2">
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-3"/>
        <button onClick={load} className="bg-zinc-800 px-3 rounded-xl">↻</button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={viderToday} className="bg-yellow-900/50 border border-yellow-600 text-yellow-300 font-bold py-3 rounded-xl text-xs">Khwi {date}</button>
        <button onClick={viderTout} className="bg-red-900/60 border-2 border-red-600 text-red-300 font-black py-3 rounded-xl text-xs">KHWI GA3 - 0</button>
      </div>
      <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 text-center font-black text-xl">{total.toFixed(0)} DH - {cmds.length} cmd</div>
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="bg-green-900/30 border border-green-700 rounded-xl p-3"><div className="text-[10px] text-green-300">ESPECE</div><div className="font-bold text-green-400">{sum(groups.espece).toFixed(0)} DH</div><div className="text-xs text-zinc-400">{groups.espece.length} cmd</div></div>
        <div className="bg-blue-900/30 border border-blue-700 rounded-xl p-3"><div className="text-[10px] text-blue-300">TPE</div><div className="font-bold text-blue-400">{sum(groups.tpe).toFixed(0)} DH</div><div className="text-xs text-zinc-400">{groups.tpe.length} cmd</div></div>
        <div className="bg-purple-900/30 border border-purple-700 rounded-xl p-3"><div className="text-[10px] text-purple-300">CHEQUE</div><div className="font-bold text-purple-400">{sum(groups.cheque).toFixed(0)} DH</div><div className="text-xs text-zinc-400">{groups.cheque.length} cmd</div></div>
        <div className="bg-yellow-900/40 border-2 border-yellow-500 rounded-xl p-3"><div className="text-[10px] text-yellow-300 font-black">REMISE</div><div className="font-bold text-yellow-400">{sum(groups.remise).toFixed(0)} DH</div><div className="text-xs">{groups.remise.length} cmd (-{totalRemise.toFixed(0)})</div></div>
        <div className="bg-orange-900/30 border border-orange-700 rounded-xl p-3 col-span-2"><div className="text-[10px] text-orange-300">OFFERT</div><div className="font-bold text-orange-400">{sumReel(groups.offert).toFixed(0)} DH perdu</div><div className="text-xs">{groups.offert.length} cmd</div></div>
      </div>

      {[
        {k:'espece',t:'ESPECE ('+groups.espece.length+') - '+sum(groups.espece).toFixed(0)+' DH',d:groups.espece,c:'border-green-600'},
        {k:'tpe',t:'TPE ('+groups.tpe.length+') - '+sum(groups.tpe).toFixed(0)+' DH',d:groups.tpe,c:'border-blue-600'},
        {k:'cheque',t:'CHEQUE ('+groups.cheque.length+') - '+sum(groups.cheque).toFixed(0)+' DH',d:groups.cheque,c:'border-purple-600'},
        {k:'remise',t:'REMISE ('+groups.remise.length+') - '+sum(groups.remise).toFixed(0)+' DH (-'+totalRemise.toFixed(0)+' DH)',d:groups.remise,c:'border-yellow-500'},
        {k:'offert',t:'OFFERT ('+groups.offert.length+') - '+sumReel(groups.offert).toFixed(0)+' DH perdu',d:groups.offert,c:'border-orange-600'},
      ].map(g=> g.d.length>0 && (
        <div key={g.k} className={'border-l-4 '+g.c+' pl-2'}>
          <h3 className="font-black py-2 text-sm">{g.t}</h3>
          {g.d.map(c=>{
            const its=itemsMap[c.id]||[];
            return(
              <div key={c.id} className="bg-[#1A1A1A] border border-zinc-800 rounded-xl p-3 mb-2">
                <div className="flex justify-between font-bold"><span>Table {c.table_numero||'?'} - {c.serveur_nom||'?'}</span><span className="text-orange-400">{Number(c.total_final||c.total||0).toFixed(0)} DH</span></div>
                <div className="text-[11px] text-zinc-500">{new Date(c.paye_at||c.created_at).toLocaleTimeString()} - {c.payment_method} {c.remise_percent? '- Remise '+c.remise_percent+'%':''}</div>
                <div className="mt-2 bg-black/50 rounded-xl p-2">
                  {its.length? its.map(it=>(
                    <div key={it.id} className="flex justify-between py-1 text-sm border-b border-zinc-800 last:border-0">
                      <span>{it.qte||1}x {it.menu_nom||it.nom}</span>
                      <span>{(Number(it.qte||1)*Number(it.prix||0)).toFixed(0)} DH - Serveur {c.serveur_nom||''}</span>
                    </div>
                  )) : <div className="text-amber-400 text-xs">Total: {c.total} DH - Serveur: {c.serveur_nom||'?'} - Qte/Prix ma m-sejlinch - sifet Caisse.tsx</div>}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
                              }
