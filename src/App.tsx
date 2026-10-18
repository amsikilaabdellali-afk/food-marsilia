// @ts-nocheck
import { useEffect, useState, useRef } from 'react';
import Login from './components/Login';
import Admin from './components/Admin';
import Caisse from './components/Caisse';
import Cuisine from './components/Cuisine';
import Serveur from './components/Serveur';
import { Lock, Wifi, X, RefreshCw, Crown, DollarSign } from 'lucide-react';

// ===== DEUX BADGES =====
const BADGE_PATRON_DEFAULT = ['0002355916', '2355916', 'MARSILIA2024', 'PATRON999', 'ADMIN999'];
const BADGE_CAISSE_DEFAULT = ['CAISSE2024', '1111', 'CAISSE123', '1234'];
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

  useEffect(()=>{ 
    const s=localStorage.getItem('marsilia_profil'); 
    if(s){ try{ setProfil(JSON.parse(s)); }catch{} } 
  },[]);

  useEffect(()=>{
    if(showBadgePopup) setTimeout(()=>badgeRef.current?.focus(), 150);
  },[showBadgePopup, showChangeBadge]);

  if(!profil) return <Login onLogin={(p:any)=>{localStorage.setItem('marsilia_profil',JSON.stringify(p));setProfil(p); setBadgeVerified(false); setShowBadgePopup(true);}} />;

  const role=String(profil.user.role||'').toLowerCase().trim();
  const id=String(profil.user.identifiant||'').toLowerCase().trim();
  const isServeurPhone = id.startsWith('s') || role === 'serveur';
  const onLogout=()=>{localStorage.clear();setProfil(null);setBadgeVerified(false);setBadgeType(null);location.reload();};

  const confirmBadge = () => {
    const type = checkBadgeType(badgeInput.trim());
    if(type){
      // Ila caisse badge w bgha yadkhal ghir caisse
      if(type==='caisse' && !(role==='caisse' || id==='c1')){
        alert('❌ Badge CAISSE ghir kaydkhal CAISSE safi\nPatron howa li yadkhal lkochi');
        setBadgeInput('');
        return;
      }
      setBadgeType(type);
      setBadgeVerified(true);
      setShowBadgePopup(false);
      setBadgeInput('');
      localStorage.setItem('patron_permanent_ok','true');
      localStorage.setItem('patron_last_type', type);
    } else {
      alert('❌ Badge ghalat!\nPatron: 0002355916\nCaisse: CAISSE2024 / 1111');
      setBadgeInput('');
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
      alert(`✅ Badge PATRON tbadal!\nJdid: ${val}\nYadkhal lkochi`);
    } else {
      const custom = JSON.parse(localStorage.getItem('patron_badges_caisse') || '[]');
      localStorage.setItem('patron_badges_caisse', JSON.stringify([val, ...custom].slice(0,10)));
      alert(`✅ Badge CAISSE tbadal!\nJdid: ${val}\nGhir CAISSE`);
    }
    setShowChangeBadge(null); setNewBadgeInput('');
  };

  if(isServeurPhone){
    if(role==='serveur'||id.startsWith('s')) return <Serveur profil={profil} onLogout={onLogout} />;
  }

  const BadgePopup = () => (
    <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border-2 border-yellow-400 rounded-2xl p-6 w-full max-w-sm text-center">
        <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse"><Lock className="w-10 h-10 text-black" /></div>
        <h3 className="font-black text-white text-lg">BADGE REQUIS 🔒</h3>
        <p className="text-zinc-400 text-xs mt-1">Bach tadkhal {role.toUpperCase() || id.toUpperCase()}</p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
          <div className="bg-zinc-800 border border-yellow-600 rounded-lg p-2"><div className="text-yellow-400 font-black">PATRON 👑</div><div className="text-zinc-400">Yadkhal lkochi</div><div className="text-white">0002355916</div></div>
          <div className="bg-zinc-800 border border-green-600 rounded-lg p-2"><div className="text-green-400 font-black">CAISSE 💰</div><div className="text-zinc-400">Ghir Caisse</div><div className="text-white">CAISSE2024</div></div>
        </div>
        <input ref={badgeRef} value={badgeInput} onChange={e=>setBadgeInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&confirmBadge()} type="password" placeholder="••••••••" className="w-full mt-4 bg-black border-2 border-yellow-400 rounded-xl p-4 text-center text-white font-black text-xl tracking-[0.5em] outline-none" autoFocus />
        <div className="flex gap-2 mt-4">
          <button onClick={onLogout} className="flex-1 bg-zinc-800 py-4 rounded-xl font-bold">Logout</button>
          <button onClick={confirmBadge} className="flex-1 bg-yellow-400 text-black py-4 rounded-xl font-black">Valider ✅</button>
        </div>
        <button onClick={startChangeBadge} className="w-full mt-3 bg-orange-600/20 border border-orange-600 text-orange-400 py-2 rounded-xl text-xs font-bold">Badal Badge? 🔑 MASTER</button>
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
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-3"><Lock className="w-8 h-8 text-white" /></div>
              <h3 className="font-black text-white">MASTER CODE 🔑</h3>
              <input value={masterInput} onChange={e=>setMasterInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&confirmMaster()} type="password" placeholder="ADMIN999" className="w-full mt-3 bg-black border-2 border-orange-500 rounded-xl p-4 text-center text-white font-black text-xl tracking-[0.5em] outline-none" autoFocus />
              <div className="flex gap-2 mt-4"><button onClick={()=>setShowChangeBadge(null)} className="flex-1 bg-zinc-800 py-3 rounded-xl font-bold">Annuler</button><button onClick={confirmMaster} className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-black">Suivant ➡️</button></div>
            </>
          ): showChangeBadge.step==='choose'?(
            <>
              <h3 className="font-black text-white">Achno bghiti tbadal?</h3>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <button onClick={()=>setShowChangeBadge({step:'new', type:'patron'})} className="bg-yellow-500/20 border-2 border-yellow-500 rounded-xl p-4"><Crown className="w-8 h-8 mx-auto text-yellow-400"/><div className="font-black text-yellow-400 mt-2">PATRON 👑</div><div className="text-[10px] text-zinc-400">Yadkhal lkochi</div></button>
                <button onClick={()=>setShowChangeBadge({step:'new', type:'caisse'})} className="bg-green-500/20 border-2 border-green-500 rounded-xl p-4"><DollarSign className="w-8 h-8 mx-auto text-green-400"/><div className="font-black text-green-400 mt-2">CAISSE 💰</div><div className="text-[10px] text-zinc-400">Ghir Caisse</div></button>
              </div>
              <button onClick={()=>setShowChangeBadge(null)} className="w-full mt-3 bg-zinc-800 py-2 rounded-xl text-xs">Annuler</button>
            </>
          ):(
            <>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${showChangeBadge.type==='patron'?'bg-yellow-500':'bg-green-500'}`}><RefreshCw className="w-8 h-8 text-white" /></div>
              <h3 className="font-black text-white">BADGE {showChangeBadge.type.toUpperCase()} JDID 🆕</h3>
              <p className="text-xs text-zinc-400 mt-1">Type: {showChangeBadge.type === 'patron' ? 'Yadkhal lkochi 👑' : 'Ghir Caisse 💰'}</p>
              <input value={newBadgeInput} onChange={e=>setNewBadgeInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&confirmNewBadge()} type="password" placeholder="Qareb bracelet jdid" className={`w-full mt-3 bg-black border-2 rounded-xl p-4 text-center text-white font-black text-lg outline-none ${showChangeBadge.type==='patron'?'border-yellow-500':'border-green-500'}`} autoFocus />
              <div className="flex gap-2 mt-4"><button onClick={()=>setShowChangeBadge(null)} className="flex-1 bg-zinc-800 py-3 rounded-xl font-bold">Annuler</button><button onClick={confirmNewBadge} className={`flex-1 py-3 rounded-xl font-black text-white ${showChangeBadge.type==='patron'?'bg-yellow-500 text-black':'bg-green-600'}`}>Enregistrer ✅</button></div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black">
      {!badgeVerified && !isServeurPhone && <BadgePopup />}
      <ChangeBadgePopup />
      {badgeVerified && (
        <div className="bg-zinc-900 border-b border-zinc-800 px-3 py-2 flex justify-between items-center sticky top-0 z-40">
          <div className={`text-xs font-black px-3 py-1 rounded-full flex items-center gap-1 ${badgeType==='patron'?'bg-yellow-500 text-black':'bg-green-600 text-white'}`}>
            {badgeType==='patron'?<><Crown className="w-3 h-3"/> PATRON - LKOCHI 👑</>:<><DollarSign className="w-3 h-3"/> CAISSE - GHIR CAISSE 💰</>}
          </div>
          <div className="flex gap-2">
            <button onClick={startChangeBadge} className="bg-orange-600 text-white px-3 py-1 rounded-full text-[10px] font-black">BADAL BADGE</button>
            <button onClick={()=>{setBadgeVerified(false); setShowBadgePopup(true);}} className="bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-black">BADGE 🔒</button>
            <button onClick={onLogout} className="bg-white text-black px-3 py-1 rounded-full text-xs font-bold">Logout</button>
          </div>
        </div>
      )}
      {badgeVerified || isServeurPhone ? (
        <>
          {role==='caisse'||id==='c1' ? <Caisse profil={profil} onLogout={onLogout} /> : null}
          {role==='cuisine'||id==='said' ? (
            badgeType==='patron' ? <Cuisine profil={profil} onLogout={onLogout} /> : <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center"><div><div className="text-6xl mb-4">🔒</div><h2 className="text-white font-black text-xl">Badge CAISSE ma 3andouch lha9</h2><p className="text-zinc-500 text-sm mt-2">Ghir Badge PATRON li yadkhal CUISINE<br/>Badge dyalek: CAISSE - Ghir CAISSE</p><button onClick={()=>{setBadgeVerified(false); setShowBadgePopup(true);}} className="mt-6 bg-yellow-500 text-black px-6 py-3 rounded-xl font-black">Badal Badge 👑</button><button onClick={onLogout} className="mt-3 block w-full bg-zinc-800 text-white py-2 rounded-xl text-xs">Logout</button></div></div>
          ) : null}
          {isServeurPhone ? <Serveur profil={profil} onLogout={onLogout} /> : null}
          {!(role==='caisse'||id==='c1'||role==='cuisine'||id==='said'||isServeurPhone) ? (
            badgeType==='patron' ? <div className="min-h-screen bg-black"><div className="bg-red-600 text-white text-center py-2 text-xs font-bold flex justify-center gap-3">ADMIN: {profil.user.nom} ({profil.user.identifiant}) - PATRON 👑<button onClick={onLogout} className="bg-black px-3 py-1 rounded">Logout</button></div><Admin /></div> : <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center"><div><div className="text-6xl mb-4">🔒</div><h2 className="text-white font-black text-xl">Badge CAISSE ma 3andouch lha9</h2><p className="text-zinc-500 text-sm mt-2">ADMIN khass PATRON</p><button onClick={()=>{setBadgeVerified(false); setShowBadgePopup(true);}} className="mt-6 bg-yellow-500 text-black px-6 py-3 rounded-xl font-black">Badal Badge 👑</button></div></div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
