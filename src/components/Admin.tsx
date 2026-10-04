// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export default function Rapports() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // 2026-10-04
  const [cmds, setCmds] = useState<any[]>([]);
  const [itemsMap, setItemsMap] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const start = new Date(date); start.setHours(0,0,0,0);
    const end = new Date(date); end.setHours(23,59,59,999);

    const { data, error } = await supabase
     .from('commandes')
     .select('*')
     .eq('statut', 'paye')
     .gte('paye_at', start.toISOString())
     .lte('paye_at', end.toISOString())
     .order('paye_at', { ascending: true });

    console.log('RAPPORT CMDS:', data, error);

    let finalData = data || [];
    // Fallback ila paye_at khawi - 9elleb b created_at
    if(finalData.length===0){
      const { data: d2 } = await supabase.from('commandes').select('*').eq('statut','paye').gte('created_at', start.toISOString()).lte('created_at', end.toISOString()).order('created_at', {ascending:true});
      finalData = d2 || [];
    }

    if(finalData.length){
      const ids = finalData.map(c=>c.id);
      const { data: items } = await supabase.from('commande_items').select('*').in('commande_id', ids);
      const map:any={}; (items||[]).forEach(it=>{ (map[it.commande_id]=map[it.commande_id]||[]).push(it); });
      setItemsMap(map);
    } else setItemsMap({});
    setCmds(finalData);
    setLoading(false);
  }, [date]);

  useEffect(()=>{ load(); }, [load]);

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
  const totalGeneral = cmds.length;

  const renderCmd = (c:any) => {
    const its = itemsMap[c.id] || [];
    return (
      <div key={c.id} className="bg-[#1A1A1A] border border-zinc-800 rounded-xl p-3 text-sm">
        <div className="flex justify-between font-bold text-white">
          <span>Table {c.table_numero || c.table_num || '?'} - {c.serveur_nom || c.serveur || 'abdellali'}</span>
          <span className="text-orange-400">{Number(c.total_final?? c.total?? 0)} DH {c.payment_method==='offert'? '(0 DH)' : ''}</span>
        </div>
        <div className="text-[11px] text-zinc-400 mt-1">
          {new Date(c.paye_at || c.created_at).toLocaleTimeString('fr-FR')} - {c.payment_method?.toUpperCase() || 'ESPECE'} {c.remise_percent? `- Remise ${c.remise_percent}% (-${Number(c.remise||0).toFixed(0)} DH)` : ''}
        </div>
        <div className="mt-2 space-y-1 border-t border-zinc-800 pt-2">
          {its.length? its.map((it:any)=><div key={it.id} className="flex justify-between text-zinc-300"><span>{it.qte||it.quantite||1}x {it.menu_nom||it.nom}</span><span>{(Number(it.qte||1)*Number(it.prix||0)).toFixed(0)} DH</span></div>)
          : <div className="text-zinc-500 text-xs">Total BD: {c.total} DH - Items: 0 (RLS) - walakin total kayn</div>}
        </div>
        {c.remise>0 && <div className="text-orange-400 text-xs mt-1 font-bold">Remise: -{Number(c.remise).toFixed(0)} DH - Encaissé: {Number(c.total_final).toFixed(0)} DH</div>}
      </div>
    );
  };

  if(loading) return <div className="p-8 text-center text-zinc-500">Chargement...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-5xl mx-auto space-y-4">
        {/* DATE */}
        <div className="flex gap-2">
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 w-full text-white" />
          <button onClick={load} className="bg-zinc-800 px-4 rounded-xl">Refresh</button>
        </div>

        {/* MAJMOU3 LFo9 */}
        <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 text-center font-black text-xl">
          {totalEncaisse.toFixed(1)} DH - {totalGeneral} cmd
          <div className="text-xs font-normal text-zinc-400 mt-1">Encaissé réel (bla OFFERT)</div>
        </div>

        {/* GROUPES LFo9 - Kola paiement b total dyalo */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <div className="bg-green-900/30 border border-green-700 rounded-xl p-3"><div className="text-[10px] text-green-300">ESPECE</div><div className="font-bold text-green-400">{sum(groups.espece).toFixed(0)} DH</div><div className="text-xs text-zinc-400">{groups.espece.length} cmd</div></div>
          <div className="bg-blue-900/30 border border-blue-700 rounded-xl p-3"><div className="text-[10px] text-blue-300">TPE</div><div className="font-bold text-blue-400">{sum(groups.tpe).toFixed(0)} DH</div><div className="text-xs text-zinc-400">{groups.tpe.length} cmd</div></div>
          <div className="bg-purple-900/30 border border-purple-700 rounded-xl p-3"><div className="text-[10px] text-purple-300">CHEQUE</div><div className="font-bold text-purple-400">{sum(groups.cheque).toFixed(0)} DH</div><div className="text-xs text-zinc-400">{groups.cheque.length} cmd</div></div>
          <div className="bg-orange-900/30 border border-orange-700 rounded-xl p-3"><div className="text-[10px] text-orange-300">OFFERT</div><div className="font-bold text-orange-400">{sumReel(groups.offert).toFixed(0)} DH perdu</div><div className="text-xs text-zinc-400">{groups.offert.length} cmd</div></div>
          <div className="bg-yellow-900/30 border border-yellow-700 rounded-xl p-3"><div className="text-[10px] text-yellow-300">REMISE</div><div className="font-bold text-yellow-400">{sum(groups.remise).toFixed(0)} DH</div><div className="text-xs text-zinc-400">{groups.remise.length} cmd (-{groups.remise.reduce((s,c)=>s+Number(c.remise||0),0).toFixed(0)} DH)</div></div>
        </div>

        {/* DETAIL - Kola groupe b commandes dyalo */}
        {[
          { key:'espece', label:`ESPECE (${groups.espece.length}) - ${sum(groups.espece).toFixed(0)} DH`, data: groups.espece, color:'border-green-600' },
          { key:'tpe', label:`TPE (${groups.tpe.length}) - ${sum(groups.tpe).toFixed(0)} DH`, data: groups.tpe, color:'border-blue-600' },
          { key:'cheque', label:`CHEQUE (${groups.cheque.length}) - ${sum(groups.cheque).toFixed(0)} DH`, data: groups.cheque, color:'border-purple-600' },
          { key:'remise', label:`REMISE (${groups.remise.length}) - ${sum(groups.remise).toFixed(0)} DH`, data: groups.remise, color:'border-yellow-600' },
          { key:'offert', label:`OFFERT (${groups.offert.length}) - ${sumReel(groups.offert).toFixed(0)} DH perdu`, data: groups.offert, color:'border-orange-600' },
        ].map(g=> g.data.length>0 && (
          <div key={g.key} className={`border-l-4 ${g.color} pl-2`}>
            <h3 className="font-black text-white py-2">{g.label}</h3>
            <div className="space-y-2">{g.data.map(renderCmd)}</div>
          </div>
        ))}

        {cmds.length===0 && <div className="text-center py-20 text-zinc-600">Ma kayn 7ta commande paye f {date}</div>}
      </div>
    </div>
  );
}
