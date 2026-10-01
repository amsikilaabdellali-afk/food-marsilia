import { supabase } from '@/lib/supabase';

type AdminUsersPayload =
  | { action: 'create'; nom: string; identifiant: string; code: string; role: string; actif: boolean }
  | { action: 'update'; id: string; nom?: string; role?: string; actif?: boolean; code?: string }
  | { action: 'delete'; id: string };

export async function adminUsers(payload: AdminUsersPayload): Promise<string | null> {
  try {
    if (payload.action === 'create') {
      // Jib restaurant_id
      const { data: resto } = await supabase.from('restaurants').select('id').limit(1).single();
      if (!resto) return "Aucun restaurant trouvé";

      const { error } = await supabase.from('utilisateurs').insert({
        restaurant_id: resto.id,
        nom: payload.nom,
        identifiant: payload.identifiant.toLowerCase(),
        code_acces: payload.code,
        role: payload.role,
        actif: payload.actif,
      });
      if (error) return error.message;
      return null;
    }

    if (payload.action === 'update') {
      const updateData: any = {};
      if (payload.nom !== undefined) updateData.nom = payload.nom;
      if (payload.role !== undefined) updateData.role = payload.role;
      if (payload.actif !== undefined) updateData.actif = payload.actif;
      if (payload.code) updateData.code_acces = payload.code;

      const { error } = await supabase.from('utilisateurs').update(updateData).eq('id', payload.id);
      if (error) return error.message;
      return null;
    }

    if (payload.action === 'delete') {
      const { error } = await supabase.from('utilisateurs').delete().eq('id', payload.id);
      if (error) return error.message;
      return null;
    }

    return null;
  } catch (e: any) {
    return e.message || "Erreur lors de l'appel au serveur";
  }
}
