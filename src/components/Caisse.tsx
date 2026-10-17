// @ts-nocheck
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { DollarSign, LogOut, Settings, Trash2, X, Wifi } from 'lucide-react';

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

  const [showScan, setShowScan] = useState<null | {action: string, cb: ()=>void}>(null);
  const [badgeInput, setBadgeInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const getPatronBadge = () => localStorage.getItem('patron_badge') || '';
  const getCode = () => localStorage.getItem('remise_code') || '1234';

  const enregistrerBadge = () => {
    setBadgeInput('');
    setShowScan({action: 'ENREGISTRER BRACELET PATRON - Qareb bracelet safar l lecteur', cb: ()=>{
      const id = badgeInput.trim();
      if(id && id.length>=3){
        localStorage.setItem('patron_badge', id);
        alert('Bracelet t-enregistra ✅\nID: '+id+'\nDaba howa li y7al OFFERT/REMISE/ANNULE');
      }
      setShowScan(null); setBadgeInput('');
    }});
    setTimeout(()=>inputRef.current?.focus(),200);
  };

  const verifierBadge = (): Promise<boolean> => {
    return new Promise((resolve)=>{
      const saved = getPatronBadge();
      setBadgeInput('');
      setShowScan({action: saved ? 'QAREB BRACELET SAFAR L LECTEUR' : 'AWAL MARRA - Qareb bracelet 0002355916', cb: ()=>{
        const val = badgeInput.trim();
        if(!saved){
          if(val.length>=3){
            localStorage.setItem('patron_badge', val);
            alert('Bracelet t-enregistra ✅\nID: '+val+'\nDaba howa patron');
            setShowScan(null); setBadgeInput('');
            resolve(true);
          } else {
            setShowScan(null); setBadgeInput('');
            resolve(false);
          }
        } else {
          const ok = val === saved || val === getCode() || val === '0002355916';
          if(!ok) alert('Bracelet ghalat! ❌\nScanniti: '+val+'\nKhass: '+saved);
          setShowScan(null); setBadgeInput('');
          resolve(ok);
        }
      }});
      setTimeout(()=>inputRef.current?.focus(),300);
    });
  };

  const changeCode = () => {
    const cur = getPatronBadge();
    if(cur && !confirm(`Badge kayn: ${cur}\nTbdlou?`)) return;
    enregistrerBadge();
  };

  useEffect(()=>{
    if(!showScan) return;
    const onKey = (e:any)=>{
      if(e.key==='Enter' && badgeInput.length>2){
        showScan.cb();
      }
    };
    window.addEventListener('keydown', onKey);
    return ()=>window.removeEventListener('keydown', onKey);
  },[showScan,badgeInput]);

  const printOneTicket = (innerHtml: string) => {
    const html = `<html><head><style>@page{size:80mm auto;margin:0}body{margin:0;padding:0;width:80mm;font-family:'Courier New',monospace;-webkit-print-color-adjust:exact}.ticket{width:72mm;padding:4mm;color:black;background:white}</style></head><body><div class="ticket">${innerHtml}<br><br><br><br><br><br></div><script>setTimeout(()=>{window.print();setTimeout(()=>window.close(),600)},300)<\/script></body></html>`;
    const iframe = document.createElement('iframe');
    iframe.style.position='fixed'; iframe.style.left='-9999px'; iframe.style.width='0'; iframe.style.height='0'; iframe.style.border='0';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if(doc){ doc.open(); doc.write(html); doc.close(); }
    setTimeout(()=>{ try{document.body.removeChild(iframe)}catch{} }, 4000);
  };

  const printTicketMixte = (cmd:any, methods:any, remises:any) => {
    const date = new Date().toLocaleString('fr-FR');
    let totalEspece = 0, totalTpe = 0, totalCheque = 0, totalOffert = 0, totalGeneral = 0;
    const rows = cmd.items.map((it:any)=>{
      const key = `${cmd.id}-${it.id}`;
      const m = methods[key] || 'espece';
      const p = remises[key] || 0;
      const prix = Number(it.prix||0)*(it.qte||1);
      const finalP = m==='offert'?0: m==='remise'? prix - prix*p/100 : prix;
      if(m==='espece') totalEspece+=finalP; else if(m==='tpe') totalTpe+=finalP; else if(m==='cheque') totalCheque+=finalP; else if(m==='offert') totalOffert+=prix;
      totalGeneral+=finalP;
      return `<div style="display:flex;justify-content:space-between;font-size:13px;font-weight:900;margin:6px 0;border-bottom:1px dotted #ccc;padding-bottom:3px"><span>${it.qte||1}x ${it.menu_nom||it.nom} <span style="font-size:10px">(${m.toUpperCase()}${p?` -${p}%`:''})</span></span><span>${finalP.toFixed(0)}</span></div>`;
    }).join('');
    const recap = `${totalEspece>0?`<div style="display:flex;justify-content:space-between;font-size:12px"><span>ESPECE:</span><b>${totalEspece.toFixed(0)} DH</b></div>`:''}${totalTpe>0?`<div style="display:flex;justify-content:space-between;font-size:12px"><span>TPE:</span><b>${totalTpe.toFixed(0)} DH</b></div>`:''}${totalCheque>0?`<div style="display:flex;justify-content:space-between;font-size:12px"><span>CHEQUE:</span><b>${totalCheque.toFixed(0)} DH</b></div>`:''}${totalOffert>0?`<div style="display:flex;justify-content:space-between;font-size:12px"><span>OFFERT:</span><b>${totalOffert.toFixed(0)} DH</b></div>`:''}`;
    const buildInner = (copy:string) => `<center><div style="font-size:18px;font-weight:900">MARSILIA FOOD</div><div style="font-size:10px">${date}</div><div style="border:2px dashed black;padding:5px;margin:8px 0;font-size:14px;font-weight:900">TABLE ${cmd.table_numero} - ${copy}<br>TICKET MIXTE</div></center><div style="border-top:2px dashed black;margin:6px 0"></div>${rows}<div style="border-top:2px dashed black;margin:6px 0"></div>${recap}<div style="display:flex;justify-content:space-between;font-size:16px;font-weight:900;border-top:2px solid black;margin-top:8px;padding-top:6px"><span>TOTAL:</span><span>${totalGeneral.toFixed(0)} DH</span></div>`;
    printOneTicket(buildInner('CLIENT'));
    setTimeout(()=> printOneTicket(buildInner('CAISSE')), 1800);
  };

  const printTicketTotal = (cmd:any, method:string, percent:number, totalFinal:number) => {
    const date = new Date().toLocaleString('fr-FR');
    const rows = cmd.items.map((it:any)=> `<div style="display:flex;justify-content:space-between;font-size:13px;margin:5px 0"><span>${it.qte||1}x ${it.menu_nom||it.nom}</span><span>${(Number(it.prix||0)*(it.qte||1)).toFixed(0)}</span></div>`).join('');
    const buildInner = (copy:string) => `<center><div style="font-size:18px;font-weight:900">MARSILIA FOOD</div><div style="font-size:10px">${date}</div><div style="border:2px dashed black;padding:5px;margin:8px 0;font-size:14px;font-weight:900">TABLE ${cmd.table_numero} - ${copy}<br>${method.toUpperCase()}${percent?` -${percent}%`:''}</div></center><div style="border-top:2px dashed black;margin:6px 0"></div>${rows}<div style="border-top:2px dashed black;margin:6px 0"></div><div style="display:flex;justify-content:space-between;font-size:16px;font-weight:900"><span>TOTAL:</span><span>${totalFinal.toFixed(0)} DH</span></div>`;
    printOneTicket(buildInner('CLIENT'));
    setTimeout(()=> printOneTicket(buildInner('CAISSE')), 1800);
  };

  const handleAnnuleCommande = async (cmd:any) => {
    const ok = await verifierBadge();
    if(!ok) return;
    if(!confirm(`TANNULI Table ${cmd.table_numero}?`)) return;
    setPaying(cmd.id);
    try {
      await supabase.from('commandes').update({ statut: 'annule' }).eq('id', cmd.id);
      if(cmd.table_id){
        const {data:remaining}=await supabase.from('commandes').select('id').eq('table_id',cmd.table_id).neq('statut','paye').neq('statut','annule').neq('id',cmd.id);
        if(!remaining || remaining.length===0) await supabase.from('tables').update({statut:'libre'}).eq('id',cmd.table_id);
      }
      setCommandes(prev => prev.filter(c=>c.id!==cmd.id));
    } catch(e:any){ alert('Erreur: '+e.message); }
    setPaying(null);
  };

  const handleAnnuleArticle = async (cmd:any, item:any) => {
    const ok = await verifierBadge();
    if(!ok) return;
    if(!confirm(`Tannuli ${item.qte}x ${item.menu_nom||item.nom}?`)) return;
    try {
      await supabase.from('commande_items').delete().eq('id', item.id);
      const newItems = cmd.items.filter((i:any)=>i.id!==item.id);
      if(newItems.length===0){
        await supabase.from('commandes').update({ statut: 'annule' }).eq('id', cmd.id);
        if(cmd.table_id) await supabase.from('tables').update({statut:'libre'}).eq('id',cmd.table_id);
        setCommandes(prev => prev.filter(c=>c.id!==cmd.id));
      } else {
        setCommandes(prev => prev.map(c=> c.id===cmd.id ? {...c, items: newItems} : c));
      }
    } catch(e:any){ alert('Erreur: '+e.message); }
  };

  const load = useCallback(async () => {
    const { data: cmds } = await supabase.from('commandes').select('*').in('statut', ['pret','prete','ready']).order('created_at', { ascending: false }).limit(100);
    let finalCmds = cmds || [];
    if(!finalCmds.length){
      const {data: all} = await supabase.from('commandes').select('*').neq('statut','paye').limit(100);
      if(all) finalCmds = all.filter(c=>c.statut!=='annule' && c.statut!=='annulee' && c.statut!=='paye');
    }
    if(finalCmds.length){
      const ids = finalCmds.map((c:any)=>c.id);
      const { data: items } = await supabase.from('commande_items').select('*').in('commande_id', ids);
      const tableIds = finalCmds.map((c:any)=>c.table_id).filter(Boolean);
      let tables:any[]=[]; if(tableIds.length){ const {data} = await supabase.from('tables').select('*').in('id', tableIds); tables=data||[]; }
      const itemsMap:any={}; (items||[]).forEach((it:any)=>{ (itemsMap[it.commande_id]=itemsMap[it.commande_id]||[]).push(it); });
      const tableMap:any={}; tables.forEach((t:any)=>{ tableMap[t.id]=t; });
      const result = finalCmds.map((c:any)=>({...c, items: itemsMap[c.id]||[], table_numero: c.table_id? tableMap[c.table_id]?.numero?? '?' : '?'}))
   .filter((c:any)=> c.items.length>0);
      setCommandes(result);
    } else setCommandes([]);
    setLoading(false);
  }, []);

  useEffect(()=>{ load(); },[load]);

  const handlePayTotal = async (cmd:any) => {
    if(paying) return;
    const totalReel = cmd.items.reduce((s:number,it:any)=> s + Number(it.prix||0)*(it.qte||1), 0);
    if(!confirm(`Table ${cmd.table_numero} TOTAL ${totalReel.toFixed(0)} DH?`)) return;
    setPaying(cmd.id);
    const method = selectedMethod[cmd.id] || 'espece';
    const percent = remiseMap[cmd.id] || 0;
    if(method==='offert' || method==='remise'){
      const ok = await verifierBadge();
      if(!ok){ setPaying(null); return; }
    }
    let totalFinal = totalReel;
    if(method==='offert') totalFinal=0;
    else if(method==='remise') totalFinal = totalReel - totalReel*percent/100;
    try {
      for(const it of cmd.items){
        await supabase.from('commande_items').update({ payment_method: method, remise_percent: percent, paye_at: new Date().toISOString() }).eq('id', it.id);
      }
      await supabase.from('commandes').update({ statut:'paye', total:totalReel, total_final:totalFinal, payment_method:method, remise_percent:percent, paye_at:new Date().toISOString() }).eq('id', cmd.id);
      if(cmd.table_id){
        const {data:remaining}=await supabase.from('commandes').select('id').eq('table_id',cmd.table_id).in('statut',['en_attente','en_preparation','pret','prete','ready']).neq('id',cmd.id);
        if(!remaining || remaining.length===0) await supabase.from('tables').update({statut:'libre'}).eq('id',cmd.table_id);
      }
      printTicketTotal(cmd, method, percent, totalFinal);
      setCommandes(prev => prev.filter(c=>c.id!==cmd.id));
    } catch(e:any){ alert('Erreur: '+e.message); load(); }
    setPaying(null);
  };

  const handlePayMixteTotal = async (cmd:any) => {
    if(paying) return;
    let needBadge = false;
    cmd.items.forEach((it:any)=>{
      const key = `${cmd.id}-${it.id}`;
      const m = itemMethods[key] || 'espece';
      if(m==='offert' || m==='remise') needBadge = true;
    });
    if(needBadge){
      const ok = await verifierBadge();
      if(!ok) return;
    }
    let totalGeneral = 0;
    cmd.items.forEach((it:any)=>{
      const key = `${cmd.id}-${it.id}`;
      const m = itemMethods[key] || 'espece';
      const p = itemRemises[key] || 0;
      const prix = Number(it.prix||0)*(it.qte||1);
      const finalP = m==='offert'?0: m==='remise'? prix - prix*p/100 : prix;
      totalGeneral+=finalP;
    });
    if(!confirm(`TICKET MIXTE Table ${cmd.table_numero} = ${totalGeneral.toFixed(0)} DH?`)) return;
    const savedMethods = {...itemMethods};
    const savedRemises = {...itemRemises};
    setPaying(cmd.id);
    try {
      for(const it of cmd.items){
        const key = `${cmd.id}-${it.id}`;
        const m = itemMethods[key] || 'espece';
        const p = itemRemises[key] || 0;
        await supabase.from('commande_items').update({ payment_method: m, remise_percent: p, paye_at: new Date().toISOString() }).eq('id', it.id);
      }
      await supabase.from('commandes').update({ statut:'paye', total: totalGeneral, total_final: totalGeneral, payment_method:'mixte', paye_at: new Date().toISOString() }).eq('id', cmd.id);
      if(cmd.table_id){
        const {data:remaining}=await supabase.from('commandes').select('id').eq('table_id',cmd.table_id).neq('statut','paye').neq('id',cmd.id);
        if(!remaining || remaining.length===0) await supabase.from('tables').update({statut:'libre'}).eq('id',cmd.table_id);
      }
      printTicketMixte(cmd, savedMethods, savedRemises);
      setCommandes(prev => prev.filter(c=>c.id!==cmd.id));
      setItemMethods({}); setItemRemises({});
    } catch(e:any){ alert('Erreur: '+e.message); }
    setPaying(null);
  };

  if(loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {showScan && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border-2 border-yellow-400 rounded-2xl p-6 w-full max-w-sm text-center">
            <div className="w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse"><Wifi className="w-12 h-12 text-black"/></div>
            <h3 className="font-black text-white text-base mb-2">{showScan.action}</h3>
            <p className="text-[11px] text-zinc-400 mb-3">Lecteur ghayktab bo7do - 0002355916</p>
            <input ref={inputRef} value={badgeInput} onChange={e=>setBadgeInput(e.target.value)} placeholder="0002355916" className="w-full bg-black border-2 border-yellow-400 rounded-xl p-4 text-center text-white font-black text-xl tracking-widest" autoFocus/>
            <div className="flex gap-2 mt-4">
              <button onClick={()=>{ setShowScan(null); setBadgeInput(''); }} className="flex-1 bg-zinc-800 py-3 rounded-xl font-bold">Annuler</button>
              <button onClick={()=>showScan.cb()} className="flex-1 bg-yellow-400 text-black py-3 rounded-xl font-black">Valider ✅</button>
            </div>
          </div>
        </div>
      )}

      <div className="sticky top-0 z-30 bg-[#0A0A0A]/95 border-b border-gray-800 px-4 py-3 flex justify-between max-w-4xl mx-auto">
        <div className="flex items-center gap-2"><DollarSign className="w-6 h-6 text-orange-500" /><h2 className="text-white font-bold">Caisse - {commandes.length}</h2></div>
        <div className="flex gap-2">
          <button onClick={changeCode} className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 font-black ${getPatronBadge()?'bg-yellow-400 text-black':'bg-red-600 text-white animate-pulse'}`}><Wifi className="w-4 h-4"/>{getPatronBadge()?'Badge '+getPatronBadge().substring(0,3)+'***':'BRACELET 🔒'}</button>
          <button onClick={load} className="bg-zinc-800 text-white px-3 py-1 rounded-lg text-xs">Refresh</button>
          <button onClick={onLogout} className="bg-white text-black px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1"><LogOut className="w-3 h-3"/>Logout</button>
        </div>
      </div>
      <div className="p-4 max-w-4xl mx-auto space-y-4">
        {commandes.length===0? <div className="text-center py-20 text-gray-600">Khawya ✅<br/><span className="text-xs mt-3 block">Bracelet dyalk: 0002355916 - Qarbo l lecteur</span></div> : commandes.map((c:any)=>{
          const mode = modePaiement[c.id] || 'total';
          const methodTotal = selectedMethod[c.id] || 'espece';
          const percentTotal = remiseMap[c.id] || 0;
          const totalReel = c.items.reduce((s:number,it:any)=> s + Number(it.prix||0)*(it.qte||1), 0);
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
                  <button onClick={async()=>{ const ok=await verifierBadge(); if(ok) setSelectedMethod({...selectedMethod,[c.id]:'offert'}); }} className={`py-2 rounded-xl text-[11px] font-bold border-2 ${methodTotal==='offert'?'bg-white text-black border-white':'bg-orange-600 text-white border-orange-400'}`}>OFFERT 📡</button>
                  <button onClick={async()=>{ const ok=await verifierBadge(); if(ok) setShowRemiseFor(c.id); }} className="py-2 rounded-xl text-[11px] font-bold bg-zinc-800 border-2 border-yellow-500 text-yellow-400">REMISE 📡</button>
                </div>
                {showRemiseFor===c.id && <div className="bg-black border-2 border-yellow-600 rounded-xl p-3 mb-3"><div className="grid grid-cols-4 gap-2 mb-2">{[5,10,15,20,25,30,40,50].map(p=><button key={p} onClick={()=>{setSelectedMethod({...selectedMethod,[c.id]:'remise'}); setRemiseMap({...remiseMap,[c.id]:p}); setShowRemiseFor(null)}} className="bg-yellow-600 text-white py-2 rounded-lg font-bold">{p}%</button>)}</div><div className="flex gap-2"><input type="number" value={customRemise} onChange={e=>setCustomRemise(e.target.value)} className="flex-1 bg-zinc-900 border border-yellow-600 rounded-xl px-3 py-2 text-white text-center"/><button onClick={()=>{const p=parseFloat(customRemise); setSelectedMethod({...selectedMethod,[c.id]:'remise'}); setRemiseMap({...remiseMap,[c.id]:p}); setShowRemiseFor(null);}} className="bg-white text-black px-4 rounded-xl font-black">OK</button></div></div>}
                <button onClick={()=>handlePayTotal(c)} disabled={paying===c.id} className="w-full py-3 rounded-xl font-bold bg-green-600 text-white">PAYER TOTAL {totalFinal.toFixed(0)} DH ({methodTotal.toUpperCase()})</button>
                <button onClick={()=>handleAnnuleCommande(c)} className="w-full mt-2 py-3 rounded-xl font-bold bg-red-900/50 border border-red-600 text-red-400 flex items-center justify-center gap-2"><Trash2 className="w-4 h-4"/>ANNULER 📡 BRACELET</button>
              </>
            ) : (
              <div className="space-y-3">
                {c.items?.map((it:any)=>{
                  const key = `${c.id}-${it.id}`;
                  const m = itemMethods[key] || 'espece';
                  const p = itemRemises[key] || 0;
                  const prix = Number(it.prix||0)*(it.qte||1);
                  const finalP = m==='offert'?0: m==='remise'? prix - prix*p/100 : prix;
                  return (
                    <div key={it.id} className="bg-black rounded-xl p-3 border border-zinc-800">
                      <div className="flex justify-between mb-2"><span className="text-white font-bold text-sm">{it.qte||1}x {it.menu_nom||it.nom}</span><span className="text-orange-400 font-black">{finalP.toFixed(0)} DH - {m.toUpperCase()} {p>0?`-${p}%`:''}</span></div>
                      <div className="grid grid-cols-6 gap-1 mb-2">
                        <button onClick={()=>setItemMethods({...itemMethods,[key]:'espece'})} className={`py-2 rounded-lg text-[10px] font-bold ${m==='espece'?'bg-white text-black':'bg-green-700 text-white'}`}>ESP</button>
                        <button onClick={()=>setItemMethods({...itemMethods,[key]:'tpe'})} className={`py-2 rounded-lg text-[10px] font-bold ${m==='tpe'?'bg-white text-black':'bg-blue-700 text-white'}`}>TPE</button>
                        <button onClick={()=>setItemMethods({...itemMethods,[key]:'cheque'})} className={`py-2 rounded-lg text-[10px] font-bold ${m==='cheque'?'bg-white text-black':'bg-purple-700 text-white'}`}>CHQ</button>
                        <button onClick={async()=>{ const ok=await verifierBadge(); if(ok) setItemMethods({...itemMethods,[key]:'offert'}); }} className={`py-2 rounded-lg text-[10px] font-bold ${m==='offert'?'bg-white text-black':'bg-orange-600 text-white'}`}>OFF 📡</button>
                        <button onClick={async()=>{
                          const ok=await verifierBadge();
                          if(!ok) return;
                          const perc = prompt('Pourcentage remise? ex: 10');
                          const val = parseFloat(perc||'0');
                          if(!val) return;
                          setItemMethods({...itemMethods,[key]:'remise'});
                          setItemRemises({...itemRemises,[key]:val});
                        }} className={`py-2 rounded-lg text-[10px] font-bold ${m==='remise'?'bg-white text-black':'bg-yellow-700 text-white border border-yellow-500'}`}>-{p||'%' } 📡</button>
                        <button onClick={()=>handleAnnuleArticle(c,it)} className="py-2 rounded-lg text-[10px] font-bold bg-red-700 text-white flex items-center justify-center"><X className="w-4 h-4"/></button>
                      </div>
                    </div>
                  )
                })}
                <button onClick={()=>handlePayMixteTotal(c)} disabled={paying===c.id} className="w-full mt-2 py-4 rounded-xl font-black bg-white text-black text-[13px] border-2 border-orange-500 shadow-lg">🧾 TICKET UNIQUE MIXTE = {totalMixte.toFixed(0)} DH - IMPRIMER</button>
                <button onClick={()=>handleAnnuleCommande(c)} className="w-full py-3 rounded-xl font-bold bg-red-900/50 border border-red-600 text-red-400 flex items-center justify-center gap-2"><Trash2 className="w-4 h-4"/>ANNULER 📡 BRACELET</button>
              </div>
            )}
          </div>
        )})}
      </div>
    </div>
  );
}
