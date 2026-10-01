import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [codeRestaurant, setCodeRestaurant] = useState('')
  const [identifiant, setIdentifiant] = useState('')
  const [codeAcces, setCodeAcces] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const cleanCode = codeRestaurant.trim().toLowerCase()
      const { data: restaurants } = await supabase.from('restaurants').select('*').or(`code.eq.${cleanCode},slug.eq.${cleanCode}`)
      if (!restaurants || restaurants.length === 0) throw new Error('Code restaurant incorrect')
      const restaurant = restaurants[0]
      const { data: users } = await supabase.from('utilisateurs').select('*').eq('restaurant_id', restaurant.id).eq('identifiant', identifiant.trim()).eq('code_acces', codeAcces.trim())
      if (!users || users.length === 0) throw new Error('Identifiant ou code incorrect')
      const user = users[0]
      localStorage.setItem('restaurant', JSON.stringify(restaurant))
      localStorage.setItem('user', JSON.stringify(user))
      window.location.href = '/'
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mb-4 text-2xl">🍴</div>
          <h1 className="text-2xl font-bold text-white">Marsilia Food</h1>
          <p className="text-sm text-gray-500 mt-1">Système de gestion restaurant</p>
        </div>
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Code restaurant</label>
              <input type="text" value={codeRestaurant} onChange={(e) => setCodeRestaurant(e.target.value)} placeholder="marsilia" className="w-full bg-[#0f0f0f] border border-gray-700 rounded-xl px-4 py-3 text-white text-sm" required />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Identifiant</label>
              <input type="text" value={identifiant} onChange={(e) => setIdentifiant(e.target.value)} placeholder="admin" className="w-full bg-[#0f0f0f] border border-gray-700 rounded-xl px-4 py-3 text-white text-sm" required />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Code d'accès</label>
              <input type="password" value={codeAcces} onChange={(e) => setCodeAcces(e.target.value)} placeholder="••••••" className="w-full bg-[#0f0f0f] border border-gray-700 rounded-xl px-4 py-3 text-white text-sm" required />
            </div>
            {error && <p className="text-xs text-red-400">⚠ {error}</p>}
            <button type="submit" disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-3 text-sm font-semibold">
              {loading? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
