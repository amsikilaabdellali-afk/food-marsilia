// Fonction Edge : gestion des comptes d'UN restaurant par son administrateur.
// Utilise la clé service_role côté serveur uniquement — elle n'est jamais envoyée au navigateur.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { BAN_FOREVER, cors, emailFor, ID_REGEX, json, ROLES } from '../_shared/common.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  const url = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // 1. Qui appelle ?
  const caller = createClient(url, anonKey, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: userData, error: userError } = await caller.auth.getUser();
  if (userError || !userData.user) return json({ error: 'Non authentifié' }, 401);
  const callerId = userData.user.id;

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  // 2. Est-ce un admin actif d'un restaurant actif ?
  const { data: meRow } = await admin
    .from('utilisateurs')
    .select('role, actif, restaurant_id, restaurants(slug, actif)')
    .eq('auth_id', callerId)
    .maybeSingle();
  const me = meRow as unknown as {
    role: string; actif: boolean; restaurant_id: string;
    restaurants: { slug: string; actif: boolean } | null;
  } | null;
  if (!me || !me.actif || me.role !== 'admin' || !me.restaurants?.actif) {
    return json({ error: 'Accès refusé' }, 403);
  }
  const restaurantId = me.restaurant_id;
  const slug = me.restaurants.slug;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Requête invalide' }, 400);
  }

  const action = body.action;

  // ---------- CRÉER ----------
  if (action === 'create') {
    const nom = String(body.nom ?? '').trim();
    const identifiant = String(body.identifiant ?? '').trim().toLowerCase();
    const code = String(body.code ?? '');
    const role = String(body.role ?? '');
    const actif = body.actif !== false;

    if (!nom) return json({ error: 'Le nom est obligatoire' }, 400);
    if (!ID_REGEX.test(identifiant)) {
      return json({ error: 'Identifiant invalide (3 à 30 caractères : lettres, chiffres, . _ -)' }, 400);
    }
    if (code.length < 6) return json({ error: 'Le code doit contenir au moins 6 caractères' }, 400);
    if (!ROLES.includes(role)) return json({ error: 'Rôle invalide' }, 400);

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: emailFor(identifiant, slug),
      password: code,
      email_confirm: true,
      ban_duration: actif ? 'none' : BAN_FOREVER,
    });
    if (createError || !created.user) {
      const exists = /already|registered|exists/i.test(createError?.message ?? '');
      return json({ error: exists ? 'Cet identifiant existe déjà' : (createError?.message ?? 'Erreur de création') }, 400);
    }

    const { error: profileError } = await admin.from('utilisateurs').insert({
      restaurant_id: restaurantId, auth_id: created.user.id, nom, identifiant, role, actif,
    });
    if (profileError) {
      await admin.auth.admin.deleteUser(created.user.id);
      return json({ error: profileError.message }, 400);
    }
    return json({ ok: true });
  }

  // ---------- MODIFIER / SUPPRIMER : l'utilisateur doit être dans le même restaurant ----------
  const id = String(body.id ?? '');
  const { data: target } = await admin
    .from('utilisateurs')
    .select('*')
    .eq('id', id)
    .eq('restaurant_id', restaurantId)
    .maybeSingle();
  if (!target) return json({ error: 'Utilisateur introuvable' }, 404);
  const isSelf = target.auth_id === callerId;

  if (action === 'update') {
    const patch: Record<string, unknown> = {};
    if (body.nom !== undefined) {
      const nom = String(body.nom).trim();
      if (!nom) return json({ error: 'Le nom est obligatoire' }, 400);
      patch.nom = nom;
    }
    if (body.role !== undefined) {
      if (!ROLES.includes(String(body.role))) return json({ error: 'Rôle invalide' }, 400);
      patch.role = body.role;
    }
    if (body.actif !== undefined) patch.actif = Boolean(body.actif);

    if (isSelf && ((patch.role && patch.role !== 'admin') || patch.actif === false)) {
      return json({ error: 'Tu ne peux pas retirer ton propre accès administrateur' }, 400);
    }

    const authPatch: Record<string, unknown> = {};
    if (body.code !== undefined && body.code !== '') {
      const code = String(body.code);
      if (code.length < 6) return json({ error: 'Le code doit contenir au moins 6 caractères' }, 400);
      authPatch.password = code;
    }
    if (patch.actif !== undefined) authPatch.ban_duration = patch.actif ? 'none' : BAN_FOREVER;

    if (Object.keys(authPatch).length > 0) {
      const { error } = await admin.auth.admin.updateUserById(target.auth_id, authPatch);
      if (error) return json({ error: error.message }, 400);
    }
    if (Object.keys(patch).length > 0) {
      const { error } = await admin.from('utilisateurs').update(patch).eq('id', id);
      if (error) return json({ error: error.message }, 400);
    }
    return json({ ok: true });
  }

  if (action === 'delete') {
    if (isSelf) return json({ error: 'Tu ne peux pas supprimer ton propre compte' }, 400);
    const { error } = await admin.auth.admin.deleteUser(target.auth_id);
    if (error) return json({ error: error.message }, 400);
    return json({ ok: true });
  }

  return json({ error: 'Action inconnue' }, 400);
});
