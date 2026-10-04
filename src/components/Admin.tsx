// @ts-nocheck
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Admin(){
  const [date,setDate]=useState(new Date().toISOString().split('T')[0]);
  const [cmds,setCmds]=useState([]);
  const [itemsMap,setItemsMap]=useState({});
  const [tablesMap,setTablesMap]=useState({});
  const [loading,setLoading]=useState(true);

  const load=async()=>{
    setLoading(true);
    const s=new Date(date); s.setHours(0,0,0,0);
    const e=new Date(date); e.setHours(23,59,59,999);
    let {data}=await supabase.from('commandes').select('*').eq('statut','paye').gte('paye_at',s.toISOString()).lte('paye_at',e.toISOString()).order('paye_at',{ascending:true});
    if(!data||!data.length){
      let r2=await supabase.from('commandes').select('*').eq('statut','paye').gte('created_at',s.toISOString()).lte('created_at',e.toISOString()).order('created_at',{ascending:true});
      data=r2.data||[];
    }
    let iMap={}; let tMap={};
    if(data&&data.length){
      const ids=data.map(c=>c.id);
      const {data:items}=await supabase.from('commande_items').select('*').in('commande_id',ids);
      (items||[]).forEach(it=>{ if(!iMap[it.commande_id]) iMap[it.commande_id]=[]; iMap[it.commande_id].push(it); });
      const tableIds=[...new Set(data.map(c=>c.table_id).filter(Boolean))];
      if(tableIds.length){
        const {data:tables}=await supabase.from('tables').select('*').in('id',tableIds);
        (tables||[]).forEach(t=>{ tMap[t.id]=t; });
      }
    }
    setItemsMap(iMap); setTablesMap(tMap); setCmds(data||[]); setLoading(false);
  };
  useEffect(()=>{load();},[date]);

  const viderToday=async()=>{
    if(!confirm('Khwi '+date+'?')) return;
    const s=new Date(date); s.setHours(0,0,0,0);
    const e=new Date(date); e.setHours(23,59,59,999);
    const {data}=await supabase.from('commandes').select('id').gte('created_at',s.toISOString()).lte('created_at',e.toISOString());
    const ids=(data||[]).map(x=>x.id);
    if(ids.length){ await supabase.from('commande_items').delete().in('commande_id',ids); await supabase.from('commandes').delete().in('id',ids); }
    load();
  };
  const viderTout=async()=>{
    if(!confirm('KHWI GA3?')) return;
    await supabase.from('commande_items').delete().neq('id','00000000-0000-0000-0000-000000000000');
    await supabase.from('commandes').delete().neq('id','00000000-0000-0000-0000-000000000000');
    load();
  };

  const sum=(arr)=>arr.reduce((s,c)=>s+Number(c.total_final||c.total||0),0);
  const total=cmds.reduce((s,c)=>s+Number(c.total_final||c.total||0),0);

  if(loading) return <div className="p-8 text-center text-white">Chargement...</div>;

  return(
    <div className="min-h-screen bg-black text-white p-3">
      <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-3 mb-2"/>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <button onClick={viderToday} className="bg-yellow-900/50 border border-yellow-600 text-yellow-300 font-bold py-3 rounded-xl text-xs">Khwi {date}</button>
        <button onClick={viderTout} className="bg-red-900/60 border-2 border-red-600 text-red-300 font-black py-3 rounded-xl text-xs">KHWI GA3 - {cmds.length}</button>
      </div>
      <div className="bg-zinc-900 rounded-2xl p-4 text-center font-black text-xl mb-3">{total.toFixed(0)} DH - {cmds.length} cmd</div>
      {cmds.map(c=>{
        const its=itemsMap[c.id]||[];
        const tableNum=c.table_numero || (c.table_id? tablesMap[c.table_id]?.numero : null) || '?';
        return(
          <div key={c.id} className="bg-[#1A1A1A] border border-zinc-800 rounded-xl p-3 mb-2">
            <div className="flex justify-between font-bold"><span>Table {tableNum} - {c.serveur_nom||'?'}</span><span className="text-orange-400">{Number(c.total_final||c.total||0).toFixed(0)} DH</span></div>
            <div className="text-[11px] text-zinc-500">{new Date(c.paye_at||c.created_at).toLocaleTimeString()} - {c.payment_method}</div>
            <div className="mt-2 bg-black/50 rounded-xl p-2">
              {its.map(it=>(
                <div key={it.id} className="flex justify-between py-1 text-sm">
                  <span>{it.qte||1}x {it.menu_nom||'Plat'}</span>
                  <span>{(Number(it.qte||1)*Number(it.prix||0)).toFixed(0)} DH</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
