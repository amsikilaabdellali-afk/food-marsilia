/*
# Sécurisation : Supabase Auth + RLS par rôle

## Objectif
Remplace l'accès public (anon) et les codes en clair par une vraie authentification.
Chaque utilisateur a un compte Supabase Auth ; la table `utilisateurs` sert de profil (nom, rôle, actif).

## Changements
- `utilisateurs` : ajout de `auth_id` (lien vers auth.users) et `identifiant`, suppression de la colonne `code`.
  Les anciennes lignes de démonstration (codes en clair, sans compte Auth) sont supprimées.
- Fonction `app_role()` : rôle de l'utilisateur connecté (NULL si inconnu ou désactivé).
- Toutes les anciennes policies publiques sont supprimées et remplacées par des policies par rôle.

## Droits
- Lecture : tout utilisateur actif connecté (sauf `utilisateurs` : sa propre ligne, ou tout pour l'admin).
- menu, recette, categories : écriture admin.
- matiere_premiere : insert/delete admin ; update admin + caisse.
- tables : insert/delete admin ; update admin + serveur + caisse.
- commandes : insert admin + serveur ; update admin + serveur + cuisine + caisse ; delete admin.
- commande_items : insert/update/delete admin + serveur.
- utilisateurs : aucune écriture côté client (passe par la fonction Edge `admin-users`).
*/

-- ============ UTILISATEURS : lien avec Auth ============
ALTER TABLE utilisateurs
  ADD COLUMN IF NOT EXISTS auth_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE utilisateurs
  ADD COLUMN IF NOT EXISTS identifiant text;

DELETE FROM utilisateurs WHERE auth_id IS NULL;

ALTER TABLE utilisateurs DROP COLUMN IF EXISTS code;
ALTER TABLE utilisateurs ALTER COLUMN identifiant SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS utilisateurs_identifiant_key
  ON utilisateurs (lower(identifiant));

ALTER TABLE utilisateurs DROP CONSTRAINT IF EXISTS utilisateurs_role_check;
ALTER TABLE utilisateurs
  ADD CONSTRAINT utilisateurs_role_check CHECK (role IN ('admin', 'serveur', 'cuisine', 'caisse'));

-- ============ FONCTION RÔLE ============
CREATE OR REPLACE FUNCTION public.app_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.utilisateurs WHERE auth_id = auth.uid() AND actif LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.app_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.app_role() TO authenticated;

-- ============ SUPPRESSION DES ANCIENNES POLICIES ============
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('matiere_premiere','menu','recette','tables','commandes','commande_items','categories','utilisateurs')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- ============ LECTURE : tout utilisateur actif connecté ============
CREATE POLICY "staff_select" ON matiere_premiere FOR SELECT TO authenticated USING (app_role() IS NOT NULL);
CREATE POLICY "staff_select" ON menu             FOR SELECT TO authenticated USING (app_role() IS NOT NULL);
CREATE POLICY "staff_select" ON recette          FOR SELECT TO authenticated USING (app_role() IS NOT NULL);
CREATE POLICY "staff_select" ON tables           FOR SELECT TO authenticated USING (app_role() IS NOT NULL);
CREATE POLICY "staff_select" ON commandes        FOR SELECT TO authenticated USING (app_role() IS NOT NULL);
CREATE POLICY "staff_select" ON commande_items   FOR SELECT TO authenticated USING (app_role() IS NOT NULL);
CREATE POLICY "staff_select" ON categories       FOR SELECT TO authenticated USING (app_role() IS NOT NULL);

-- ============ MENU / RECETTE / CATEGORIES : admin ============
CREATE POLICY "admin_insert" ON menu FOR INSERT TO authenticated WITH CHECK (app_role() = 'admin');
CREATE POLICY "admin_update" ON menu FOR UPDATE TO authenticated USING (app_role() = 'admin') WITH CHECK (app_role() = 'admin');
CREATE POLICY "admin_delete" ON menu FOR DELETE TO authenticated USING (app_role() = 'admin');

CREATE POLICY "admin_insert" ON recette FOR INSERT TO authenticated WITH CHECK (app_role() = 'admin');
CREATE POLICY "admin_update" ON recette FOR UPDATE TO authenticated USING (app_role() = 'admin') WITH CHECK (app_role() = 'admin');
CREATE POLICY "admin_delete" ON recette FOR DELETE TO authenticated USING (app_role() = 'admin');

CREATE POLICY "admin_insert" ON categories FOR INSERT TO authenticated WITH CHECK (app_role() = 'admin');
CREATE POLICY "admin_update" ON categories FOR UPDATE TO authenticated USING (app_role() = 'admin') WITH CHECK (app_role() = 'admin');
CREATE POLICY "admin_delete" ON categories FOR DELETE TO authenticated USING (app_role() = 'admin');

-- ============ MATIERE PREMIERE ============
CREATE POLICY "admin_insert" ON matiere_premiere FOR INSERT TO authenticated WITH CHECK (app_role() = 'admin');
CREATE POLICY "admin_caisse_update" ON matiere_premiere FOR UPDATE TO authenticated
  USING (app_role() IN ('admin','caisse')) WITH CHECK (app_role() IN ('admin','caisse'));
CREATE POLICY "admin_delete" ON matiere_premiere FOR DELETE TO authenticated USING (app_role() = 'admin');

-- ============ TABLES ============
CREATE POLICY "admin_insert" ON tables FOR INSERT TO authenticated WITH CHECK (app_role() = 'admin');
CREATE POLICY "service_update" ON tables FOR UPDATE TO authenticated
  USING (app_role() IN ('admin','serveur','caisse')) WITH CHECK (app_role() IN ('admin','serveur','caisse'));
CREATE POLICY "admin_delete" ON tables FOR DELETE TO authenticated USING (app_role() = 'admin');

-- ============ COMMANDES ============
CREATE POLICY "serveur_insert" ON commandes FOR INSERT TO authenticated WITH CHECK (app_role() IN ('admin','serveur'));
CREATE POLICY "staff_update" ON commandes FOR UPDATE TO authenticated
  USING (app_role() IN ('admin','serveur','cuisine','caisse')) WITH CHECK (app_role() IN ('admin','serveur','cuisine','caisse'));
CREATE POLICY "admin_delete" ON commandes FOR DELETE TO authenticated USING (app_role() = 'admin');

-- ============ COMMANDE ITEMS ============
CREATE POLICY "serveur_insert" ON commande_items FOR INSERT TO authenticated WITH CHECK (app_role() IN ('admin','serveur'));
CREATE POLICY "serveur_update" ON commande_items FOR UPDATE TO authenticated
  USING (app_role() IN ('admin','serveur')) WITH CHECK (app_role() IN ('admin','serveur'));
CREATE POLICY "serveur_delete" ON commande_items FOR DELETE TO authenticated USING (app_role() IN ('admin','serveur'));

-- ============ UTILISATEURS : lecture seule côté client ============
CREATE POLICY "own_or_admin_select" ON utilisateurs FOR SELECT TO authenticated
  USING (auth_id = auth.uid() OR app_role() = 'admin');
