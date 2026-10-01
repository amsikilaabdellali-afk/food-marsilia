import { supabase } from '@/lib/supabase';

// Appelle une fonction Edge Supabase et retourne soit les données, soit un message d'erreur en français.
export async function callEdge<T = unknown>(
  name: string,
  body: unknown
): Promise<{ data: T | null; error: string | null }> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (!error) return { data: data as T, error: null };

  const response = (error as { context?: unknown }).context;
  if (response instanceof Response) {
    try {
      const payload = await response.json();
      if (payload?.error) return { data: null, error: String(payload.error) };
    } catch {
      // réponse non JSON : on retombe sur le message générique
    }
  }
  return { data: null, error: "Erreur lors de l'appel au serveur" };
}
