/*
# Multi-restaurant (multi-tenant)

## Objectif
Permettre de vendre l'application à plusieurs restaurants, avec des données strictement isolées.

## Changements
- Nouvelle table `restaurants` (nom, code/slug, actif). Un restaurant désactivé perd tout accès (impayé, arrêt...).
- Nouvelle table `super_admins` : le propriétaire de la plateforme (toi). Il gère les restaurants, sans accès à leurs données.
- Colonne `restaurant_id` ajoutée à toutes les tables de données. Les données existantes sont rattachées
  au restaurant « Marsilia Food » (code `marsilia`).
- `restaurant_id` se remplit automatiquement (valeur par défaut = restaurant de l'utilisateur connecté),
  donc le code de l'application n'a pas besoin de le passer.
- Unicité par restaurant : numéro de table et nom de catégorie.
- Toutes les policies RLS sont recréées : chaque requête est limitée au restaurant de l'utilisateur ET à son rôle.
*/

-- ============ RESTAURANTS & SUPER ADMINS ============
CREATE TABLE IF NOT EXISTS restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]{2,30}$'),
  actif boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS super_admins (
  auth_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;

INSERT INTO restaurants (nom, slug) VALUES ('Marsilia Food', 'marsilia')
ON CONFLICT (slug) DO NOTHING;

-- ============ UTILISATEURS ============
ALTER TABLE utilisateurs
  ADD COLUMN IF NOT EXISTS restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE;
UPDATE utilisateurs
  SET restaurant_id = (SELECT id FROM restaurants WHERE slug = 'marsilia')
  WHERE restaurant_id IS NULL;
ALTER TABLE utilisateurs ALTER COLUMN restaurant_id SET NOT NULL;

DROP INDEX IF EXISTS utilisateurs_identifiant_key;
CREATE UNIQUE INDEX IF NOT EXISTS utilisateurs_restaurant_identifiant_key
  ON utilisateurs (restaurant_id, lower(identifiant));

-- ============ FONCTIONS ============
CREATE OR REPLACE FUNCTION public.app_restaurant()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.restaurant_id
  FROM public.utilisateurs u
  JOIN public.restaurants r ON r.id = u.restaurant_id
  WHERE u.auth_id = auth.uid() AND u.actif AND r.actif
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.app_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.role
  FROM public.utilisateurs u
  JOIN public.restaurants r ON r.id = u.restaurant_id
  WHERE u.auth_id = auth.uid() AND u.actif AND r.actif
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.app_restaurant() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.app_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.app_restaurant() TO authenticated;
GRANT EXECUTE ON FUNCTION public.app_role() TO authenticated;

-- ============ restaurant_id SUR LES TABLES DE DONNÉES ============
DO $$
DECLARE
  t text;
  default_id uuid := (SELECT id FROM public.restaurants WHERE slug = 'marsilia');
BEGIN
  FOREACH t IN ARRAY ARRAY['matiere_premiere','menu','recette','tables','commandes','commande_items','categories']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE CASCADE', t);
    EXECUTE format('UPDATE public.%I SET restaurant_id = %L WHERE restaurant_id IS NULL', t, default_id);
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN restaurant_id SET NOT NULL', t);
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN restaurant_id SET DEFAULT public.app_restaurant()', t);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I (restaurant_id)', t || '_restaurant_id_idx', t);
  END LOOP;
END $$;

-- ============ UNICITÉ PAR RESTAURANT ============
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_nom_key;
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_restaurant_nom_key;
ALTER TABLE categories ADD CONSTRAINT categories_restaurant_nom_key UNIQUE (restaurant_id, nom);

ALTER TABLE tables DROP CONSTRAINT IF EXISTS tables_numero_key;
ALTER TABLE tables DROP CONSTRAINT IF EXISTS tables_restaurant_numero_key;
ALTER TABLE tables ADD CONSTRAINT tables_restaurant_numero_key UNIQUE (restaurant_id, numero);

-- ============ POLICIES : on repart de zéro ============
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('matiere_premiere','menu','recette','tables','commandes','commande_items','categories','utilisateurs','restaurants','super_admins')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- Petite fonction temporaire pour générer une policy "restaurant + rôle"
CREATE OR REPLACE FUNCTION pg_temp.mk(t text, cmd text, roles text[]) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
  cond text := format('restaurant_id = public.app_restaurant() AND public.app_role() = ANY (%L::text[])', roles);
  pname text := lower(cmd) || '_' || array_to_string(roles, '_');
BEGIN
  IF cmd = 'INSERT' THEN
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (%s)', pname, t, cond);
  ELSIF cmd = 'UPDATE' THEN
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (%s) WITH CHECK (%s)', pname, t, cond, cond);
  ELSIF cmd = 'DELETE' THEN
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (%s)', pname, t, cond);
  END IF;
END $$;

-- Lecture : tout utilisateur actif, uniquement dans son restaurant
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['matiere_premiere','menu','recette','tables','commandes','commande_items','categories']
  LOOP
    EXECUTE format(
      'CREATE POLICY "staff_select" ON public.%I FOR SELECT TO authenticated USING (public.app_role() IS NOT NULL AND restaurant_id = public.app_restaurant())',
      t);
  END LOOP;
END $$;

-- menu / recette / categories : écriture admin
SELECT pg_temp.mk(t, c, ARRAY['admin'])
FROM unnest(ARRAY['menu','recette','categories']) AS t, unnest(ARRAY['INSERT','UPDATE','DELETE']) AS c;

-- matiere_premiere : insert/delete admin ; update admin + caisse
SELECT pg_temp.mk('matiere_premiere', 'INSERT', ARRAY['admin']);
SELECT pg_temp.mk('matiere_premiere', 'UPDATE', ARRAY['admin','caisse']);
SELECT pg_temp.mk('matiere_premiere', 'DELETE', ARRAY['admin']);

-- tables : insert/delete admin ; update admin + serveur + caisse
SELECT pg_temp.mk('tables', 'INSERT', ARRAY['admin']);
SELECT pg_temp.mk('tables', 'UPDATE', ARRAY['admin','serveur','caisse']);
SELECT pg_temp.mk('tables', 'DELETE', ARRAY['admin']);

-- commandes : insert admin + serveur ; update tous ; delete admin
SELECT pg_temp.mk('commandes', 'INSERT', ARRAY['admin','serveur']);
SELECT pg_temp.mk('commandes', 'UPDATE', ARRAY['admin','serveur','cuisine','caisse']);
SELECT pg_temp.mk('commandes', 'DELETE', ARRAY['admin']);

-- commande_items : admin + serveur
SELECT pg_temp.mk('commande_items', 'INSERT', ARRAY['admin','serveur']);
SELECT pg_temp.mk('commande_items', 'UPDATE', ARRAY['admin','serveur']);
SELECT pg_temp.mk('commande_items', 'DELETE', ARRAY['admin','serveur']);

-- utilisateurs : sa propre ligne, ou tout son restaurant pour l'admin. Écritures via la fonction Edge.
CREATE POLICY "own_or_admin_select" ON utilisateurs FOR SELECT TO authenticated
  USING (
    auth_id = auth.uid()
    OR (public.app_role() = 'admin' AND restaurant_id = public.app_restaurant())
  );

-- restaurants : on ne voit que le sien (et seulement s'il est actif)
CREATE POLICY "own_restaurant_select" ON restaurants FOR SELECT TO authenticated
  USING (id = public.app_restaurant());

-- super_admins : chacun ne voit que sa propre ligne
CREATE POLICY "own_super_admin_select" ON super_admins FOR SELECT TO authenticated
  USING (auth_id = auth.uid());
