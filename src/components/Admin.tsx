import { useState } from 'react';
import {
  LayoutDashboard, UtensilsCrossed, Package, ClipboardList, Leaf, Tags, Users, FileBarChart
} from 'lucide-react';
import { DashboardTab } from './admin/DashboardTab';
import { MenuTab } from './admin/MenuTab';
import { StockTab } from './admin/StockTab';
import { CommandesTab } from './admin/CommandesTab';
import { MatiereTab } from './admin/MatiereTab';
import { CategoriesTab } from './admin/CategoriesTab';
import { UtilisateursTab } from './admin/UtilisateursTab';
import { RapportsTab } from './admin/RapportsTab';

type Tab = 'dashboard' | 'menu' | 'stock' | 'commandes' | 'matiere' | 'categories' | 'utilisateurs' | 'rapports';

export default function Admin() {
  const [tab, setTab] = useState<Tab>('dashboard');

  const tabs: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'menu', label: 'Menu', icon: UtensilsCrossed },
    { id: 'stock', label: 'Stock', icon: Package },
    { id: 'commandes', label: 'Commandes', icon: ClipboardList },
    { id: 'matiere', label: 'Matière', icon: Leaf },
    { id: 'categories', label: 'Catégories', icon: Tags },
    { id: 'utilisateurs', label: 'Utilisateurs', icon: Users },
    { id: 'rapports', label: 'Rapports', icon: FileBarChart },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-20">
      <div className="sticky top-0 z-30 bg-[#0A0A0A]/95 backdrop-blur border-b border-gray-800">
        <div className="flex items-center gap-1 px-2 py-2 overflow-x-auto scrollbar-hide">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                  tab === t.id ? 'bg-[#FF6B00] text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 max-w-6xl mx-auto">
        {tab === 'dashboard' && <DashboardTab />}
        {tab === 'menu' && <MenuTab />}
        {tab === 'stock' && <StockTab />}
        {tab === 'commandes' && <CommandesTab />}
        {tab === 'matiere' && <MatiereTab />}
        {tab === 'categories' && <CategoriesTab />}
        {tab === 'utilisateurs' && <UtilisateursTab />}
        {tab === 'rapports' && <RapportsTab />}
      </div>
    </div>
  );
}
