import { supabase, type Utilisateur } from '@/lib/supabase';

export type Profil = {
  user: Utilisateur;
  restaurantNom: string;
};

// Charge le profil de la personne connectée.
// Retourne null si le compte est désactivé, inconnu, ou si son restaurant est suspendu.
export async function loadProfil(authId: string): Promise<Profil | null> {
  const { data: u } = await supabase.from('utilisateurs').select('*').eq('auth_id', authId).maybeSingle();

  if (u) {
    if (!u.actif) return null;
    // La policy ne renvoie le restaurant que s'il est actif.
    const { data: r } = await supabase.from('restaurants').select('nom').maybeSingle();
    if (!r) return null;
    return { user: u as Utilisateur, restaurantNom: r.nom as string };
  }

  // Pas de profil restaurant : est-ce le propriétaire de la plateforme ?
  const { data: sa } = await supabase.from('super_admins').select('auth_id').eq('auth_id', authId).maybeSingle();
  if (sa) {
    return {
      user: {
        id: authId,
        auth_id: authId,
        restaurant_id: '',
        nom: 'Plateforme',
        identifiant: 'plateforme',
        role: 'plateforme',
        actif: true,
        created_at: '',
      },
      restaurantNom: 'Plateforme',
    };
  }
  return null;
}
