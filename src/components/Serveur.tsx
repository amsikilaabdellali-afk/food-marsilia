// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Plus, Minus, Send, Image as ImageIcon } from 'lucide-react';

export default function Serveur({ serveurNom }: { serveurNom: string }) {
  const [view, setView] = useState<'tables' | 'commande'>('tables');
  const [selectedTable, setSelectedTable] = useState<any>(null);
  if (view === 'commande' && selectedTable) return <CommandeView table={selectedTable} serveurNom={serveurNom} onBack={() => setView('tables')} />;
  return <TablesView onSelectTable={(t) => { setSelectedTable(t); setView('commande'); }} />;
}

function TablesView({ onSelectTable }: { onSelectTable: (t: any) => void }) {
  const [tables, setTables] = useState<any[]>([]);
  const [commandes, setCommandes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    const [{ data: t }, { data: c }] = await Promise.all([
      supabase.from('tables').select('*').order('numero'),
      supabase.from('commandes').select('*').in('statut', ['en_attente', 'en_preparation', 'pret']),
    ]);
    setTables(t || []); setCommandes(c || []); setLoading(false);
  }, []);
  useEffect(() => { load(); const i = setInterval(load, 3000); return () => clearInterval(i); }, [load]);
  const getStatus = (id: string) => {
    const cmds = commandes.filter((c) => c.table_id === id);
    if (cmds.some((c) => c.statut === 'pret')) return 'pret';
    if (cmds.length > 0) return 'en_cours';
    return 'libre';
  };
  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8
