// @ts-nocheck
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, ShoppingCart, Plus, Minus, ChefHat, Search } from 'lucide-react';
import { printFromTPEToKitchen } from '@/utils/tpePrint';

export default function Serveur({ user }: any) {
  const [produits, setProduits] = useState<any[]>([]);
  const [selectedCategorie, setSelectedCategorie] = useState<string | null>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [table, setTable] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('produits').select('*').eq('disponible', true).order('nom');
      if(data) setProduits(data);
      setLoading(false);
    })();
  }, []);

  // Jib categories men produits
  const categories = useMemo(() => {
    const cats = [...new Set(produits.map(p => p.categorie || p.category || 'Autre'))];
    return cats.filter(Boolean).sort();
  }, [produits]);

  const filteredProduits = useMemo(() => {
    let list = produits;
    if(selectedCategorie){
      list = list.filter(p => (p.categorie || p.category || 'Autre') === selectedCategorie);
    }
    if(search){
      list = list.filter(p => p.nom.toLowerCase().includes(search.toLowerCase()));
    }
    return list;
  }, [produits, selectedCategorie, search]);

  const addToCart = (p: any) => {
    const existing = cart.find(c => c.id === p.id);
    if(existing){
      setCart(cart.map(c => c.id === p.id ? {...c, qte: c.qte+1} : c));
    } else {
      setCart([...cart, {...p, qte: 1, note: ''}]);
    }
  };

  const updateQte = (id: string, delta: number) => {
    const item = cart.find(c => c.id === id);
    if(!item) return;
    const newQte = item.qte + delta;
    if(newQte <= 0) setCart(cart.filter(c => c.id !== id));
    else setCart(cart.map(c => c.id === id ? {...c, qte: newQte} : c));
  };

  const envoyer = async () => {
    if(!table || cart.length === 0){
      alert('Khtar table w zid repas!');
      return;
    }
    const commande = {
      id_table: table,
      table: table,
      serveur_id: user?.id,
      serveur: user?.identifiant || 's1',
      serveur_nom: user?.nom || 'Serveur',
      produits: cart,
      items: cart,
      statut: 'en_cuisine',
      total: cart.reduce((a,b)=>a+(b.prix*b.qte),0),
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase.from('commandes').insert([commande]).select();
    if(error){
      alert('Erreur: '+error.message);
    } else {
      // TPE → Imprimante Cuisine direct
      try{ printFromTPEToKitchen(data?.[0] || commande); }catch{}
      alert(`✅ Commande sayfat! Table ${table} → Cuisine`);
      setCart([]);
      setSelectedCategorie(null);
    }
  };

  if(loading) return <div className="min-h-screen bg-black flex items-center justify-center text-zinc-600">Kaytchargi menu...</div>;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* HEADER */}
      <div className="bg-zinc-900 border-b border-zinc-800 p-3 flex items-center gap-3 sticky top-0 z-20">
        {selectedCategorie ? (
          <button onClick={()=>setSelectedCategorie(null)} className="bg-zinc-800 p-2.5 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : null}
        <div className="flex-1">
          <h1 className="font-black text-sm">
            {selectedCategorie ? selectedCategorie.toUpperCase() : 'MENU - CATEGORIES'}
          </h1>
          <p className="text-[10px] text-zinc-500">
            {selectedCategorie ? `${filteredProduits.length} repas` : `${categories.length} categories • ${produits.length} repas`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input value={table} onChange={e=>setTable(e.target.value)} placeholder="Table" className="w-16 bg-black border border-zinc-700 rounded-full px-3 py-2 text-center font-black text-sm" />
          <div className="bg-yellow-500 text-black px-3 py-2 rounded-full font-black text-xs flex items-center gap-1">
            <ShoppingCart className="w-4 h-4" /> {cart.reduce((a,b)=>a+b.qte,0)}
          </div>
        </div>
      </div>

      {/* SEARCH */}
      <div className="p-3">
        <div className="bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2.5 flex items-center gap-2">
          <Search className="w-4 h-4 text-zinc-500" />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={selectedCategorie ? `Qalleb f ${selectedCategorie}...` : 'Qalleb f ga3 menu...'} className="flex-1 bg-transparent outline-none text-sm" />
        </div>
      </div>

      {/* LAWAL: CATEGORIES */}
      {!selectedCategorie ? (
        <div className="flex-1 p-3 grid grid-cols-2 gap-3 content-start">
          {categories.map((cat) => {
            const count = produits.filter(p => (p.categorie||'Autre')===cat).length;
            return (
              <button
                key={cat}
                onClick={()=>setSelectedCategorie(cat)}
                className="bg-zinc-900 hover:bg-zinc-800 border-2 border-zinc-800 hover:border-yellow-500 rounded-2xl p-5 text-left transition-all active:scale-95 group"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition">
                  <ChefHat className="w-7 h-7 text-black" />
                </div>
                <div className="font-black text-sm uppercase">{cat}</div>
                <div className="text-[11px] text-zinc-500 mt-1">{count} repas →</div>
              </button>
            );
          })}
          {categories.length===0 && <div className="col-span-2 text-center py-10 text-zinc-600">Ma kayn 7ta categorie</div>}
        </div>
      ) : (
        /* MAN BA3D: LES REPAS DYAL CATEGORIE */
        <div className="flex-1 p-3 grid grid-cols-2 gap-2.5 content-start pb-32">
          {filteredProduits.map((p) => (
            <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 flex flex-col">
              {p.image && <img src={p.image} alt={p.nom} className="w-full h-24 object-cover rounded-xl mb-2" />}
              <div className="flex-1">
                <div className="font-bold text-[13px] leading-tight">{p.nom}</div>
                <div className="text-[11px] text-zinc-500 mt-0.5 line-clamp-2">{p.description || ''}</div>
              </div>
              <div className="flex justify-between items-center mt-3">
                <span className="font-black text-yellow-400 text-sm">{p.prix} DH</span>
                <button onClick={()=>addToCart(p)} className="bg-white text-black px-3.5 py-1.5 rounded-full font-black text-xs flex items-center gap-1 active:scale-90">
                  <Plus className="w-3 h-3" /> Zid
                </button>
              </div>
            </div>
          ))}
          {filteredProduits.length===0 && (
            <div className="col-span-2 text-center py-10 text-zinc-600">
              Ma kayn 7ta repas f {selectedCategorie}
              <br/>
              <button onClick={()=>setSelectedCategorie(null)} className="mt-3 bg-zinc-800 px-4 py-2 rounded-full text-xs">Rje3 l categories</button>
            </div>
          )}
        </div>
      )}

      {/* PANIER FIXED */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t-2 border-yellow-500 p-3 z-30 max-h-[45vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-black text-xs">Table {table || '?'} • {cart.length} articles</h3>
            <span className="font-black text-yellow-400">{cart.reduce((a,b)=>a+(b.prix*b.qte),0)} DH</span>
          </div>
          <div className="space-y-2 mb-3 max-h-32 overflow-y-auto">
            {cart.map((c) => (
              <div key={c.id} className="flex justify-between items-center bg-black rounded-full px-3 py-1.5">
                <span className="text-xs flex-1 truncate">{c.nom}</span>
                <div className="flex items-center gap-2">
                  <button onClick={()=>updateQte(c.id,-1)} className="bg-zinc-800 w-6 h-6 rounded-full flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                  <span className="font-black text-xs w-5 text-center">{c.qte}</span>
                  <button onClick={()=>updateQte(c.id,1)} className="bg-zinc-800 w-6 h-6 rounded-full flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                </div>
              </div>
            ))}
          </div>
          <button onClick={envoyer} className="w-full bg-yellow-500 text-black py-3.5 rounded-full font-black text-sm flex items-center justify-center gap-2 active:scale-95">
            <ChefHat className="w-5 h-5" /> SAYFAT L CUISINE → {table || 'TABLE'}
          </button>
        </div>
      )}
    </div>
  );
}
