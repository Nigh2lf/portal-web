import "server-only";

import { cookies } from "next/headers";

export type VisaoImoveis = "grade" | "lista";
export const VISAO_COOKIE = "visao_imoveis";
export const VISAO_PADRAO: VisaoImoveis = "grade";

/** Preferência do visitante para a listagem de imóveis: grade (padrão) ou um por linha. */
export async function lerVisao(): Promise<VisaoImoveis> {
  const jar = await cookies();
  const v = jar.get(VISAO_COOKIE)?.value;
  return v === "lista" ? "lista" : VISAO_PADRAO;
}
