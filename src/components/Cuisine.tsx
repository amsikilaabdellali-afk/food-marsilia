import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, type Commande, type CommandeItem, type TableResto } from '@/lib/supabase';
import { ChefHat, Clock, CheckCircle2, Flame, Bell } from 'lucide-react';

type CmdWithItems = Commande & { items: CommandeItem[]; table_numero: number | null };

export default function Cuisine() {
  const [commandes, setCommandes] = useState<CmdWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const prevCountRef = useRef(0);

  const load = useCallback(async () => {
    const { data: cmds } = await supabase
      .from('commandes')
      .select('*')
      .in('statut', ['en_attente', 'en_preparation', 'pret'])
      .order('created_at', { ascending: true });

    if (cmds && cmds.length > 0) {
      const ids = cmds.map((c) => c.id);
      const tableIds = cmds.map((c) => c.table_id).filter(Boolean) as string[];
      const [{ data: items }, { data: tables }] = await Promise.all([
        supabase.from('commande_items').select('*').in('commande_id', ids),
        tableIds.length > 0 ? supabase.from('tables').select('*').in('id', tableIds) : Promise.resolve({ data: [] as TableResto[] }),
      ]);

      const itemsMap: Record<string, CommandeItem[]> = {};
      (items || []).forEach((it) => {
        (itemsMap[it.commande_id] = itemsMap[it.commande_id] || []).push(it);
      });
      const tableMap: Record<string, TableResto> = {};
      (tables || []).forEach((t) => { tableMap[t.id] = t; });

      const result: CmdWithItems[] = cmds.map((c) => ({
        ...c,
        items: itemsMap[c.id] || [],
        table_numero: c.table_id ? tableMap[c.table_id]?.numero ?? null : null,
      }));

      // Play sound if new orders arrived
      if (result.length > prevCountRef.current && prevCountRef.current > 0) {
        playNotificationSound();
      }
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

  const updateStatus = async (cmd: CmdWithItems, newStatus: string) => {
    await supabase.from('commandes').update({ statut: newStatus, updated_at: new Date().toISOString() }).eq('id', cmd.id);
    load();
  };

  const enAttente = commandes.filter((c) => c.statut === 'en_attente');
  const enPrep = commandes.filter((c) => c.statut === 'en_preparation');
  const pret = commandes.filter((c) => c.statut === 'pret');

  if (loading) return <LoadingSpinner />;

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
          {/* EN ATTENTE */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-gray-400" />
              <h3 className="text-gray-300 font-semibold">En attente</h3>
              <span className="ml-auto text-gray-500 text-sm">{enAttente.length}</span>
            </div>
            <div className="space-y-3">
              {enAttente.map((c) => (
                <KanbanCard key={c.id} cmd={c} now={now} onAction={() => updateStatus(c, 'en_preparation')} actionLabel="Commencer" actionIcon={Flame} actionClass="bg-blue-600 hover:bg-blue-500" />
              ))}
              {enAttente.length === 0 && <EmptyCol text="Aucune commande en attente" />}
            </div>
          </div>

          {/* EN PREPARATION */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-5 h-5 text-blue-400" />
              <h3 className="text-blue-300 font-semibold">En préparation</h3>
              <span className="ml-auto text-gray-500 text-sm">{enPrep.length}</span>
            </div>
            <div className="space-y-3">
              {enPrep.map((c) => (
                <KanbanCard key={c.id} cmd={c} now={now} onAction={() => updateStatus(c, 'pret')} actionLabel="Prêt !" actionIcon={CheckCircle2} actionClass="bg-green-600 hover:bg-green-500" />
              ))}
              {enPrep.length === 0 && <EmptyCol text="Rien en préparation" />}
            </div>
          </div>

          {/* PRET */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <h3 className="text-green-300 font-semibold">Prêt à servir</h3>
              <span className="ml-auto text-gray-500 text-sm">{pret.length}</span>
            </div>
            <div className="space-y-3">
              {pret.map((c) => (
                <KanbanCard key={c.id} cmd={c} now={now} isPret />
              ))}
              {pret.length === 0 && <EmptyCol text="Aucun plat prêt" />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KanbanCard({ cmd, now, onAction, actionLabel, actionIcon: ActionIcon, actionClass, isPret }: {
  cmd: CmdWithItems;
  now: number;
  onAction?: () => void;
  actionLabel?: string;
  actionIcon?: typeof Flame;
  actionClass?: string;
  isPret?: boolean;
}) {
  const elapsed = Math.floor((now - new Date(cmd.created_at).getTime()) / 1000);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const isUrgent = elapsed > 600 && !isPret;

  return (
    <div className={`bg-[#1A1A1A] rounded-2xl p-4 border ${
      isPret ? 'border-green-600' : isUrgent ? 'border-red-600' : 'border-gray-800'
    }`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="text-white font-bold">Table {cmd.table_numero || 'N/A'}</div>
          <div className="text-gray-500 text-xs">{cmd.serveur_nom || 'N/A'}</div>
        </div>
        <div className={`text-sm font-mono font-bold ${isPret ? 'text-green-400' : isUrgent ? 'text-red-400' : 'text-gray-400'}`}>
          {mins}:{secs.toString().padStart(2, '0')}
        </div>
      </div>

      <div className="space-y-1 mb-3">
        {cmd.items.map((it) => (
          <div key={it.id} className="flex items-center gap-2 text-sm">
            <span className="bg-[#FF6B00]/20 text-[#FF6B00] font-bold w-7 h-7 rounded-lg flex items-center justify-center text-xs">
              {it.qte}
            </span>
            <span className="text-gray-200">{it.menu_nom}</span>
          </div>
        ))}
      </div>

      {onAction && ActionIcon && actionLabel && actionClass && (
        <button
          onClick={onAction}
          className={`w-full flex items-center justify-center gap-2 text-white font-medium py-2.5 rounded-xl transition-colors ${actionClass}`}
        >
          <ActionIcon className="w-4 h-4" />
          {actionLabel}
        </button>
      )}

      {isPret && (
        <div className="text-center text-green-400 text-sm font-medium py-1">
          En attente de service
        </div>
      )}
    </div>
  );
}

function EmptyCol({ text }: { text: string }) {
  return (
    <div className="border-2 border-dashed border-gray-800 rounded-2xl p-8 text-center">
      <p className="text-gray-600 text-sm">{text}</p>
    </div>
  );
}

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.frequency.value = 880;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.5);
  } catch {
    // Audio not available
  }
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
