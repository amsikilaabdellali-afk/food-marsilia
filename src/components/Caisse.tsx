import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { DollarSign, Printer } from 'lucide-react';

export default function Caisse() {
  const [commandes, setCommandes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<Record<string, any>>({});
  const [remiseMap, setRemiseMap] = useState<Record<string, number>>({});
  const [showRemiseFor, setShowRemiseFor] = useState<string | null>(null);
  const OWNER_CODE = '1234';

  // PRINT MA KAY-BLOKICH - try/catch + iframe
  const printDoubleTicket = (cmd:any) => {
    try {
      const totalReel = Number(cmd.total||cmd.total_final||0);
      const method = selectedMethod[cmd.id] || 'espece';
      const percent = remiseMap[cmd.id] || 0;
      const remiseMontant = method==='offert'? totalReel : method==='remise'? totalReel*percent/100 : 0;
      const totalFinal = totalReel - remiseMontant;
      const date = new Date().toLocaleString('fr-FR');

      const ticket = (copy:string) => `
        <div style="width:300px;padding:10px;font-family:monospace;border:1px dashed black;margin-bottom:20px;">
          <center><h2 style="margin:0;">Marsilia Food</h2><p style="font-size:11px;">${copy}</p><p style="font-size:10px;">${date}</p>
          <p style="border-top:1px dashed black;border-bottom:1px dashed black;padding:5px 0;">Table: ${cmd.table_numero||'N/A'}</p></center>
          <div style="margin:10px 0;font-size:12px;">${cmd.items.length? cmd.items.map((it:any)=>`${it.qte||1}x ${it.menu_nom||it.nom} - ${(it.qte||1)*Number(it.prix||0)} DH`).join('<br>') : `Total: ${totalReel} DH`}</div>
          <div style="border-top:1px dashed black;padding-top:5px;font-weight:bold;">NET: ${totalFinal} DH - ${method}</div>
        </div>`;

      // Tari9a li kat-khdem f mobile - iframe
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
      const doc = iframe.contentWindow?.document;
      if(doc){
        doc.open();
        doc.write(`<html><body>${ticket('CLIENT COPY 1')}<div style="text-align:center;margin:15px 0;">✂️ COUPER ✂️</div>${ticket('ARCHIVE COPY 2')}<script>setTimeout(()=>{window.print();},300); setTimeout(()=>{window.parent.document.body.removeChild(window.frameElement)},2000);<\/script></body></html>`);
        doc.close();
      } else {
        // Fallback - 7al window 3adi bla print auto
        const win = window.open('', '_blank');
        if(win){
          win.document.write(`${ticket('CLIENT')}${ticket('ARCHIVE')}`);
          win.document.close();
        }
      }
    } catch(e){
      console.log('Print error ignored:', e);
      // Ma n-blocki-walou - print machi mohim 9ed ma mohim y-t7ayad
    }
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
      let tables:any[]=[];
      if(tableIds.length){ const {data} = await supabase.from('tables').select('*').in('id', tableIds); tables=data||[]; }
      const itemsMap:any={}; (items||[]).forEach((it:any)=>{ (itemsMap[it.commande_id]=itemsMap[it.commande_id]||[]).push(it); });
      const tableMap:any={}; tables.forEach((t:any)=>{ tableMap[t.id]=t; });
      const result = finalCmds.map((c:any)=>({...c, items: itemsMap[c.id]||[], table_numero: c.table_id? tableMap[c.table_id]?.numero?? c.table_numero?? null : c.table_numero?? null }));
      setCommandes(result);
    } else setCommandes([]);
    setLoading(false);
  }, []);

  useEffect(()=>{ load(); const i=setInterval(load,4000); return()=>clearInterval(i); },[load]);

  const handlePay = async (cmd:any) => {
    if(paying) return;
    setPaying(cmd.id);
    const totalReel = Number(cmd.total||cmd.total_final||0);
    const method = selectedMethod[cmd.id] || 'espece';
    const percent = remiseMap[cmd.id] || 0;
    let remiseMontant = 0; let totalFinal = totalReel;
    if(method==='offert'){ remiseMontant=totalReel; totalFinal=0; }
    else if(method==='remise'){ remiseMontant = totalReel * percent / 100; totalFinal = totalReel - remiseMontant; }

    // 1. 7ayad mn UI direct
    setCommandes(prev => prev.filter(c=>c.id!==cmd.id));

    // 2. Sift l base - hada howa mohim
    try {
      const { error } = await supabase.from('commandes').update({
        statut:'paye', total:totalReel, total_final:totalFinal, payment_method:method, remise:remiseMontant, remise_percent:percent, paye_at:new Date().toISOString()
      }).eq('id', cmd.id);

      if(error) throw error;

      if(cmd.table_id){
        const {data:remaining}=await supabase.from('commandes').select('id').eq('table_id',cmd.table_id).in('statut',['en_attente','en_preparation','pret','prete']).neq('id',cmd.id);
        if(!remaining || remaining.length===0) await supabase.from('tables').update({statut:'libre'}).eq('id',cmd.table_id);
      }

      // 3. Print mor ma t-paya - ila fchal print ma kay-raja3ch commande
      setTimeout(()=>printDoubleTicket(cmd), 500);

    } catch(e:any){
      console.error(e);
      alert('❌ Erreur DB: '+e.message+'\n\nKhassk dir SQL li fo9!');
      load(); // raj3o
    }
    setPaying(null); setShowRemiseFor(null);
  };

  if(loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <div className="sticky top-0 z-30 bg-[#0A0A0A]/95 border-b border-gray-800 px-4 py-3 flex justify-between max-w-4xl mx-auto">
        <div className="flex items-center gap-2"><DollarSign className="w-6 h-6 text-orange-500" /><h2 className="text-white font-bold">Caisse - {commandes.length} à encaisser</h2></div>
        <button onClick={load} className="bg-zinc-800 text-white px-3 py-1 rounded-lg text-xs">Refresh</button>
      </div>
      <div className="p-4 max-w-4xl mx-auto space-y-3">
        {commandes.length===0? <div className="text-center py-20 text-gray-600">Khawya ✅ - ga3 t-khalsou!</div> : commandes.map((c:any)=>{
          const totalReel = Number(c.total||c.total_final||0);
          const method = selectedMethod[c.id] || 'espece';
          const percent = remiseMap[c.id] || 0;
          const totalFinal = method==='offert'?0: method==='remise'? totalReel - totalReel*percent/100 : totalReel;
          return (
          <div key={c.id} className="bg-[#1A1A1A] rounded-2xl p-4 border border-gray-800">
            <div className="flex justify-between mb-2">
              <div><div className="text-white font-bold">Table {c.table_numero||'?'} - {c.statut}</div><div className="text-gray-500 text-xs">Total BD: {totalReel} DH {c.items.length===0?'⚠️ 0 art': `${c.items.length} art`}</div></div>
              <div className="text-right"><div className="text-xl font-black text-orange-500">{totalFinal} DH</div><button onClick={()=>printDoubleTicket(c)} className="text-[10px] bg-zinc-800 px-2 py-1 rounded flex items-center gap-1 mt-1"><Printer className="w-3 h-3"/>TEST PRINT 2x</button></div>
            </div>
            <div className="grid grid-cols-5 gap-2 mb-2">
              <button onClick={()=>setSelectedMethod({...selectedMethod,[c.id]:'espece'})} className={`py-2.5 rounded-xl text-[11px] font-bold ${method==='espece'?'bg-white text-black':'bg-green-600 text-white'}`}>ESPECE</button>
              <button onClick={()=>setSelectedMethod({...selectedMethod,[c.id]:'tpe'})} className={`py-2.5 rounded-xl text-[11px] font-bold ${method==='tpe'?'bg-white text-black':'bg-blue-600 text-white'}`}>TPE</button>
              <button onClick={()=>setSelectedMethod({...selectedMethod,[c.id]:'cheque'})} className={`py-2.5 rounded-xl text-[11px] font-bold ${method==='cheque'?'bg-white text-black':'bg-purple-600 text-white'}`}>CHEQUE</button>
              <button onClick={()=>setSelectedMethod({...selectedMethod,[c.id]:'offert'})} className={`py-2.5 rounded-xl text-[11px] font-bold ${method==='offert'?'bg-white text-black':'bg-orange-600 text-white'}`}>OFFERT</button>
              <button onClick={()=>{const code=prompt('Code:'); if(code!=='1234') return; setShowRemiseFor(c.id)}} className="py-2.5 rounded-xl text-[11px] font-bold bg-zinc-800 border-2 border-yellow-500 text-yellow-400">REMISE</button>
            </div>
            {showRemiseFor===c.id && <div className="bg-black border border-yellow-600 rounded-xl p-3 mb-3 grid grid-cols-4 gap-2">{[10,20,30,50].map(p=><button key={p} onClick={()=>{setSelectedMethod({...selectedMethod,[c.id]:'remise'}); setRemiseMap({...remiseMap,[c.id]:p}); setShowRemiseFor(null)}} className="bg-yellow-600 text-white py-2 rounded-lg font-bold">{p}%</button>)}</div>}
            <button onClick={()=>handlePay(c)} disabled={paying===c.id} className="w-full py-3 rounded-xl font-bold bg-green-600 text-white">{paying===c.id?'...':'PAYER + IMPRIMER 2 TICKETS - '+totalFinal+' DH'}</button>
          </div>
        )})}
      </div>
    </div>
  );
}
