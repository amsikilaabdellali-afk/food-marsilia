import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export default function Caisse() {
  const [commandes, setCommandes] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'espece'|'tpe'|'cheque'|'offert'|null>(null);
  const [remise, setRemise] = useState(0);
  const [owner] = useState({ whatsapp: '212612345678', code: '1234' });

  const load = useCallback(async () => {
    const { data: cmds } = await supabase.from('commandes').select('*').eq('statut','pret').order('created_at',{ascending:true});
    if(!cmds || cmds.length===0){ setCommandes([]); setSelected(null); return; }
    const ids = cmds.map((c:any)=>c.id);
    const tableIds = [...new Set(cmds.map((c:any)=>c.table_id).filter(Boolean))];
    const [{data:items},{data:tables}] = await Promise.all([
      supabase.from('commande_items').select('*').in('commande_id', ids),
      tableIds.length? supabase.from('tables').select('id,numero').in('id', tableIds) : Promise.resolve({data:[]})
    ]);
    const itemsMap:any={}; (items||[]).forEach((it:any)=>{ if(!itemsMap[it.commande_id]) itemsMap[it.commande_id]=[]; itemsMap[it.commande_id].push(it); });
    const tableMap:any={}; (tables||[]).forEach((t:any)=>{ tableMap[t.id]=t.numero; });
    const finalCmds = cmds.map((c:any)=>({...c, items: itemsMap[c.id]||[], table_numero: tableMap[c.table_id]||'N/A'}));
    setCommandes(finalCmds);
    if(!selected) setSelected(finalCmds[0]);
  },[]);

  useEffect(()=>{ load(); }, [load]);

  // Ila OFFERT -> total = 0, walakin kan7sbo total l7a9i9i bach nsiftoh f WhatsApp
  const totalReel = selected? selected.items.reduce((s:any,it:any)=>s+(Number(it.qte)*Number(it.prix)),0) : 0;
  const totalBrut = paymentMethod==='offert'? 0 : totalReel;
  const totalFinal = paymentMethod==='offert'? 0 : Math.max(0, totalBrut - remise);

  const handlePay = async () => {
    if(!selected ||!paymentMethod) return alert('Khtar ESPECE / TPE / CHEQUE / OFFERT');
    const cmd = selected;
    const rest = commandes.filter(c=>c.id!==cmd.id);
    setCommandes(rest);
    setSelected(rest[0]||null);

    // Sifet WhatsApp ila OFFERT - b detail kamel
    if(paymentMethod==='offert'){
      const detailItems = cmd.items.map((it:any)=>`${it.qte}x ${it.menu_nom||it.nom} = ${it.qte*it.prix}DH`).join('%0A');
      const msg = `🎁 COMMANDE OFFERT - 0 DH%0A%0A📍 Table: ${cmd.table_numero}%0A👤 Serveur: ${cmd.serveur_nom||'caisse'}%0A%0A📋 Detail Commande:%0A${detailItems}%0A%0A💰 Total reel: ${totalReel}DH%0A💸 Total caisse: 0 DH%0A%0A⏰ ${new Date().toLocaleString('fr-MA')}%0A%0AMarsilia Food`;
      window.open(`https://wa.me/${owner.whatsapp}?text=${msg}`, '_blank');
    }

    await supabase.from('commandes').update({
      statut: 'paye',
      payment_method: paymentMethod,
      remise: paymentMethod==='offert'? totalReel : remise,
      total_final: totalFinal,
      paye_at: new Date().toISOString()
    }).eq('id', cmd.id);

    if(cmd.table_id){
      const { data: others } = await supabase.from('commandes').select('id').eq('table_id', cmd.table_id).in('statut',['en_attente','en_preparation','pret']).neq('id', cmd.id);
      if(!others || others.length===0) await supabase.from('tables').update({ statut: 'libre' }).eq('id', cmd.table_id);
    }
    setPaymentMethod(null); setRemise(0);
  };

  return (
    <div className="h-screen bg-black flex">
      <div className="w-[40%] border-r border-zinc-800 p-2 overflow-y-auto">
        {commandes.map((c:any)=>{ const tot=c.items.reduce((s:any,it:any)=>s+(Number(it.qte)*Number(it.prix)),0); return <div key={c.id} onClick={()=>{setSelected(c); setPaymentMethod(null);}} className={`p-4 rounded-2xl mb-2 cursor-pointer ${selected?.id===c.id?'bg-white text-black':'bg-zinc-900 text-white'}`}>Table {c.table_numero} - {tot}DH<div className="text-xs opacity-60">{c.items.length} art</div></div> })}
      </div>
      <div className="flex-1 flex flex-col">
        {!selected? <div className="flex-1 flex items-center justify-center text-zinc-600">Khtar Table</div> : (
          <>
            <div className="p-4 flex justify-between border-b border-zinc-800">
              <h2 className="text-white text-3xl font-black">Table {selected.table_numero}</h2>
              <div className="text-right">
                {paymentMethod==='offert'? <><div className="text-zinc-500 line-through text-sm">{totalReel} DH</div><div className="text-green-400 text-4xl font-black">0 DH - OFFERT</div></> : <div className="text-orange-500 text-4xl font-black">{totalFinal} DH</div>}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {/* Hna kayban detail kamel wakha OFFERT */}
              {selected.items.map((it:any)=>(
                <div key={it.id} className={`flex justify-between p-4 rounded-2xl ${paymentMethod==='offert'?'bg-orange-500/10 border border-orange-500/30':'bg-zinc-900'}`}>
                  <span className="text-white">{it.qte}x {it.menu_nom||it.nom}</span>
                  <span className="text-white font-bold">{it.qte*Number(it.prix)} DH {paymentMethod==='offert' && <span className="text-orange-400 text-xs">-&gt; 0</span>}</span>
                </div>
              ))}
              {paymentMethod==='offert' && <div className="p-3 bg-orange-500/20 rounded-xl text-orange-300 text-sm">⚠️ Had commande ghadi tdouz 0 DH f la caisse, walakin detail kayban w ghadi ytsefet l mol mahal f WhatsApp</div>}
            </div>
            <div className="p-3 border-t border-zinc-800">
              <div className="grid grid-cols-2 gap-3">
                <button onClick={()=>setPaymentMethod('espece')} className={`h-[75px] rounded-2xl font-black ${paymentMethod==='espece'?'bg-white text-black ring-4 ring-green-500':'bg-green-600 text-white'}`}>💵 ESPECE</button>
                <button onClick={()=>setPaymentMethod('tpe')} className={`h-[75px] rounded-2xl font-black ${paymentMethod==='tpe'?'bg-white text-black ring-4 ring-blue-500':'bg-blue-600 text-white'}`}>💳 TPE</button>
                <button onClick={()=>setPaymentMethod('offert')} className={`h-[75px] rounded-2xl font-black ${paymentMethod==='offert'?'bg-white text-black ring-4 ring-orange-500':'bg-orange-600 text-white'}`}>🎁 OFFERT<br/><span className="text-[10px]">TOTAL 0 + WhatsApp</span></button>
                <button onClick={()=>setPaymentMethod('cheque')} className={`h-[75px] rounded-2xl font-black ${paymentMethod==='cheque'?'bg-white text-black ring-4 ring-purple-500':'bg-purple-600 text-white'}`}>🧾 CHEQUE</button>
              </div>
              <button onClick={handlePay} className="w-full mt-3 h-[60px] bg-white text-black rounded-2xl font-black text-xl">PAYER {totalFinal} DH {paymentMethod?` - ${paymentMethod.toUpperCase()}`:''}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
