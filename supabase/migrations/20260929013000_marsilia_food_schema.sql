/*
# Marsilia Food - Restaurant Management System Schema

## Overview
Complete database schema for a Moroccan restaurant management system with 4 roles
(Admin, Serveur, Cuisine, Caisse). Single-tenant demo app with public access (no auth).

## Tables

1. **matiere_premiere** - Raw ingredients (Poulet, Semoule, Tomate, etc.)
   - id, nom, quantite, unite, seuil_alerte, created_at

2. **menu** - Dishes with price, category, image, availability
   - id, nom, prix, categorie, image_url, disponible, created_at

3. **recette** - Links menu items to ingredients with quantities needed
   - id, menu_id, matiere_id, qte_necessaire

4. **tables** - Restaurant tables with status
   - id, numero, statut (libre/en_cours), created_at

5. **commandes** - Orders with status, table, server name, total
   - id, table_id, serveur_nom, statut (en_attente/en_preparation/pret/paye), total, created_at, updated_at

6. **commande_items** - Line items per order
   - id, commande_id, menu_id, menu_nom, prix, qte, created_at

## Security
- RLS enabled on all tables
- Public access (TO anon, authenticated) since this is a demo with no sign-in
- All CRUD operations allowed for demo purposes
*/

-- ============ MATIERE PREMIERE ============
CREATE TABLE IF NOT EXISTS matiere_premiere (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  quantite numeric NOT NULL DEFAULT 0,
  unite text NOT NULL DEFAULT 'kg',
  seuil_alerte numeric NOT NULL DEFAULT 5,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE matiere_premiere ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_matiere" ON matiere_premiere;
CREATE POLICY "anon_select_matiere" ON matiere_premiere FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_matiere" ON matiere_premiere;
CREATE POLICY "anon_insert_matiere" ON matiere_premiere FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_matiere" ON matiere_premiere;
CREATE POLICY "anon_update_matiere" ON matiere_premiere FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_matiere" ON matiere_premiere;
CREATE POLICY "anon_delete_matiere" ON matiere_premiere FOR DELETE
  TO anon, authenticated USING (true);

-- ============ MENU ============
CREATE TABLE IF NOT EXISTS menu (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  prix numeric NOT NULL DEFAULT 0,
  categorie text NOT NULL DEFAULT 'Plats',
  image_url text,
  disponible boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE menu ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_menu" ON menu;
CREATE POLICY "anon_select_menu" ON menu FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_menu" ON menu;
CREATE POLICY "anon_insert_menu" ON menu FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_menu" ON menu;
CREATE POLICY "anon_update_menu" ON menu FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_menu" ON menu;
CREATE POLICY "anon_delete_menu" ON menu FOR DELETE
  TO anon, authenticated USING (true);

-- ============ RECETTE ============
CREATE TABLE IF NOT EXISTS recette (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id uuid REFERENCES menu(id) ON DELETE CASCADE,
  matiere_id uuid REFERENCES matiere_premiere(id) ON DELETE CASCADE,
  qte_necessaire numeric NOT NULL DEFAULT 1
);

ALTER TABLE recette ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_recette" ON recette;
CREATE POLICY "anon_select_recette" ON recette FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_recette" ON recette;
CREATE POLICY "anon_insert_recette" ON recette FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_recette" ON recette;
CREATE POLICY "anon_update_recette" ON recette FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_recette" ON recette;
CREATE POLICY "anon_delete_recette" ON recette FOR DELETE
  TO anon, authenticated USING (true);

-- ============ TABLES ============
CREATE TABLE IF NOT EXISTS tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero integer NOT NULL UNIQUE,
  statut text NOT NULL DEFAULT 'libre',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_tables" ON tables;
CREATE POLICY "anon_select_tables" ON tables FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_tables" ON tables;
CREATE POLICY "anon_insert_tables" ON tables FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_tables" ON tables;
CREATE POLICY "anon_update_tables" ON tables FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_tables" ON tables;
CREATE POLICY "anon_delete_tables" ON tables FOR DELETE
  TO anon, authenticated USING (true);

-- ============ COMMANDES ============
CREATE TABLE IF NOT EXISTS commandes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id uuid REFERENCES tables(id) ON DELETE SET NULL,
  serveur_nom text,
  statut text NOT NULL DEFAULT 'en_attent',
  total numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE commandes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_commandes" ON commandes;
CREATE POLICY "anon_select_commandes" ON commandes FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_commandes" ON commandes;
CREATE POLICY "anon_insert_commandes" ON commandes FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_commandes" ON commandes;
CREATE POLICY "anon_update_commandes" ON commandes FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_commandes" ON commandes;
CREATE POLICY "anon_delete_commandes" ON commandes FOR DELETE
  TO anon, authenticated USING (true);

-- ============ COMMANDE_ITEMS ============
CREATE TABLE IF NOT EXISTS commande_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commande_id uuid REFERENCES commandes(id) ON DELETE CASCADE,
  menu_id uuid REFERENCES menu(id) ON DELETE SET NULL,
  menu_nom text NOT NULL,
  prix numeric NOT NULL DEFAULT 0,
  qte integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE commande_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_commande_items" ON commande_items;
CREATE POLICY "anon_select_commande_items" ON commande_items FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_commande_items" ON commande_items;
CREATE POLICY "anon_insert_commande_items" ON commande_items FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_commande_items" ON commande_items;
CREATE POLICY "anon_update_commande_items" ON commande_items FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_commande_items" ON commande_items;
CREATE POLICY "anon_delete_commande_items" ON commande_items FOR DELETE
  TO anon, authenticated USING (true);

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_recette_menu_id ON recette(menu_id);
CREATE INDEX IF NOT EXISTS idx_recette_matiere_id ON recette(matiere_id);
CREATE INDEX IF NOT EXISTS idx_commandes_table_id ON commandes(table_id);
CREATE INDEX IF NOT EXISTS idx_commandes_statut ON commandes(statut);
CREATE INDEX IF NOT EXISTS idx_commande_items_commande_id ON commande_items(commande_id);
CREATE INDEX IF NOT EXISTS idx_menu_categorie ON menu(categorie);

-- ============ SEED DATA ============

-- Matieres premieres
INSERT INTO matiere_premiere (nom, quantite, unite, seuil_alerte) VALUES
  ('Poulet', 10, 'kg', 3),
  ('Semoule', 20, 'kg', 5),
  ('Tomate', 15, 'kg', 4),
  ('Boisson', 50, 'pcs', 10),
  ('Frites', 10, 'kg', 3)
ON CONFLICT DO NOTHING;

-- Menu items
INSERT INTO menu (nom, prix, categorie, image_url, disponible) VALUES
  ('Couscous Royal', 85, 'Plats', '', true),
  ('Tajine Poulet', 65, 'Plats', '', true),
  ('Pastilla', 70, 'Entrees', '', true),
  ('Coca Cola', 15, 'Boissons', '', true),
  ('Thé à la Menthe', 12, 'Boissons', '', true),
  ('Chebakia', 25, 'Desserts', '', true)
ON CONFLICT DO NOTHING;

-- Recettes (links menu to matiere_premiere with quantities)
INSERT INTO recette (menu_id, matiere_id, qte_necessaire)
SELECT m.id, mp.id, v.qte
FROM menu m
CROSS JOIN matiere_premiere mp
JOIN (VALUES
  ('Couscous Royal', 'Poulet', 0.3),
  ('Couscous Royal', 'Semoule', 0.2),
  ('Couscous Royal', 'Tomate', 0.15),
  ('Tajine Poulet', 'Poulet', 0.25),
  ('Tajine Poulet', 'Tomate', 0.1),
  ('Pastilla', 'Poulet', 0.15),
  ('Chebakia', 'Semoule', 0.05)
) AS v(dish, ingredient, qte)
ON v.dish = m.nom AND v.ingredient = mp.nom
ON CONFLICT DO NOTHING;

-- Tables
INSERT INTO tables (numero, statut) VALUES
  (1, 'libre'), (2, 'libre'), (3, 'libre'), (4, 'libre'),
  (5, 'libre'), (6, 'libre'), (7, 'libre'), (8, 'libre')
ON CONFLICT DO NOTHING;