/*
# Add utilisateurs table for user management with passwords

## Overview
Replaces hardcoded login codes with a database-managed user system.
Admin can add, modify, and delete users with their access code and role.

## New Table
- **utilisateurs**: id, nom, code (access code), role (admin/serveur/cuisine/caisse), actif (boolean), created_at

## Seed Data
- 4 default users matching the original codes: Admin (0617), Serveur (1111), Cuisine (2222), Caisse (0505)

## Security
- RLS enabled, public CRUD (single-tenant demo app)
*/

CREATE TABLE IF NOT EXISTS utilisateurs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  code text NOT NULL,
  role text NOT NULL DEFAULT 'serveur',
  actif boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE utilisateurs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_utilisateurs" ON utilisateurs;
CREATE POLICY "anon_select_utilisateurs" ON utilisateurs FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_utilisateurs" ON utilisateurs;
CREATE POLICY "anon_insert_utilisateurs" ON utilisateurs FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_utilisateurs" ON utilisateurs;
CREATE POLICY "anon_update_utilisateurs" ON utilisateurs FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_utilisateurs" ON utilisateurs;
CREATE POLICY "anon_delete_utilisateurs" ON utilisateurs FOR DELETE
  TO anon, authenticated USING (true);

INSERT INTO utilisateurs (nom, code, role, actif) VALUES
  ('Admin', '0617', 'admin', true),
  ('Serveur', '1111', 'serveur', true),
  ('Cuisine', '2222', 'cuisine', true),
  ('Caisse', '0505', 'caisse', true)
ON CONFLICT DO NOTHING;