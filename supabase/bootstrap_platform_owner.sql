-- Compte propriétaire de la plateforme (toi) : il crée et suspend les restaurants clients.
-- À exécuter UNE SEULE FOIS dans le SQL Editor de Supabase, après les migrations.
--
-- 1. Supabase > Authentication > Users > "Add user" > "Create new user"
--    Email : owner@plateforme.marsilia.app
--            (le code restaurant "plateforme" est réservé au propriétaire ; domaine par défaut : marsilia.app)
--    Mot de passe : ton code (choisis-en un long !)
--    Coche "Auto Confirm User".
-- 2. Exécute ceci :

INSERT INTO super_admins (auth_id)
SELECT id FROM auth.users WHERE email = 'owner@plateforme.marsilia.app'
ON CONFLICT (auth_id) DO NOTHING;

-- Connexion dans l'application : code restaurant = plateforme, identifiant = owner.
