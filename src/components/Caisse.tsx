// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { DollarSign, Printer, CheckCircle2 } from 'lucide-react';

export default function Caisse() {
  const [commandes, setCommandes] = useState<any[]>([]);
  const [payedToday, setPayedToday] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);

  const load = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data: cmds } = await supabase.from('commandes').select('*').in('statut', ['pret', 'paye']).order('created_at', { ascending: false });
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
      setCommandes(result.filter((c: any) => c.statut === 'pret'));
      setPayedToday(result.filter((c: any) => c.statut === 'paye' && c.created_at.startsWith(today)));
    } else {
      setCommandes([]); setPayedToday([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); const i = setInterval(load, 3000); return () => clearInterval(i); }, [load]);

  const handlePay = async (cmd: any) => {
    setPaying(cmd.id);
    await supabase.from('commandes').update({ statut: 'paye', updated_at: new Date().toISOString() }).eq('id', cmd.id);
    if (cmd.table_id) {
      const { data: remaining } = await supabase.from('commandes').select('*').eq('table_id', cmd.table_id).in('statut', ['en_attente', 'en_preparation', 'pret']);
      if (!remaining || remaining.length === 0) {
        await supabase.from('tables').update({ statut: 'libre' }).eq('id', cmd.table_id);
      }
    }
    printReceipt(cmd);
    setPaying(null);
    load();
  };

  if (loading) return <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <div className="sticky top-0 z-30 bg-[#0A0A0A]/95 border-b border-gray-800 px-4 py-3">
        <div className="flex items-center gap-2 max-w-4xl mx-auto"><DollarSign className="w-6 h-6 text-[#FF6B00]" /><h2 className="text-white font-bold">Caisse</h2></div>
      </div>
      <div className="p-4 max-w-4xl mx-auto">
        <div className="space-y-3">
          {commandes.length === 0? (
            <div className="text-center py-12"><CheckCircle2 className="w-12 h-12 text-gray-700 mx-auto mb-3" /><p className="text-gray-500">Aucune commande à encaisser</p></div>
          ) : commandes.map((c: any) => (
            <div key={c.id} className="bg-[#1A1A1A] rounded-2xl p-4 border border-gray-800">
              <div className="flex items-start justify-between mb-3"><div><div className="text-white font-bold text-lg">Table {c.table_numero || 'N/A'}</div><div className="text-gray-500 text-sm">{c.serveur_nom}</div></div><div className="text-[#FF6B00] text-2xl font-bold">{Number(c.total).toFixed(0)} DH</div></div>
              <div className="space-y-1 mb-4 border-t border-gray-800 pt-3">{c.items.map((it: any) => (<div key={it.id} className="flex justify-between text-sm"><span className="text-gray-300">{it.qte}x {it.menu_nom}</span><span className="text-gray-400">{(it.qte * Number(it.prix)).toFixed(0)} DH</span></div>))}</div>
              <div className="flex gap-2"><button onClick={() => printReceipt(c)} className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2.5 rounded-xl"><Printer className="w-4 h-4" />Ticket</button><button onClick={() => handlePay(c)} disabled={paying === c.id} className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white font-semibold py-2.5 rounded-xl">{paying === c.id? 'Encaissement...' : 'Payé'}</button></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function printReceipt(cmd: any) {
  const now = new Date(); const dateStr = now.toLocaleDateString('fr-FR'); const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const w = window.open('', '_blank', 'width=400,height=600'); if (!w) return;
  w.document.write(`<html><head><title>Ticket</title><style>*{font-family:monospace}body{width:300px;margin:0 auto;padding:10px}</style></head><body><h1>MARSILIA FOOD</h1><div>Table: ${cmd.table_numero}</div><div>Serveur: ${cmd.serveur_nom}</div><div>${dateStr} ${timeStr}</div><hr>${cmd.items.map((it: any) => `<div>${it.qte}x ${it.menu_nom} - ${(it.qte * Number(it.prix)).toFixed(0)} DH</div>`).join('')}<hr><div>TOTAL: ${Number(cmd.total).toFixed(0)} DH</div></body></html>`);
  w.document.close(); w.print(); setTimeout(() => w.close(), 500);
}
