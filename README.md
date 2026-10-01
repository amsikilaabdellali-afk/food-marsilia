# Marsilia Food    

Application de gestion pour restaurant — React + TypeScript + Vite + Tailwind CSS + Supabase.

## Démarrage local

1. Installer Node.js (version LTS recommandée).
2. Copier `.env.example` vers `.env.local`.
3. Renseigner `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`.
4. Installer les dépendances : `npm install`
5. Lancer : `npm run dev`

## Vérifications

- `npm run typecheck`
- `npm run lint`
- `npm run build`

## Supabase

### 1. Base de données
Exécute les migrations de `supabase/migrations/` dans l'ordre des dates (SQL Editor). Les deux dernières activent l'authentification, les droits par rôle et l'isolation entre restaurants.

### 2. Réglages Auth (Authentication > Sign In / Providers)
- Désactive **Allow new users to sign up** (les comptes sont créés uniquement par l'application).
- Mets **Minimum password length** à 6 (ou plus).

### 3. Fonctions Edge
- `admin-users` : l'administrateur d'un restaurant gère ses utilisateurs.
- `platform-admin` : le propriétaire de la plateforme crée et suspend les restaurants.

```
supabase login
supabase link --project-ref <ton-project-ref>
supabase secrets set AUTH_EMAIL_DOMAIN=marsilia.app
supabase functions deploy admin-users
supabase functions deploy platform-admin
```

### 4. Comptes de départ
- `supabase/bootstrap_platform_owner.sql` : ton compte propriétaire (code restaurant `plateforme`).
- `supabase/bootstrap_first_admin.sql` : le premier administrateur du restaurant existant « Marsilia Food » (code `marsilia`).

## Multi-restaurant

- Chaque restaurant a un **code** (ex. `marsilia`). À la connexion, on saisit : code restaurant + identifiant + code d'accès.
- Toutes les données portent un `restaurant_id` ; les règles RLS limitent chaque requête au restaurant de l'utilisateur **et** à son rôle. Un restaurant ne voit jamais les données d'un autre.
- Le propriétaire (`super_admins`) se connecte avec le code restaurant `plateforme`. Il voit uniquement la liste des restaurants (jamais leurs commandes, menus ou stocks), en crée de nouveaux et peut en suspendre un : ses utilisateurs perdent alors tout accès.
- Un nouveau restaurant démarre avec 4 catégories et 8 tables ; son administrateur crée ensuite ses utilisateurs, son menu et son stock.
- L'e-mail technique d'un compte est `identifiant@code-restaurant.domaine`. Le domaine (`AUTH_EMAIL_DOMAIN` côté fonctions, `VITE_AUTH_EMAIL_DOMAIN` côté application) doit être identique partout.

## Limites actuelles

- Le nombre de tables d'un restaurant n'est pas modifiable depuis l'interface (8 par défaut).
- Pas de facturation ni d'abonnement intégrés : la suspension d'un restaurant se fait à la main depuis l'écran Plateforme.

## Déploiement et installation chez un client

1. Héberge le frontend (Vercel, Netlify ou Cloudflare Pages) : build `npm run build`, dossier de sortie `dist`.
2. Configure les variables `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` et `VITE_AUTH_EMAIL_DOMAIN` chez l'hébergeur.
3. Donne au client le lien, son code restaurant, son identifiant et son code d'accès.
4. Installation en raccourci (l'application est installable : icône, plein écran, sans barre du navigateur) :
   - Android (Chrome) : menu ⋮ > « Installer l'application ».
   - iPhone / iPad (Safari uniquement) : Partager > « Sur l'écran d'accueil ».
   - PC (Chrome ou Edge) : icône d'installation dans la barre d'adresse, ou menu > « Installer ».
