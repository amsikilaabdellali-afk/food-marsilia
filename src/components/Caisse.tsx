import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { DollarSign, Banknote, CreditCard, Gift, Receipt, Lock, Printer } from 'lucide-react';

export default function Caisse() {
  const [commandes, setCommandes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<Record<string, 'espece'|'tpe'|'cheque'|'offert'|'remise'>>({});
  const [remiseMap, setRemiseMap] = useState<Record<string, number>>({});
  const [showRemiseFor, setShowRemiseFor] = useState<string | null>(null);

  const OWNER_CODE = '1234';

  // === FONCTION LI KAT-TEB3A 2 TICKETS ===
  const printDoubleTicket = (cmd:any) => {
    const totalReel = cmd.items.length? cmd.items.reduce((s:any,it:any)=> s + Number(it.qte||it.quantite||1)*Number(it.prix||it.prix_unitaire||0),0) : Number(cmd.total||0);
    const method = selectedMethod[cmd.id] || 'espece';
    const percent = remiseMap[cmd.id] || 0;
    const remiseMontant = method==='offert'? totalReel : method==='remise'? totalReel*percent/100 : 0;
    const totalFinal = totalReel - remiseMontant;
    const date = new Date().toLocaleString('fr-FR');

    const itemsHtml = cmd.items.map((it:any)=> `
      <div style="display:flex; justify-content:space-between; font-size:12px; margin:3px 0;">
        <span>${it.qte||it.quantite||1}x ${it.menu_nom||it.nom}</span>
        <span>${((it.qte||1)*Number(it.prix||0)).toFixed(0)} DH</span>
      </div>
    `).join('');

    const ticketHtml = (copy:string) => `
      <div style="width:300px; padding:10px; font-family:monospace; border:1px dashed black; margin-bottom:20px;">
        <center>
          <h2 style="margin:0;">Marsilia Food</h2>
          <p style="margin:2px; font-size:11px;">${copy}</p>
          <p style="margin:2px; font-size:10px;">${date}</p>
          <p style="margin:5px 0; border-top:1px dashed black; border-bottom:1px dashed black; padding:5px 0;">
            Table: ${cmd.table_numero||'N/A'} | Serveur: ${cmd.serveur_nom||''}
          </p>
        </center>
        <div style="margin:10px 0;">${itemsHtml}</div>
        <div style="border-top:1px dashed black; padding-top:5px;">
          <div style="display:flex; justify-content:space-between; font-weight:bold;"><span>Total:</span><span>${totalReel} DH</span></div>
          ${remiseMontant>0? `<div style="display:flex; justify-content:space-between; color:red;"><span>${method==='offert'?'OFFERT':'Remise '+percent+'%'}:</span><span>-${remiseMontant.toFixed(0)} DH</span></div>` : ''}
          <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:16px; margin-top:5px;"><span>NET:</span><span>${totalFinal} DH</span></div>
          <div style="font-size:10px; margin-top:5px;">Paiement: ${method.toUpperCase()}</div>
        </div>
        <center style="margin-top:10px; font-size:10px;">Merci - Bssaha!</center>
      </div>
    `;

    const win = window.open('', '_blank', 'width=350,height=600');
    if(win){
      win.document.write(`
        <html><head><title>Tickets</title>
        <style>
          @media print { body{margin:0}.no-print{display:none} }
          body{display:flex; flex-direction:column; align-items:center;}
        </style>
        </head><body>
          ${ticketHtml('TICKET CLIENT - COPY 1')}
          <div style="border-top:2px solid black; margin:15px 0; width:100%; text-align:center; font-size:10px;">✂️ COUPER ICI ✂️</div>
          ${ticketHtml('TICKET CUISINE / ARCHIVE - COPY 2')}
          <script>window.onload=function(){window.print(); setTimeout(()=>window.close(),500)}</script>
        </body></html>
      `);
      win.document.close();
    }
  };

  const load = useCallback(async () => {
    const { data: cmds } = await supabase.from('commandes').select('*').in('statut', ['pret','prete','ready','prêt']).order('created_at', { ascending: false }).limit(200);
    let finalCmds = cmds || [];
    if(!finalCmds || finalCmds.length===0){
      const {data: all} = await supabase.from('commandes').select('*').neq('statut','paye').order('created_at',{ascending:false}).limit(50);
      if(all && all.length>0) finalCmds = all.filter(c=> c.statut!=='annulee');
    }
    if (finalCmds && finalCmds.length > 0) {
      const ids = finalCmds.map((c:any) => c.id);
      const tableIds = finalCmds.map((c:any) => c.table_id).filter(Boolean);
      const [{ data: items }, { data: tables }] = await Promise.all([
        supabase.from('commande_items').select('*').in('commande_id', ids),
        tableIds.length>0? supabase.from('tables').select('*').in('id', tableIds) : Promise.resolve({data: [] as any}),
      ]);
      const itemsMap: any = {}; (items||[]).forEach((it:any)=>{ (itemsMap[it.commande_id]=itemsMap[it.commande_id]||[]).push(it); });
      const tableMap: any = {}; (tables||[]).forEach((t:any)=>{ tableMap[t.id]=t; });
      const result = finalCmds.map((c:any)=>({...c, items: itemsMap[c.id]||[], table_numero: c.table_id? tableMap[c.table_id]?.numero?? c.table_numero?? null : c.table_numero?? null}));
      setCommandes(result);
    } else setCommandes([]);
    setLoading(false);
  }, []);

  useEffect(()=>{ load(); const i=setInterval(load,3000); return()=>clearInterval(i); },[load]);

  const handlePay = async (cmd: any) => {
    const method = selectedMethod[cmd.id] || 'espece';
    const percent = remiseMap[cmd.id] || 0;
    setPaying(cmd.id);
    const totalReel = cmd.items.length? cmd.items.reduce((s:any,it:any)=> s + Number(it.qte||it.quantite||1)*Number(it.prix||it.prix_unitaire||0),0) : Number(cmd.total||0);
    let remiseMontant = 0; let totalFinal = totalReel;
    if(method==='offert'){ remiseMontant=totalReel; totalFinal=0; }
    else if(method==='remise'){ remiseMontant = totalReel * percent / 100; totalFinal = totalReel - remiseMontant; }

    // 1. Tba3 2 tickets 9bel ma t-payer
    printDoubleTicket(cmd);

    // 2. Sift l base
    await supabase.from('commandes').update({
      statut:'paye', total:totalReel, total_final:totalFinal, payment_method:method, remise:remiseMontant, remise_percent: percent,
      paye_at:new Date().toISOString(), updated_at:new Date().toISOString()
    }).eq('id',cmd.id);

    if(cmd.table_id){
      const {data:remaining}=await supabase.from('commandes').select('id').eq('table_id',cmd.table_id).in('statut',['en_attente','en_preparation','pret','prete']).neq('id',cmd.id);
      if(!remaining || remaining.length===0) await supabase.from('tables').update({statut:'libre'}).eq('id',cmd.table_id);
    }
    setPaying(null); setShowRemiseFor(null);
    setTimeout(()=>load(), 1000);
  };

  const openRemise5 = (cmdId: string) => {
    const code = prompt('🔒 Code mol mahal:');
    if(code!==OWNER_CODE) return alert('Code ghalet!');
    setShowRemiseFor(cmdId);
  };

  if(loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <div className="sticky top-0 z-30 bg-[#0A0A0A]/95 border-b border-gray-800 px-4 py-3">
        <div className="flex items-center gap-2 max-w-4xl mx-auto justify-between">
          <div className="flex items-center gap-2"><DollarSign className="w-6 h-6 text-[#FF6B00]" /><h2 className="text-white font-bold">Caisse - {commandes.length} à encaisser</h2></div>
          <button onClick={load} className="bg-zinc-800 text-white px-3 py-1 rounded-lg text-xs">Refresh</button>
        </div>
      </div>

      <div className="p-4 max-w-4xl mx-auto space-y-3">
        {commandes.length===0? <div className="text-center py-20 text-gray-600">Khawya ✅</div> : commandes.map((c:any)=>{
          const totalReel = c.items.length? c.items.reduce((s:any,it:any)=> s + Number(it.qte||it.quantite||1)*Number(it.prix||it.prix_unitaire||0),0) : Number(c.total||0);
          const method = selectedMethod[c.id] || 'espece';
          const percent = remiseMap[c.id] || 0;
          const remiseMontant = method==='offert'? totalReel : method==='remise'? totalReel*percent/100 : 0;
          const totalFinal = totalReel - remiseMontant;
          return (
          <div key={c.id} className="bg-[#1A1A1A] rounded-2xl p-4 border border-gray-800">
            <div className="flex justify-between mb-2">
              <div><div className="text-white font-bold">Table {c.table_numero||'N/A'} - {c.statut}</div><div className="text-gray-500 text-xs">{c.serveur_nom||''} - {c.items.length} art</div></div>
              <div className="text-right">
                <div className="text-xl font-black text-[#FF6B00]">{totalFinal} DH</div>
                <button onClick={()=>printDoubleTicket(c)} className="text-[10px] bg-zinc-800 px-2 py-1 rounded flex items-center gap-1 mt-1"><Printer className="w-3 h-3"/>TEST PRINT 2x</button>
              </div>
            </div>
            <div className="space-y-1 mb-3 border-t border-gray-800 pt-2 text-sm">
              {c.items.map((it:any)=><div key={it.id} className="flex justify-between"><span className="text-gray-300">{it.qte||it.quantite||1}x {it.menu_nom||it.nom}</span><span className="text-gray-400">{((it.qte||1)*Number(it.prix||0)).toFixed(0)} DH</span></div>)}
            </div>

            <div className="grid grid-cols-5 gap-2 mb-2">
              <button onClick={()=>{setSelectedMethod({...selectedMethod,[c.id]:'espece'}); setRemiseMap({...remiseMap,[c.id]:0})}} className={`py-2.5 rounded-xl text-[11px] font-bold ${method==='espece'?'bg-white text-black ring-2 ring-green-500':'bg-green-600 text-white'}`}><Banknote className="w-4 h-4 mx-auto" />ESPECE</button>
              <button onClick={()=>{setSelectedMethod({...selectedMethod,[c.id]:'tpe'}); setRemiseMap({...remiseMap,[c.id]:0})}} className={`py-2.5 rounded-xl text-[11px] font-bold ${method==='tpe'?'bg-white text-black ring-2 ring-blue-500':'bg-blue-600 text-white'}`}><CreditCard className="w-4 h-4 mx-auto" />TPE</button>
              <button onClick={()=>{setSelectedMethod({...selectedMethod,[c.id]:'cheque'}); setRemiseMap({...remiseMap,[c.id]:0})}} className={`py-2.5 rounded-xl text-[11px] font-bold ${method==='cheque'?'bg-white text-black ring-2 ring-purple-500':'bg-purple-600 text-white'}`}><Receipt className="w-4 h-4 mx-auto" />CHEQUE</button>
              <button onClick={()=>{setSelectedMethod({...selectedMethod,[c.id]:'offert'}); setRemiseMap({...remiseMap,[c.id]:100})}} className={`py-2.5 rounded-xl text-[11px] font-bold ${method==='offert'?'bg-white text-black ring-2 ring-orange-500':'bg-orange-600 text-white'}`}><Gift className="w-4 h-4 mx-auto" />OFFERT</button>
              <button onClick={()=>openRemise5(c.id)} className={`py-2.5 rounded-xl text-[11px] font-bold bg-zinc-800 border-2 border-yellow-500 text-yellow-400`}><Lock className="w-3 h-3 mx-auto" />REMISE</button>
            </div>

            {showRemiseFor===c.id && (
              <div className="bg-black border border-yellow-600 rounded-xl p-3 mb-3">
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[10,20,30,50].map(p=><button key={p} onClick={()=>{setSelectedMethod({...selectedMethod,[c.id]:'remise'}); setRemiseMap({...remiseMap,[c.id]:p}); setShowRemiseFor(null)}} className="bg-yellow-600 text-white py-2 rounded-lg font-bold">{p}%</button>)}
                </div>
              </div>
            )}

            <button onClick={()=>handlePay(c)} disabled={paying===c.id} className="w-full py-3 rounded-xl font-bold bg-green-600 text-white flex items-center justify-center gap-2">
              <Printer className="w-4 h-4"/>{paying===c.id?'...':`PAYER + IMPRIMER 2 TICKETS - ${totalFinal} DH`}
            </button>
          </div>
        )})}
      </div>
    </div>
  );
      }
