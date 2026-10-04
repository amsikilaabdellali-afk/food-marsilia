import { supabase, type Utilisateur } from '@/lib/supabase';
export type Profil = { user: Utilisateur; restaurantNom: string; };
export async function loadProfil(authId: string): Promise<Profil | null> {
  const { data: u } = await supabase.from('utilisateurs').select('*').eq('auth_id', authId).maybeSingle();
  if (u) {
    if (!u.actif) return null;
    const { data: r } = await supabase.from('restaurants').select('nom').eq('id', u.restaurant_id).maybeSingle();
    const { data: r2 } = await supabase.from('restaurants').select('nom').maybeSingle();
    return { user: u as Utilisateur, restaurantNom: r?.nom || r2?.nom || 'Marsilia Food' };
  }
  const { data: sa } = await supabase.from('super_admins').select('auth_id').eq('auth_id', authId).maybeSingle();
  if (sa) return { user: { id: authId, auth_id: authId, restaurant_id: '', nom: 'Plateforme', identifiant: 'plateforme', role: 'plateforme', actif: true, created_at: '' } as any, restaurantNom: 'Plateforme' };
  return null;
}
