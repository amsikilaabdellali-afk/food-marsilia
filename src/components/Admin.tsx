import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Printer } from 'lucide-react';

type Tab = 'rapports';
export default function Admin(){
  return <div className="min-h-screen bg-[#0A0A0A] p-4 max-w-4xl mx-auto"><RapportsTab/></div>
}

function Loading(){ return <div className="py-20 text-center text-white">Chargement...</div> }

function RapportsTab(){
  const [cmds,setCmds]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [date,setDate]=useState(new Date().toISOString().split('T')[0]);
  const [view,setView]=useState<'jour'|'mois'>('jour');
  const [month,setMonth]=useState(new Date().toISOString().slice(0,7));

  const load=useCallback(async()=>{
    setLoading(true);
    let q=supabase.from('commandes').select('*').eq('statut','paye').order('paye_at',{ascending:false}).limit(200);
    if(view==='jour'){ q=q.gte('paye_at',`${date}T00:00:00`).lte('paye_at',`${date}T23:59:59`); }
    else{ q=q.gte('paye_at',`${month}-01T00:00:00`).lt('paye_at',`${month}-32T00:00:00`); }
    const {data}=await q;
    if(data && data.length){
      const ids=data.map((c:any)=>c.id);
      const {data:items}=await supabase.from('commande_items').select('*').in('commande_id',ids);
      const m:any={}; (items||[]).forEach((it:any)=>{(m[it.commande_id]=m[it.commande_id]||[]).push(it);});
      setCmds(data.map((c:any)=>({...c, items:m[c.id]||[] })));
    } else setCmds([]);
    setLoading(false);
  },[date,month,view]);

  useEffect(()=>{load();},[load]);

  const totalReel=cmds.reduce((s,c)=>s+Number(c.total||0),0);
  const totalEncaisse=cmds.reduce((s,c)=>s+Number(c.total_final??c.total??0),0);
  const perte=cmds.reduce((s,c)=>s+Number(c.remise||0),0);

  const byMethod:any={};
  cmds.forEach((c:any)=>{ const k=c.payment_method||'espece'; if(!byMethod[k]) byMethod[k]={count:0,total:0,perte:0}; byMethod[k].count++; byMethod[k].total+=Number(c.total_final??0); byMethod[k].perte+=Number(c.remise||0); });

  if(loading) return <Loading/>;

  return(
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-white font-black text-xl">Rapports - Li dazou kamel dyal nhar</h1>
        <button onClick={()=>window.print()} className="bg-[#FF6B00] text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"><Printer className="w-4 h-4"/>Imprimer</button>
      </div>

      <div className="flex gap-2">
        <button onClick={()=>setView('jour')} className={`px-4 py-2 rounded-xl text-sm font-bold ${view==='jour'?'bg-[#FF6B00] text-white':'bg-zinc-800 text-zinc-400'}`}>Journalier</button>
        <button onClick={()=>setView('mois')} className={`px-4 py-2 rounded-xl text-sm font-bold ${view==='mois'?'bg-[#FF6B00] text-white':'bg-zinc-800 text-zinc-400'}`}>Mensuel</button>
      </div>

      {view==='jour'? <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full bg-zinc-900 text-white p-3 rounded-xl border border-zinc-800"/>
      : <input type="month" value={month} onChange={e=>setMonth(e.target.value)} className="w-full bg-zinc-900 text-white p-3 rounded-xl border border-zinc-800"/>}

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-[#1A1A1A] p-3 rounded-xl border border-zinc-800 text-center"><div className="text-white font-black text-lg">{totalEncaisse} DH</div><div className="text-[10px] text-zinc-500">MAJMOU3 LI TKHALLES</div></div>
        <div className="bg-[#1A1A1A] p-3 rounded-xl border border-zinc-800 text-center"><div className="text-white font-black text-lg">{cmds.length}</div><div className="text-[10px] text-zinc-500">3adad li dazou</div></div>
        <div className="bg-[#1A1A1A] p-3 rounded-xl border border-zinc-800 text-center"><div className="text-orange-400 font-black text-lg">{perte} DH</div><div className="text-[10px] text-zinc-500">OFFERT/REMISE</div></div>
      </div>

      <div className="bg-[#1A1A1A] rounded-xl p-3 border border-zinc-800">
        <div className="text-white font-bold text-sm mb-2">Bachmn dazou - ESPECE/TPE/CHEQUE/OFFERT/REMISE:</div>
        {Object.entries(byMethod).map(([k,v]:any)=><div key={k} className="flex justify-between text-sm py-1 border-b border-zinc-800 last:border-0"><span className={`font-bold ${k==='offert'?'text-orange-400':k==='remise'?'text-yellow-400':'text-white'}`}>{k.toUpperCase()} {v.count} cmd {k==='offert'?`🎁 ZERO - ${v.perte}DH`:''} {k==='remise'?`(-${v.perte}DH)`:''}</span><span className="text-white font-black">{v.total} DH</span></div>)}
        {Object.keys(byMethod).length===0 && <div className="text-zinc-600 text-xs">Ma kayn walo</div>}
      </div>

      <div className="bg-[#1A1A1A] rounded-2xl border border-zinc-800 overflow-hidden">
        <div className="p-3 bg-zinc-900/60 flex justify-between"><span className="text-white font-black text-sm">Ga3 li dazou - chno fihom - b ch7al - chkoun - bachmn</span><span className="text-[#FF6B00] font-bold text-sm">{totalEncaisse} DH</span></div>
        {cmds.map((c:any)=>(
          <div key={c.id} className="p-4 border-b border-zinc-800 last:border-0">
            <div className="flex justify-between">
              <div><div className="text-white font-bold text-sm">Table {c.table_numero||'N/A'} - <span className="text-[#FF6B00]">{c.serveur_nom}</span> <span className="text-zinc-500 text-xs">{c.paye_at? new Date(c.paye_at).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}):''}</span></div><div className="text-[10px] text-zinc-600">#{c.id.slice(0,8)}</div></div>
              <div className="text-right"><div className={`text-xs px-2 py-1 rounded-full font-black ${c.payment_method==='espece'?'bg-green-900 text-green-300':c.payment_method==='tpe'?'bg-blue-900 text-blue-300':c.payment_method==='offert'?'bg-orange-900 text-orange-300':c.payment_method==='remise'?'bg-yellow-900 text-yellow-300':'bg-zinc-700 text-white'}`}>{c.payment_method?.toUpperCase()} {c.remise_percent?`-${c.remise_percent}%`:''} {c.payment_method==='offert'?'🎁 0DH':''}</div><div className="text-white font-black text-sm mt-1">{Number(c.total_final??0)} DH</div><div className="text-[10px] text-zinc-500 line-through">{Number(c.total||0)} DH</div></div>
            </div>
            <div className="bg-black/60 rounded-lg p-2 mt-2">
              <div className="text-[10px] text-zinc-500 font-bold uppercase">Chno kan fiha:</div>
              {c.items?.map((it:any)=><div key={it.id} className="flex justify-between text-xs"><span className="text-zinc-300">{it.qte}x {it.menu_nom}</span><span className="text-zinc-500">{it.qte*Number(it.prix)} DH</span></div>)}
              <div className="border-t border-dashed border-zinc-700 mt-2 pt-1">
                <div className="flex justify-between text-xs"><span className="text-zinc-500">Total réel li kan:</span><span className="text-white">{Number(c.total||0)} DH</span></div>
                {Number(c.remise||0)>0 && <div className="flex justify-between text-xs"><span className="text-orange-400">OFFERT/Remise:</span><span className="text-orange-400">-{Number(c.remise||0)} DH</span></div>}
                <div className="flex justify-between text-xs font-black"><span className="text-green-400">Li t-khallas b {c.payment_method}:</span><span className="text-green-400">{Number(c.total_final??0)} DH</span></div>
                <div className="flex justify-between text-[11px] mt-1"><span className="text-zinc-500">Li darha:</span><span className="text-white font-bold">{c.serveur_nom} - Table {c.table_numero} - {c.payment_method?.toUpperCase()} - {Number(c.total_final??0)} DH</span></div>
              </div>
            </div>
          </div>
        ))}
        {cmds.length===0 && <div className="p-10 text-center text-zinc-600">Ma kayn walo f {date}</div>}
        <div className="bg-[#FF6B00] p-3 flex justify-between font-black text-white"><span>MAJMOU3 KAMEL DYAL NHAR</span><span>{totalEncaisse} DH / {totalReel} DH réel</span></div>
      </div>
    </div>
  );
        }
