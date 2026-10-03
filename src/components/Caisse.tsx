import { useState, useEffect, useCallback } from 'react';
import { supabase, type Commande, type CommandeItem, type TableResto } from '@/lib/supabase';
import { DollarSign, Printer, CheckCircle2 } from 'lucide-react';

type CmdWithItems = Commande & { items: CommandeItem[]; table_numero: number | null };

export default function Caisse() {
  const [commandes, setCommandes] = useState<CmdWithItems[]>([]);
  const [payedToday, setPayedToday] = useState<CmdWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);

  const load = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data: cmds } = await supabase.from('commandes').select('*').in('statut', ['pret', 'paye']).order('created_at', { ascending: false });
    if (cmds && cmds.length > 0) {
      const ids = cmds.map((c) => c.id);
      const tableIds = cmds.map((c) => c.table_id).filter(Boolean) as string[];
      const [{ data: items }, { data: tables }] = await Promise.all([
        supabase.from('commande_items').select('*').in('commande_id', ids),
        tableIds.length > 0? supabase.from('tables').select('*').in('id', tableIds) : Promise.resolve({ data: [] as TableResto[] }),
      ]);
      const itemsMap: Record<string, CommandeItem[]> = {};
      (items || []).forEach((it) => { (itemsMap[it.commande_id] = itemsMap[it.commande_id] || []).push(it); });
      const tableMap: Record<string, TableResto> = {};
      (tables || []).forEach((t) => { tableMap[t.id] = t; });
      const result: CmdWithItems[] = cmds.map((c) => ({
      ...c,
        items: itemsMap[c.id] || [],
        table_numero: c.table_id? tableMap[c.table_id]?.numero?? null : null,
      }));
      setCommandes(result.filter((c) => c.statut === 'pret'));
      setPayedToday(result.filter((c) => c.statut === 'paye' && c.created_at.startsWith(today)));
    } else {
      setCommandes([]);
      setPayedToday([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [load]);

  const handlePay = async (cmd: CmdWithItems) => {
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

  const printEndOfDay = () => {
    if (payedToday.length === 0) { alert('Aucune commande payee aujourd hui.'); return; }
    const total = payedToday.reduce((s, c) => s + Number(c.total), 0);
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR');
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const w = window.open('', '_blank', 'width=400,height=600');
    if (!w) return;
    w.document.write(`
      <html><head><title>Fin de service - ${dateStr}</title>
      <style>*{font-family:'Courier New',monospace}body{width:300px;margin:0 auto;padding:10px}h1{text-align:center;font-size:18px;margin:5px 0}.info{text-align:center;font-size:12px;margin:3px 0}hr{border:1px dashed #000;margin:8px 0}.item{font-size:12px;display:flex;justify-content:space-between;margin:3px 0}.total{font-size:16px;font-weight:bold;display:flex;justify-content:space-between;margin-top:5px}</style></head><body>
      <h1>MARSILIA FOOD</h1><div class="info">--- FIN DE SERVICE ---</div><div class="info">Date: ${dateStr} - ${timeStr}</div><hr>
      ${payedToday.map((c) => `<div class="item"><span>Table ${c.table_numero || 'N/A'} (${c.serveur_nom || 'N/A'})</span><span>${Number(c.total).toFixed(0)} DH</span></div>`).join('')}
      <hr><div class="total"><span>TOTAL ENCAISSE</span><span>${total.toFixed(0)} DH</span></div><div class="info">${payedToday.length} commande(s) payee(s)</div><hr><div class="info">Merci de votre service!</div></body></html>
    `);
    w.document.close(); w.print(); setTimeout(() => w.close(), 500);
  };

  if (loading) return <LoadingSpinner />;
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <div className="sticky top-0 z-30 bg-[#0A0A0A]/95 backdrop-blur border-b border-gray-800 px-4 py-3">
        <div className="flex items-center gap-2 max-w-4xl mx-auto">
          <DollarSign className="w-6 h-6 text-[#FF6B00]" /><h2 className="text-white font-bold">Caisse</h2>
          {payedToday.length > 0 && <button onClick={printEndOfDay} className="ml-auto flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white font-medium px-4 py-2 rounded-xl text-sm"><Printer className="w-4 h-4" /><span className="hidden sm:inline">Fin de service</span></button>}
        </div>
      </div>
      <div className="p-4 max-w-4xl mx-auto">
        <div className="space-y-3">
          {commandes.length === 0? (
            <div className="text-center py-12"><CheckCircle2 className="w-12 h-12 text-gray-700 mx-auto mb-3" /><p className="text-gray-500">Aucune commande à encaisser</p></div>
          ) : (
            commandes.map((c) => (
              <div key={c.id} className="bg-[#1A1A1A] rounded-2xl p-4 border border-gray-800">
                <div className="flex items-start justify-between mb-3"><div><div className="text-white font-bold text-lg">Table {c.table_numero || 'N/A'}</div
