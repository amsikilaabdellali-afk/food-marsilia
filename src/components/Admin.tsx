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

    // PAYE
    let {data}=await supabase.from('commandes').select('*').eq('statut','paye').gte('paye_at',start.toISOString()).lte('paye_at',end.toISOString()).order('paye_at',{ascending:true});
    if(!data||data.length===0){
      const {data:d2}=await supabase.from('commandes').select('*').eq('statut','paye').gte('created_at',start.toISOString()).lte('created_at',end.toISOString()).order('created_at',{ascending:true});
      data=d2||[];
    }

    // ANNULE - jdid
    let {data:annuleData}=await supabase.from('commandes').select('*').in('statut',['annule','annulee']).gte('created_at',start.toISOString()).lte('created_at',end.toISOString()).order('created_at',{ascending:true});
    if(!annuleData || annuleData.length===0){
       const {data:d3}=await supabase.from('commandes').select('*').in('statut',['annule','annulee']).gte('updated_at',start.toISOString()).lte('updated_at',end.toISOString()).order('updated_at',{ascending:true});
       annuleData=d3||[];
    }

    let iMap:any={}; let aMap:any={}; let tMap:any={};
    const allIds=[...(data||[]).map((c:any)=>c.id), ...(annuleData||[]).map((c:any)=>c.id)];
    const tableIds=[...(data||[]).map((c:any)=>c.table_id), ...(annuleData||[]).map((c:any)=>c.table_id)].filter(Boolean);

    if(allIds.length){
      const [itemsRes,tablesRes]=await Promise.all([
        supabase.from('commande_items').select('*').in('commande_id',allIds),
        tableIds.length?supabase.from('tables').select('*').in('id',tableIds):Promise.resolve({data:[] as any})
      ]);
      (itemsRes.data||[]).forEach((it:any)=>{ 
        // far9o bin paye w annule
        if((data||[]).some((c:any)=>c.id===it.commande_id)){
          (iMap[it.commande_id]=iMap[it.commande_id]||[]).push(it);
        } else {
          (aMap[it.commande_id]=aMap[it.commande_id]||[]).push(it);
        }
      });
      (tablesRes.data||[]).forEach((t:any)=>{ tMap[t.id]=t; });
    }

    setItemsMap(iMap); setAnnuleItemsMap(aMap); setTableMap(tMap); 
    setCmds(data||[]); setAnnules(annuleData||[]);
    setLoading(false);
  },[date]);

  useEffect(()=>{ load(); },[load]);

  const getTableLabel=(c:any)=>{ const t=tableMap[c.table_id]; if(t) return `Table ${t.numero} - ${t.etage||'RDC'}`; if(c.table_numero) return `Table ${c.table_numero}`; return 'Table?'; };
  const getModeName=(m:any,p:any)=>{ const v=(m||'espece').toLowerCase(); if(v==='remise') return `REMISE ${p||0}%`; return v.toUpperCase(); };

  const totals=(()=>{
    let espece=0,tpe=0,cheque=0,offert=0,remise=0,cE=0,cT=0,cC=0,cO=0,cR=0;
    cmds.forEach((c:any)=>{
      const method=(c.payment_method||'').toLowerCase();
      const its=itemsMap[c.id]||[];
      if(method==='mixte'){
        its.forEach((it:any)=>{
          const m=(it.payment_method||'espece').toLowerCase();
          const prix=Number(it.qte||1)*Number(it.prix||0);
          const perc=Number(it.remise_percent||0);
          const finalP=m==='offert'?0:m==='remise'?prix-prix*perc/100:prix;
          if(m==='espece'){espece+=finalP;cE++;}
          else if(m==='tpe'){tpe+=finalP;cT++;}
          else if(m==='cheque'){cheque+=finalP;cC++;}
          else if(m==='offert'){offert+=prix;cO++;}
          else if(m==='remise'){remise+=finalP;cR++;}
        });
      }else{
        const tot=Number(c.total_final??c.total??0);
        const totReel=Number(c.total??0);
        if(method==='espece'){espece+=tot;cE++;}
        else if(method==='tpe'){tpe+=tot;cT++;}
        else if(method==='cheque'){cheque+=tot;cC++;}
        else if(method==='offert'){offert+=totReel;cO++;}
        else if(method==='remise'){remise+=tot;cR++;}
      }
    });
    return {espece,tpe,cheque,offert,remise,total:espece+tpe+cheque+remise,cE,cT,cC,cO,cR};
  })();

  const totalsAnnule=(()=>{
    let total=0, countItems=0;
    annules.forEach((c:any)=>{
      const its=annuleItemsMap[c.id]||[];
      if(its.length>0){
        its.forEach((it:any)=>{ total+=Number(it.qte||1)*Number(it.prix||0); countItems+=Number(it.qte||1); });
      } else {
        total+=Number(c.total||0);
      }
    });
    return {total, count: annules.length, countItems};
  })();

  const groups:any={
    espece:cmds.filter((c:any)=>(c.payment_method||'').toLowerCase()==='espece'),
    tpe:cmds.filter((c:any)=>(c.payment_method||'').toLowerCase()==='tpe'),
    cheque:cmds.filter((c:any)=>(c.payment_method||'').toLowerCase()==='cheque'),
    offert:cmds.filter((c:any)=>(c.payment_method||'').toLowerCase()==='offert'),
    remise:cmds.filter((c:any)=>(c.payment_method||'').toLowerCase()==='remise'),
    mixte:cmds.filter((c:any)=>(c.payment_method||'').toLowerCase()==='mixte'),
  };

  if(loading) return <div className="p-8 text-center">Chargement...</div>;

  return <div>
    <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-3 mb-2"/>
    <div className="bg-zinc-900 rounded-2xl p-4 text-center font-black text-xl mb-3 border border-zinc-700">{totals.total.toFixed(0)} DH - {cmds.length} cmd {groups.mixte.length>0?`(${groups.mixte.length} MIXTE)`:''}</div>
    
    {/* TOTALS PAYE */}
    <div className="grid grid-cols-3 gap-2 mb-3 text-center">
      <div className="bg-green-900/30 border border-green-700 rounded-xl p-3"><div className="text-[10px] text-green-300">ESPECE</div><div className="font-bold text-green-400">{totals.espece.toFixed(0)} DH</div><div className="text-xs">{totals.cE}</div></div>
      <div className="bg-blue-900/30 border border-blue-700 rounded-xl p-3"><div className="text-[10px] text-blue-300">TPE</div><div className="font-bold text-blue-400">{totals.tpe.toFixed(0)} DH</div><div className="text-xs">{totals.cT}</div></div>
      <div className="bg-purple-900/30 border border-purple-700 rounded-xl p-3"><div className="text-[10px] text-purple-300">CHEQUE</div><div className="font-bold text-purple-400">{totals.cheque.toFixed(0)} DH</div><div className="text-xs">{totals.cC}</div></div>
      <div className="bg-yellow-900/40 border-2 border-yellow-500 rounded-xl p-3"><div className="text-[10px] text-yellow-300 font-black">REMISE</div><div className="font-bold text-yellow-400">{totals.remise.toFixed(0)} DH</div><div className="text-xs">{totals.cR}</div></div>
      <div className="bg-orange-900/30 border border-orange-700 rounded-xl p-3"><div className="text-[10px] text-orange-300">OFFERT</div><div className="font-bold text-orange-400">{totals.offert.toFixed(0)} DH</div><div className="text-xs">{totals.cO}</div></div>
      <div className="bg-white/10 border-2 border-orange-500 rounded-xl p-3"><div className="text-[10px] text-white font-black">MIXTE</div><div className="font-bold text-white">{groups.mixte.length}</div><div className="text-xs">{groups.mixte.reduce((s:any,c:any)=>s+Number(c.total_final??c.total??0),0).toFixed(0)} DH</div></div>
    </div>

    {/* TOTALS ANNULE - JDID */}
    <div className="bg-red-950/50 border-2 border-red-600 rounded-2xl p-4 mb-4">
      <div className="flex justify-between items-center">
        <div><div className="text-red-300 text-[11px] font-black tracking-widest">COMMANDES ANNULÉES</div><div className="font-black text-xl text-red-400">{totalsAnnule.count} commandes - {totalsAnnule.total.toFixed(0)} DH perdu</div><div className="text-xs text-red-300/70">{totalsAnnule.countItems} articles annulés</div></div>
        <div className="text-3xl">🚫</div>
      </div>
    </div>

    {/* LISTE ANNULE */}
    {annules.length>0 && (
      <div className="border-l-4 border-red-600 pl-2 mb-6">
        <h3 className="font-black py-2 text-sm text-red-400">ANNULÉES ({annules.length}) - {totalsAnnule.total.toFixed(0)} DH</h3>
        {annules.map((c:any)=>{
          const its=annuleItemsMap[c.id]||[];
          return <div key={c.id} className="bg-red-950/20 border border-red-900/50 rounded-xl p-3 mb-2">
            <div className="flex justify-between font-bold text-sm"><span>{getTableLabel(c)} - {c.serveur_nom||'?'}</span><span className="text-red-400">{(its.length? its.reduce((s:any,i:any)=>s+Number(i.qte||1)*Number(i.prix||0),0) : Number(c.total||0)).toFixed(0)} DH</span></div>
            <div className="text-[11px] text-zinc-500">{new Date(c.created_at).toLocaleTimeString()} - ANNULE</div>
            <div className="mt-2 bg-black/60 rounded-lg p-2">
              {its.length>0 ? its.map((it:any)=><div key={it.id} className="flex justify-between py-1 text-sm border-b border-zinc-800 last:border-0 text-zinc-400"><span>{it.qte||1}x {it.menu_nom||it.nom||'Plat'}</span><span>{(Number(it.qte||1)*Number(it.prix||0)).toFixed(0)} DH</span></div>) : <div className="text-xs text-zinc-500">Total: {Number(c.total||0).toFixed(0)} DH</div>}
            </div>
          </div>
        })}
      </div>
    )}

    {/* LISTE PAYE */}
    <div>{Object.entries(groups).map(([k,list]:any)=>{ if(!list.length) return null; let title=''; let border=''; if(k==='espece'){title=`ESPECE (${totals.cE}) - ${totals.espece.toFixed(0)} DH`;border='border-green-600';} if(k==='tpe'){title=`TPE (${totals.cT}) - ${totals.tpe.toFixed(0)} DH`;border='border-blue-600';} if(k==='cheque'){title=`CHEQUE (${totals.cC}) - ${totals.cheque.toFixed(0)} DH`;border='border-purple-600';} if(k==='remise'){title=`REMISE (${totals.cR}) - ${totals.remise.toFixed(0)} DH`;border='border-yellow-500';} if(k==='offert'){title=`OFFERT (${totals.cO}) - ${totals.offert.toFixed(0)} DH perdu`;border='border-orange-600';} if(k==='mixte'){title=`MIXTE (${list.length}) - ${list.reduce((s:any,c:any)=>s+Number(c.total_final??c.total??0),0).toFixed(0)} DH`;border='border-white';} return <div key={k} className={`border-l-4 ${border} pl-2 mb-5`}><h3 className="font-black py-2 text-sm">{title}</h3>{list.map((c:any)=>{const its=itemsMap[c.id]||[];return <div key={c.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 mb-2"><div className="flex justify-between font-bold text-sm"><span>{getTableLabel(c)} - {c.serveur_nom||'?'}</span><span className="text-orange-400">{Number(c.total_final??c.total??0).toFixed(0)} DH</span></div><div className="text-[11px] text-zinc-500">{new Date(c.paye_at||c.created_at).toLocaleTimeString()} - {c.payment_method}</div><div className="mt-2 bg-black/60 rounded-lg p-2">{its.map((it:any)=><div key={it.id} className="flex justify-between py-2 text-sm border-b border-zinc-800 last:border-0"><span>{it.qte||1}x {it.menu_nom||it.nom||'Plat'} - {getModeName(it.payment_method,it.remise_percent)}</span><span>{(Number(it.qte||1)*Number(it.prix||0)).toFixed(0)} DH</span></div>)}</div></div>})}</div>})}</div>
  </div>
}
