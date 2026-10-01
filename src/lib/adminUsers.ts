import { callEdge } from '@/lib/edge';

type AdminUsersPayload =
  | { action: 'create'; nom: string; identifiant: string; code: string; role: string; actif: boolean }
  | { action: 'update'; id: string; nom?: string; role?: string; actif?: boolean; code?: string }
  | { action: 'delete'; id: string };

// Appelle la fonction Edge `admin-users` (réservée aux administrateurs d'un restaurant).
// Retourne un message d'erreur en français, ou null si tout s'est bien passé.
export async function adminUsers(payload: AdminUsersPayload): Promise<string | null> {
  const { error } = await callEdge('admin-users', payload);
  return error;
}
