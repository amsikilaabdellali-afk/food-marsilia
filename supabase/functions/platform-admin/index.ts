// Fonction Edge : gestion des restaurants clients, réservée au propriétaire de la plateforme (super_admins).
import { createClient } from 'npm:@supabase/supabase-js@2';
import { cors, emailFor, ID_REGEX, json, RESERVED_SLUGS, SLUG_REGEX } from '../_shared/common.ts';

const DEFAULT_CATEGORIES = [
  { nom: 'Plats', label: 'Plats', ordre: 1 },
  { nom: 'Entrees', label: 'Entrées', ordre: 2 },
  { nom: 'Boissons', label: 'Boissons', ordre: 3 },
  { nom: 'Desserts', label: 'Desserts', ordre: 4 },
];
const DEFAULT_TABLES_COUNT = 8;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  const url = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const caller = createClient(url, anonKey, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: userData, error: userError } = await caller.auth.getUser();
  if (userError || !userData.user) return json({ error: 'Non authentifié' }, 401);

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: isSuper } = await admin
    .from('super_admins')
    .select('auth_id')
    .eq('auth_id', userData.user.id)
    .maybeSingle();
  if (!isSuper) return json({ error: 'Accès refusé' }, 403);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Requête invalide' }, 400);
  }

  // ---------- LISTER ----------
  if (body.action === 'list') {
    const { data: restaurants, error } = await admin
      .from('restaurants')
      .select('id, nom, slug, actif, created_at')
      .order('created_at', { ascending: false });
    if (error) return json({ error: error.message }, 400);

    const { data: users } = await admin.from('utilisateurs').select('restaurant_id, role, identifiant');
    const list = (restaurants ?? []).map((r) => {
      const mine = (users ?? []).filter((u) => u.restaurant_id === r.id);
      return {
        ...r,
        nb_utilisateurs: mine.length,
        admins: mine.filter((u) => u.role === 'admin').map((u) => u.identifiant),
      };
    });
    return json({ restaurants: list });
  }

  // ---------- ACTIVER / DÉSACTIVER ----------
  if (body.action === 'set_actif') {
    const { error } = await admin
      .from('restaurants')
      .update({ actif: Boolean(body.actif) })
      .eq('id', String(body.id ?? ''));
    if (error) return json({ error: error.message }, 400);
    return json({ ok: true });
  }

  // ---------- CRÉER UN RESTAURANT + SON ADMIN ----------
  if (body.action === 'create_restaurant') {
    const nom = String(body.nom ?? '').trim();
    const slug = String(body.slug ?? '').trim().toLowerCase();
    const adminNom = String(body.admin_nom ?? '').trim() || 'Administrateur';
    const adminIdentifiant = String(body.admin_identifiant ?? '').trim().toLowerCase();
    const code = String(body.code ?? '');

    if (!nom) return json({ error: 'Le nom du restaurant est obligatoire' }, 400);
    if (!SLUG_REGEX.test(slug) || RESERVED_SLUGS.includes(slug)) {
      return json({ error: 'Code restaurant invalide (2 à 30 caractères : lettres minuscules, chiffres, tiret)' }, 400);
    }
    if (!ID_REGEX.test(adminIdentifiant)) {
      return json({ error: "Identifiant admin invalide (3 à 30 caractères : lettres, chiffres, . _ -)" }, 400);
    }
    if (code.length < 6) return json({ error: 'Le code doit contenir au moins 6 caractères' }, 400);

    const { data: resto, error: restoError } = await admin
      .from('restaurants')
      .insert({ nom, slug })
      .select('id')
      .single();
    if (restoError || !resto) {
      const exists = /duplicate|unique/i.test(restoError?.message ?? '');
      return json({ error: exists ? 'Ce code restaurant existe déjà' : (restoError?.message ?? 'Erreur de création') }, 400);
    }

    // En cas d'échec à une étape, on annule tout (la suppression du restaurant supprime ses lignes liées).
    const rollback = async (authId?: string) => {
      if (authId) await admin.auth.admin.deleteUser(authId);
      await admin.from('restaurants').delete().eq('id', resto.id);
    };

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: emailFor(adminIdentifiant, slug),
      password: code,
      email_confirm: true,
    });
    if (createError || !created.user) {
      await rollback();
      return json({ error: createError?.message ?? "Erreur de création du compte admin" }, 400);
    }

    const { error: profileError } = await admin.from('utilisateurs').insert({
      restaurant_id: resto.id,
      auth_id: created.user.id,
      nom: adminNom,
      identifiant: adminIdentifiant,
      role: 'admin',
      actif: true,
    });
    if (profileError) {
      await rollback(created.user.id);
      return json({ error: profileError.message }, 400);
    }

    // Données de départ : catégories et tables.
    const { error: catError } = await admin
      .from('categories')
      .insert(DEFAULT_CATEGORIES.map((c) => ({ ...c, restaurant_id: resto.id })));
    const { error: tableError } = await admin.from('tables').insert(
      Array.from({ length: DEFAULT_TABLES_COUNT }, (_, i) => ({
        numero: i + 1, statut: 'libre', restaurant_id: resto.id,
      })),
    );
    if (catError || tableError) {
      await rollback(created.user.id);
      return json({ error: (catError ?? tableError)!.message }, 400);
    }

    return json({ ok: true });
  }

  return json({ error: 'Action inconnue' }, 400);
});
