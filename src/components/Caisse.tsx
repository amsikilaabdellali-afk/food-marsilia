import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { DollarSign, CheckCircle2, Banknote, CreditCard, Gift, Receipt, Lock, Percent } from 'lucide-react';

export default function Caisse() {
  const [commandes, setCommandes] = useState<any[]>([]);
  const [payedToday, setPayedToday] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<Record<string, 'espece'|'tpe'|'cheque'|'offert'|'remise'>>({});
  const [remiseMap, setRemiseMap] = useState<Record<string, number>>({});
  const [showHisto, setShowHisto] = useState(false);
  const [showRemiseFor, setShowRemiseFor] = useState<string | null>(null);

  const OWNER_CODE = '1234'; // CODE MOL MAHAL

  const load = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data: cmds } = await supabase.from('commandes').select('*').in('statut', ['pret', 'paye']).order('created_at', { ascending: false }).limit(200);
    if (cmds && cmds.length > 0) {
      const ids = cmds.map((c:any) => c.id);
      const tableIds = cmds.map((c:any) => c.table_id).filter(Boolean);
      const [{ data: items }, { data: tables }] = await Promise.all([
        supabase.from('commande_items').select('*').in('commande_id', ids),
        tableIds.length>0? supabase.from('tables').select('*').in('id', tableIds) : Promise.resolve({data: [] as any}),
      ]);
      const itemsMap: any = {}; (items||[]).forEach((it:any)=>{ (itemsMap[it.commande_id]=itemsMap[it.commande_id]||[]).push(it); });
      const tableMap: any = {}; (tables||[]).forEach((t:any)=>{ tableMap[t.id]=t; });
      const result = cmds.map((c:any)=>({...c, items: itemsMap[c.id]||[], table_numero: c.table_id? tableMap[c.table_id]?.numero?? c.table_numero?? null : c.table_numero?? null})).filter((c:any)=> c.items.length>0);
      setCommandes(result.filter((c:any)=> c.statut==='pret'));
      setPayedToday(result.filter((c:any)=> c.statut==='paye' && c.paye_at && c.paye_at.startsWith(today)));
    } else { setCommandes([]); setPayedToday([]); }
    setLoading(false);
  }, []);

  useEffect(()=>{ load(); const i=setInterval(load,3000); return()=>clearInterval(i); },[load]);

  const handlePay = async (cmd: any) => {
    const method = selectedMethod[cmd.id] || 'espece';
    const percent = remiseMap[cmd.id] || 0;
    setPaying(cmd.id);
    const totalReel = cmd.items.reduce((s:any,it:any)=> s + Number(it.qte)*Number(it.prix),0);
    let remiseMontant = 0;
    let totalFinal = totalReel;
    if(method==='offert'){ remiseMontant=totalReel; totalFinal=0; }
    else if(method==='remise'){ remiseMontant = totalReel * percent / 100; totalFinal = totalReel - remiseMontant; }

    await supabase.from('commandes').update({
      statut:'paye', total:totalReel, total_final:totalFinal, payment_method:method, remise:remiseMontant, remise_percent: percent,
      paye_at:new Date().toISOString(), updated_at:new Date().toISOString()
    }).eq('id',cmd.id);

    if(cmd.table_id){
      const {data:remaining}=await supabase.from('commandes').select('id').eq('table_id',cmd.table_id).in('statut',['en_attente','en_preparation','pret']).neq('id',cmd.id);
      if(!remaining || remaining.length===0) await supabase.from('tables').update({statut:'libre'}).eq('id',cmd.table_id);
    }
    setPaying(null); setShowRemiseFor(null); load();
  };

  const openRemise = (cmdId: string) => {
    const code = prompt('🔒 CODE mol mahal - REMISE:');
    if(code!==OWNER_CODE) return alert('Code ghalet! Ghir mol mahal.');
    setShowRemiseFor(cmdId);
  };
  const openHisto = () => {
    const code = prompt('🔒 CODE mol mahal - HISTORIQUE:');
    if(code!==OWNER_CODE) return alert('Code ghalet!');
    setShowHisto(true);
  };

  if(loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <div className="sticky top-0 z-30 bg-[#0A0A0A]/95 border-b border-gray-800 px-4 py-3">
        <div className="flex items-center gap-2 max-w-4xl mx-auto">
          <DollarSign className="w-6 h-6 text-[#FF6B00]" /><h2 className="text-white font-bold">Caisse - {commandes.length}</h2>
          <button onClick={openHisto} className="ml-auto flex items-center gap-2 bg-zinc-900 border border-zinc-700 text-white px-4 py-2 rounded-xl text-xs font-bold"><Lock className="w-3 h-3" /> HISTORIQUE 🔒</button>
        </div>
      </div>

      <div className="p-4 max-w-4xl mx-auto space-y-3">
        {commandes.length===0? <div className="text-center py-20 text-gray-600">Khawya ✅ - Table 6 - 0DH m7ayda</div> : commandes.map((c:any)=>{
          const totalReel = c.items.reduce((s:any,it:any)=> s + Number(it.qte)*Number(it.prix),0);
          const method = selectedMethod[c.id] || 'espece';
          const percent = remiseMap[c.id] || 0;
          const remiseMontant = method==='offert'? totalReel : method==='remise'? totalReel*percent/100 : 0;
          const totalFinal = totalReel - remiseMontant;
          return (
          <div key={c.id} className="bg-[#1A1A1A] rounded-2xl p-4 border border-gray-800">
            <div className="flex justify-between mb-3">
              <div><div className="text-white font-bold text-lg">Table {c.table_numero||'N/A'}</div><div className="text-gray-500 text-xs">{c.serveur_nom} - {c.items.length} art - {new Date(c.created_at).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</div></div>
              <div className="text-right">
                {(method==='offert' || method==='remise') && <div className="text-zinc-500 line-through text-xs">{totalReel} DH</div>}
                <div className={`text-2xl font-black ${method==='offert'?'text-orange-400': method==='remise'?'text-yellow-400':'text-[#FF6B00]'}`}>{totalFinal.toFixed(0)} DH {method==='offert'?'🎁': method==='remise'?`(-${percent}%)`:''}</div>
              </div>
            </div>
            <div className="space-y-1 mb-3 border-t border-gray-800 pt-2">
              {c.items.map((it:any)=><div key={it.id} className="flex justify-between text-sm"><span className="text-gray-300">{it.qte}x {it.menu_nom}</span><span className="text-gray-400">{(it.qte*Number(it.prix)).toFixed(0)} DH</span></div>)}
              <div className="pt-2 border-t border-dashed border-gray-700 flex justify-between font-bold text-white text-sm"><span>Total réel</span><span>{totalReel} DH</span></div>
              {remiseMontant>0 && <div className="flex justify-between font-bold text-orange-400 text-sm"><span>{method==='offert'?'OFFERT - ZERO':'Remise '+percent+'%'}</span><span>-{remiseMontant.toFixed(0)} DH</span></div>}
              <div className="flex justify-between font-black text-green-400 text-sm"><span>Total encaissé</span><span>{totalFinal.toFixed(0)} DH</span></div>
            </div>
            <div className="grid grid-cols-5 gap-2 mb-3">
              <button onClick={()=>{setSelectedMethod({...selectedMethod,[c.id]:'espece'}); setRemiseMap({...remiseMap,[c.id]:0})}} className={`py-2.5 rounded-xl text-[11px] font-bold ${method==='espece'?'bg-white text-black ring-2 ring-green-500':'bg-green-600 text-white'}`}>ESPECE</button>
              <button onClick={()=>{setSelectedMethod({...selectedMethod,[c.id]:'tpe'}); setRemiseMap({...remiseMap,[c.id]:0})}} className={`py-2.5 rounded-xl text-[11px] font-bold ${method==='tpe'?'bg-white text-black ring-2 ring-blue-500':'bg-blue-600 text-white'}`}>TPE</button>
              <button onClick={()=>{setSelectedMethod({...selectedMethod,[c.id]:'cheque'}); setRemiseMap({...remiseMap,[c.id]:0})}} className={`py-2.5 rounded-xl text-[11px] font-bold ${method==='cheque'?'bg-white text-black ring-2 ring-purple-500':'bg-purple-600 text-white'}`}>CHEQUE</button>
              <button onClick={()=>{setSelectedMethod({...selectedMethod,[c.id]:'offert'}); setRemiseMap({...remiseMap,[c.id]:100})}} className={`py-2.5 rounded-xl text-[11px] font-bold ${method==='offert'?'bg-white text-black ring-2 ring-orange-500':'bg-orange-600 text-white'}`}>OFFERT 0DH</button>
              <button onClick={()=>openRemise(c.id)} className={`py-2.5 rounded-xl text-[11px] font-bold bg-zinc-800 border border-yellow-600 text-yellow-400 ${method==='remise'?'ring-2 ring-yellow-400':''}`}><Lock className="w-3 h-3 mx-auto" />REMISE 🔒</button>
            </div>

            {showRemiseFor===c.id && (
              <div className="bg-black border border-yellow-700 rounded-xl p-3 mb-3">
                <div className="text-yellow-400 text-xs font-bold mb-2">Choisir remise:</div>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[10,20,30,50].map(p=>(
                    <button key={p} onClick={()=>{setSelectedMethod({...selectedMethod,[c.id]:'remise'}); setRemiseMap({...remiseMap,[c.id]:p}); setShowRemiseFor(null)}} className="bg-yellow-600 text-white py-2 rounded-lg font-bold">{p}%</button>
                  ))}
                </div>
                <button onClick={()=>{const v=prompt('Pourcentage li bghiti (ex: 17):'); const n=Number(v); if(n>0 && n<=100){setSelectedMethod({...selectedMethod,[c.id]:'remise'}); setRemiseMap({...remiseMap,[c.id]:n}); setShowRemiseFor(null)}}} className="w-full bg-zinc-700 text-white py-2 rounded-lg text-xs">✏️ Autre % - kteb li bghiti (ay remise)</button>
              </div>
            )}

            <button onClick={()=>handlePay(c)} disabled={paying===c.id} className={`w-full py-3 rounded-xl font-bold ${method==='offert'?'bg-orange-600': method==='remise'?'bg-yellow-600':'bg-green-600'} text-white`}>
              {paying===c.id?'...': method==='offert'? `CONFIRMER OFFERT - 0DH (Reel ${totalReel}DH)` : method==='remise'? `PAYER ${totalFinal.toFixed(0)}DH - REMISE ${percent}%` : `PAYER ${totalFinal.toFixed(0)}DH - ${method.toUpperCase()}`}
            </button>
          </div>
        )})}
      </div>

      {showHisto && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col p-4">
          <div className="flex justify-between items-center mb-4"><h2 className="text-white font-black">HISTORIQUE 🔒</h2><button onClick={()=>setShowHisto(false)} className="bg-white text-black px-4 py-2 rounded-full font-bold">X</button></div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-zinc-900 p-3 rounded-xl"><div className="text-xs text-gray-500">ESPECE/TPE/CHEQUE</div><div className="text-green-400 font-bold">{payedToday.filter((c:any)=>['espece','tpe','cheque'].includes(c.payment_method)).reduce((s:any,c:any)=>s+Number(c.total_final||0),0)} DH</div></div>
            <div className="bg-zinc-900 p-3 rounded-xl border border-orange-900"><div className="text-xs text-gray-500">OFFERT/REMISE</div><div className="text-orange-400 font-bold">{payedToday.filter((c:any)=>['offert','remise'].includes(c.payment_method)).length} cmds</div><div className="text-[10px] text-gray-500">Perte {payedToday.filter((c:any)=>['offert','remise'].includes(c.payment_method)).reduce((s:any,c:any)=>s+Number(c.remise||0),0)}DH</div></div>
            <div className="bg-[#FF6B00] p-3 rounded-xl col-span-2"><div className="text-xs text-white/70">TOTAL ENCAISSÉ</div><div className="text-white font-black text-xl">{payedToday.reduce((s:any,c:any)=>s+Number(c.total_final||0),0)} DH</div></div>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2">
            {payedToday.map((c:any)=><div key={c.id} className="bg-zinc-900 p-3 rounded-xl text-sm"><div className="flex justify-between"><span className="text-gray-300">T{ c.table_numero} {c.payment_method?.toUpperCase()} {c.remise_percent?` ${c.remise_percent}%`:''} {c.payment_method==='offert'?`🎁 ${c.remise}->0DH`: c.payment_method==='remise'?`(-${Number(c.remise).toFixed(0)}DH)`:''}</span><span className={`font-bold ${c.payment_method==='offert'?'text-orange-400':'text-white'}`}>{Number(c.total_final||0)} DH</span></div><div className="text-[11px] text-gray-500">{c.items.map((it:any)=>`${it.qte}x ${it.menu_nom}`).join(', ')}</div></div>)}
          </div>
        </div>
      )}
    </div>
  );
            }
