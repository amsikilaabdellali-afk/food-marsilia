// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export default function Rapports() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [cmds, setCmds] = useState<any[]>([]);
  const [itemsMap, setItemsMap] = useState<any>({});
  const [tableMap, setTableMap] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const start = new Date(date); start.setHours(0,0,0,0);
    const end = new Date(date); end.setHours(23,59,59,999);

    let { data } = await supabase
   .from('commandes')
   .select('*')
   .eq('statut','paye')
   .gte('paye_at', start.toISOString())
   .lte('paye_at', end.toISOString())
   .order('paye_at', { ascending: true });

    if(!data || data.length===0){
      const { data: d2 } = await supabase.from('commandes').select('*').eq('statut','paye').gte('created_at', start.toISOString()).lte('created_at', end.toISOString()).order('created_at', {ascending:true});
      data = d2 || [];
    }

    let iMap:any = {};
    let tMap:any = {};
    if(data && data.length){
      const ids = data.map(c=>c.id);
      const tableIds = data.map(c=>c.table_id).filter(Boolean);
      const [{ data: items }, { data: tables }] = await Promise.all([
        supabase.from('commande_items').select('*').in('commande_id', ids),
        tableIds.length? supabase.from('tables').select('*').in('id', tableIds) : Promise.resolve({ data: [] } as any)
      ]);
      (items||[]).forEach((it:any)=>{ (iMap[it.commande_id]=iMap[it.commande_id]||[]).push(it); });
      (tables||[]).forEach((t:any)=>{ tMap[t.id]=t; });
    }
    setItemsMap(iMap);
    setTableMap(tMap);
    setCmds(data || []);
    setLoading(false);
  }, [date]);

  useEffect(()=>{ load(); }, [load]);

  const getTableNum = (c:any) => c.table_numero || c.table_num || tableMap[c.table_id]?.numero || tableMap[c.table_id]?.number || tableMap[c.table_id]?.nom || '?';

  // --- BOUTONS JDAD ---
  const viderAujourdhui = async () => {
    if(!confirm(`T-msa7 ghir commandes dyal ${date}?`)) return;
    const start = new Date(date); start.setHours(0,0,0,0);
    const end = new Date(date); end.setHours(23,59,59,999);
    const { data: todays } = await supabase.from('commandes').select('id').gte('created_at', start.toISOString()).lte('created_at', end.toISOString());
    const ids = (todays||[]).map((c:any)=>c.id);
    if(ids.length){
      await supabase.from('commande_items').delete().in('commande_id', ids);
      await supabase.from('commandes').delete().in('id', ids);
    }
    alert(`Tmsa7 ${ids.length} commandes`);
    load();
  };

  const viderTout = async () => {
    if(!confirm('⛔️ Ghadi t-msa7 GA3 commandes kamlin dyal test?')) return;
    if(!confirm('Mta2akked? Ga3 Rapports ghadi y-welli 0')) return;
    await supabase.from('commande_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('commandes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('tables').update({ statut: 'libre' }).neq('id', '00000000-0000-0000-0000-000000000000');
    alert('✅ Tms7at ga3 - daba 0');
    load();
  };

  const groups = {
    espece: cmds.filter(c=> (c.payment_method||'espece')==='espece'),
    tpe: cmds.filter(c=> c.payment_method==='tpe'),
    cheque: cmds.filter(c=> c.payment_method==='cheque'),
    offert: cmds.filter(c=> c.payment_method==='offert'),
    remise: cmds.filter(c=> c.payment_method==='remise'),
  };

  const sum = (arr:any[]) => arr.reduce((s,c)=> s + Number(c.total_final?? c.total?? 0), 0);
  const sumReel = (arr:any[]) => arr.reduce((s,c)=> s + Number(c.total?? 0), 0);
  const totalEncaisse = sum(groups.espece)+sum(groups.tpe)+sum(groups.cheque)+sum(groups.remise);

  const exportPDF = () => {
    const html = `
    <html><head><title>Rapport ${date}</title>
    <style>@page{size:A4; margin:10mm;} body{font-family:Arial; font-size:11px;} h1{text-align:center;} h2{background:#eee; padding:6px; margin-top:18px;} table{width:100%; border-collapse:collapse;} th,td{border:1px solid #aaa; padding:5px; text-align:left;} th{background:#111; color:#fff;}</style></head><body>
      <h1>Marsilia Food - Rapport ${date}</h1>
      <p style="text-align:center; font-weight:bold; font-size:14px;">${totalEncaisse.toFixed(1)} DH encaissé - ${cmds.length} commandes</p>
      ${['espece','tpe','cheque','remise','offert'].map(k=>{
        const arr = groups[k as keyof typeof groups]; if(!arr.length) return '';
        return `<h2>${k.toUpperCase()} - ${sum(arr).toFixed(0)} DH (${arr.length})</h2>
        <table><tr><th>Heure</th><th>Table</th><th>Qte</th><th>Total</th><th>Paiement</th><th>Encaissé</th></tr>
        ${arr.map(c=>{
          const its = itemsMap[c.id]||[]; const qte = its.length? its.map((it:any)=>`${it.qte||1}x ${it.menu_nom||it.nom}`).join(' + ') : '-';
          return `<tr><td>${new Date(c.paye_at||c.created_at).toLocaleTimeString('fr-FR')}</td><td>${getTableNum(c)}</td><td>${qte}</td><td>${c.total} DH</td><td>${c.payment_method}</td><td><b>${c.total_final??c.total} DH</b></td></tr>`;
        }).join('')}</table>`;
      }).join('')}
      <script>setTimeout(()=>window.print(),600);<\/script>
    </body></html>`;
    const w = window.open('', '_blank'); if(w){ w.document.write(html); w.document.close(); }
  };

  const renderCmd = (c:any) => {
    const its = itemsMap[c.id] || [];
    return (
      <div key={c.id} className="bg-[#1A1A1A] border border-zinc-800 rounded-xl p-3 text-sm">
        <div className="flex justify-between font-bold text-white">
          <span>Table {getTableNum(c)} - {c.serveur_nom || 'abdellali'}</span>
          <span className="text-orange-400">{Number(c.total_final?? c.total?? 0)} DH</span>
        </div>
        <div className="text-[11px] text-zinc-400 mt-1">
          {new Date(c.paye_at || c.created_at).toLocaleTimeString('fr-FR')} - {c.payment_method?.toUpperCase()}
        </div>
        <div className="mt-2 space-y-1 border-t border-zinc-800 pt-2">
          {its.length? its.map((it:any)=><div key={it.id} className="flex justify-between text-zinc-300"><span>{it.qte||1}x {it.menu_nom||it.nom}</span><span>{(Number(it.qte||1)*Number(it.prix||0)).toFixed(0)} DH</span></div>)
          : <div className="text-amber-500/70 text-[11px]">⚠️ Repas ma t-sauvach (commande 9dima)</div>}
        </div>
      </div>
    );
  };

  if(loading) return <div className="p-8 text-center text-zinc-500">Chargement...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex gap-2 flex-wrap">
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 flex-1 text-white" />
          <button onClick={exportPDF} className="bg-orange-600 px-4 rounded-xl font-bold text-sm">📄 PDF</button>
          <button onClick={load} className="bg-zinc-800 px-4 rounded-xl">Refresh</button>
        </div>

        {/* BOUTONS JDAD DYAL KHWI */}
        <div className="grid grid-cols-2 gap-2">
          <button onClick={viderAujourdhui} className="bg-yellow-900/40 border border-yellow-700 text-yellow-300 font-bold py-3 rounded-xl text-sm">🗑️ Khwi dyal {date}</button>
          <button onClick={viderTout} className="bg-red-900/60 border-2 border-red-600 text-red-300 font-black py-3 rounded-xl text-sm">⛔️ KHWI GA3 - BDA 0</button>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 text-center font-black text-xl">
          {totalEncaisse.toFixed(1)} DH - {cmds.length} cmd
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <div className="bg-green-900/30 border border-green-700 rounded-xl p-3"><div className="text-[10px] text-green-300">ESPECE</div><div className="font-bold text-green-400">{sum(groups.espece).toFixed(0)} DH</div></div>
          <div className="bg-blue-900/30 border border-blue-700 rounded-xl p-3"><div className="text-[10px] text-blue-300">TPE</div><div className="font-bold text-blue-400">{sum(groups.tpe).toFixed(0)} DH</div></div>
          <div className="bg-purple-900/30 border border-purple-700 rounded-xl p-3"><div className="text-[10px] text-purple-300">CHEQUE</div><div className="font-bold text-purple-400">{sum(groups.cheque).toFixed(0)} DH</div></div>
          <div className="bg-orange-900/30 border border-orange-700 rounded-xl p-3"><div className="text-[10px] text-orange-300">OFFERT</div><div className="font-bold text-orange-400">{sumReel(groups.offert).toFixed(0)} DH perdu</div></div>
          <div className="bg-yellow-900/30 border border-yellow-700 rounded-xl p-3"><div className="text-[10px] text-yellow-300">REMISE</div><div className="font-bold text-yellow-400">{sum(groups.remise).toFixed(0)} DH</div></div>
        </div>

        {[
          { key:'espece', label:`ESPECE (${groups.espece.length})`, data: groups.espece },
          { key:'tpe', label:`TPE (${groups.tpe.length})`, data: groups.tpe },
          { key:'cheque', label:`CHEQUE (${groups.cheque.length})`, data: groups.cheque },
          { key:'remise', label:`REMISE (${groups.remise.length})`, data: groups.remise },
          { key:'offert', label:`OFFERT (${groups.offert.length})`, data: groups.offert },
        ].map(g=> g.data.length>0 && (
          <div key={g.key}><h3 className="font-black py-2">{g.label}</h3><div className="space-y-2">{g.data.map(renderCmd)}</div></div>
        ))}
        {cmds.length===0 && <div className="text-center py-20 text-zinc-600">Ma kayn walou - 0 commande</div>}
      </div>
    </div>
  );
}
