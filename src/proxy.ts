import { NextResponse, type NextRequest } from "next/server";
import { PORTAIS, PORTAL_PADRAO_SLUG } from "@/mocks/data/portais";
import { REDIRECTS_LEGADO, resolverRedirectLegado } from "@/config/redirects";

export const PORTAL_HEADER = "x-portal-slug";
export const PORTAL_COOKIE = "portal";
const ACCESS_COOKIE = "access";
const REFRESH_COOKIE = "refresh";
const MARGEM_RENOVACAO_MS = 120_000;
const API_BASE_URL = (process.env.API_BASE_URL ?? "http://localhost:8000/api/v1").replace(/\/$/, "");

const slugs = new Set(PORTAIS.map((p) => p.slug));

function expiraEm(token: string | undefined) {
  if (!token) return 0;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]!.replace(/-/g, "+").replace(/_/g, "/"))) as { exp?: number };
    return (payload.exp ?? 0) * 1000;
  } catch {
    return 0;
  }
}

/**
 * Renova o access token do anunciante (modo API) quando está perto de expirar,
 * gravando os cookies na resposta. Falha silenciosa: a página vai pedir login.
 */
async function renovarSessao(request: NextRequest, response: NextResponse) {
  if ((process.env.DATA_SOURCE ?? "mock") !== "api") return response;
  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!refresh || expiraEm(access) > Date.now() + MARGEM_RENOVACAO_MS) return response;
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ refresh }),
      cache: "no-store",
    });
    if (!res.ok) {
      response.cookies.delete(ACCESS_COOKIE);
      response.cookies.delete(REFRESH_COOKIE);
      return response;
    }
    const tokens = (await res.json()) as { access: string; refresh?: string };
    const secure = process.env.NODE_ENV === "production";
    response.cookies.set(ACCESS_COOKIE, tokens.access, { httpOnly: true, sameSite: "lax", secure, path: "/", expires: new Date(expiraEm(tokens.access) || Date.now() + 3_600_000) });
    if (tokens.refresh) response.cookies.set(REFRESH_COOKIE, tokens.refresh, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: 60 * 60 * 24 * 30 });
    response.headers.set("x-access-renewed", "1");
  } catch {
    // API fora do ar: segue sem renovar.
  }
  return response;
}

/**
 * Resolve o portal (tenant) pela host da requisição. Em localhost ou host
 * desconhecido, usa `?portal=` ou o cookie `portal`, com fallback no padrão.
 * O slug segue no header `x-portal-slug` e é lido por `getPortal()`.
 */
export async function proxy(request: NextRequest) {
  const url = request.nextUrl;

  const legado = resolverRedirectLegado(url.pathname);
  if (legado) return NextResponse.redirect(new URL(legado, url), 301);

  const host = (request.headers.get("host") ?? "").toLowerCase().split(":")[0]!;
  const porHost = PORTAIS.find((p) => p.dominios.includes(host))?.slug;
  const porQuery = url.searchParams.get("portal");
  const porCookie = request.cookies.get(PORTAL_COOKIE)?.value;

  const slug = porHost ?? (porQuery && slugs.has(porQuery) ? porQuery : porCookie && slugs.has(porCookie) ? porCookie : PORTAL_PADRAO_SLUG);

  const headers = new Headers(request.headers);
  headers.set(PORTAL_HEADER, slug);

  if (porQuery && slugs.has(porQuery) && !porHost) {
    url.searchParams.delete("portal");
    const res = NextResponse.redirect(url);
    res.cookies.set(PORTAL_COOKIE, porQuery, { path: "/", maxAge: 60 * 60 * 24 * 30 });
    return res;
  }

  return renovarSessao(request, NextResponse.next({ request: { headers } }));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logos/|portais/|.*\\.(?:svg|png|jpg|jpeg|webp|ico|txt|xml)$).*)"],
};

export { REDIRECTS_LEGADO };
