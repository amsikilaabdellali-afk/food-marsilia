// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { DollarSign, Printer, Eye, EyeOff, Save } from 'lucide-react';

export default function Caisse() {
  const [commandes, setCommandes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<Record<string, any>>({});
  const [remiseMap, setRemiseMap] = useState<Record<string, number>>({});
  const [showRemiseFor, setShowRemiseFor] = useState<string | null>(null);

  // CODE LIBRE - PATRON YBADLO
  const [remiseCode, setRemiseCode] = useState(localStorage.getItem('remise_code') || 'MARSILIA2024');
  const [codeEdit, setCodeEdit] = useState(localStorage.getItem('remise_code') || 'MARSILIA2024');
  const [showCode, setShowCode] = useState(false);
  const [codeInputFor, setCodeInputFor] = useState<string | null>(null);
  const [codeInput, setCodeInput] = useState('');
  const [percentLibre, setPercentLibre] = useState<Record<string,string>>({});

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
      const result = finalCmds.map((c:any)=>({...c, items: itemsMap[c.id]||[], table_numero: c.table_id? tableMap[c.table_id]?.numero?? '?' : '?', table_etage: tableMap[c.table_id]?.etage?? ''}));
      setCommandes(result);
    } else setCommandes([]);
    try{ const {data: sett} = await supabase.from('settings').select('*').eq('cle','remise_code').single(); if(sett?.valeur){ setRemiseCode(sett.valeur); setCodeEdit(sett.valeur); localStorage.setItem('remise_code', sett.valeur); } }catch(e){}
    setLoading(false);
  }, []);
  useEffect(()=>{ load(); const i=setInterval(load,4000); return()=>clearInterval(i); },[load]);

  const saveCodeLibre = async()=>{
    if(!codeEdit || codeEdit.length<4) return alert('Code 9sir! Dir 4 minimum');
    localStorage.setItem('remise_code', codeEdit);
    setRemiseCode(codeEdit);
    try{ await supabase.from('settings').upsert({cle:'remise_code', valeur:codeEdit}); }catch(e){}
    alert(`Code t7afad: ${codeEdit}`);
  };

  const handlePay = async (cmd:any) => {
    if(paying) return; setPaying(cmd.id);
    const totalReel = Number(cmd.total||0);
    const method = selectedMethod[cmd.id] || 'espece';
    const percent = remiseMap[cmd.id] || 0;
    let remiseMontant = 0; let totalFinal = totalReel;
    if(method==='offert'){ remiseMontant=totalReel; totalFinal=0; }
    else if(method==='remise'){ remiseMontant = totalReel * percent / 100; totalFinal = totalReel - remiseMontant; }
    setCommandes(prev => prev.filter(c=>c.id!==cmd.id));
    try {
      const { error } = await supabase.from('commandes').update({ statut:'paye', total:totalReel, total_final:totalFinal, payment_method:method, remise:remiseMontant, remise_percent:percent, paye_at:new Date().toISOString() }).eq('id', cmd.id);
      if(error) throw error;
      if(cmd.table_id){ const {data:remaining}=await supabase.from('commandes').select('id').eq('table_id',cmd.table_id).in('statut',['en_attente','en_preparation','pret','prete','ready']).neq('id',cmd.id); if(!remaining || remaining.length===0) await supabase.from('tables').update({statut:'libre'}).eq('id',cmd.table_id); }
    } catch(e:any){ alert('Erreur: '+e.message); load(); }
    setPaying(null);
  };

  const verifyCode = (cmdId:string)=>{
    if(codeInput!==remiseCode){ alert('Code ghalat!'); return; }
    setCodeInputFor(null); setCodeInput(''); setShowRemiseFor(cmdId);
    setPercentLibre({...percentLibre, [cmdId]: String(remiseMap[cmdId]||'20')});
  };

  if(loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>;
    return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <div className="sticky top-0 z-30 bg-[#0A0A0A] border-b border-gray-800 px-4 py-3 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2"><DollarSign className="w-6 h-6 text-orange-500" /><h2 className="text-white font-bold">Caisse - {commandes.length}</h2></div>
          <button onClick={load} className="bg-zinc-800 text-white px-3 py-1 rounded-lg text-xs">Refresh</button>
        </div>
        {/* BOUTON LIBRE BACH YBADAL CODE */}
        <div className="bg-yellow-900/20 border-2 border-yellow-600/50 rounded-xl p-3 flex gap-2 items-center">
          <div className="flex-1">
            <div className="text-[10px] text-yellow-400 font-bold">CODE REMISE - PATRON YBADAL LIBRE</div>
            <div className="flex gap-1 mt-1">
              <input value={codeEdit} onChange={e=>setCodeEdit(e.target.value)} type={showCode?'text':'password'} placeholder="Code twil 7orof+ar9am" className="flex-1 bg-black border border-yellow-700 rounded-lg px-3 py-2 text-sm font-mono"/>
              <button onClick={()=>setShowCode(!showCode)} className="bg-zinc-800 p-2 rounded-lg">{showCode?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}</button>
            </div>
          </div>
          <button onClick={saveCodeLibre} className="bg-yellow-600 text-black px-4 py-3 rounded-xl font-black flex items-center gap-1"><Save className="w-4 h-4"/> SAUVER</button>
        </div>
      </div>

      {codeInputFor && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-2xl w-full max-w-sm border-2 border-yellow-600 p-5 space-y-4">
            <h3 className="font-black text-yellow-400">🔐 Dakhal Code</h3>
            <input value={codeInput} onChange={e=>setCodeInput(e.target.value)} type="password" placeholder="Code remise..." className="w-full bg-black border-2 border-yellow-600 rounded-xl px-4 py-3 font-mono text-center font-bold" autoFocus/>
            <div className="flex gap-2"><button onClick={()=>{setCodeInputFor(null); setCodeInput('')}} className="flex-1 bg-zinc-800 py-3 rounded-xl">Annuler</button><button onClick={()=>verifyCode(codeInputFor)} className="flex-1 bg-yellow-600 text-black py-3 rounded-xl font-black">Vérifier</button></div>
          </div>
        </div>
      )}

      <div className="p-4 max-w-4xl mx-auto space-y-3">
        {commandes.length===0? <div className="text-center py-20 text-gray-600">Khawya ✅</div> : commandes.map((c:any)=>{
          const totalReel = Number(c.total||0);
          const method = selectedMethod[c.id] || 'espece';
          const percent = remiseMap[c.id] || 0;
          const totalFinal = method==='offert'?0: method==='remise'? totalReel - totalReel*percent/100 : totalReel;
          return (
          <div key={c.id} className="bg-[#1A1A1A] rounded-2xl p-4 border border-gray-800">
            <div className="flex justify-between mb-2"><div><div className="text-white font-bold">Table {c.table_numero} {c.table_etage?`- ${c.table_etage}`:''}</div><div className="text-gray-400 text-xs mt-1">{c.items?.map((it:any)=> `${it.qte||1}x ${it.menu_nom||'Plat'}`).join(' + ')}</div></div><div className="text-xl font-black text-orange-500">{totalFinal.toFixed(0)} DH</div></div>
            <div className="grid grid-cols-5 gap-2 mb-2">
              <button onClick={()=>setSelectedMethod({...selectedMethod,[c.id]:'espece'})} className={`py-2.5 rounded-xl text-[11px] font-bold ${method==='espece'?'bg-white text-black':'bg-green-600'}`}>ESPECE</button>
              <button onClick={()=>setSelectedMethod({...selectedMethod,[c.id]:'tpe'})} className={`py-2.5 rounded-xl text-[11px] font-bold ${method==='tpe'?'bg-white text-black':'bg-blue-600'}`}>TPE</button>
              <button onClick={()=>setSelectedMethod({...selectedMethod,[c.id]:'cheque'})} className={`py-2.5 rounded-xl text-[11px] font-bold ${method==='cheque'?'bg-white text-black':'bg-purple-600'}`}>CHEQUE</button>
              <button onClick={()=>setSelectedMethod({...selectedMethod,[c.id]:'offert'})} className={`py-2.5 rounded-xl text-[11px] font-bold ${method==='offert'?'bg-white text-black':'bg-orange-600'}`}>OFFERT</button>
              <button onClick={()=>{setCodeInput(''); setCodeInputFor(c.id)}} className={`py-2.5 rounded-xl text-[11px] font-bold border-2 ${method==='remise'?'bg-yellow-500 text-black border-yellow-300':'bg-zinc-800 border-yellow-500 text-yellow-400'}`}>REMISE</button>
            </div>
            {showRemiseFor===c.id && (
              <div className="bg-black border-2 border-yellow-600 rounded-xl p-3 mb-3">
                <div className="text-xs text-yellow-400 font-black mb-2">POURCENTAGE LIBRE - Ktbo ay ra9m:</div>
                <div className="flex gap-2">
                  <input type="number" value={percentLibre[c.id]||''} onChange={e=>setPercentLibre({...percentLibre, [c.id]: e.target.value})} placeholder="Ex: 13, 27, 33" className="flex-1 bg-zinc-800 border border-yellow-600 rounded-xl px-4 py-3 text-center font-black text-xl" autoFocus/>
                  <span className="flex items-center font-black text-yellow-400 text-xl">%</span>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={()=>{ const p=Number(percentLibre[c.id]); if(!p||p<=0||p>=100) return alert('Dir 1-99%'); setRemiseMap({...remiseMap,[c.id]:p}); setSelectedMethod({...selectedMethod,[c.id]:'remise'}); setShowRemiseFor(null); }} className="flex-1 bg-yellow-600 text-black py-3 rounded-xl font-black">CONFIRMER {percentLibre[c.id]?`${percentLibre[c.id]}%`:''} → {(totalReel - totalReel*Number(percentLibre[c.id]||0)/100).toFixed(0)} DH</button>
                  <button onClick={()=>setShowRemiseFor(null)} className="bg-zinc-700 px-4 py-3 rounded-xl">X</button>
                </div>
              </div>
            )}
            <button onClick={()=>handlePay(c)} disabled={paying===c.id} className="w-full py-3 rounded-xl font-bold bg-green-600 text-white">{paying===c.id?'...':`PAYER ${totalFinal.toFixed(0)} DH (${method.toUpperCase()}${method==='remise'&&percent?` ${percent}%`:''})`}</button>
          </div>
        )})}
      </div>
    </div>
  );
}
