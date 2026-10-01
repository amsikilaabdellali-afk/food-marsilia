/*
# Add categories table for dynamic category management

## Overview
Previously categories were hardcoded in the frontend. This migration creates a
`categories` table so the Admin can add/remove categories dynamically.

## New Table
- **categories**: id, nom (unique key), label (display name), ordre (sort), created_at

## Seed Data
- Plats, Entrées, Boissons, Desserts (matching existing menu items)

## Security
- RLS enabled, public CRUD (single-tenant demo app)
*/

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text UNIQUE NOT NULL,
  label text NOT NULL,
  ordre integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_categories" ON categories;
CREATE POLICY "anon_select_categories" ON categories FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_categories" ON categories;
CREATE POLICY "anon_insert_categories" ON categories FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_categories" ON categories;
CREATE POLICY "anon_update_categories" ON categories FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_categories" ON categories;
CREATE POLICY "anon_delete_categories" ON categories FOR DELETE
  TO anon, authenticated USING (true);

INSERT INTO categories (nom, label, ordre) VALUES
  ('Plats', 'Plats', 1),
  ('Entrees', 'Entrées', 2),
  ('Boissons', 'Boissons', 3),
  ('Desserts', 'Desserts', 4)
ON CONFLICT (nom) DO NOTHING;