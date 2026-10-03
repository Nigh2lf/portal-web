/**
 * Tags do cache de dados do Next para as leituras públicas da API.
 *
 * Espelham os escopos de `core/services/public_cache.py` no portal-api: quando um
 * dado muda, a API chama `POST /api/revalidate` com as tags afetadas.
 */
export type EscopoCache = "portal" | "home" | "listing" | "catalog" | "content" | "advertiser" | "plans";

/** Validade máxima no cache do Next; a invalidação normal vem da API por tag. */
export const REVALIDATE_PADRAO = 3600;

export function tagsCache(escopo: EscopoCache, portalSlug?: string): string[] {
  const tags = ["pub", `pub:${escopo}`];
  if (portalSlug) tags.push(`portal:${portalSlug}`, `portal:${portalSlug}:${escopo}`);
  return tags;
}

/** Busca pelo host acontece antes de o slug ser conhecido; tem tag própria. */
export const TAGS_HOSTS = ["pub", "pub:portal", "pub:hosts"];

const TAG_VALIDA = /^(pub|pub:[a-z]+|portal:[a-z0-9-]+(:[a-z]+)?)$/;

export function tagValida(tag: unknown): tag is string {
  return typeof tag === "string" && TAG_VALIDA.test(tag);
}
