import "server-only";

import { cookies } from "next/headers";

export const FAVORITOS_COOKIE = "favoritos";
const DURACAO = 60 * 60 * 24 * 30;

/** Favoritos de visitante anônimo: lista de ids no cookie (legado usava 3 dias; aqui 30). */
export async function lerFavoritos(): Promise<string[]> {
  const jar = await cookies();
  const raw = jar.get(FAVORITOS_COOKIE)?.value;
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string").slice(0, 100) : [];
  } catch {
    return [];
  }
}

export async function gravarFavoritos(ids: string[]) {
  const jar = await cookies();
  jar.set(FAVORITOS_COOKIE, JSON.stringify([...new Set(ids)].slice(0, 100)), {
    path: "/",
    sameSite: "lax",
    maxAge: DURACAO,
  });
}
