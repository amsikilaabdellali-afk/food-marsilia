// @ts-nocheck
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

  const printDoubleTicket = (cmd:any) => {
    try {
      const totalReel = Number(cmd.total||cmd.total_final||0);
      const method = selectedMethod[cmd.id] || cmd.payment_method || 'espece';
      const percent = remiseMap[cmd.id] || cmd.remise_percent || 0;
      const remiseMontant = method==='offert'? totalReel : method==='remise'? totalReel*percent/100 : Number(cmd.remise||0);
      const totalFinal = totalReel - remiseMontant;
      const date = new Date().toLocaleString('fr-FR');

      const itemsList = cmd.items && cmd.items.length
       ? cmd.items.map((it:any)=>{
            const q = it.qte||1;
            const p = Number(it.prix||0);
            const nom = it.menu_nom||'Plat';
            return `<div style="display:flex; justify-content:space-between; margin:3px 0;"><span>${q}x ${nom}</span><span>${q}x${p} = ${(q*p).toFixed(0)} DH</span></div>`;
          }).join('')
        : `<div>Total: ${totalReel} DH</div>`;

      const ticketContent = (copy:string, num:string) => `
        <div style="width:100%; max-width:300px; margin:0 auto; padding:10px; font-family:monospace; font-size:12px;">
          <center>
            <h2 style="margin:0; font-size:18px;">Marsilia Food</h2>
            <p style="margin:4px 0; font-size:12px; font-weight:bold;">${copy}</p>
            <p style="margin:2px 0; font-size:10px;">${date}</p>
            <p style="margin:2px 0; font-size:10px;">Ticket N° ${num} - Table ${cmd.table_numero||'?'}</p>
            <div style="border-top:1px dashed black; border-bottom:1px dashed black; padding:6px 0; margin:8px 0;">
              Table: ${cmd.table_numero||'?'} | Serveur: ${cmd.serveur_nom||'?'} | ${cmd.statut||''}
            </div>
          </center>
          <div style="margin:10px 0; border-bottom:1px dashed #aaa; padding-bottom:8px;">
            <div style="font-weight:bold; margin-bottom:5px;">Détail:</div>
            ${itemsList}
          </div>
          <div style="border-top:1px dashed black; padding-top:8px;">
            <div style="display:flex; justify-content:space-between;"><span>Total Réel:</span><span>${totalReel.toFixed(0)} DH</span></div>
            ${remiseMontant>0? `<div style="display:flex; justify-content:space-between; color:red;"><span>Remise ${percent? percent+'%':''}:</span><span>-${remiseMontant.toFixed(0)} DH</span></div>`:''}
            <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:16px; margin-top:5px; border-top:1px solid black; padding-top:5px;"><span>NET A PAYER:</span><span>${totalFinal.toFixed(0)} DH</span></div>
            <div style="font-size:11px; margin-top:6px;">Paiement: ${method.toUpperCase()} | Serveur: ${cmd.serveur_nom||''}</div>
          </div>
          <center style="margin-top:15px; font-size:10px;">Merci - Bssaha!</center>
        </div>`;

      const html = `<html><head><title>2 Tickets</title><style>@page { margin: 0; size: 80mm auto; } body { margin:0; padding:0; }.page { width:100%; }.page1 { page-break-after: always; } @media print {.no-print { display:none; } }</style></head><body><div class="page page1">${ticketContent('TICKET CLIENT', '1/2')}</div><div class="page page2">${ticketContent('TICKET CUISINE / ARCHIVE', '2/2')}</div><script>setTimeout(()=>{ window.print(); }, 400); setTimeout(()=>{ try{ window.close(); }catch(e){} }, 1500);<\/script></body></html>`;
      const iframe = document.createElement('iframe'); iframe.style.position='fixed'; iframe.style.right='0'; iframe.style.bottom='0'; iframe.style.width='0'; iframe.style.height='0'; iframe.style.border='0'; document.body.appendChild(iframe);
      const doc = iframe.contentWindow?.document; if(doc){ doc.open(); doc.write(html); doc.close(); } else { const win = window.open('', '_blank'); if(win){ win.document.write(html); win.document.close(); } }
    } catch(e){ console.log('print error', e); }
  };

  const load = useCallback(async () => {
    const { data: cmds } = await supabase.from('commandes').select('*').in('statut', ['pret','prete','ready']).order('created_at', { ascending: false }).limit(100);
    let finalCmds = cmds || [];
    if(!finalCmds.length){
      const {data: all} = await supabase.from('commandes').select('*').neq('statut','paye').limit(100);
      if(all) finalCmds = all.filter(c=>c.statut!=='annulee' && c.statut!=='paye' && c.statut!=='annule');
    }
    if(finalCmds.length){
      const ids = finalCmds.map((c:any)=>c.id);
      const { data: items } = await supabase.from('commande_items').select('*').in('commande_id', ids);
      const tableIds = finalCmds.map((c:any)=>c.table_id).filter(Boolean);
      let tables:any[]=[]; if(tableIds.length){ const {data} = await supabase.from('tables').select('*').in('id', tableIds); tables=data||[]; }
      const itemsMap:any={}; (items||[]).forEach((it:any)=>{ (itemsMap[it.commande_id]=itemsMap[it.commande_id]||[]).push(it); });
      const tableMap:any={}; tables.forEach((t:any)=>{ tableMap[t.id]=t; });
      const result = finalCmds.map((c:any)=>({...c, items: itemsMap[c.id]||[], table_numero: c.table_id? tableMap[c.table_id]?.numero?? c.table_numero?? '?' : c.table_numero?? '?', serveur_nom: c.serveur_nom||'abdellali' }));
      setCommandes(result);
    } else setCommandes([]);
    setLoading(false);
  }, []);

  useEffect(()=>{ load(); const i=setInterval(load,4000); return()=>clearInterval(i); },[load]);

  const handlePay = async (cmd:any) => {
    if(paying) return;
    setPaying(cmd.id);
    const totalReel = Number(cmd.total||0);
    const method = selectedMethod[cmd.id] || 'espece';
    const percent = remiseMap[cmd.id] || 0;
    let remiseMontant = 0; let totalFinal = totalReel;
    if(method==='offert'){ remiseMontant=totalReel; totalFinal=0; }
    else if(method==='remise'){ remiseMontant = totalReel * percent / 100; totalFinal = totalReel - remiseMontant; }

    setCommandes(prev => prev.filter(c=>c.id!==cmd.id));
    try {
      // MA BA9INACH KAN-MSA7 WALO - ghadi n-khalliw items kima homa!
      const { error } = await supabase.from('commandes').update({
        statut:'paye', total:totalReel, total_final:totalFinal, payment_method:method, remise:remiseMontant, remise_percent:percent, paye_at:new Date().toISOString()
      }).eq('id', cmd.id);
      if(error) throw error;

      if(cmd.table_id){
        const {data:remaining}=await supabase.from('commandes').select('id').eq('table_id',cmd.table_id).in('statut',['en_attente','en_preparation','pret','prete','ready']).neq('id',cmd.id);
        if(!remaining || remaining.length===0) await supabase.from('tables').update({statut:'libre'}).eq('id',cmd.table_id);
      }
      setTimeout(()=>printDoubleTicket(cmd), 600);
    } catch(e:any){ alert('Erreur: '+e.message); load(); }
    setPaying(null);
  };

  if(loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <div className="sticky top-0 z-30 bg-[#0A0A0A]/95 border-b border-gray-800 px-4 py-3 flex justify-between max
