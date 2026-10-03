import "server-only";

import { cookies } from "next/headers";
import { VISAO_COOKIE, VISAO_PADRAO, type VisaoImoveis } from "./visao-config";

export { VISAO_COOKIE, VISAO_PADRAO, type VisaoImoveis } from "./visao-config";

/** Preferência do visitante para a listagem de imóveis: grade (padrão) ou um por linha. */
export async function lerVisao(): Promise<VisaoImoveis> {
  const jar = await cookies();
  const v = jar.get(VISAO_COOKIE)?.value;
  return v === "lista" ? "lista" : VISAO_PADRAO;
}
