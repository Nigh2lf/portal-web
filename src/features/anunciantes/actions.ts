"use server";

import { getRepository } from "@/lib/api";
import type { ResultadoAcao } from "@/lib/api/types";

/** Registra o clique em "Ver telefone" / WhatsApp do card de anunciante (paridade com `AjaxIncrementoTelefone.php`). */
export async function registrarCliqueAnunciante(anuncianteId: string, tipo: "telefone" | "whatsapp" = "telefone"): Promise<ResultadoAcao> {
  if (!anuncianteId) return { ok: false, mensagem: "Anunciante inválido." };
  const repo = await getRepository();
  await repo.registrarClique({ anuncianteId, tipo });
  return { ok: true };
}
