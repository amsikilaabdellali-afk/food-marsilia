// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export default function Caisse() {
  const [commandes, setCommandes] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'espece'|'tpe'|'cheque'|null>(null);
  const [remise, setRemise] = useState(0);
  const [owner, setOwner] = useState<any>({ owner_whatsapp: '212600000000', owner_code: '1234' });

  const load = useCallback(async () => {
    const { data: cmds } = await supabase.from('commandes').select('*').eq('statut','pret').order('created_at',{ascending:false});
    if(!cmds || cmds.length===0){ setCommandes([]); return; }
    const ids = cmds.map((c:any)=>c.id);
    const tableIds = [...new Set(cmds.map((c:any)=>c.table_id).filter(Boolean))];
    const [{data:items}, {data:tables}, {data:settings}] = await Promise.all([
      supabase.from('commande_items').select('*').in('commande_id', ids),
      tableIds.length? supabase.from('tables').select('id,numero').in('id', tableIds) : Promise.resolve({data:[]}),
      supabase.from('settings').select('*').eq('id',1).single()
    ]);
    if(settings) setOwner(settings);
    const itemsMap:any={}; (items||[]).forEach((it:any)=>{ if(!itemsMap[it.commande_id]) itemsMap[it.commande_id]=[]; itemsMap[it.commande_id].push(it); });
    const tableMap:any={}; (tables||[]).forEach((t:any)=>{ tableMap[t.id]=t.numero; });
    setCommandes(cmds.map((c:any)=>({...c, items:itemsMap[c.id]||[], table_numero:tableMap[c.table_id]||'N/A'})));
  },[]);

  useEffect(()=>{ load(); },[load]);
  useEffect(()=>{ if(commandes.length>0 &&!selected) setSelected(commandes[0]); },[commandes]);

  const totalBrut = selected? selected.items.filter((it:any)=>!it.is_offert).reduce((s:any,it:any)=>s+(it.qte*Number(it.prix)),0) : 0;
  const totalFinal = Math.max(0, totalBrut - remise);

  const handleOffert = async () => {
    if(!selected) return;
    const item = selected.items[0];
    if(!item) return;
    if(!confirm(`T2ekked OFFERT: ${item.menu_nom}? Ghadi ytsefet WhatsApp l mol mahal`)) return;
    await supabase.from('commande_items').update({is_offert:true}).eq('id', item.id);
    const msg = `🔔 OFFERT - Marsilia Food%0ATable: ${selected.table_numero}%0AArticle: ${item.qte}x ${item.menu_nom} ${item.prix}DH -> 0 DH%0ACaissiere: ${selected.serveur_nom || 'caisse'}%0A${new Date().toLocaleString('fr-MA')}`;
    window.open(`https://wa.me/${owner.owner_whatsapp}?text=${msg}`, '_blank');
    load();
  };

  const handleRemise = () => {
    const code = prompt('CODE dyal mol mahal:');
    if(code!== owner.owner_code) return alert('Code ghalet! Ghir mol mahal');
    const m = prompt(`Total ${totalBrut} DH - Ch7al tna9as?`);
    if(m) setRemise(Math.min(totalBrut, Number(m)));
  };

  const handlePay = async () => {
    if(!selected ||!paymentMethod) return alert('Khtar ESPECE / TPE / CHEQUE');
    await supabase.from('commandes').update({statut:'paye', payment_method:paymentMethod, remise, total_final:totalFinal}).eq('id', selected.id);
    const next = commandes.filter(c=>c.id!==selected.id);
    setSelected(next[0]||null); setRemise(0); setPaymentMethod(null); load();
  };

  return (
    <div className="h-screen bg-black flex">
      <div className="w-[40%] border-r border-zinc-800 p-2 overflow-y-auto">
        {commandes.map(c=>{ const tot=c.items.filter((it:any)=>!it.is_offert).reduce((s:any,it:any)=>s+(it.qte*Number(it.prix)),0); return <div key={c.id} onClick={()=>{setSelected(c); setRemise(0);}} className={`p-4 rounded-2xl mb-2 cursor-pointer ${selected?.id===c.id?'bg-white text-black':'bg-zinc-900 text-white'}`}><div className="font-bold">Table {c.table_numero} - {tot} DH</div><div className="text-xs opacity-60">{c.items.length} art</div></div> })}
      </div>
      <div className="flex-1 flex flex-col">
        {!selected? <div className="flex-1 flex items-center justify-center text-zinc-600">Khtar Table</div> : (
          <>
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="flex justify-between mb-4"><div className="text-white text-2xl font-bold">Table {selected.table_numero}</div><div className="text-orange-500 text-3xl font-black">{totalFinal} DH</div></div>
              {selected.items.map((it:any)=><div key={it.id} className={`p-3 rounded-xl mb-2 flex justify-between ${it.is_offert?'bg-orange-500/20 border border-orange-500':'bg-zinc-900'}`}><span className="text-white">{it.qte}x {it.menu_nom}</span><span className={it.is_offert?'text-orange-400':'text-white'}>{it.is_offert?'0 DH':`${it.qte*it.prix} DH`}</span></div>)}
              <button onClick={handleRemise} className="w-full mt-4 h-12 bg-zinc-800 rounded-xl text-white border border-dashed border-zinc-600">🔑 REMISE Mol Mahal {remise>0?`-${remise}DH`:''}</button>
            </div>
            <div className="p-3 border-t border-zinc-800">
              <div className="grid grid-cols-2 gap-3">
                <button onClick={()=>setPaymentMethod('espece')} className={`h-[75px] rounded-2xl font-black ${paymentMethod==='espece'?'bg-white text-black ring-2 ring-green-500':'bg-green-600 text-white'}`}>💵 ESPECE</button>
                <button onClick={()=>setPaymentMethod('tpe')} className={`h-[75px] rounded-2xl font-black ${paymentMethod==='tpe'?'bg-white text-black ring-2 ring-blue-500':'bg-blue-600 text-white'}`}>💳 TPE</button>
                <button onClick={handleOffert} className="h-[75px] rounded-2xl font-black bg-orange-600 text-white">🎁 OFFERT<br/><span className="text-[10px]">+ WhatsApp</span></button>
                <button onClick={()=>setPaymentMethod('cheque')} className={`h-[75px] rounded-2xl font-black ${paymentMethod==='cheque'?'bg-white text-black ring-2 ring-purple-500':'bg-purple-600 text-white'}`}>🧾 CHEQUE</button>
              </div>
              <button onClick={handlePay} className="w-full mt-3 h-[55px] bg-white text-black rounded-2xl font-black text-lg">PAYER {totalFinal} DH</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
    }
