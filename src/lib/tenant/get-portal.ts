import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { getRepository } from "@/lib/api";
import type { Portal } from "@/lib/api/types";
import { PORTAL_PADRAO } from "./dominios";

const PORTAL_HEADER = "x-portal-slug";

/** Portal da requisição atual (definido pelo `proxy.ts`). Memoizado por request. */
export const getPortal = cache(async (): Promise<Portal> => {
  const h = await headers();
  const slug = h.get(PORTAL_HEADER) ?? PORTAL_PADRAO;
  const repo = await getRepository();
  const portal = (await repo.getPortalBySlug(slug)) ?? (await repo.getPortalBySlug(PORTAL_PADRAO));
  if (!portal) throw new Error("Nenhum portal configurado");
  return portal;
});

export function urlAbsoluta(portal: Portal, path = "/") {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? `https://${portal.dominio}`;
  return new URL(path, base).toString();
}
