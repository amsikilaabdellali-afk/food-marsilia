// @ts-nocheck
import { useEffect, useState, useRef } from 'react';
import Login from './components/Login';
import Admin from './components/Admin';
import Caisse from './components/Caisse';
import Cuisine from './components/Cuisine';
import Serveur from './components/Serveur';
import { Lock, Crown, DollarSign, RefreshCw } from 'lucide-react';

const BADGE_PATRON_DEFAULT = ['0002355916', '2355916', 'MARSILIA2024', 'PATRON999'];
const BADGE_CAISSE_DEFAULT = ['CAISSE2024', '1111', 'CAISSE123'];
const MASTER_CODE = 'ADMIN999';

export default function App(){
  const [profil,setProfil]=useState<any>(null);
  const [badgeVerified, setBadgeVerified] = useState(false);
  const [badgeType, setBadgeType] = useState<'patron' | 'caisse' | null>(null);
  const [showBadgePopup, setShowBadgePopup] = useState(false);
  const [badgeInput, setBadgeInput] = useState('');
  const badgeRef = useRef<HTMLInputElement>(null);
  const [showChangeBadge, setShowChangeBadge] = useState<null | {step: 'master' | 'choose' | 'new', type: 'patron' | 'caisse'}>(null);
  const [masterInput, setMasterInput] = useState('');
  const [newBadgeInput, setNewBadgeInput] = useState('');

  const getPatronBadges = () => {
    const custom = JSON.parse(localStorage.getItem('patron_badges_patron') || '[]');
    return [...BADGE_PATRON_DEFAULT, ...custom];
  };
  const getCaisseBadges = () => {
    const custom = JSON.parse(localStorage.getItem('patron_badges_caisse') || '[]');
    return [...BADGE_CAISSE_DEFAULT, ...custom];
  };

  const checkBadgeType = (val: string): 'patron' | 'caisse' | null => {
    const clean = val.trim().replace(/\s/g,'');
    const patron = getPatronBadges();
    const caisse = getCaisseBadges();
    if(patron.some(b => clean.includes(b) || b.includes(clean) || clean === b) || clean.includes('2355916')) return 'patron';
    if(caisse.some(b => clean.includes(b) || b.includes(clean) || clean === b)) return 'caisse';
    return null;
  };

  useEffect(()=>{ const s=localStorage.getItem('marsilia_profil'); if(s){ try{ setProfil(JSON.parse(s)); }catch{} } },[]);
  useEffect(()=>{ if(showBadgePopup) setTimeout(()=>badgeRef.current?.focus(), 150); },[showBadgePopup]);

  if(!profil) return <Login onLogin={(p:any)=>{localStorage.setItem('marsilia_profil',JSON.stringify(p));setProfil(p); setBadgeVerified(false); setShowBadgePopup(true);}} />;

  const role=String(profil.user.role||'').toLowerCase().trim();
  const id=String(profil.user.identifiant||'').toLowerCase().trim();
  
  // ===== FIX: said ma hiyach serveur! =====
  const isServeur = role==='serveur' || /^s\d+$/.test(id) || (id.startsWith('s') && id !== 'said' && id.length <= 3);
  const isCuisine = role==='cuisine' || id==='said';
  const isCaisse = role==='caisse' || id==='c1';
  const isAdmin = !isServeur && !isCuisine && !isCaisse;

  const onLogout=()=>{localStorage.clear();setProfil(null);setBadgeVerified(false);setBadgeType(null);location.reload();};

  const confirmBadge = () => {
    const type = checkBadgeType(badgeInput.trim());
    if(type){
      if(type==='caisse' && !isCaisse){
        alert('❌ Badge CAISSE ghir kaydkhal CAISSE safi\nKhass PATRON bach tadkhal '+role.toUpperCase());
        setBadgeInput(''); return;
      }
      setBadgeType(type); setBadgeVerified(true); setShowBadgePopup(false); setBadgeInput('');
    } else {
      alert('❌ Badge ghalat!'); setBadgeInput('');
    }
  };

  const startChangeBadge = () => { setMasterInput(''); setShowChangeBadge({step:'master', type:'patron'}); };
  const confirmMaster = () => {
    if(masterInput.trim() !== MASTER_CODE){ alert('❌ MASTER CODE ghalat!'); return; }
    setMasterInput(''); setShowChangeBadge({step:'choose', type:'patron'});
  };
  const confirmNewBadge = () => {
    const val = newBadgeInput.trim().replace(/\s/g,'');
    if(val.length < 2){ alert('Badge sghir'); return; }
    if(showChangeBadge?.type === 'patron'){
      const custom = JSON.parse(localStorage.getItem('patron_badges_patron') || '[]');
      localStorage.setItem('patron_badges_patron', JSON.stringify([val, ...custom].slice(0,10)));
    } else {
      const custom = JSON.parse(localStorage.getItem('patron_badges_caisse') || '[]');
      localStorage.setItem('patron_badges_caisse', JSON.stringify([val, ...custom].slice(0,10)));
    }
    alert(`✅ Badge ${showChangeBadge?.type} tbadal!`);
    setShowChangeBadge(null); setNewBadgeInput('');
  };

  const BadgePopup = () => (
    <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border-2 border-yellow-400 rounded-2xl p-6 w-full max-w-sm text-center">
        <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4"><Lock className="w-10 h-10 text-black" /></div>
        <h3 className="font-black text-white">BADGE REQUIS 🔒</h3>
        <p className="text-zinc-400 text-xs mt-1">Bach tadkhal {role.toUpperCase()} - {id.toUpperCase()} - {isCuisine?'CUISINE': isCaisse?'CAISSE': isServeur?'SERVEUR':'ADMIN'}</p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
          <div className="bg-zinc-800 border border-yellow-600 rounded-lg p-3"><div className="text-yellow-400 font-black">PATRON 👑</div><div className="text-zinc-500 text-[9px]">Lkochi</div><div className="text-zinc-600 mt-1">••••••••</div></div>
          <div className="bg-zinc-800 border border-green-600 rounded-lg p-3"><div className="text-green-400 font-black">CAISSE 💰</div><div className="text-zinc-500 text-[9px]">Ghir Caisse</div><div className="text-zinc-600 mt-1">••••••••</div></div>
        </div>
        <input ref={badgeRef} value={badgeInput} onChange={e=>setBadgeInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&confirmBadge()} type="password" placeholder="••••••••" className="w-full mt-3 bg-black border-2 border-yellow-400 rounded-xl p-4 text-center text-white font-black text-xl tracking-[0.5em] outline-none" autoFocus />
        <div className="flex gap-2 mt-4">
          <button onClick={onLogout} className="flex-1 bg-zinc-800 py-4 rounded-xl font-bold">Logout</button>
          <button onClick={confirmBadge} className="flex-1 bg-yellow-400 text-black py-4 rounded-xl font-black">Valider ✅</button>
        </div>
      </div>
    </div>
  );

  const ChangeBadgePopup = () => {
    if(!showChangeBadge) return null;
    return (
      <div className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center p-4">
        <div className="bg-zinc-900 border-2 border-orange-500 rounded-2xl p-6 w-full max-w-sm text-center">
          {showChangeBadge.step==='master'?(
            <>
              <h3 className="font-black text-white">MASTER CODE 🔑</h3>
              <input value={masterInput} onChange={e=>setMasterInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&confirmMaster()} type="password" placeholder="••••••••" className="w-full mt-3 bg-black border-2 border-orange-500 rounded-xl p-4 text-center text-white font-black text-xl tracking-[0.5em] outline-none" autoFocus />
              <div className="flex gap-2 mt-4"><button onClick={()=>setShowChangeBadge(null)} className="flex-1 bg-zinc-800 py-3 rounded-xl">Annuler</button><button onClick={confirmMaster} className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-black">Suivant</button></div>
            </>
          ): showChangeBadge.step==='choose'?(
            <>
              <h3 className="font-black text-white">Achno tbadal?</h3>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <button onClick={()=>setShowChangeBadge({step:'new', type:'patron'})} className="bg-yellow-500/20 border-2 border-yellow-500 rounded-xl p-4"><div className="font-black text-yellow-400 text-xs">PATRON 👑</div></button>
                <button onClick={()=>setShowChangeBadge({step:'new', type:'caisse'})} className="bg-green-500/20 border-2 border-green-500 rounded-xl p-4"><div className="font-black text-green-400 text-xs">CAISSE 💰</div></button>
              </div>
            </>
          ):(
            <>
              <h3 className="font-black text-white text-sm">BADGE {showChangeBadge.type.toUpperCase()} JDID</h3>
              <input value={newBadgeInput} onChange={e=>setNewBadgeInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&confirmNewBadge()} type="password" placeholder="••••••••" className="w-full mt-3 bg-black border-2 rounded-xl p-4 text-center text-white font-black text-lg tracking-[0.5em] outline-none border-yellow-500" autoFocus />
              <div className="flex gap-2 mt-4"><button onClick={()=>setShowChangeBadge(null)} className="flex-1 bg-zinc-800 py-3 rounded-xl">Annuler</button><button onClick={confirmNewBadge} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-black">Save ✅</button></div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black">
      {!badgeVerified && !isServeur && <BadgePopup />}
      <ChangeBadgePopup />
      {badgeVerified && !isServeur && (
        <div className="bg-zinc-900 border-b border-zinc-800 px-3 py-2 flex justify-between items-center sticky top-0 z-40">
          <div className={`text-[10px] font-black px-3 py-1 rounded-full ${badgeType==='patron'?'bg-yellow-500 text-black':'bg-green-600 text-white'}`}>
            {badgeType==='patron'?'PATRON 👑':'CAISSE 💰'} - {id.toUpperCase()} - {isCuisine?'CUISINE': isCaisse?'CAISSE':'ADMIN'}
          </div>
          <div className="flex gap-2">
            <button onClick={startChangeBadge} className="bg-orange-600 text-white px-2 py-1 rounded-full text-[9px] font-black">BADAL</button>
            <button onClick={()=>{setBadgeVerified(false); setShowBadgePopup(true);}} className="bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-black">🔒</button>
            <button onClick={onLogout} className="bg-white text-black px-2 py-1 rounded-full text-xs font-bold">Logout</button>
          </div>
        </div>
      )}
      
      {/* FIX HNA - TARTIB SAHIH */}
      {isCaisse && (badgeVerified || true) && <Caisse profil={profil} onLogout={onLogout} />}
      {isCuisine && (badgeType==='patron' || badgeVerified) && <Cuisine profil={profil} onLogout={onLogout} />}
      {isServeur && <Serveur profil={profil} onLogout={onLogout} />}
      {isAdmin && badgeType==='patron' && <div className="min-h-screen bg-black"><div className="bg-red-600 text-white text-center py-2 text-xs font-bold flex justify-center gap-3">ADMIN: {profil.user.nom} ({profil.user.identifiant})<button onClick={onLogout} className="bg-black px-3 py-1 rounded">Logout</button></div><Admin /></div>}
      
      {isCuisine && badgeType==='caisse' && (
        <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
          <div><div className="text-6xl mb-4">🔒</div><h2 className="text-white font-black">Badge CAISSE ghir CAISSE</h2><p className="text-zinc-500 text-xs mt-2">CUISINE khass PATRON</p><button onClick={()=>{setBadgeVerified(false); setShowBadgePopup(true);}} className="mt-4 bg-yellow-500 text-black px-6 py-3 rounded-xl font-black">Badal Badge 👑</button></div>
        </div>
      )}
      {isAdmin && badgeType!=='patron' && badgeVerified && (
        <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
          <div><div className="text-6xl mb-4">🔒</div><h2 className="text-white font-black">ADMIN khass PATRON</h2><button onClick={()=>{setBadgeVerified(false); setShowBadgePopup(true);}} className="mt-4 bg-yellow-500 text-black px-6 py-3 rounded-xl font-black">Badal Badge 👑</button></div>
        </div>
      )}
    </div>
  );
}
