-- Premier administrateur du restaurant « Marsilia Food » (code restaurant : marsilia).
-- À exécuter UNE SEULE FOIS dans le SQL Editor de Supabase, après les migrations.
--
-- 1. Supabase > Authentication > Users > "Add user" > "Create new user"
--    Email : admin@marsilia.marsilia.app
--            (format : identifiant@code-restaurant.domaine ; le domaine par défaut est marsilia.app)
--    Mot de passe : ton code (6 caractères minimum)
--    Coche "Auto Confirm User".
-- 2. Exécute ceci pour créer son profil administrateur :

INSERT INTO utilisateurs (restaurant_id, auth_id, nom, identifiant, role, actif)
SELECT (SELECT id FROM restaurants WHERE slug = 'marsilia'), id, 'Admin', 'admin', 'admin', true
FROM auth.users
WHERE email = 'admin@marsilia.marsilia.app'
ON CONFLICT (auth_id) DO NOTHING;
