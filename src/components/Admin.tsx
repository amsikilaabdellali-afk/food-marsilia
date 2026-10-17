function RapportsTab(){
  const [date,setDate]=useState(new Date().toISOString().split('T')[0]);
  const [cmds,setCmds]=useState<any[]>([]);
  const [annules,setAnnules]=useState<any[]>([]);
  const [itemsMap,setItemsMap]=useState<any>({});
  const [annuleItemsMap,setAnnuleItemsMap]=useState<any>({});
  const [tableMap,setTableMap]=useState<any>({});
  const [loading,setLoading]=useState(true);

  const load=useCallback(async()=>{
    setLoading(true);
    const start=new Date(date); start.setHours(0,0,0,0);
    const end=new Date(date); end.setHours(23,59,59,999);
    
    let {data}=await supabase.from('commandes').select('*').eq('statut','paye').gte('paye_at',start.toISOString()).lte('paye_at',end.toISOString()).order('paye_at',{ascending:true});
    if(!data||data.length===0){
      const {data:d2}=await supabase.from('commandes').select('*').eq('statut','paye').gte('created_at',start.toISOString()).lte('created_at',end.toISOString()).order('created_at',{ascending:true});
      data=d2||[];
    }
    let {data:annuleData}=await supabase.from('commandes').select('*').in('statut',['annule','annulee']).gte('created_at',start.toISOString()).lte('created_at',end.toISOString()).order('created_at',{ascending:true});
    
    let iMap:any={}; let aMap:any={}; let tMap:any={};
    const allIds=[...(data||[]).map((c:any)=>c.id), ...(annuleData||[]).map((c:any)=>c.id)];
    const tableIds=[...(data||[]).map((c:any)=>c.table_id), ...(annuleData||[]).map((c:any)=>c.table_id)].filter(Boolean);
    
    if(allIds.length){
      const [itemsRes,tablesRes]=await Promise.all([
        supabase.from('commande_items').select('*').in('commande_id',allIds),
        tableIds.length?supabase.from('tables').select('*').in('id',tableIds):Promise.resolve({data:[] as any})
      ]);
      (itemsRes.data||[]).forEach((it:any)=>{ 
        if((data||[]).some((c:any)=>c.id===it.commande_id)){ (iMap[it.commande_id]=iMap[it.commande_id]||[]).push(it); }
        else { (aMap[it.commande_id]=aMap[it.commande_id]||[]).push(it); }
      });
      (tablesRes.data||[]).forEach((t:any)=>{ tMap[t.id]=t; });
    }
    setItemsMap(iMap); setAnnuleItemsMap(aMap); setTableMap(tMap); setCmds(data||[]); setAnnules(annuleData||[]); setLoading(false);
  },[date]);

  useEffect(()=>{ load(); },[load]);

  const getTableLabel=(c:any)=>{ const t=tableMap[c.table_id]; if(t) return `T${t.numero} ${t.etage||''}`; if(c.table_numero) return `T${c.table_numero}`; return 'T?'; };

  const getBadge=(method:any, remise:any)=>{
    const m=(method||'').toLowerCase();
    if(m==='espece') return <span className="bg-green-600 text-white px-2 py-1 rounded-full text-[10px] font-black">ESPECE</span>;
    if(m==='tpe') return <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-[10px] font-black">TPE</span>;
    if(m==='cheque') return <span className="bg-purple-600 text-white px-2 py-1 rounded-full text-[10px] font-black">CHEQUE</span>;
    if(m==='offert') return <span className="bg-orange-600 text-white px-2 py-1 rounded-full text-[10px] font-black">OFFERT</span>;
    if(m==='remise') return <span className="bg-yellow-500 text-black px-2 py-1 rounded-full text-[10px] font-black">REMISE {remise||0}%</span>;
    if(m==='mixte') return <span className="bg-white text-black border-2 border-orange-500 px-2 py-1 rounded-full text-[10px] font-black">MIXTE</span>;
    if(m==='annule' || m==='annulee') return <span className="bg-red-600 text-white px-2 py-1 rounded-full text-[10px] font-black">ANNULE</span>;
    return <span className="bg-zinc-700 px-2 py-1 rounded-full text-[10px]">{m.toUpperCase()}</span>;
  };

  const getItemBadge=(it:any)=>{
    const m=(it.payment_method||'espece').toLowerCase();
    const p=it.remise_percent||0;
    if(m==='espece') return <span className="bg-green-900 text-green-300 px-1.5 py-0.5 rounded text-[9px]">ESP</span>;
    if(m==='tpe') return <span className="bg-blue-900 text-blue-300 px-1.5 py-0.5 rounded text-[9px]">TPE</span>;
    if(m==='cheque') return <span className="bg-purple-900 text-purple-300 px-1.5 py-0.5 rounded text-[9px]">CHQ</span>;
    if(m==='offert') return <span className="bg-orange-900 text-orange-300 px-1.5 py-0.5 rounded text-[9px]">OFF</span>;
    if(m==='remise') return <span className="bg-yellow-900 text-yellow-300 px-1.5 py-0.5 rounded text-[9px]">-{p}%</span>;
    return null;
  };

  const totals=(()=>{
    let espece=0,tpe=0,cheque=0,offert=0,remise=0;
    cmds.forEach((c:any)=>{
      const method=(c.payment_method||'').toLowerCase();
      const its=itemsMap[c.id]||[];
      if(method==='mixte'){
        its.forEach((it:any)=>{
          const m=(it.payment_method||'espece').toLowerCase();
          const prix=Number(it.qte||1)*Number(it.prix||0);
          const perc=Number(it.remise_percent||0);
          const finalP=m==='offert'?0:m==='remise'?prix-prix*perc/100:prix;
          if(m==='espece') espece+=finalP;
          else if(m==='tpe') tpe+=finalP;
          else if(m==='cheque') cheque+=finalP;
          else if(m==='offert') offert+=prix;
          else if(m==='remise') remise+=finalP;
        });
      }else{
        const tot=Number(c.total_final??c.total??0);
        const totReel=Number(c.total??0);
        if(method==='espece') espece+=tot;
        else if(method==='tpe') tpe+=tot;
        else if(method==='cheque') cheque+=tot;
        else if(method==='offert') offert+=totReel;
        else if(method==='remise') remise+=tot;
      }
    });
    return {espece,tpe,cheque,offert,remise,total:espece+tpe+cheque+remise};
  })();

  const totalsAnnule=annules.reduce((s:any,c:any)=>{
    const its=annuleItemsMap[c.id]||[];
    const t=its.length? its.reduce((a:any,i:any)=>a+Number(i.qte||1)*Number(i.prix||0),0) : Number(c.total||0);
    return s+t;
  },0);

  if(loading) return <div className="p-8 text-center">Chargement...</div>;

  return <div>
    <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-3 mb-3"/>
    
    <div className="bg-zinc-900 rounded-2xl p-4 text-center font-black text-xl mb-3 border border-zinc-700">
      {totals.total.toFixed(0)} DH - {cmds.length} PAYE + {annules.length} ANNULE
    </div>

    <div className="grid grid-cols-3 gap-2 mb-4 text-center">
      <div className="bg-green-900/30 border border-green-700 rounded-xl p-2"><div className="text-[9px] text-green-300">ESPECE</div><div className="font-bold text-green-400 text-sm">{totals.espece.toFixed(0)}</div></div>
      <div className="bg-blue-900/30 border border-blue-700 rounded-xl p-2"><div className="text-[9px] text-blue-300">TPE</div><div className="font-bold text-blue-400 text-sm">{totals.tpe.toFixed(0)}</div></div>
      <div className="bg-purple-900/30 border border-purple-700 rounded-xl p-2"><div className="text-[9px] text-purple-300">CHEQUE</div><div className="font-bold text-purple-400 text-sm">{totals.cheque.toFixed(0)}</div></div>
      <div className="bg-yellow-900/40 border border-yellow-600 rounded-xl p-2"><div className="text-[9px] text-yellow-300">REMISE</div><div className="font-bold text-yellow-400 text-sm">{totals.remise.toFixed(0)}</div></div>
      <div className="bg-orange-900/30 border border-orange-700 rounded-xl p-2"><div className="text-[9px] text-orange-300">OFFERT</div><div className="font-bold text-orange-400 text-sm">{totals.offert.toFixed(0)}</div></div>
      <div className="bg-red-950/50 border-2 border-red-600 rounded-xl p-2"><div className="text-[9px] text-red-300 font-black">ANNULE</div><div className="font-bold text-red-400 text-sm">{totalsAnnule.toFixed(0)}</div><div className="text-[9px] text-red-300">{annules.length} cmd</div></div>
    </div>

    {/* ANNULES EN HAUT */}
    {annules.length>0 && (
      <div className="mb-6">
        <h3 className="font-black text-red-400 mb-2 flex items-center gap-2">🚫 ANNULÉES ({annules.length}) - {totalsAnnule.toFixed(0)} DH</h3>
        {annules.map((c:any)=>{
          const its=annuleItemsMap[c.id]||[];
          const totalCmd=its.length? its.reduce((s:any,i:any)=>s+Number(i.qte||1)*Number(i.prix||0),0) : Number(c.total||0);
          return (
            <div key={c.id} className="bg-red-950/20 border-2 border-red-800 rounded-xl p-3 mb-2">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2"><span className="font-black">{getTableLabel(c)}</span><span className="text-xs text-zinc-400">{c.serveur_nom}</span><span className="text-[10px] text-zinc-500">{new Date(c.created_at).toLocaleTimeString()}</span></div>
                <div className="flex items-center gap-2">{getBadge('annule',0)}<span className="font-black text-red-400">{totalCmd.toFixed(0)} DH</span></div>
              </div>
              <div className="bg-black/60 rounded-lg p-2 space-y-1">
                {its.map((it:any)=><div key={it.id} className="flex justify-between text-sm"><span className="text-zinc-300">{it.qte}x {it.menu_nom||it.nom}</span><span className="text-zinc-500">{(Number(it.qte)*Number(it.prix)).toFixed(0)} DH</span></div>)}
                {its.length===0 && <div className="text-xs text-zinc-500">Commande annulée - {totalCmd.toFixed(0)} DH</div>}
              </div>
            </div>
          )
        })}
      </div>
    )}

    {/* COMMANDES PAYE - KAMLA */}
    <h3 className="font-black text-green-400 mb-2">✅ PAYÉES ({cmds.length}) - {totals.total.toFixed(0)} DH</h3>
    {cmds.map((c:any)=>{
      const its=itemsMap[c.id]||[];
      return (
        <div key={c.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 mb-3">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2"><span className="font-black text-white">{getTableLabel(c)}</span><span className="text-xs text-zinc-400">{c.serveur_nom}</span><span className="text-[10px] text-zinc-500">{new Date(c.paye_at||c.created_at).toLocaleTimeString()}</span></div>
            <div className="flex items-center gap-2">{getBadge(c.payment_method, c.remise_percent)}<span className="font-black text-orange-400">{Number(c.total_final??c.total??0).toFixed(0)} DH</span></div>
          </div>
          {/* Detail dyal OFFERT / REMISE */}
          {(c.payment_method==='offert' || c.payment_method==='remise') && (
            <div className={`mb-2 p-2 rounded-lg text-xs font-bold ${c.payment_method==='offert'?'bg-orange-900/50 text-orange-300':'bg-yellow-900/50 text-yellow-300'}`}>
              {c.payment_method==='offert'? '🎁 COMMANDE OFFERTE' : `🏷️ REMISE ${c.remise_percent}% - Total reel ${Number(c.total).toFixed(0)} DH → Payé ${Number(c.total_final).toFixed(0)} DH`}
            </div>
          )}
          <div className="bg-black/60 rounded-lg p-2 space-y-1.5">
            {its.map((it:any)=>{
              const prix=Number(it.qte||1)*Number(it.prix||0);
              const perc=Number(it.remise_percent||0);
              const finalP=(it.payment_method||'').toLowerCase()==='offert'?0:(it.payment_method||'').toLowerCase()==='remise'? prix-prix*perc/100 : prix;
              return (
                <div key={it.id} className="flex justify-between items-center py-1 border-b border-zinc-800/50 last:border-0">
                  <div className="flex items-center gap-2"><span className="bg-zinc-800 text-white text-xs font-bold w-6 h-6 rounded flex items-center justify-center">{it.qte}</span><span className="text-sm text-white">{it.menu_nom||it.nom}</span>{getItemBadge(it)}</div>
                  <div className="text-right"><div className="text-xs text-zinc-500 line-through">{prix.toFixed(0)} DH</div><div className="text-sm font-bold text-white">{c.payment_method==='mixte'? finalP.toFixed(0) : prix.toFixed(0)} DH</div></div>
                </div>
              )
            })}
          </div>
          <div className="mt-2 flex justify-between text-xs text-zinc-500"><span>{its.length} articles • {c.payment_method==='mixte'? 'Ticket mixte détaillé au dessus' : `Payé en ${c.payment_method}`}</span><span className="font-bold text-white">TOTAL: {Number(c.total_final??c.total).toFixed(0)} DH</span></div>
        </div>
      )
    })}
  </div>
}
