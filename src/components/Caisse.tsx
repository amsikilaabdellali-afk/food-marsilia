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
  const [modePaiement, setModePaiement] = useState<Record<string, 'total' | 'articles'>>({});
  const [itemMethods, setItemMethods] = useState<Record<string, string>>({});
  const [itemRemises, setItemRemises] = useState<Record<string, number>>({});

  const getCode = () => localStorage.getItem('remise_code') || '1234';
  const changeCode = () => {
    const oldCode = prompt('Dakhal Code 9dim:');
    if (oldCode!== getCode()) return alert('Code ghalat!');
    const newCode = prompt('Dakhal Code jdid:');
    if (!newCode) return;
    if (newCode.length < 4) return alert('Code 4 ar9am minimum');
    localStorage.setItem('remise_code', newCode);
    alert('Code t-badal b-najah ✅');
  };

  const printTicketMixte = (cmd:any) => {
    const date = new Date().toLocaleString('fr-FR');
    let totalEspece = 0, totalTpe = 0, totalCheque = 0, totalOffert = 0, totalRemise = 0;
    let totalGeneral = 0;
    const rows = cmd.items.map((it:any)=>{
      const key = `${cmd.id}-${it.id}`;
      const m = itemMethods[key] || 'espece';
      const p = itemRemises[key] || 0;
      const prix = Number(it.prix||0)*(it.qte||it.quantite||1);
      const finalP = m==='offert'?0: m==='remise'? prix - prix*p/100 : prix;
      if(m==='espece') totalEspece+=finalP;
      else if(m==='tpe') totalTpe+=finalP;
      else if(m==='cheque') totalCheque+=finalP;
      else if(m==='offert') totalOffert+=prix;
      else if(m==='remise') totalRemise+=finalP;
      totalGeneral+=finalP;
      return `<div style="display:flex;justify-content:space-between;font-size:12px;margin:4px 0"><span>${it.qte||1}x ${it.menu_nom||it.nom} <b>(${m.toUpperCase()}${p?` -${p}%`:''})</b></span><span>${finalP.toFixed(0)} DH</span></div>`;
    }).join('');
    const recap = `
      ${totalEspece>0?`<div style="display:flex;justify-content:space-between;margin:2px 0"><span>ESPECE:</span><span>${totalEspece.toFixed(0)} DH</span></div>`:''}
      ${totalTpe>0?`<div style="display:flex;justify-content:space-between;margin:2px 0"><span>TPE:</span><span>${totalTpe.toFixed(0)} DH</span></div>`:''}
      ${totalCheque>0?`<div style="display:flex;justify-content:space-between;margin:2px 0"><span>CHEQUE:</span><span>${totalCheque.toFixed(0)} DH</span></div>`:''}
      ${totalOffert>0?`<div style="display:flex;justify-content:space-between;margin:2px 0"><span>OFFERT:</span><span>${totalOffert.toFixed(0)} DH</span></div>`:''}
      ${totalRemise>0?`<div style="display:flex;justify-content:space-between;margin:2px 0"><span>REMISE:</span><span>${totalRemise.toFixed(0)} DH</span></div>`:''}
    `;
    const ticket = (copy:string) => `<div style="width:72mm;padding:5mm;font-family:monospace;color:black;background:white"><center><h2 style="margin:0">MARSILIA FOOD</h2><div style="font-size:10px">Haj fateh - ${date}</div><div style="font-size:12px;font-weight:bold;margin:6px 0;border:1px dashed black;padding:4px">Table ${cmd.table_numero} - ${copy}<br/>TICKET MIXTE</div></center><hr style="border:1px dashed black">${rows}<hr style="border:1px dashed black">${recap}<div style="display:flex;justify-content:space-between;font-weight:bold;font-size:15px;border-top:2px solid black;margin-top:6px;padding-top:6px"><span>TOTAL:</span><span>${totalGeneral.toFixed(0)} DH</span></div></div>`;
    const html = `<html><head><style>@page{size:80mm auto;margin:0}body{margin:0}</style></head><body>${ticket('CLIENT')}<div style="page-break-after:always"></div>${ticket('CAISSE')}<script>setTimeout(()=>{window.print();setTimeout(()=>window.close(),1000)},500)<\/script></body></html>`;
    const iframe = document.createElement('iframe'); iframe.style.position='fixed'; iframe.style.width='0'; iframe.style.height='0'; iframe.style.border='0'; document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document; if(doc){ doc.open(); doc.write(html); doc.close(); }
    setTimeout(()=>{ try{document.body.removeChild(iframe)}catch{} }, 6000);
  };

  const printTicketSingle = (cmd:any, item:any, method:string, percent:number) => {
    const prix = Number(item.prix||0)*(item.qte||item.quantite||1);
    const finalP = method==='offert'?0: method==='remise'? prix - prix*percent/100 : prix;
    const date = new Date().toLocaleString('fr-FR');
    const html = `<html><head><style>@page{size:80mm auto;margin:0}body{font-family:monospace;padding:5mm}</style></head><body><center><h2>MARSILIA FOOD</h2><div>${date}</div><div style="border:1px dashed black;padding:5px">Table ${cmd.table_numero}</div></center><div>${item.qte||1}x ${item.menu_nom||item.nom} (${method.toUpperCase()}) = ${finalP.toFixed(0)} DH</div><script>setTimeout(()=>{window.print();window.close()},500)<\/script></body></html>`;
    const iframe = document.createElement('iframe'); iframe.style.position='fixed'; iframe.style.width='0'; iframe.style.height='0'; iframe.style.border='0'; document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document; if(doc){ doc.open(); doc.write(html); doc.close(); }
    setTimeout(()=>{ try{document.body.removeChild(iframe)}catch{} }, 5000);
  };

  const printDoubleTicket = (cmd:any) => {
    const totalReel = cmd.items.reduce((s:number,it:any)=> s + Number(it.prix||0)*(it.qte||it.quantite||1), 0);
    const method = selectedMethod[cmd.id] || 'espece';
    const percent = remiseMap[cmd.id] || 0;
    const remiseMontant = method==='offert'? totalReel : method==='remise'? totalReel*percent/100 : 0;
    const totalFinal = totalReel - remiseMontant;
    const date = new Date().toLocaleString('fr-FR');
    const itemsRows = cmd.items?.map((it:any)=> `<div style="display:flex;justify-content:space-between"><span>${it.qte||1}x ${it.menu_nom||it.nom}</span><span>${(Number(it.prix||0)*(it.qte||1)).toFixed(0)} DH</span></div>`).join('') || '';
    const ticket = (copy:string) => `<div style="width:72mm;padding:5mm;font-family:monospace"><center><h2>MARSILIA FOOD</h2><div>${date}</div><div style="border:1px dashed black;padding:5px">Table ${cmd.table_numero} - ${copy}</div></center><hr>${itemsRows}<hr><div>TOTAL: ${totalFinal.toFixed(0)} DH - ${method.toUpperCase()}</div></div>`;
    const html = `<html><head><style>@page{size:80mm auto;margin:0}body{margin:0}</style></head><body>${ticket('CLIENT')}<div style="page-break-after:always"></div>${ticket('CAISSE')}<script>setTimeout(()=>{window.print();window.close()},500)<\/script></body></html>`;
    const iframe = document.createElement('iframe'); iframe.style.position='fixed'; iframe.style.width='0'; iframe.style.height='0'; iframe.style.border='0'; document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document; if(doc){ doc.open(); doc.write(html); doc.close(); }
    setTimeout(()=>{ try{document.body.removeChild(iframe)}catch{} }, 7000);
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
      const itemsMap:any={}; (items||[]).forEach((it:any)=>{ if(it.statut==='paye') return; (itemsMap[it.commande_id]=itemsMap[it.commande_id]||[]).push(it); });
      const tableMap:any={}; tables.forEach((t:any)=>{ tableMap[t.id]=t; });
      const result = finalCmds.map((c:any)=>({...c, items: itemsMap[c.id]||[], table_numero: c.table_id? tableMap[c.table_id]?.numero?? '?' : '?'}))
   .filter((c:any)=> c.items.length>0);
      setCommandes(result);
    } else setCommandes([]);
    setLoading(false);
  }, []);

  useEffect(()=>{ load(); const i=setInterval(load,4000); return()=>clearInterval(i); },[load]);

  const handlePayTotal = async (cmd:any) => {
    if(paying) return;
    const totalReel = cmd.items.reduce((s:number,it:any)=> s + Number(it.prix||0)*(it.qte||it.quantite||1), 0);
    if(!confirm(`Table ${cmd.table_numero} TOTAL ${totalReel.toFixed(0)} DH?`)) return;
    setPaying(cmd.id);
    const method = selectedMethod[cmd.id] || 'espece';
    const percent = remiseMap[cmd.id] || 0;
    let remiseMontant = 0; let totalFinal = totalReel;
    if(method==='offert'){ remiseMontant=totalReel; totalFinal=0; }
    else if(method==='remise'){ remiseMontant = totalReel * percent / 100; totalFinal = totalReel - remiseMontant; }
    setCommandes(prev => prev.filter(c=>c.id!==cmd.id));
    try {
      await supabase.from('commandes').update({ statut:'paye', total:totalReel, total_final:totalFinal, payment_method:method, remise:remiseMontant, remise_percent:percent, paye_at:new Date().toISOString() }).eq('id', cmd.id);
      if(cmd.table_id){
        const {data:remaining}=await supabase.from('commandes').select('id').eq('table_id',cmd.table_id).in('statut',['en_attente','en_preparation','pret','prete','ready']).neq('id',cmd.id);
        if(!remaining || remaining.length===0) await supabase.from('tables').update({statut:'libre'}).eq('id',cmd.table_id);
      }
      setTimeout(()=>printDoubleTicket(cmd), 600);
    } catch(e:any){ alert('Erreur: '+e.message); load(); }
    setPaying(null);
  };

  const handlePayMixteTotal = async (cmd:any) => {
    if(paying) return;
    let totalGeneral = 0;
    cmd.items.forEach((it:any)=>{
      const key = `${cmd.id}-${it.id}`;
      const m = itemMethods[key] || 'espece';
      const p = itemRemises[key] || 0;
      const prix = Number(it.prix||0)*(it.qte||it.quantite||1);
      const finalP = m==='offert'?0: m==='remise'? prix - prix*p/100 : prix;
      totalGeneral+=finalP;
    });
    if(!confirm(`TICKET UNIQUE MIXTE Table ${cmd.table_numero}?\nTotal: ${totalGeneral.toFixed(0)} DH\n${cmd.items.map((it:any)=>{const k=`${cmd.id}-${it.id}`; return `${it.menu_nom||it.nom}: ${itemMethods[k]||'espece'}`}).join('\n')}`)) return;
    setPaying(cmd.id);
    try {
      for(const it of cmd.items){
        const key = `${cmd.id}-${it.id}`;
        const m = itemMethods[key] || 'espece';
        const p = itemRemises[key] || 0;
        await supabase.from('commande_items').update({ statut:'paye', payment_method:m, remise_percent:p, paye_at:new Date().toISOString() }).eq('id', it.id);
      }
      await supabase.from('commandes').update({ statut:'paye', total:totalGeneral, total_final:totalGeneral, payment_method:'mixte', paye_at:new Date().toISOString() }).eq('id', cmd.id);
      if(cmd.table_id){
        const {data:remaining}=await supabase.from('commandes').select('id').eq('table_id',cmd.table_id).in('statut',['en_attente','en_preparation','pret','prete','ready']).neq('id',cmd.id);
        if(!remaining || remaining.length===0) await supabase.from('tables').update({statut:'libre'}).eq('id',cmd.table_id);
      }
      setCommandes(prev => prev.filter(c=>c.id!==cmd.id));
      printTicketMixte(cmd);
      load();
    } catch(e:any){ alert('Erreur: '+e.message); load(); }
    setPaying(null);
  };

  const handlePaySingleArticle = async (cmd:any, item:any) => {
    const key = `${cmd.id}-${item.id}`;
    const method = itemMethods[key] || 'espece';
    const percent = itemRemises[key] || 0;
    const prix = Number(item.prix||0)*(item.qte||item.quantite||1);
    let totalFinal = prix;
    if(method==='offert') totalFinal=0;
    else if(method==='remise') totalFinal = prix - prix*percent/100;
    if(!confirm(`Tkhallas "${item.menu_nom||item.nom}" = ${totalFinal.toFixed(0)} DH (${method})?`)) return;
    setPaying(key);
    try {
      await supabase.from('commande_items').update({ statut:'paye', payment_method:method, remise_percent:percent, paye_at:new Date().toISOString() }).eq('id', item.id);
      const remainingItems = cmd.items.filter((it:any)=> it.id!==item.id);
      const remainingTotal = remainingItems.reduce((s:number,it:any)=> s + Number(it.prix||0)*(it.qte||it.quantite||1), 0);
      if(remainingTotal>0){ await supabase.from('commandes').update({ total: remainingTotal }).eq('id', cmd.id); }
      else { await supabase.from('commandes').update({ statut:'paye' }).eq('id', cmd.id); if(cmd.table_id) await supabase.from('tables').update({statut:'libre'}).eq('id',cmd.table_id); }
      printTicketSingle(cmd, item, method, percent);
      load();
    } catch(e:any){ alert('Erreur: '+e.message); }
    setPaying(null);
  };

  if(loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <div className="sticky top-0 z-30 bg-[#0A0A0A]/95 border-b border-gray-800 px-4 py-3 flex justify-between max-w-4xl mx-auto">
        <div className="flex items-center gap-2"><DollarSign className="w-6 h-6 text-orange-500" /><h2 className="text-white font-bold">Caisse - {commandes.length}</h2></div>
        <div className="flex gap-2">
          <button onClick={changeCode} className="bg-zinc-800 text-white px-2 py-1 rounded-lg text-xs flex items-center gap-1"><Settings className="w-3 h-3"/>Code</button>
          <button onClick={load} className="bg-zinc-800 text-white px-3 py-1 rounded-lg text-xs">Refresh</button>
          <button onClick={onLogout} className="bg-white text-black px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1"><LogOut className="w-3 h-3"/>Logout</button>
        </div>
      </div>
      <div className="p-4 max-w-4xl mx-auto space-y-4">
        {commandes.length===0? <div className="text-center py-20 text-gray-600">Khawya ✅</div> : commandes.map((c:any)=>{
          const mode = modePaiement[c.id] || 'total';
          const methodTotal = selectedMethod[c.id] || 'espece';
          const percentTotal = remiseMap[c.id] || 0;
          const totalReel = c.items.reduce((s:number,it:any)=> s + Number(it.prix||0)*(it.qte||it.quantite||1), 0);
          const totalFinal = methodTotal==='offert'?0: methodTotal==='remise'? totalReel - totalReel*percentTotal/100 : totalReel;
          const totalMixte = c.items.reduce((s:number,it:any)=>{const k=`${c.id}-${it.id}`; const m=itemMethods[k]||'espece'; const p=itemRemises[k]||0; const prix=Number(it.prix||0)*(it.qte||1); return s + (m==='offert'?0:m==='remise'?prix-prix*p/100:prix);},0);
          return (
          <div key={c.id} className="bg-[#1A1A1A] rounded-2xl p-4 border border-gray-800">
            <div className="flex justify-between mb-3"><div><div className="text-white font-bold text-lg">Table {c.table_numero} - {c.statut}</div><div className="text-xs text-gray-400">{c.items.length} articles - {totalReel.toFixed(0)} DH</div></div><div className="flex gap-2"><button onClick={()=>setModePaiement({...modePaiement,[c.id]:'total'})} className={`text-[10px] px-3 py-1 rounded-full font-bold ${mode==='total'?'bg-white text-black':'bg-zinc-800 text-gray-400'}`}>TOTAL</button><button onClick={()=>setModePaiement({...modePaiement,[c.id]:'articles'})} className={`text-[10px] px-3 py-1 rounded-full font-bold ${mode==='articles'?'bg-orange-500 text-white':'bg-zinc-800 text-gray-400'}`}>MIXTE</button></div></div>

            {mode==='total'? (
              <>
                <div className="bg-black/50 rounded-xl p-2 mb-3 text-xs text-gray-300">{c.items.map((it:any)=> `${it.qte||1}x ${it.menu_nom||it.nom}`).join(' + ')}</div>
                <div className="grid grid-cols-5 gap-2 mb-2">
                  <button onClick={()=>setSelectedMethod({...selectedMethod,[c.id]:'espece'})} className={`py-2 rounded-xl text-[11px] font-bold ${methodTotal==='espece'?'bg-white text-black':'bg-green-600 text-white'}`}>ESPECE</button>
                  <button onClick={()=>setSelectedMethod({...selectedMethod,[c.id]:'tpe'})} className={`py-2 rounded-xl text-[11px] font-bold ${methodTotal==='tpe'?'bg-white text-black':'bg-blue-600 text-white'}`}>TPE</button>
                  <button onClick={()=>setSelectedMethod({...selectedMethod,[c.id]:'cheque'})} className={`py-2 rounded-xl text-[11px] font-bold ${methodTotal==='cheque'?'bg-white text-black':'bg-purple-600 text-white'}`}>CHEQUE</button>
                  <button onClick={()=>setSelectedMethod({...selectedMethod,[c.id]:'offert'})} className={`py-2 rounded-xl text-[11px] font-bold ${methodTotal==='offert'?'bg-white text-black':'bg-orange-600 text-white'}`}>OFFERT</button>
                  <button onClick={()=>{const code=prompt(`Code Patron?`); if(code!==getCode()) return alert('Code ghalat!'); setShowRemiseFor(c.id);}} className="py-2 rounded-xl text-[11px] font-bold bg-zinc-800 border-2 border-yellow-500 text-yellow-400">REMISE</button>
                </div>
                {showRemiseFor===c.id && <div className="bg-black border-2 border-yellow-600 rounded-xl p-3 mb-3"><div className="grid grid-cols-4 gap-2 mb-2">{[5,10,15,20,25,30,40,50].map(p=><button key={p} onClick={()=>{setSelectedMethod({...selectedMethod,[c.id]:'remise'}); setRemiseMap({...remiseMap,[c.id]:p}); setShowRemiseFor(null)}} className="bg-yellow-600 text-white py-2 rounded-lg font-bold">{p}%</button>)}</div><div className="flex gap-2"><input type="number" value={customRemise} onChange={e=>setCustomRemise(e.target.value)} className="flex-1 bg-zinc-900 border border-yellow-600 rounded-xl px-3 py-2 text-white text-center"/><button onClick={()=>{const p=parseFloat(customRemise); setSelectedMethod({...selectedMethod,[c.id]:'remise'}); setRemiseMap({...remiseMap,[c.id]:p}); setShowRemiseFor(null);}} className="bg-white text-black px-4 rounded-xl font-black">OK</button></div></div>}
                <button onClick={()=>handlePayTotal(c)} disabled={paying===c.id} className="w-full py-3 rounded-xl font-bold bg-green-600 text-white">PAYER TOTAL {totalFinal.toFixed(0)} DH ({methodTotal.toUpperCase()})</button>
              </>
            ) : (
              <div className="space-y-3">
                {c.items?.map((it:any)=>{
                  const key = `${c.id}-${it.id}`;
                  const m = itemMethods[key] || 'espece';
                  const p = itemRemises[key] || 0;
                  const prix = Number(it.prix||0)*(it.qte||it.quantite||1);
                  const finalP = m==='offert'?0: m==='remise'? prix - prix*p/100 : prix;
                  return (
                    <div key={it.id} className="bg-black rounded-xl p-3 border border-zinc-800">
                      <div className="flex justify-between mb-2"><span className="text-white font-bold text-sm">{it.qte||1}x {it.menu_nom||it.nom}</span><span className="text-orange-400 font-black">{finalP.toFixed(0)} DH {p>0?`(-${p}%)`:''} - {m.toUpperCase()}</span></div>
                      <div className="grid grid-cols-5 gap-1 mb-2">
                        <button onClick={()=>setItemMethods({...itemMethods,[key]:'espece'})} className={`py-2 rounded-lg text-[10px] font-bold ${m==='espece'?'bg-white text-black':'bg-green-700 text-white'}`}>ESP</button>
                        <button onClick={()=>setItemMethods({...itemMethods,[key]:'tpe'})} className={`py-2 rounded-lg text-[10px] font-bold ${m==='tpe'?'bg-white text-black':'bg-blue-700 text-white'}`}>TPE</button>
                        <button onClick={()=>setItemMethods({...itemMethods,[key]:'cheque'})} className={`py-2 rounded-lg text-[10px] font-bold ${m==='cheque'?'bg-white text-black':'bg-purple-700 text-white'}`}>CHQ</button>
                        <button onClick={()=>setItemMethods({...itemMethods,[key]:'offert'})} className={`py-2 rounded-lg text-[10px] font-bold ${m==='offert'?'bg-white text-black':'bg-orange-600 text-white'}`}>OFF</button>
                        <button onClick={()=>{
                          const code=prompt(`Code Patron pour ${it.menu_nom}?`);
                          if(code!==getCode()) return alert('Code ghalat!');
                          const perc = prompt('Pourcentage remise? ex: 10');
                          const val = parseFloat(perc||'0');
                          if(!val) return;
                          setItemMethods({...itemMethods,[key]:'remise'});
                          setItemRemises({...itemRemises,[key]:val});
                        }} className={`py-2 rounded-lg text-[10px] font-bold ${m==='remise'?'bg-white text-black':'bg-yellow-700 text-white border border-yellow-500'}`}>-{p||'%'}</button>
                      </div>
                      <button onClick={()=>handlePaySingleArticle(c,it)} disabled={paying===key} className="w-full py-2 rounded-lg font-bold bg-zinc-800 text-white text-xs border border-zinc-700">
                        {paying===key?'...':`Payer cet article seul = ${finalP.toFixed(0)} DH`}
                      </button>
                    </div>
                  )
                })}
                <button onClick={()=>handlePayMixteTotal(c)} disabled={paying===c.id} className="w-full mt-2 py-4 rounded-xl font-black bg-white text-black text-[13px] border-2 border-orange-500 shadow-lg">
                  🧾 TICKET UNIQUE MIXTE = {totalMixte.toFixed(0)} DH
                </button>
                <div className="text-[10px] text-gray-400 text-center">Ticket wa7da fiha: {c.items.map((it:any)=>{const k=`${c.id}-${it.id}`; return `${it.menu_nom||'Art'}(${itemMethods[k]||'ESP'})`}).join(' + ')}</div>
              </div>
            )}
          </div>
        )})}
      </div>
    </div>
  );
}
