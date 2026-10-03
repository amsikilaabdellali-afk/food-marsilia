// @ts-nocheck
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { ChefHat, Clock, CheckCircle2, Flame } from 'lucide-react';

export default function Cuisine() {
  const [commandes, setCommandes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const prevCountRef = useRef(0);

  const load = useCallback(async () => {
    const { data: cmds } = await supabase.from('commandes').select('*').in('statut', ['en_attente', 'en_preparation', 'pret']).order('created_at', { ascending: true });
    if (cmds && cmds.length > 0) {
      const ids = cmds.map((c: any) => c.id);
      const tableIds = cmds.map((c: any) => c.table_id).filter(Boolean);
      const { data: items } = await supabase.from('commande_items').select('*').in('commande_id', ids);
      const { data: tables } = tableIds.length > 0? await supabase.from('tables').select('*').in('id', tableIds) : { data: [] as any };

      const itemsMap: any = {};
      (items || []).forEach((it: any) => { (itemsMap[it.commande_id] = itemsMap[it.commande_id] || []).push(it); });
      const tableMap: any = {};
      (tables || []).forEach((t: any) => { tableMap[t.id] = t; });

      const result = cmds.map((c: any) => ({
      ...c,
        items: itemsMap[c.id] || [],
        table_numero: c.table_id? tableMap[c.table_id]?.numero?? null : null,
      }));
      if (result.length > prevCountRef.current && prevCountRef.current > 0) playNotificationSound();
      prevCountRef.current = result.length;
      setCommandes(result);
    } else {
      prevCountRef.current = 0;
      setCommandes([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 3000);
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => { clearInterval(interval); clearInterval(timer); };
  }, [load]);

  const updateStatus = async (cmd: any, newStatus: string) => {
    await supabase.from('commandes').update({ statut: newStatus, updated_at: new Date().toISOString() }).eq('id', cmd.id);
    if (newStatus === 'pret') {
      await supabase.from('tables').update({ statut: 'pret' }).eq('id', cmd.table_id);
    }
    load();
  };

  const enAttente = commandes.filter((c) => c.statut === 'en_attente');
  const enPrep = commandes.filter((c) => c.statut === 'en_preparation');
  const pret = commandes.filter((c) => c.statut === 'pret');

  if (loading) return <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <div className="sticky top-0 z-30 bg-[#0A0A0A]/95 backdrop-blur border-b border-gray-800 px-4 py-3">
        <div className="flex items-center gap-3 max-w-7xl mx-auto">
          <ChefHat className="w-6 h-6 text-[#FF6B00]" />
          <h2 className="text-white font-bold">Cuisine</h2>
          <div className="ml-auto flex gap-2 text-sm">
            <span className="px-3 py-1 rounded-lg bg-gray-800 text-gray-300">{enAttente.length} Attente</span>
            <span className="px-3 py-1 rounded-lg bg-blue-900 text-blue-300">{enPrep.length} Prép.</span>
            <span className="px-3 py-1 rounded-lg bg-green-900 text-green-300">{pret.length} Prêt</span>
          </div>
        </div>
      </div>
      <div className="p-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3"><Clock className="w-5 h-5 text-gray-400" /><h3 className="text-gray-300 font-semibold">En attente</h3><span className="ml-auto text-gray-500 text-sm">{enAttente.length}</span></div>
            <div className="space-y-3">{enAttente.map((c) => (<div key={c.id} className="bg-[#1A1A1A] rounded-2xl p-4 border border-gray-800"><div className="flex justify-between mb-2"><div><div className="text-white font-bold">Table {c.table_numero || 'N/A'}</div><div className="text-gray-500 text-xs">{c.serveur_nom}</div></div><div className="text-gray-400 font-mono text-sm">{Math.floor((now - new Date(c.created_at).getTime())/1000/60)}:{(Math.floor((now - new Date(c.created_at).getTime())/1000)%60).toString().padStart(2,'0')}</div></div><div className="space-y-1 mb-3">{c.items.map((it:any)=>(<div key={it.id} className="flex gap-2 text-sm"><span className="bg-[#FF6B00]/20 text-[#FF6B00] font-bold w-7 h-7 rounded-lg flex items-center justify-center text-xs">{it.qte}</span><span className="text-gray-200">{it.menu_nom}</span></div>))}</div><button onClick={()=>updateStatus(c,'en_preparation')} className="w-full flex justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-xl"><Flame className="w-4 h-4" />Commencer</button></div>))}{enAttente.length===0 && <div className="border-2 border-dashed border-gray-800 rounded-2xl p-8 text-center text-gray-600 text-sm">Aucune commande</div>}</div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-3"><Flame className="w-5 h-5 text-blue-400" /><h3 className="text-blue-300 font-semibold">En préparation</h3><span className="ml-auto text-gray-500 text-sm">{enPrep.length}</span></div>
            <div className="space-y-3">{enPrep.map((c) => (<div key={c.id} className="bg-[#1A1A1A] rounded-2xl p-4 border border-gray
