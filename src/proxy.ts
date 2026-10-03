import { NextResponse, type NextRequest } from "next/server";
import { PORTAIS, PORTAL_PADRAO_SLUG } from "@/mocks/data/portais";
import { REDIRECTS_LEGADO, resolverRedirectLegado } from "@/config/redirects";

export const PORTAL_HEADER = "x-portal-slug";
export const PORTAL_COOKIE = "portal";

const slugs = new Set(PORTAIS.map((p) => p.slug));

/**
 * Resolve o portal (tenant) pela host da requisição. Em localhost ou host
 * desconhecido, usa `?portal=` ou o cookie `portal`, com fallback no padrão.
 * O slug segue no header `x-portal-slug` e é lido por `getPortal()`.
 */
export function proxy(request: NextRequest) {
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

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logos/|portais/|.*\\.(?:svg|png|jpg|jpeg|webp|ico|txt|xml)$).*)"],
};

export { REDIRECTS_LEGADO };
