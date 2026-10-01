// Utilitaires partagés par les fonctions Edge.

export const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

export const ROLES = ['admin', 'serveur', 'cuisine', 'caisse'];
export const ID_REGEX = /^[a-z0-9._-]{3,30}$/;
export const SLUG_REGEX = /^[a-z0-9-]{2,30}$/;
export const RESERVED_SLUGS = ['plateforme'];
export const BAN_FOREVER = '876000h';

const EMAIL_DOMAIN = Deno.env.get('AUTH_EMAIL_DOMAIN') ?? 'marsilia.app';

// E-mail technique du compte : identifiant@code-restaurant.domaine
// (doit rester identique à identifiantToEmail dans src/lib/supabase.ts)
export const emailFor = (identifiant: string, slug: string) => `${identifiant}@${slug}.${EMAIL_DOMAIN}`;
