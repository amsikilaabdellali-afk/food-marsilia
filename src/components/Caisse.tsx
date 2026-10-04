// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export default function Caisse({ profil, onLogout }: any) {
  const [cmds, setCmds] = useState<any[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const load = useCallback(async () => {
    const start = new Date(date); start.setHours(0,0,0,0);
    const end = new Date(date); end.setHours(23,59,59,999);
    const { data } = await supabase.from('commandes').select('*').gte('created_at', start.toISOString()).lte('created_at', end.toISOString()).order('created_at', {ascending:false});
    setCmds(data || []);
  }, [date]);

  useEffect(() => { load(); const id=setInterval(load,5000); return ()=>clearInterval(id); }, [load]);

  const payer = async (c:any, method:string) => {
    if(!confirm(`Payer ${c.total} DH en ${method}?`)) return;
    await supabase.from('commandes').update({ statut:'paye', payment_method:method, paye_at:new Date().toISOString() }).eq('id', c.id);
    load();
  };

  const total = cmds.filter(c=>c.statut==='paye').reduce((s,c)=>s+Number(c.total_final||c.total||0),0);

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      <div className="bg-yellow-500 text-black p-3 flex justify-between items-center sticky top-0 z-20">
        <div className="font-black">CAISSE: {profil?.user?.nom} ({profil?.user?.identifiant})</div>
        <button onClick={onLogout} className="bg-black text-white px-4 py-2 rounded-xl text-xs font-bold">Logout</button>
      </div>
      <div className="p-3 max-w-5xl mx-auto">
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-3 mb-3"/>
        <div className="bg-zinc-900 rounded-2xl p-4 text-center font-black text-xl mb-3 border border-zinc-700">{total.toFixed(0)} DH encaissé - {cmds.filter(c=>c.statut==='paye').length} payées</div>

        <h3 className="font-black text-orange-400 mb-2">À PAYER ({cmds.filter(c=>c.statut!=='paye').length})</h3>
        {cmds.filter(c=>c.statut!=='paye').map((c:any)=>(
          <div key={c.id} className="bg-zinc-900 border border-orange-800 rounded-xl p-3 mb-2">
            <div className="flex justify-between font-bold"><span>Table {c.table_numero||c.table_id?.slice(0,4)} - {c.serveur_nom}</span><span className="text-orange-400">{Number(c.total||0).toFixed(0)} DH</span></div>
            <div className="text-xs text-zinc-500">{new Date(c.created_at).toLocaleTimeString()} - {c.statut}</div>
            <div className="grid grid-cols-4 gap-2 mt-3">
              <button onClick={()=>payer(c,'espece')} className="bg-green-600 py-3 rounded-xl font-black text-xs">ESPECE</button>
              <button onClick={()=>payer(c,'tpe')} className="bg-blue-600 py-3 rounded-xl font-black text-xs">TPE</button>
              <button onClick={()=>payer(c,'cheque')} className="bg-purple-600 py-3 rounded-xl font-black text-xs">CHEQUE</button>
              <button onClick={()=>payer(c,'offert')} className="bg-zinc-700 py-3 rounded-xl font-black text-xs">OFFERT</button>
            </div>
          </div>
        ))}

        <h3 className="font-black text-green-400 mt-6 mb-2">PAYÉES ({cmds.filter(c=>c.statut==='paye').length})</h3>
        {cmds.filter(c=>c.statut==='paye').map((c:any)=>(
          <div key={c.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 mb-2 opacity-70">
            <div className="flex justify-between text-sm"><span>Table {c.table_numero} - {c.serveur_nom}</span><span>{Number(c.total_final||c.total||0).toFixed(0)} DH - {c.payment_method}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}
