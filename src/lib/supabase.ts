import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Variables manquantes : renseigne VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans .env.local'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
  realtime: { params: { eventsPerSecond: 10 } },
});

// Les comptes Supabase Auth utilisent un e-mail technique : identifiant@code-restaurant.domaine
// Ce domaine doit être identique à AUTH_EMAIL_DOMAIN des fonctions Edge.
const AUTH_EMAIL_DOMAIN =
  (import.meta.env.VITE_AUTH_EMAIL_DOMAIN as string | undefined) || 'marsilia.app';

export const identifiantToEmail = (identifiant: string, restaurantCode: string) =>
  `${identifiant.trim().toLowerCase()}@${restaurantCode.trim().toLowerCase()}.${AUTH_EMAIL_DOMAIN}`;

export type Menu = {
  id: string;
  nom: string;
  prix: number;
  categorie: string;
  image_url: string | null;
  disponible: boolean;
  created_at: string;
};

export type MatierePremiere = {
  id: string;
  nom: string;
  quantite: number;
  unite: string;
  seuil_alerte: number;
  created_at: string;
};

export type Recette = {
  id: string;
  menu_id: string;
  matiere_id: string;
  qte_necessaire: number;
};

export type TableResto = {
  id: string;
  numero: number;
  statut: string;
  created_at: string;
};

export type Commande = {
  id: string;
  table_id: string | null;
  serveur_nom: string | null;
  statut: string;
  total: number;
  created_at: string;
  updated_at: string;
};

export type CommandeItem = {
  id: string;
  commande_id: string;
  menu_id: string | null;
  menu_nom: string;
  prix: number;
  qte: number;
  created_at: string;
};

export type Category = {
  id: string;
  nom: string;
  label: string;
  ordre: number;
  created_at: string;
};

export type Utilisateur = {
  id: string;
  auth_id: string;
  restaurant_id: string;
  nom: string;
  identifiant: string;
  role: string;
  actif: boolean;
  created_at: string;
};
