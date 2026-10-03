// ============ COMMANDES - FIXE ============
function CommandesTab() {
  const [commandes, setCommandes] = useState<(Commande & { items?: CommandeItem[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Tous');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: cmds } = await supabase.from('commandes').select('*').order('created_at', { ascending: false }).limit(150);
      if (cmds && cmds.length > 0) {
        const ids = cmds.map((c) => c.id);
        const { data: items } = await supabase.from('commande_items').select('*').in('commande_id', ids);
        const itemsMap: Record<string, CommandeItem[]> = {};
        (items || []).forEach((it) => { (itemsMap[it.commande_id] = itemsMap[it.commande_id] || []).push(it); });
        // FIX: ma n-wriw-ch commandes khawyin (Table 6 - 0DH)
        const filtered = cmds.map((c) => ({...c, items: itemsMap[c.id] || [] })).filter((c:any)=> c.items.length>0);
        setCommandes(filtered);
      } else setCommandes([]);
      setLoading(false);
    };
    load(); const interval = setInterval(load, 5000); return () => clearInterval(interval);
  }, []);

  const filters = ['Tous', 'en_attente', 'en_preparation', 'pret', 'paye'];
  const filtered = filter === 'Tous'? commandes : commandes.filter((c) => c.statut === filter);
  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white">Historique - Li dazou / Li tkhalso</h2>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${filter === f? 'bg-[#FF6B00] text-white' : 'bg-[#1A1A1A] text-gray-400'}`}>
            {f === 'Tous'? 'Tous' : f === 'en_attente'? 'En attente' : f === 'en_preparation'? 'En préparation' : f === 'pret'? 'Prêt' : 'Payé'}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {filtered.map((c:any) => {
          const totalReel = (c.items||[]).reduce((s:any,it:any)=> s + Number(it.qte)*Number(it.prix),0);
          const totalAffiche = c.statut==='paye'? Number(c.total_final?? totalReel) : totalReel;
          return (
          <div key={c.id} className="bg-[#1A1A1A] rounded-2xl border border-gray-800 overflow-hidden">
            <button onClick={() => setExpanded(expanded === c.id? null : c.id)} className="w-full flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                {expanded === c.id? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                <div className="text-left">
                  <div className="text-white font-medium text-sm">Table {c.table_numero||'?'} · {c.serveur_nom||'N/A'} · {new Date(c.created_at).toLocaleString('fr-FR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</div>
                  <div className="text-gray-500 text-xs">{c.items?.length||0} art · {c.payment_method? `KHLAS: ${c.payment_method.toUpperCase()}` : c.statut} {c.payment_method==='offert'? `🎁 Reel ${totalReel}DH -> 0DH` : ''}</div>
                </div>
              </div>
              <div className="flex items-center gap-3"><StatusBadge statut={c.statut} /><span className={`font-bold ${c.payment_method==='offert'?'text-orange-400':'text-white'}`}>{totalAffiche.toFixed(0)} DH</span></div>
            </button>
            {expanded === c.id && c.items && (
              <div className="border-t border-gray-800 p-4 space-y-2 bg-black/20">
                <div className="text-[11px] text-gray-500">DÉTAIL LI DAZ - KOL WA7DA BACH TKHALSET:</div>
                {c.items.map((it:any) => (<div key={it.id} className="flex justify-between text-sm"><span className="text-gray-300">{it.qte}x {it.menu_nom}</span><span className="text-gray-400">{(it.qte * Number(it.prix)).toFixed(0)} DH</span></div>))}
                <div className="pt-2 border-t border-gray-800 flex justify-between text-white font-bold"><span>Total réel</span><span>{totalReel.toFixed(0)} DH</span></div>
                <div className="flex justify-between font-black text-[#FF6B00]"><span>Li tkhalas / Encaissé</span><span>{totalAffiche.toFixed(0)} DH {c.payment_method? `(${c.payment_method})`:''}</span></div>
                {c.payment_method==='offert' && c.remise>0 && <div className="text-xs text-orange-400">OFFERT: khsara {Number(c.remise).toFixed(0)} DH - kayban 0 DH f caisse</div>}
              </div>
            )}
          </div>
        )})}
      </div>
    </div>
  );
}

// ============ RAPPORTS - FIXE ============
function RapportsTab() {
  const [commandes, setCommandes] = useState<(Commande & { items?: CommandeItem[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'jour' | 'mois'>('jour');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('commandes').select('*').eq('statut','paye').order('paye_at', { ascending: false });
    if (view === 'jour') query = query.gte('paye_at', selectedDate + 'T00:00:00').lte('paye_at', selectedDate + 'T23:59:59');
    else query = query.gte('paye_at', selectedMonth + '-01T00:00:00').lte('paye_at', selectedMonth + '-31T23:59:59');
    const { data: cmds } = await query;
    if (cmds && cmds.length > 0) {
      const ids = cmds.map((c) => c.id);
      const { data: items } = await supabase.from('commande_items').select('*').in('commande_id', ids);
      const itemsMap: Record<string, CommandeItem[]> = {};
      (items || []).forEach((it) => { (itemsMap[it.commande_id] = itemsMap[it.commande_id] || []).push(it); });
      setCommandes(cmds.map((c) => ({...c, items: itemsMap[c.id] || [] })));
    } else setCommandes([]);
    setLoading(false);
  }, [view, selectedDate, selectedMonth]);

  useEffect(() => { load(); }, [load]);

  const payedCmds = commandes;
  const totalEspece = payedCmds.filter((c:any)=>c.payment_method==='espece').reduce((s,c:any)=>s+Number(c.total_final||0),0);
  const totalTpe = payedCmds.filter((c:any)=>c.payment_method==='tpe').reduce((s,c:any)=>s+Number(c.total_final||0),0);
  const totalCheque = payedCmds.filter((c:any)=>c.payment_method==='cheque').reduce((s,c:any)=>s+Number(c.total_final||0),0);
  const offerts = payedCmds.filter((c:any)=>c.payment_method==='offert');
  const totalPerteOffert = offerts.reduce((s,c:any)=>s+Number(c.remise||0),0);
  const totalPaye = payedCmds.reduce((s, c:any) => s + Number(c.total_final||0), 0);

  const byServer: Record<string, { count: number; total: number }> = {};
  payedCmds.forEach((c:any) => { const name = c.serveur_nom || 'N/A'; if (!byServer[name]) byServer[name] = { count: 0, total: 0 }; byServer[name].count++; byServer[name].total += Number(c.total_final||0); });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h2 className="text-xl font-bold text-white">Rapports - Li tkhalso</h2><button onClick={()=>window.print()} className="flex items-center gap-2 bg-[#FF6B00] text-white px-4 py-2.5 rounded-xl"><Printer className="w-4 h-4" /> Imprimer</button></div>
      <div className="flex gap-2">
        <button onClick={() => setView('jour')} className={`px-4 py-2.5 rounded-xl text-sm ${view==='jour'?'bg-[#FF6B00] text-white':'bg-[#1A1A1A] text-gray-400'}`}>Journalier</button>
        <button onClick={() => setView('mois')} className={`px-4 py-2.5 rounded-xl text-sm ${view==='mois'?'bg-[#FF6B00] text-white':'bg-[#1A1A1A] text-gray-400'}`}>Mensuel</button>
      </div>
      <div>{view==='jour'? <input type="date" value={selectedDate} onChange={(e)=>setSelectedDate(e.target.value)} className="bg-[#1A1A1A] text-white rounded-xl py-2.5 px-3 border border-gray-800" /> : <input type="month" value={selectedMonth} onChange={(e)=>setSelectedMonth(e.target.value)} className="bg-[#1A1A1A] text-white rounded-xl py-2.5 px-3 border border-gray-800" />}</div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={DollarSign} label="💵 ESPECE" value={`${totalEspece.toFixed(0)} DH`} color="text-green-400" bg="bg-green-950/30" />
        <StatCard icon={DollarSign} label="💳 TPE" value={`${totalTpe.toFixed(0)} DH`} color="text-blue-400" bg="bg-blue-950/30" />
        <StatCard icon={DollarSign} label="🧾 CHEQUE" value={`${totalCheque.toFixed(0)} DH`} color="text-purple-400" bg="bg-purple-950/30" />
        <div className="bg-[#1A1A1A] p-4 rounded-2xl border border-orange-900/50"><div className="text-xs text-gray-500">🎁 OFFERT</div><div className="text-orange-400 text-xl font-bold">{offerts.length} cmds</div><div className="text-xs text-orange-300/60">Perte {totalPerteOffert.toFixed(0)} DH - 0DH f caisse</div></div>
        <div className="bg-[#FF6B00] p-4 rounded-2xl col-span-2 lg:col-span-4"><div className="text-xs text-white/70">TOTAL ENCAISSÉ RÉEL (OFFERT = 0DH)</div><div className="text-white text-2xl font-black">{totalPaye.toFixed(0)} DH</div><div className="text-xs text-white/70">{payedCmds.length} commandes - li tkhalso ha homa</div></div>
      </div>
      <div className="bg-[#1A1A1A] rounded-2xl p-5 border border-gray-800">
        <h3 className="text-white font-semibold mb-3">Li dazou - kol wa7da bach tkhalset</h3>
        <div className="space-y-2">
          {payedCmds.map((c:any)=><div key={c.id} className="flex justify-between text-sm py-2 border-b border-gray-800 last:border-0"><span className="text-gray-300">Table {c.table_numero||'?'} - {c.payment_method?.toUpperCase()} - {c.serveur_nom} - {new Date(c.paye_at||c.created_at).toLocaleTimeString()} - {c.items?.length} art {c.payment_method==='offert'?`🎁 Reel ${Number(c.remise||0)}DH -> 0DH`:''}</span><span className={`font-bold ${c.payment_method==='offert'?'text-orange-400':'text-white'}`}>{Number(c.total_final||0).toFixed(0)} DH</span></div>)}
          {payedCmds.length===0 && <p className="text-gray-600 text-center py-6">Ba9i ma daz walo</p>}
        </div>
      </div>
    </div>
  );
                                                                                                                                                                                                                                                                                                                                                                                                                                                          }a
