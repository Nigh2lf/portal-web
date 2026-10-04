import { PORTAIS, PORTAL_PADRAO_SLUG } from "@/mocks/data/portais";

/**
 * Descobre o portal pelo domínio da visita. Em modo API, pergunta ao backend só pelo
 * host recebido (`/public/portals/by-host/?host=`, que compara com `domain` e
 * `extra_domains` de `core_portal`).
 *
 * O `proxy.ts` chama isto em toda requisição, então a resposta de cada host fica em
 * memória por 1 minuto e é renovada em segundo plano: a visita só espera a API na
 * primeira vez que um host aparece. Se a API falhar, vale a última resposta conhecida.
 */

const TTL_MS = 60_000;
const API_BASE_URL = (process.env.API_BASE_URL ?? "http://localhost:8000/api/v1").replace(/\/$/, "");
const SLUG_VALIDO = /^[a-z0-9-]{2,60}$/;

/** Portal aberto quando o host não é de nenhum portal (localhost, domínio do Railway). */
export const PORTAL_PADRAO = process.env.PORTAL_PADRAO ?? PORTAL_PADRAO_SLUG;

type Entrada = { slug: string | null; expira: number };
const porHost = new Map<string, Entrada>();
const emAndamento = new Map<string, Promise<string | null>>();

/** `www.exemplo.com.br:3000` → `exemplo.com.br`. */
export function normalizarHost(host: string) {
  const h = host.toLowerCase().split(":")[0]!.trim();
  return h.startsWith("www.") ? h.slice(4) : h;
}

export function slugValido(slug: string | null | undefined): slug is string {
  return Boolean(slug && SLUG_VALIDO.test(slug));
}

function doMock(host: string) {
  return PORTAIS.find((p) => p.dominios.some((d) => normalizarHost(d) === host))?.slug ?? null;
}

async function perguntarApi(host: string): Promise<string | null> {
  const res = await fetch(`${API_BASE_URL}/public/portals/by-host/?host=${encodeURIComponent(host)}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = (await res.json()) as { data?: { slug?: string } };
  return json.data?.slug ?? null;
}

function renovar(host: string) {
  let p = emAndamento.get(host);
  if (p) return p;
  p = perguntarApi(host)
    .then((slug) => {
      porHost.set(host, { slug, expira: Date.now() + TTL_MS });
      return slug;
    })
    .catch((e: unknown) => {
      console.error(`[tenant] falha ao resolver o portal de ${host}:`, e instanceof Error ? e.message : e);
      const anterior = porHost.get(host);
      if (anterior) anterior.expira = Date.now() + 10_000;
      return anterior?.slug ?? null;
    })
    .finally(() => emAndamento.delete(host));
  emAndamento.set(host, p);
  return p;
}

/** Slug do portal do host, ou `undefined` quando o domínio não é de nenhum portal. */
export async function slugPorHost(hostBruto: string): Promise<string | undefined> {
  const host = normalizarHost(hostBruto);
  if (!host) return undefined;
  // Desenvolvimento: `serra.localhost:3000` abre o portal serra.
  if (host.endsWith(".localhost")) {
    const slug = host.slice(0, -".localhost".length);
    return slugValido(slug) ? slug : undefined;
  }
  if (host === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(host)) return undefined;
  if ((process.env.DATA_SOURCE ?? "mock") !== "api") return doMock(host) ?? undefined;

  const cache = porHost.get(host);
  if (!cache) return (await renovar(host)) ?? undefined;
  if (cache.expira <= Date.now()) void renovar(host);
  return cache.slug ?? undefined;
}
