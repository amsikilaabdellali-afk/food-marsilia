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

  // JDID - LAKHLAS PAR ARTICLE
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
    if(mode === 'total'){
      return Number(cmd.total||0);
    }
    let total = 0;
    cmd.items?.forEach((it:any)=>{
      const key = `${cmd.id}-${it.id}`;
      if(selectedItems[key]){
        total += Number(it.prix||0) * (it.qte||it.quantite||1);
      }
    });
    return total;
  };

  const printDoubleTicket = (cmd:any) => {
    try {
      const mode = modePaiement[cmd.id] || 'total';
      const itemsToPrint = mode === 'articles'
       ? cmd.items.filter((it:any)=> selectedItems[`${cmd.id}-${it.id}`])
        : cmd.items;

      const totalReel = itemsToPrint.reduce((s:number,it:any)=> s + Number(it.prix||0)*(it.qte||it.quantite||1), 0);
      const method = selectedMethod[cmd.id] || 'espece';
      const percent = remiseMap[cmd.id] || 0;
      const remiseMontant = method==='offert'? totalReel : method==='remise'? totalReel*percent/100 : 0;
      const totalFinal = totalReel - remiseMontant;
      const date = new Date().toLocaleString('fr-FR');
      const itemsRows = itemsToPrint?.map((it:any)=> `
        <div style="display:flex;justify-content:space-between;font-size:13px;margin:4px 0">
          <span>${it.qte||it.quantite||1}x ${it.menu_nom||it.nom||'Plat'}</span>
          <span>${(Number(it.prix||0)*(it.qte||it.quantite||1)).toFixed(0)} DH</span>
        </div>`).join('') || '';

      const ticket = (copy:string) => `
        <div class="ticket">
          <center>
            <h2 style="margin:0;font-size:18px">MARSILIA FOOD</h2>
            <div style="font-size:10px">Haj fateh - ${date}</div>
            <div style="font-size:14px;font-weight:bold;margin:8px 0;border:1px dashed black;padding:5px">Table ${cmd.table_numero||'?'} - ${copy}</div>
            <div style="font-size:11px">${mode==='articles'?'PARTIEL':''} - ${itemsToPrint.length}/${cmd.items.length} articles</div>
          </center>
          <hr style="border:1px dashed black;margin:10px 0">
          ${itemsRows}
          <hr style="border:1px dashed black;margin:10px 0">
          <div style="display:flex;justify-content:space-between"><span>Sous-total:</span><span>${totalReel.toFixed(0)} DH</span></div>
          ${remiseMontant>0? `<div style="display:flex;justify-content:space-between"><span>Remise ${percent}%:</span><span>-${remiseMontant.toFixed(0)} DH</span></div>`:''}
          <div style="display:flex;justify-content:space-between;font-weight:bold;font-size:16px;margin-top:6px;border-top:2px solid black;padding-top:6px"><span>TOTAL:</span><span>${totalFinal.toFixed(0)} DH</span></div>
          <div style="text-align:center;margin-top:10px;font-size:12px;font-weight:bold">Paiement: ${method.toUpperCase()} ${percent?`(${percent}%)`:''}</div>
        </div>
      `;

      const html = `
        <html><head><title>Tickets</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          body { margin:0; padding:0; background:white; color:black; font-family:monospace; }
         .ticket { width:72mm; padding:5mm; }
         .page-break { page-break-after: always; }
        </style>
        </head><body>
          ${ticket('ORIGINAL CLIENT')}
          <div class="page-break"></div>
          ${ticket('DUPLICATA CAISSE')}
          <script>setTimeout(()=>{window.print(); setTimeout(()=>window.close(), 1500)},500)<\/script>
        </body></html>`;

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
