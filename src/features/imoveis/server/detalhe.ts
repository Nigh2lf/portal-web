import "server-only";

import { cache } from "react";
import { getRepository } from "@/lib/api";
import type { ImovelDetalhe } from "@/lib/api/repository";

/**
 * Detalhe memoizado por request (metadata + página = uma chamada, uma
 * visualização registrada).
 */
export const carregarImovel = cache(
  async (portalId: string, slug: string, preview: boolean, anuncianteId?: string): Promise<ImovelDetalhe | null> => {
    const repo = await getRepository();
    return repo.getImovel(portalId, slug, { preview, anuncianteId });
  },
);
