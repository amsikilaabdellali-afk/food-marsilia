function TablesView({ onSelectTable }: { onSelectTable: (t: TableResto) => void }) {
  const [tables, setTables] = useState<TableResto[]>([]);
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    const [{ data: t }, { data: c }] = await Promise.all([
      supabase.from('tables').select('*').order('numero'),
      supabase.from('commandes').select('*').in('statut', ['en_attente', 'en_preparation', 'pret']),
    ]);
    setTables(t || []);
    setCommandes(c || []);
    setLoading(false);
  }, []);
  useEffect(() => { load(); const interval = setInterval(load, 3000); return () => clearInterval(interval); }, [load]);

  const getTableStatus = (tableId: string) => {
    const tableCmds = commandes.filter((c) => c.table_id === tableId);
    if (tableCmds.some((c) => c.statut === 'pret')) return 'pret';
    if (tableCmds.length > 0) return 'en_cours';
    return 'libre';
  };
  if (loading) return <LoadingSpinner />;
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-xl font-bold text-white mb-4">Tables du Restaurant</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {tables.map((t) => {
          const status = getTableStatus(t.id);
          return (
            <button key={t.id} onClick={() => onSelectTable(t)}
              className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center border-2 ${status==='pret'?'bg-green-900/40 border-green-500':status==='en_cours'?'bg-blue-950/40 border-blue-600':'bg-[#1A1A1A] border-gray-800'}`}>
              <div className="text-3xl font-bold text-white">{t.numero}</div>
              <div className="text-xs mt-1 text-gray-500">{status}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
