import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export default function Caisse() {
  const [commandes, setCommandes] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'espece'|'tpe'|'cheque'|'offert'|null>(null);
  const [remise, setRemise] = useState(0);
  const [loading, setLoading] = useState(true);
  const [owner] = useState({ whatsapp: '212600000000', code: '1234' });

  const load = useCallback(async () => {
    setLoading(true);
    const { data: cmds } = await supabase.from('commandes').select('*').eq('statut','pret').order('created_at',{ascending:true});
    if(!cmds || cmds.length===0){ setCommandes([]); setSelected(null); setLoading(false); return; }

    const ids = cmds.map((c:any)=>c.id);
    const tableIds = [...new Set(cmds.map((c:any)=>c.table_id).filter(Boolean))];

    const [{data:items}, {data:tables}] = await Promise.all([
      supabase.from('commande_items').select('*').in('commande_id', ids),
      tableIds.length? supabase.from('tables').select('id,numero').in('id', tableIds) : Promise.resolve({data:[]})
    ]);

    const itemsMap:any={}; (items||[]).forEach((it:any)=>{ if(!itemsMap[it.commande_id]) itemsMap[it.commande_id]=[]; itemsMap[it.commande_id].push(it); });
    const tableMap:any={}; (tables||[]).forEach((t:any)=>{ tableMap[t.id]=t.numero; });

    const finalCmds = cmds.map((c:any)=>({...c, items: itemsMap[c.id]||[], table_numero: tableMap[c.table_id] || c.table_numero || 'N/A'}));
    setCommandes(finalCmds);
    if(!selected) setSelected(finalCmds[0]);
    else {
      const stillExists = finalCmds.find((c:any)=>c.id===selected.id);
      if(!stillExists && finalCmds.length>0) setSelected(finalCmds[0]);
      else if(stillExists) setSelected(stillExists);
      else setSelected(null);
    }
    setLoading(false);
  }, []);

  useEffect(()=>{ load(); }, [load]);

  const totalBrut = selected? selected.items.filter((it:any)=>!it.is_offert).reduce((s:any,it:any)=>s + (Number(it.qte)*Number(it.prix)),0) : 0;
  const totalFinal = Math.max(0, totalBrut - remise);

  // Mlli tkhalas - t7ayyed direct men l'ecran
  const handlePay = async () => {
    if(!selected) return;
    if(!paymentMethod){ alert('Khtar tari9a dyal lkhlas: ESPECE / TPE / CHEQUE / OFFERT'); return; }

    const commandeToPay = selected;
    const restCommandes = commandes.filter(c=>c.id!== commandeToPay.id);

    // 1. 7ayyedha direct men UI - matb9ach tban
    setCommandes(restCommandes);
    setSelected(restCommandes.length>0? restCommandes[0] : null);
    setPaymentMethod(null);
    setRemise(0);

    // 2. Siftha l Supabase f background - tban f Rapport / Historique
    try {
      await supabase.from('commandes').update({
        statut: 'paye',
        payment_method: paymentMethod,
        remise: remise,
        total_final: totalFinal,
        paye_at: new Date().toISOString()
      }).eq('id', commandeToPay.id);

      if(commandeToPay.table_id){
        const { data: others } = await supabase.from('commandes').select('id').eq('table_id', commandeToPay.table_id).in('statut',['en_attente','en_preparation','pret']).neq('id', commandeToPay.id);
        if(!others || others.length===0){
          await supabase.from('tables').update({ statut: 'libre' }).eq('id', commandeToPay.table_id);
        }
      }

      // 3. Ila OFFERT - sifet WhatsApp l mol mahal
      if(paymentMethod === 'offert'){
        const msg = `🎁 OFFERT%0ATable ${commandeToPay.table_numero}%0ATotal ${totalBrut}DH -> 0DH%0A${new Date().toLocaleString('fr-MA')}`;
        window.open(`https://wa.me/${owner.whatsapp}?text=${msg}`, '_blank');
      }

    } catch(e){ console.error(e); load(); }
  };

  if(loading) return <div className="h-screen bg-black flex items-center justify-center text-white">Chargement...</div>;

  return (
    <div className="h-screen bg-black flex overflow-hidden">
      {/* LIST GAUCHE */}
      <div className="w-[40%] border-r border-zinc-800 flex flex-col bg-black">
        <div className="p-4 border-b border-zinc-800 text-white font-bold">CAISSE - {commandes.length} commandes</div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {commandes.map((c:any)=>{
            const tot = c.items.filter((it:any)=>!it.is_offert).reduce((s:any,it:any)=>s+(Number(it.qte)*Number(it.prix)),0);
            return (
              <div key={c.id} onClick={()=>{setSelected(c); setRemise(0); setPaymentMethod(null);}} className={`p-4 rounded-2xl cursor-pointer border ${selected?.id===c.id? 'bg-white text-black border-white' : 'bg-zinc-900 text-white border-zinc-800'}`}>
                <div className="font-black">Table {c.table_numero} - {tot} DH</div>
                <div className="text-xs opacity-60 mt-1">{c.items.length} articles - {new Date(c.created_at).toLocaleTimeString()}</div>
              </div>
            )
          })}
          {commandes.length===0 && <div className="text-center py-20 text-zinc-600">Aucune commande - Kolchi tkhalas ✅</div>}
        </div>
      </div>

      {/* DETAIL DROITE */}
      <div className="flex-1 flex flex-col bg-black">
        {!selected? <div className="flex-1 flex items-center justify-center text-zinc-600">Khtar Table men lisser</div> : (
          <>
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
              <h2 className="text-white text-3xl font-black">Table {selected.table_numero}</h2>
              <div className="text-right">
                {remise>0 && <div className="text-zinc-500 line-through text-sm">{totalBrut} DH</div>}
                <div className="text-[#FF6B00] text-4xl font-black">{totalFinal} DH</div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {selected.items.map((it:any)=>(
                <div key={it.id} className="flex justify-between p-4 rounded-2xl bg-zinc-900 text-white">
                  <span>{it.qte}x {it.menu_nom || it.nom}</span>
                  <span className="font-bold">{(Number(it.qte)*Number(it.prix))} DH</span>
                </div>
              ))}
              <button onClick={()=>{
                const code = prompt('Code mol mahal bach dir remise:');
                if(code!== owner.code) return alert('Code ghalet');
                const m = prompt(`Total ${totalBrut} DH - ch7al tna9as?`);
                if(m) setRemise(Math.min(totalBrut, Number(m)));
              }} className="w-full h-12 mt-4 bg-zinc-800 rounded-xl text-white border border-dashed border-zinc-600">🔑 REMISE Mol Mahal {remise>0?`-${remise} DH`:''}</button>
            </div>

            <div className="p-3 border-t border-zinc-800 bg-black">
              <div className="grid grid-cols-2 gap-3">
                <button onClick={()=>setPaymentMethod('espece')} className={`h-[80px] rounded-2xl font-black text-lg ${paymentMethod==='espece'?'bg-white text-black ring-4 ring-green-500':'bg-green-600 text-white'}`}>💵 ESPECE</button>
                <button onClick={()=>setPaymentMethod('tpe')} className={`h-[80px] rounded-2xl font-black text-lg ${paymentMethod==='tpe'?'bg-white text-black ring-4 ring-blue-500':'bg-blue-600 text-white'}`}>💳 TPE</button>
                <button onClick={()=>setPaymentMethod('offert')} className={`h-[80px] rounded-2xl font-black text-lg ${paymentMethod==='offert'?'bg-white text-black ring-4 ring-orange-500':'bg-orange-600 text-white'}`}>🎁 OFFERT</button>
                <button onClick={()=>setPaymentMethod('cheque')} className={`h-[80px] rounded-2xl font-black text-lg ${paymentMethod==='cheque'?'bg-white text-black ring-4 ring-purple-500':'bg-purple-600 text-white'}`}>🧾 CHEQUE</button>
              </div>
              <button onClick={handlePay} disabled={!paymentMethod} className="w-full mt-3 h-[60px] rounded-2xl bg-white text-black font-black text-xl disabled:opacity-20">
                PAYER {totalFinal} DH - {paymentMethod?.toUpperCase() || 'KHTAR'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
              }
