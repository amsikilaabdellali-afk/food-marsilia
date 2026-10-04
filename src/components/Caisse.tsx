// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { DollarSign, Printer } from 'lucide-react';

export default function Caisse() {
  const [commandes, setCommandes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<Record<string, any>>({});
  const [remiseMap, setRemiseMap] = useState<Record<string, number>>({});
  const [showRemiseFor, setShowRemiseFor] = useState<string | null>(null);

  const printDoubleTicket = (cmd:any) => {
    try {
      const totalReel = Number(cmd.total||0);
      const method = selectedMethod[cmd.id] || 'espece';
      const percent = remiseMap[cmd.id] || 0;
      const remiseMontant = method==='offert'? totalReel : method==='remise'? totalReel*percent/100 : 0;
      const totalFinal = totalReel - remiseMontant;
      const date = new Date().toLocaleString('fr-FR');
      const itemsList = cmd.items?.map((it:any)=> `<div>${it.qte||1}x ${it.menu_nom||'Plat'} = ${Number(it.prix||0)*(it.qte||1)} DH</div>`).join('') || '';
      const html = `<html><head><title>Ticket</title></head><body style="font-family:monospace"><center><h2>Marsilia Food</h2><p>${date}</p><p>Table ${cmd.table_numero||'?'}</p><hr><div>${itemsList}</div><hr><h3>${totalFinal} DH - ${method.toUpperCase()}</h3><p>Merci!</p></center><script>setTimeout(()=>window.print(),500)<\/script></body></html>`;
      const iframe = document.createElement('iframe'); iframe.style.display='none'; document.body.appendChild(iframe);
      const doc = iframe.contentWindow?.document; if(doc){ doc.open(); doc.write(html); doc.close(); }
    } catch(e){ console.log(e); }
  };

  const load = useCallback(async () => {
    const { data: cmds } = await supabase.from('commandes').select('*').in('statut', ['pret','prete','ready']).order('created_at', { ascending: false }).limit(100);
    let finalCmds = cmds || [];
    if(!finalCmds.length){
      const {data: all} = await supabase.from('commandes').select('*').neq('statut','paye').limit(100);
      if(all) finalCmds = all.filter(c=>c.statut!=='annulee' && c.statut!=='paye');
    }
    if(finalCmds.length){
      const ids = finalCmds.map((c:any)=>c.id);
      const { data: items } = await supabase.from('commande_items').select('*').in('commande_id', ids);
      const tableIds = finalCmds.map((c:any)=>c.table_id).filter(Boolean);
      let tables:any[]=[]; if(tableIds.length){ const {data} = await supabase.from('tables').select('*').in('id', tableIds); tables=data||[]; }
      const itemsMap:any={}; (items||[]).forEach((it:any)=>{ (itemsMap[it.commande_id]=itemsMap[it.commande_id]||[]).push(it); });
      const tableMap:any={}; tables.forEach((t:any)=>{ tableMap[t.id]=t; });
      const result = finalCmds.map((c:any)=>({...c, items: itemsMap[c.id]||[], table_numero: c.table_id? tableMap[c.table_id]?.numero?? '?' : '?'}));
      setCommandes(result);
    } else setCommandes([]);
    setLoading(false);
  }, []);

  useEffect(()=>{ load(); const i=setInterval(load,4000); return()=>clearInterval(i); },[load]);

  const handlePay = async (cmd:any) => {
    if(paying) return; setPaying(cmd.id);
    const totalReel = Number(cmd.total||0);
    const method = selectedMethod[cmd.id] || 'espece';
    const percent = remiseMap[cmd.id] || 0;
    let remiseMontant = 0; let totalFinal = totalReel;
    if(method==='offert'){ remiseMontant=totalReel; totalFinal=0; }
    else if(method==='remise'){ remiseMontant = totalReel * percent / 100; totalFinal = totalReel - remiseMontant; }
    setCommandes(prev => prev.filter(c=>c.id!==cmd.id));
    try {
      const { error } = await supabase.from('commandes').update({ statut:'paye', total:totalReel, total_final:totalFinal, payment_method:method, remise:remiseMontant, remise_percent:percent, paye_at:new Date().toISOString() }).eq('id', cmd.id);
      if(error) throw error;
      if(cmd.table_id){
        const {data:remaining}=await supabase.from('commandes').select('id').eq('table_id',cmd.table_id).in('statut',['en_attente','en_preparation','pret','prete','ready']).neq('id',cmd.id);
        if(!remaining || remaining.length===0) await supabase.from('tables').update({statut:'libre'}).eq('id',cmd.table_id);
      }
      setTimeout(()=>printDoubleTicket(cmd), 600);
    } catch(e:any){ alert('Erreur: '+e.message); load(); }
    setPaying(null);
  };

  if(loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <div className="sticky top-0 z-30 bg-[#0A0A0A]/95 border-b border-gray-800 px-4 py-3 flex justify-between max-w-4xl mx-auto">
        <div className="flex items-center gap-2"><DollarSign className="w-6 h-6 text-orange-500" /><h2 className="text-white font-bold">Caisse - {commandes.length}</h2></div>
        <button onClick={load} className="bg-zinc-800 text-white px-3 py-1 rounded-lg text-xs">Refresh</button>
      </div>
      <div className="p-4 max-w-4xl mx-auto space-y-3">
        {commandes.length===0? <div className="text-center py-20 text-gray-600">Khawya ✅</div> : commandes.map((c:any)=>{
          const totalReel = Number(c.total||0);
          const method = selectedMethod[c.id] || 'espece';
          const totalFinal = method==='offert'?0: method==='remise'? totalReel - totalReel*(remiseMap[c.id]||0)/100 : totalReel;
          return (
          <div key={c.id} className="bg-[#1A1A1A] rounded-2xl p-4 border border-gray-800">
            <div className="flex justify-between mb-2"><div><div className="text-white font-bold">Table {c.table_numero} - {c.statut}</div><div className="text-gray-400 text-xs mt-1">{c.items?.map((it:any)=> `${it.qte||1}x ${it.menu_nom||'Plat'}`).join(' + ')}</div></div><div className="text-right"><div className="text-xl font-black text-orange-500">{totalFinal.toFixed(0)} DH</div><button onClick={()=>printDoubleTicket(c)} className="text-[10px] bg-zinc-800 px-2 py-1 rounded mt-1 flex items-center gap-1"><Printer className="w-3 h-3"/>TICKET</button></div></div>
            <div className="grid grid-cols-5 gap-2 mb-2">
              <button onClick={()=>setSelectedMethod({...selectedMethod,[c.id]:'espece'})} className={`py-2.5 rounded-xl text-[11px] font-bold ${method==='espece'?'bg-white text-black':'bg-green-600 text-white'}`}>ESPECE</button>
              <button onClick={()=>setSelectedMethod({...selectedMethod,[c.id]:'tpe'})} className={`py-2.5 rounded-xl text-[11px] font-bold ${method==='tpe'?'bg-white text-black':'bg-blue-600 text-white'}`}>TPE</button>
              <button onClick={()=>setSelectedMethod({...selectedMethod,[c.id]:'cheque'})} className={`py-2.5 rounded-xl text-[11px] font-bold ${method==='cheque'?'bg-white text-black':'bg-purple-600 text-white'}`}>CHEQUE</button>
              <button onClick={()=>setSelectedMethod({...selectedMethod,[c.id]:'offert'})} className={`py-2.5 rounded-xl text-[11px] font-bold ${method==='offert'?'bg-white text-black':'bg-orange-600 text-white'}`}>OFFERT</button>
              <button onClick={()=>{const code=prompt('Code remise (1234):'); if(code!=='1234') return alert('Code ghalat'); setShowRemiseFor(c.id)}} className="py-2.5 rounded-xl text-[11px] font-bold bg-zinc-800 border-2 border-yellow-500 text-yellow-400">REMISE</button>
            </div>
            {showRemiseFor===c.id && <div className="bg-black border border-yellow-600 rounded-xl p-3 mb-3 grid grid-cols-4 gap-2">{[10,20,30,50].map(p=><button key={p} onClick={()=>{setSelectedMethod({...selectedMethod,[c.id]:'remise'}); setRemiseMap({...remiseMap,[c.id]:p}); setShowRemiseFor(null)}} className="bg-yellow-600 text-white py-2 rounded-lg font-bold">{p}%</button>)}<button onClick={()=>setShowRemiseFor(null)} className="bg-zinc-700 py-2 rounded-lg col-span-4">Annuler</button></div>}
            <button onClick={()=>handlePay(c)} disabled={paying===c.id} className="w-full py-3 rounded-xl font-bold bg-green-600 text-white">{paying===c.id?'...':`PAYER ${totalFinal.toFixed(0)} DH (${method.toUpperCase()})`}</button>
          </div>
        )})}
      </div>
    </div>
  );
          }
