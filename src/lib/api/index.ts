import "server-only";

import type { PortalRepository } from "./repository";

export type { PortalRepository, ImovelDetalhe, FiltrosMeusImoveis } from "./repository";
export * from "./types";

let instancia: PortalRepository | null = null;

/**
 * Ponto único de acesso a dados. `DATA_SOURCE=mock` (padrão em dev) usa os
 * dados em memória de `src/mocks`; `DATA_SOURCE=api` usa a API Django.
 */
export async function getRepository(): Promise<PortalRepository> {
  if (instancia) return instancia;
  const fonte = process.env.DATA_SOURCE ?? "mock";
  if (fonte === "api") {
    const { HttpRepository } = await import("./http-repository");
    instancia = new HttpRepository(process.env.API_BASE_URL ?? "http://localhost:8000/api/v1");
  } else {
    const { MockRepository } = await import("@/mocks/repository");
    instancia = new MockRepository();
  }
  return instancia;
}
