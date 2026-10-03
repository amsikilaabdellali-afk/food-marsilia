// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { DollarSign, Printer, CheckCircle2, CreditCard, Banknote, User, Percent, Trash2, Map, MessageSquare, Gift } from 'lucide-react';

export default function Caisse() {
  const [commandes, setCommandes] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'especes' | 'cb' | 'ca_vendeur' | null>(null);
  const [remise, setRemise] = useState(0);

  const load = useCallback(async () => {
    const { data: cmds } = await supabase.from('commandes').select('*').eq('statut','pret').order('created_at', { ascending: false });
    if (cmds && cmds.length > 0) {
      const ids = cmds.map((c: any) => c.id);
      const tableIds = cmds.map((c: any) => c.table_id).filter(Boolean);
      const [{ data: items }, { data: tables }] = await Promise.all([
        supabase.from('commande_items').select('*').in('commande_id', ids),
        tableIds.length > 0? supabase.from('tables').select('*').in('id', tableIds) : Promise.resolve({ data: [] }),
      ]);
      const itemsMap: any = {};
      (items || []).forEach((it: any) => { if (!itemsMap[it.commande_id]) itemsMap[it.commande_id] = []; itemsMap[it.commande_id].push(it); });
      const tableMap: any = {};
      (tables || []).forEach((t: any) => { tableMap[t.id] = t; });
      const result = cmds.map((c: any) => ({
      ...c,
        items: itemsMap[c.id] || [],
        table_numero: c.table_id? tableMap[c.table_id]?.numero || null : null,
      }));
      setCommandes(result);
      if (!selected && result.length > 0) setSelected(result[0]);
      else if (selected) {
        const updated = result.find(p => p.id === selected.id);
        if (updated) setSelected(updated); else if(result.length>0) setSelected(result[0]);
      }
    } else {
      setCommandes([]); setSelected(null);
    }
    setLoading(false);
  }, [selected]);

  useEffect(() => { load(); const i = setInterval(load, 3000); return () => clearInterval(i); }, [load]);

  // TOTAL bla OFFERT
  const totalSansOffert = selected? selected.items.filter((it:any)=>!it.is_offert).reduce((s:any,it:any)=> s + (it.qte * Number(it.prix)),0) : 0;
  const totalApresRemise = totalSansOffert - (totalSansOffert * remise / 100);

  const handleAnnulerLigne = async (itemId: string) => {
    await supabase.from('commande_items').delete().eq('id', itemId);
    load();
  };

  const handleOffert = async (item: any) => {
    // Toggle offert
    const newOffert =!item.is_offert;
    await supabase.from('commande_items').update({
      is_offert: newOffert,
      prix_original: newOffert? item.prix : null // n7afdo taman asli
    }).eq('id', item.id);
    load();
  };

  const handlePay = async () => {
    if (!selected ||!paymentMethod) return alert('Khtar: Especes wla C.B.');
    setPaying(true);
    await supabase.from('commandes').update({
      statut: 'paye',
      payment_method: paymentMethod,
      remise: remise,
      total_final: totalApresRemise,
      updated_at: new Date().toISOString()
    }).eq('id', selected.id);

    if (selected.table_id) {
      const { data: remaining } = await supabase.from('commandes').select('id').eq('table_id', selected.table_id).in('statut', ['en_attente', 'en_preparation', 'pret']);
      if (!remaining || remaining.length <= 1) {
        await supabase.from('tables').update({ statut: 'libre' }).eq('id', selected.table_id);
      }
    }
    printReceipt(selected, paymentMethod, remise, totalApresRemise);
    setSelected(null); setPaymentMethod(null); setRemise(0);
    setPaying(false);
    load();
  };

  if (loading) return <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex">
      <div className="w-[35%] border-r border-gray-800 p-3 space-y-2 overflow-y-auto">
        <div className="flex items-center gap-2 mb-4"><DollarSign className="w-6 h-6 text-[#FF6B00]" /><h2 className="text-white font-bold">Caisse</h2></div>
        {commandes.length === 0? (
          <div className="text-center py-12"><CheckCircle2 className="w-12 h-12 text-gray-700 mx-auto mb-3" /><p className="text-gray-500">Aucune commande à encaisser</p></div>
        ) : commandes.map((c) => {
          const tot = c.items.filter((it:any)=>!it.is_offert).reduce((s:any,it:any)=> s + (it.qte * Number(it.prix)),0);
          return (
          <div key={c.id} onClick={() => {setSelected(c); setRemise(0); setPaymentMethod(null);}}
            className={`p-3 rounded-xl border cursor-pointer ${selected?.id === c.id? 'bg-[#FF6B00]/20 border-[#FF6B00]' : 'bg-[#1A1A1A] border-gray-800'}`}>
            <div className="text-white font-bold">Table {c.table_numero || 'N/A'} - {tot.toFixed(0)} DH</div>
            <div className="text-gray-500 text-xs">{c.serveur_nom} - {c.items.length} articles {c.items.some((it:any)=>it.is_offert) && <span className="text-orange-400">+ OFFERT</span>}</div>
          </div>
        )})}
      </div>

      <div className="flex-1 flex flex-col">
        {!selected? <div className="flex-1 flex items-center justify-center text-gray-600">Khtar commande</div> : (
          <>
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white text-xl font-bold">Table {selected.table_numero}</h3>
                <span className="text-[#FF6B00] text-2xl font-bold">{totalApresRemise.toFixed(0)} DH</span>
              </div>
              <div className="space-y-2">
                {selected.items.map((it: any) => (
                  <div key={it.id} className={`flex justify-between items-center p-3 rounded-lg border ${it.is_offert? 'bg-orange-900/30 border-orange-500/50' : 'bg-[#1A1A1A] border-gray-800'}`}>
                    <div>
                      <span className={`text-white font-medium ${it.is_offert? 'line-through opacity-60' : ''}`}>{it.qte}x {it.menu_nom}</span>
                      {it.is_offert && <span className="ml-2 bg-orange-500 text-black text-[10px] px-2 py-0.5 rounded-full font-bold">OFFERT - 0 DH</span>}
                      {it.is_offert && it.prix_original && <div className="text-[11px] text-gray-400">Taman asli: {Number(it.prix_original).toFixed(0)} DH</div>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`${it.is_offert? 'text-orange-400 font-bold' : 'text-gray-400'}`}>{it.is_offert? '0 DH' : `${(it.qte * Number(it.prix)).toFixed(0)} DH`}</span>
                      <button onClick={() => handleOffert(it)} className={`p-1.5 rounded ${it.is_offert? 'bg-orange-500 text-black' : 'bg-gray-700 text-white'}`} title="Offert"><Gift className="w-4 h-4"/></button>
                      <button onClick={() => handleAnnulerLigne(it.id)} className="text-red-500 p-1"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#111] p-3 border-t border-gray-800">
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => setPaymentMethod('especes')} className={`py-4 rounded-lg font-bold flex flex-col items-center gap-1 ${paymentMethod==='especes'? 'bg-green-600 text-white' : 'bg-[#2A9D2A] text-white'}`}><Banknote className="w-5 h-5"/> ESPECES</button>
                <button onClick={() => setPaymentMethod('cb')} className={`py-4 rounded-lg font-bold flex flex-col items-center gap-1 ${paymentMethod==='cb'? 'bg-blue-600 text-white' : 'bg-[#3B82F6] text-white'}`}><CreditCard className="w-5 h-5"/> C.B.</button>
                <button onClick={() => { if(selected.items.length>0) handleAnnulerLigne(selected.items[selected.items.length-1].id)}} className="py-4 rounded-lg font-bold bg-[#8B0000] text-white flex flex-col items-center gap-1"><Trash2 className="w-5 h-5"/> Annuler Ligne</button>

                <button onClick={() => setPaymentMethod('ca_vendeur')} className={`py-4 rounded-lg font-bold ${paymentMethod==='ca_vendeur'? 'bg-purple-600' : 'bg-[#7C3AED]'} text-white flex flex-col items-center gap-1`}><User className="w-5 h-5"/> C.A. vendeur</button>
                <button onClick={() => printReceipt(selected, paymentMethod, remise, totalApresRemise)} className="py-4 rounded-lg font-bold bg-[#EAB308] text-black flex flex-col items-center gap-1"><Printer className="w-5 h-5"/> Paiement</button>
                <button onClick={() => { if(selected.items.length>0) handleOffert(selected.items[selected.items.length-1])}} className="py-4 rounded-lg font-bold bg-[#FF6B00] text-white flex flex-col items-center gap-1"><Gift className="w-5 h-5"/> OFFERT</button>

                <button onClick={() => { const r = prompt('Remise %?'); if(r) setRemise(Number(r)); }} className="py-4 rounded-lg font-bold bg-[#F97316] text-white flex flex-col items-center gap-1"><Percent className="w-5 h-5"/> REMISE {remise>0? `(${remise}%)` : ''}</button>
                <button className="py-4 rounded-lg font-bold bg-[#EA580C] text-white flex flex-col items-center gap-1"><MessageSquare className="w-5 h-5"/> Message Cuisine</button>
                <button onClick={handlePay} disabled={paying ||!paymentMethod} className="py-4 rounded-lg font-bold bg-green-600 text-white disabled:opacity-50">{paying? '...' : `PAYER ${totalApresRemise.toFixed(0)} DH`}</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function printReceipt(cmd: any, method: any, remise: number, totalFinal: number) {
  const now = new Date(); const dateStr = now.toLocaleDateString('fr-FR'); const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const w = window.open('', '_blank', 'width=400,height=600'); if (!w) return;
  w.document.write(`<html><head><title>Ticket</title><style>*{font-family:monospace}body{width:300px;margin:0 auto;padding:10px}</style></head><body>
  <center><h2>MARSILIA FOOD</h2><div>${dateStr} ${timeStr}</div><div>Table: ${cmd.table_numero} - ${cmd.serveur_nom}</div><div>Paiement: ${method}</div></center><hr>
  ${cmd.items.map((it: any) => `<div style="display:flex;justify-content:space-between"><span>${it.qte}x ${it.menu_nom} ${it.is_offert? '<b>(OFFERT)</b>' : ''}</span><span>${it.is_offert? '0 DH' : `${(it.qte * Number(it.prix)).toFixed(0)} DH`}</span></div>`).join('')}<hr>
  ${remise>0? `<div>Remise: ${remise}%</div>` : ''}<div style="font-weight:bold;font-size:18px">TOTAL: ${totalFinal.toFixed(0)} DH</div><center><br>Merci!</center></body></html>`);
  w.document.close(); w.print(); setTimeout(() => w.close(), 500);
                  }
