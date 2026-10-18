// @ts-nocheck
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Plus, Edit, Trash2, Search } from 'lucide-react';

export default function Admin({ activeTabProp }: any) {
  const [produits, setProduits] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategorie, setSelectedCategorie] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      // Jib ga3 produits
      const { data: produitsData } = await supabase.from('produits').select('*').order('created_at', { ascending: false });
      if(produitsData) setProduits(produitsData);

      // Jib categories - ila kayn table categories
      const { data: catsData } = await supabase.from('categories').select('*').order('nom');
      if(catsData && catsData.length > 0){
        setCategories(catsData);
      } else {
        // Ila ma kaynch table categories, jib men produits
        const uniq = [...new Set((produitsData||[]).map(p => p.categorie || p.category || p.type || 'Autre'))];
        setCategories(uniq.map(name => ({ id: name, nom: name, name: name, slug: name })));
      }
      setLoading(false);
    })();
  }, []);

  // Plats dyal categorie li mkhtara
  const platsFiltres = useMemo(() => {
    let list = produits;
    if(selectedCategorie){
      list = list.filter(p => {
        const cat = p.categorie || p.category || p.type || 'Autre';
        return cat === selectedCategorie || p.categorie_id === selectedCategorie || p.category_id === selectedCategorie;
      });
    }
    if(search){
      list = list.filter(p => p.nom.toLowerCase().includes(search.toLowerCase()));
    }
    return list;
  }, [produits, selectedCategorie, search]);

  if(loading) return <div className="min-h-screen bg-black text-zinc-600 flex items-center justify-center">Kaytchargi Menu 99...</div>;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* TABS BHAL TSAWIRA */}
      <div className="bg-black border-b border-zinc-900 p-2 flex gap-2 overflow-x-auto sticky top-0 z-20">
        <button className="bg-orange-600 text-white px-4 py-1.5 rounded-full text-[11px] font-black">MENU</button>
        <button className="bg-zinc-800 text-zinc-400 px-4 py-1.5 rounded-full text-[11px] font-bold">GESTION STOCK</button>
        <button className="bg-zinc-800 text-zinc-400 px-4 py-1.5 rounded-full text-[11px] font-bold">CATEGORIES</button>
        <button className="bg-zinc-800 text-zinc-400 px-4 py-1.5 rounded-full text-[11px] font-bold">TABLES</button>
        <button className="bg-zinc-800 text-zinc-400 px-4 py-1.5 rounded-full text-[11px] font-bold">USERS</button>
        <button className="bg-zinc-800 text-zinc-400 px-4 py-1.5 rounded-full text-[11px] font-bold">RAPPORTS</button>
      </div>

      <div className="max-w-[1100px] mx-auto p-4">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            {selectedCategorie && (
              <button onClick={()=>setSelectedCategorie(null)} className="bg-zinc-800 p-2 rounded-full hover:bg-zinc-700">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="font-bold text-[15px]">
              {selectedCategorie ? `${selectedCategorie} - ${platsFiltres.length} plats` : 'Menu 99 - Normal + Glovo'}
            </h2>
          </div>
          <button className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-full text-xs font-black flex items-center gap-1">
            + Plat
          </button>
        </div>

        {/* SEARCH ILA DAKHAL CATEGORIE */}
        {selectedCategorie && (
          <div className="mb-4 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2 flex items-center gap-2">
            <Search className="w-4 h-4 text-zinc-500" />
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={`Qalleb f ${selectedCategorie}...`} className="flex-1 bg-transparent outline-none text-sm" />
          </div>
        )}

        {/* 1- LAWAL: CATEGORIES */}
        {!selectedCategorie ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => {
              const catName = cat.nom || cat.name || cat.id;
              const count = produits.filter(p => (p.categorie || p.category || 'Autre') === catName).length;
              const coverPlat = produits.find(p => (p.categorie || 'Autre') === catName);

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategorie(catName)}
                  className="bg-[#121212] border border-zinc-800 hover:border-orange-500 rounded-xl overflow-hidden text-left group"
                >
                  <div className="h-[180px] bg-zinc-900 overflow-hidden relative">
                    {coverPlat?.image ? (
                      <img src={coverPlat.image} alt={catName} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600">
                        <span className="text-xs">Sans photo</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="font-black text-[16px] uppercase">{catName}</div>
                      <div className="text-[11px] text-zinc-300">{count} plats →</div>
                    </div>
                  </div>
                  <div className="p-3 bg-[#1a1a1a] flex justify-between items-center">
                    <span className="text-[11px] text-zinc-500">{count} ingrédients • {cat.slug || catName.toLowerCase()}</span>
                    <span className="text-orange-500 text-xs font-black">Voir →</span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          /* 2- MAN BA3D: LES REPAS DYAL CATEGORIE BHAL TSAWIRA */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {platsFiltres.map((plat) => (
              <div key={plat.id} className="bg-[#121212] border border-zinc-800 rounded-xl overflow-hidden group hover:border-zinc-700 transition">
                {/* SORA */}
                <div className="h-[200px] bg-zinc-800 relative overflow-hidden">
                  {plat.image ? (
                    <img src={plat.image} alt={plat.nom} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#2a2a2a]">
                      <span className="text-zinc-500 text-xs">Sans photo</span>
                    </div>
                  )}
                </div>
                {/* INFO BHAL TSAWIRA */}
                <div className="p-3 bg-[#1e1e1e] flex justify-between items-center">
                  <div className="flex-1">
                    <div className="font-bold text-[14px]">{plat.nom || plat.name}</div>
                    <div className="text-[11px] text-zinc-400 mt-1">
                      {plat.prix || plat.prix_normal || 60} DH Normal <span className="mx-1">|</span> {plat.prix_glovo || 70} DH Glovo 💰
                    </div>
                    <div className="text-[9px] text-zinc-600 mt-1">
                      {plat.ingredients?.length || 1} ingrédients • {plat.categorie || 'poulet_grillé'}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-3">
                    <button className="bg-[#2a2a2a] hover:bg-zinc-700 w-9 h-9 rounded-lg flex items-center justify-center">
                      <Edit className="w-4 h-4 text-zinc-400" />
                    </button>
                    <button className="bg-red-900/80 hover:bg-red-800 w-9 h-9 rounded-lg flex items-center justify-center">
                      <Trash2 className="w-4 h-4 text-red-300" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {platsFiltres.length === 0 && (
              <div className="col-span-2 text-center py-16 bg-zinc-900/50 rounded-xl border border-dashed border-zinc-800">
                <div className="text-zinc-500 text-sm mb-3">Ma kayn 7ta plat f {selectedCategorie}</div>
                <button className="bg-orange-600 px-5 py-2 rounded-full text-xs font-bold">+ Zid Plat f {selectedCategorie}</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
