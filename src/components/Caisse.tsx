// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { DollarSign, Printer, LogOut, Settings, CheckSquare } from 'lucide-react';

export default function Caisse({ profil, onLogout }: any) {
  const [commandes, setCommandes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<Record<string, any>>({});
  const [remiseMap, setRemiseMap] = useState<Record<string, number>>({});
  const [showRemiseFor, setShowRemiseFor] = useState<string | null>(null);
  const [customRemise, setCustomRemise] = useState('10');
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
  const [modePaiement, setModePaiement] = useState<Record<string, 'total' | 'articles'>>({});

  const getCode = () => localStorage.getItem('remise_code') || '1234';
  const changeCode = () => {
    const oldCode = prompt('Code 9dim (default 1234):');
    if (oldCode!== getCode()) return alert('Code ghalat! Code daba: ' + getCode());
    const newCode = prompt('Code jdid (ex: 2026):');
    if (!newCode) return;
    localStorage.setItem('remise_code', newCode);
    alert('Code t-badal: ' + newCode);
  };

  const getTotalAPayer = (cmd:any) => {
    const mode = modePaiement[cmd.id] || 'total';
    if(mode === 'total') return Number(cmd.total||0);
    let total = 0;
    cmd.items?.forEach((it:any)=>{
      const key = `${cmd.id}-${it.id}`;
      if(selectedItems[key]) total += Number(it.prix||0) * (it.qte||it.quantite||1);
    });
    return total;
  };

  const printDoubleTicket = (cmd:any) => {
    try {
      const mode = modePaiement[cmd.id] || 'total';
      const itemsToPrint = mode === 'articles'? cmd.items.filter((it:any)=> selectedItems[`${cmd.id}-${it.id}`]) : cmd.items;
      const totalReel = itemsToPrint.reduce((s:number,it:any)=> s + Number(it.prix||0)*(it.qte||it.quantite||1), 0);
      const method = selectedMethod[cmd.id] || 'espece';
      const percent = remiseMap[cmd.id] || 0;
      const remiseMontant = method==='offert'? totalReel : method==='remise'? totalReel*percent/100 : 0;
      const totalFinal = totalReel - remiseMontant;
      const date = new Date().toLocaleString('fr-FR');
      const itemsRows = itemsToPrint?.map((it:any)=> `<div style="display:flex;justify-content:space-between;font-size:13px;margin:4px 0"><span>${it.qte||it.quantite||1}x ${it.menu_nom||it.nom||'Plat'}</span><span>${(Number(it.prix||0)*(it.qte||it.quantite||1)).toFixed(0)} DH</span></div>`).join('') || '';
      const ticket = (copy:string) => `<div class="ticket"><center><h2 style="margin:0;font-size:18px">MARSILIA FOOD</h2><div style="font-size:10px">Haj fateh - ${date}</div><div style="font-size:14px;font-weight:bold;margin:8px 0;border:1px dashed black;padding:5px">Table ${cmd.table_numero||'?'} - ${copy}</div></center><hr style="border:1px dashed black;margin:10px 0">${itemsRows}<hr style="border:1px dashed black;margin:10px 0"><div style="display:flex;justify-content:space-between"><span>Sous-total:</span><span>${totalReel.toFixed(0)} DH</span></div>${remiseMontant>0? `<div style="display:flex;justify-content:space-between"><span>Remise ${percent}%:</span><span>-${remiseMontant.toFixed(0)} DH</span></div>`:''}<div style="display:flex;justify-content:space-between;font-weight:bold;font-size:16px;margin-top:6px;border-top:2px solid black;padding-top:6px"><span>TOTAL:</span><span>${totalFinal.toFixed(0)} DH</span></div></div>`;
      const html = `<html><head><title>Tickets</title><style>@page { size: 80mm auto; margin: 0; } body { margin:0; padding:0; background:white; color:black; font-family:monospace; }.ticket { width:72mm; padding:5mm; }.page-break { page-break-after: always; }</style></head><body>${ticket('ORIGINAL CLIENT')}<div class="page-break"></div>${ticket('DUPLICATA CAISSE')}<script>setTimeout(()=>{window.print(); setTimeout(()=>window.close(), 1500)},500)<\/script></body></html>`;
      const iframe = document.createElement('iframe');
      iframe.style.position='fixed'; iframe.style.right='0'; iframe.style.bottom='0'; iframe.style.width='0'; iframe.style.height='0'; iframe.style.border='0';
      document.body.appendChild(iframe);
      const doc = iframe.contentWindow?.document;
      if(doc){ doc.open(); doc.write(html); doc.close(); }
      setTimeout(()=>{ try{document.body.removeChild(iframe)}catch{} }, 7000);
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
    if(paying) return;
    const mode = modePaiement[cmd.id] || 'total';
    let itemsToPay:any[] = [];
    let totalReel = 0;
    if(mode === 'articles'){
      itemsToPay = cmd.items.filter((it:any)=> selectedItems[`${cmd.id}-${it.id}`]);
      if(itemsToPay.length===0) return alert('Khtar chi article t-khallas!');
      totalReel = itemsToPay.reduce((s:number,it:any)=> s + Number(it.prix||0)*(it.qte||it.quantite||1), 0);
    } else {
      itemsToPay = cmd.items;
      totalReel = Number(cmd.total||0);
    }
    if(totalReel===0) return alert('Total 0 DH!');
    if(!confirm(`Confirmer Table ${cmd.table_numero} - ${mode==='articles'? itemsToPay.length+' articles': 'TOTAL'} : ${totalReel.toFixed(0)} DH?`)) return;
    setPaying(cmd.id);
    const method = selectedMethod[cmd.id] || 'espece';
    const percent = remiseMap[cmd.id] || 0;
    let remiseMontant = 0; let totalFinal = totalReel;
    if(method==='offert'){ remiseMontant=totalReel; totalFinal=0; }
    else if(method==='remise'){ remiseMontant = totalReel * percent / 100; totalFinal = totalReel - remiseMontant; }
    if(mode === 'total' || itemsToPay.length === cmd.items.length){
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
    } else {
      try {
        const idsToPay = itemsToPay.map((it:any)=>it.id);
        await supabase.from('commande_items').update({ statut:'paye' }).in('id', idsToPay);
        const remainingItems = cmd.items.filter((it:any)=>!selectedItems[`${cmd.id}-${it.id}`]);
        const remainingTotal = remainingItems.reduce((s:number,it:any)=> s + Number(it.prix||0)*(it.qte||it.quantite||1), 0);
        if(remainingTotal>0){ await supabase.from('commandes').update({ total: remainingTotal }).eq('id', cmd.id); }
        else { await supabase.from('commandes').update({ statut:'paye' }).eq('id', cmd.id); if(cmd.table_id) await supabase.from('tables').update({statut:'libre'}).eq('id',cmd.table_id); }
        const newSelected = {...selectedItems}; idsToPay.forEach((id:any)=> delete newSelected[`${cmd.id}-${id}`]); setSelectedItems(newSelected);
        alert(`Tkhallas ${itemsToPay.length} articles (${totalFinal.toFixed(0)} DH) - Ba9i ${remainingTotal.toFixed(0)} DH`);
        printDoubleTicket({...cmd, items: itemsToPay});
        load();
      } catch(e:any){ alert('Erreur partiel: '+e.message); }
    }
    setPaying(null);
  };

  if(loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <div className="sticky top-0 z-30 bg-[#0A0A0A]/95 border-b border-gray-800 px-4 py-3 flex justify-between max-w-4xl mx-auto">
        <div className="flex items-center gap-2"><DollarSign className="w-6 h-6 text-orange-500" /><h2 className="text-white font-bold">Caisse {profil?.user?.nom?`- ${profil.user.nom}`:''} - {commandes.length}</h2></div>
        <div className="flex gap-2">
          <button onClick={changeCode} className="bg-zinc-800 text-white px-2 py-1 rounded-lg text-xs flex items-center gap-1"><Settings className="w-3 h-3"/>Code</button>
          <button onClick={load} className="bg-zinc-800 text-white px-3 py-1 rounded-lg text-xs">Refresh</button>
          <button onClick={onLogout} className="bg-white text-black px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1"><LogOut className="w-3 h-3"/>Logout</button>
        </div>
      </div>
      <div className="p-4 max-w-4xl mx-auto space-y-3">
        {commandes.length===0? <div className="text-center py-20 text-gray-600">Khawya ✅</div> : commandes.map((c:any)=>{
          const mode = modePaiement[c.id] || 'total';
          const totalReel = getTotalAPayer(c);
          const method = selectedMethod[c.id] || 'espece';
          const percent = remiseMap[c.id] || 0;
          const totalFinal = method==='offert'?0: method==='remise'? totalReel - totalReel*percent/100 : totalReel;
          const selectedCount = c.items.filter((it:any)=> selectedItems[`${c.id}-${it.id}`]).length;
          return (
          <div key={c.id} className="bg-[#1A1A1A] rounded-2xl p-4 border border-gray-800">
            <div className="flex justify-between mb-2"><div><div className="text-white font-bold">Table {c.table_numero} - {c.statut}</div><div className="text-[10px] text-gray-500 mt-1">{mode==='articles'? `${selectedCount}/${c.items.length} selectionnés` : `${c.items.length} articles`}</div></div><div className="text-right"><div className="text-xl font-black text-orange-500">{totalFinal.toFixed(0)} DH</div><button onClick={()=>printDoubleTicket(c)} className="text-[10px] bg-zinc-800 px-2 py-1 rounded mt-1 flex items-center gap-1 text-white"><Printer className="w-3 h-3"/>TICKETS</button></div></div>
            <div className="bg-black/60 rounded-xl p-2 mb-3 border border-zinc-800">
              <div className="flex justify-between items-center mb-2"><span className="text-[10px] text-yellow-400 font-bold flex items-center gap-1"><CheckSquare className="w-3 h-3"/>ARTICLES</span><div className="flex gap-1"><button onClick={()=>setModePaiement({...modePaiement,[c.id]:'total'})} className={`text-[9px] px-3 py-1 rounded-full font-bold ${mode==='total'?'bg-white text-black':'bg-zinc-800 text-gray-400'}`}>TOTAL</button><button onClick={()=>setModePaiement({...modePaiement,[c.id]:'articles'})} className={`text-[9px] px-3 py-1 rounded-full font-bold ${mode==='articles'?'bg-orange-500 text-white':'bg-zinc-800 text-gray-400'}`}>PAR ARTICLE</button></div></div>
              {c.items?.map((it:any)=>{const key=`${c.id}-${it.id}`; const prixUnit=Number(it.prix||0); const qte=it.qte||it.quantite||1; const prixTotal=prixUnit*qte; const isChecked=selectedItems[key]; return (<label key={it.id} className={`flex justify-between items-center p-2.5 rounded-xl mb-1 cursor-pointer ${isChecked?'bg-green-900/40 border border-green-600':'bg-zinc-900'}`}><div className="flex items-center gap-2.5">{mode==='articles' && <input type="checkbox" checked={!!isChecked} onChange={(e)=>setSelectedItems({...selectedItems, [key]: e.target.checked})} className="w-4 h-4"/>}<span className="text-white text-[13px]">{qte}x {it.menu_nom||it.nom||'Plat'}</span></div><span className="text-orange-400 text-xs font-bold">{prixTotal.toFixed(0)} DH</span></label>)})}
            </div>
            <div className="grid grid-cols-5 gap-2 mb-2"><button onClick={()=>setSelectedMethod({...selectedMethod,[c.id]:'espece'})} className={`py-2.5 rounded-xl text-[11px] font-bold ${method==='espece'?'bg-white text-black':'bg-green-600 text-white'}`}>ESPECE</button><button onClick={()=>setSelectedMethod({...selectedMethod,[c.id]:'tpe'})} className={`py-2.5 rounded-xl text-[11px] font-bold ${method==='tpe'?'bg-white text-black':'bg-blue-600 text-white'}`}>TPE</button><button onClick={()=>setSelectedMethod({...selectedMethod,[c.id]:'cheque'})} className={`py-2.5 rounded-xl text-[11px] font-bold ${method==='cheque'?'bg-white text-black':'bg-purple-600 text-white'}`}>CHEQUE</button><button onClick={()=>setSelectedMethod({...selectedMethod,[c.id]:'offert'})} className={`py-2.5 rounded-xl text-[11px] font-bold ${method==='offert'?'bg-white text-black':'bg-orange-600 text-white'}`}>OFFERT</button><button onClick={()=>{const code=prompt(`Code Patron?`); if(code!==getCode()) return alert('Code ghalat!'); setShowRemiseFor(c.id);}} className="py-2.5 rounded-xl text-[11px] font-bold bg-zinc-800 border-2 border-yellow-500 text-yellow-400">REMISE</button></div>
            {showRemiseFor===c.id && <div className="bg-black border-2 border-yellow-600 rounded-xl p-3 mb-3"><div className="grid grid-cols-4 gap-2 mb-3">{[5,10,15,20,25,30,40,50].map(p=><button key={p} onClick={()=>{setSelectedMethod({...selectedMethod,[c.id]:'remise'}); setRemiseMap({...remiseMap,[c.id]:p}); setShowRemiseFor(null)}} className="bg-yellow-600 text-white py-2 rounded-lg font-bold">{p}%</button>)}</div><div className="flex gap-2"><input type="number" value={customRemise} onChange={e=>setCustomRemise(e.target.value)} className="flex-1 bg-zinc-900 border border-yellow-600 rounded-xl px-3 py-3 text-white font-bold text-center"/><button onClick={()=>{const p=parseFloat(customRemise); if(!p || p<0 || p>100) return alert('0-100%'); setSelectedMethod({...selectedMethod,[c.id]:'remise'}); setRemiseMap({...remiseMap,[c.id]:p}); setShowRemiseFor(null);}} className="bg-white text-black px-5 rounded-xl font-black">OK</button></div></div>}
            <button onClick={()=>handlePay(c)} disabled={paying===c.id || (mode==='articles' && selectedCount===0)} className="w-full py-3 rounded-xl font-bold bg-green-600 text-white disabled:bg-zinc-700 disabled:text-zinc-500">{paying===c.id?'...' : mode==='articles'? `PAYER ${selectedCount} ARTICLES = ${totalFinal.toFixed(0)} DH` : `PAYER ${totalFinal.toFixed(0)} DH`}</button>
          </div>
        )})}
      </div>
    </div>
  );
}
