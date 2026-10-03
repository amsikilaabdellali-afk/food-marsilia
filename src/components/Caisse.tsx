// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { DollarSign, CheckCircle2, CreditCard, Banknote, Gift, FileText } from 'lucide-react';

export default function Caisse() {
  const [commandes, setCommandes] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'espece' | 'tpe' | 'cheque' | null>(null);
  const [remise, setRemise] = useState(0);

  const load = useCallback(async () => {
    const { data: cmds } = await supabase.from('commandes').select('*').eq('statut','pret').order('created_at', { ascending: false });
    if (cmds && cmds.length > 0) {
      const ids = cmds.map((c: any) => c.id);
      const [{ data: items }] = await Promise.all([
        supabase.from('commande_items').select('*').in('commande_id', ids),
      ]);
      const itemsMap: any = {};
      (items || []).forEach((it: any) => { if (!itemsMap[it.commande_id]) itemsMap[it.commande_id] = []; itemsMap[it.commande_id].push(it); });
      const result = cmds.map((c: any) => ({
      ...c,
        items: itemsMap[c.id] || [],
        table_numero: c.table_id || c.table_numero || 'N/A',
      }));
      setCommandes(result);
    } else {
      setCommandes([]); setSelected(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase.channel('caisse-final').on('postgres_changes', { event: '*', schema: 'public', table: 'commandes' }, () => load()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  useEffect(() => {
    if (commandes.length > 0 &&!selected) setSelected(commandes[0]);
    if (selected) {
      const updated = commandes.find(c => c.id === selected.id);
      if (updated) setSelected(updated);
    }
  }, [commandes]);

  const totalBrut = selected? selected.items.filter((it:any)=>!it.is_offert).reduce((s:any,it:any)=> s + (it.qte * Number(it.prix)),0) : 0;
  const totalFinal = Math.max(0, totalBrut - remise);

  const handleOffert = async (item: any) => {
    await supabase.from('commande_items').update({ is_offert:!item.is_offert, prix_original:!item.is_offert? item.prix : null }).eq('id', item.id);
    load();
  };

  const handlePay = async () => {
    if (!selected ||!paymentMethod) return alert('Khtar tari9a lkhlass');
    setPaying(true);
    await supabase.from('commandes').update({
      statut: 'paye',
      payment_method: paymentMethod,
      remise: remise,
      total_final: totalFinal,
      updated_at: new Date().toISOString()
    }).eq('id', selected.id);
    printReceipt(selected, paymentMethod, totalBrut, remise, totalFinal);
    const next = commandes.filter(c => c.id!== selected.id);
    setSelected(next.length > 0? next[0] : null);
    setPaymentMethod(null); setRemise(0);
    setPaying(false);
    load();
  };

  if (loading) return <div className="flex items-center justify-center h-screen bg-[#0A0A0A]"><div className="w-8 h-8 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="h-screen bg-[#0A0A0A] flex overflow-hidden">
      <div className="w-[38%] border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800 flex items-center gap-2"><DollarSign className="w-5 h-5 text-[#FF6B00]" /><h2 className="text-white font-bold">Caisse</h2></div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {commandes.length === 0? <div className="text-center py-16 text-gray-500"><CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-30"/>Aucune commande</div> : commandes.map((c) => {
            const tot = c.items.filter((it:any)=>!it.is_offert).reduce((s:any,it:any)=> s + (it.qte * Number(it.prix)),0);
            return <div key={c.id} onClick={() => {setSelected(c); setRemise(0);}} className={`p-4 rounded-2xl border cursor-pointer ${selected?.id === c.id? 'bg-white text-black border-white' : 'bg-[#1A1A1A] border-gray-800 text-white'}`}><div className="font-bold">Table {c.table_numero} - {tot} DH</div><div className="text-xs opacity-60">{c.items.length} art</div></div>
          })}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {!selected? <div className="flex-1 flex items-center justify-center text-gray-600">Khtar Table</div> : (
          <>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex justify-between mb-3"><h3 className="text-white text-2xl font-bold">Table {selected.table_numero}</h3><div className="text-right"><div className="text-gray-400 line-through text-sm">{remise>0? `${totalBrut} DH` : ''}</div><div className="text-[#FF6B00] text-2xl font-bold">{totalFinal} DH</div></div></div>

              <div className="space-y-2 mb-4">
                {selected.items.map((it: any) => (
                  <div key={it.id} className={`flex justify-between items-center p-3 rounded-xl ${it.is_offert? 'bg-orange-500/20 border border-orange-500' : 'bg-[#1A1A1A]'}`}>
                    <div><div className={`text-white ${it.is_offert? 'line-through' : ''}`}>{it.qte}x {it.menu_nom}</div>{it.is_offert && <div className="text-orange-400 text-xs font-bold">OFFERT - 0 DH</div>}</div>
                    <div className="flex items-center gap-2"><span className={it.is_offert? 'text-orange-400 font-bold' : 'text-white'}>{it.is_offert? '0 DH' : `${(it.qte * Number(it.prix)).toFixed(0)} DH`}</span><button onClick={() => handleOffert(it)} className={`p-2 rounded-lg ${it.is_offert? 'bg-orange-500 text-black' : 'bg-[#2A2A2A] text-white'}`}><Gift className="w-4 h-4"/></button></div>
                  </div>
                ))}
              </div>

              {/* REMISE KATN9AS DIRECT */}
              <div className="bg-[#1A1A1A] p-3 rounded-2xl flex items-center justify-between">
                <span className="text-white font-bold">REMISE (DH)</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setRemise(Math.max(0, remise - 10))} className="w-10 h-10 bg-gray-700 rounded-xl text-white font-bold">-10</button>
                  <input type="number" value={remise} onChange={(e)=>setRemise(Math.max(0, Number(e.target.value)))} className="w-20 h-10 bg-black text-white text-center rounded-xl border border-gray-700 font-bold" placeholder="0"/>
                  <button onClick={() => setRemise(remise + 10)} className="w-10 h-10 bg-gray-700 rounded-xl text-white font-bold">+10</button>
                </div>
              </div>
              {remise>0 && <div className="text-orange-400 text-sm mt-2 text-center">Remise {remise} DH tna9sat direct men total</div>}
            </div>

            <div className="p-3 bg-[#111] border-t border-gray-800">
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setPaymentMethod('espece')} className={`h-[75px] rounded-2xl font-black flex flex-col items-center justify-center ${paymentMethod==='espece'? 'bg-white text-black' : 'bg-[#2ECC71] text-white'}`}><Banknote className="w-6 h-6"/> ESPECE</button>
                <button onClick={() => setPaymentMethod('tpe')} className={`h-[75px] rounded-2xl font-black flex flex-col items-center justify-center ${paymentMethod==='tpe'? 'bg-white text-black' : 'bg-[#3498DB] text-white'}`}><CreditCard className="w-6 h-6"/> TPE</button>
                <button onClick={() => { if(selected.items.length>0) handleOffert(selected.items[0])}} className="h-[75px] rounded-2xl font-black bg-[#FF6B00] text-white flex flex-col items-center justify-center"><Gift className="w-6 h-6"/> OFFERT</button>
                <button onClick={() => setPaymentMethod('cheque')} className={`h-[75px] rounded-2xl font-black flex flex-col items-center justify-center ${paymentMethod==='cheque'? 'bg-white text-black' : 'bg-[#9B59B6] text-white'}`}><FileText className="w-6 h-6"/> CHEQUE</button>
              </div>
              <button onClick={handlePay} disabled={paying ||!paymentMethod} className="w-full mt-3 h-[60px] rounded-2xl bg-white text-black font-black text-xl disabled:opacity-20">
                PAYER {totalFinal} DH {remise>0? `(au lieu de ${totalBrut})` : ''}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function printReceipt(cmd: any, method: any, brut: number, remise: number, final: number) {
  const w = window.open('', '_blank', 'width=400,height=600'); if (!w) return;
  w.document.write(`<html><body style="font-family:monospace;width:300px;margin:0 auto;padding:10px"><center><h2>MARSILIA FOOD</h2><div>Table ${cmd.table_numero} - ${new Date().toLocaleString('fr-FR')}</div><div>${method.toUpperCase()}</div></center><hr>${cmd.items.map((it:any)=>`<div style="display:flex;justify-content:space-between"><span>${it.qte}x ${it.menu_nom} ${it.is_offert?'(OFFERT)':''}</span><span>${it.is_offert?'0':it.qte*Number(it.prix)} DH</span></div>`).join('')}<hr><div>Total brut: ${brut} DH</div>${remise>0?`<div>Remise: -${remise} DH</div>`:''}<div style="font-weight:bold;font-size:18px">A PAYER: ${final} DH</div></body></html>`);
  w.document.close(); w.print(); setTimeout(()=>w.close(),500);
}
