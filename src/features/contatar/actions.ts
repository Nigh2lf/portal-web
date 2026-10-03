"use server";

import { getRepository } from "@/lib/api";
import type { ResultadoAcao } from "@/lib/api/types";
import { getPortal } from "@/lib/tenant/get-portal";
import { contatarSchema, type ContatarValores } from "./schemas";

/** "Fale com o anunciante" (substitui `Contactar.php`). Mesmo schema do formulário. */
export async function contatarAnunciante(valores: ContatarValores): Promise<ResultadoAcao> {
  const parsed = contatarSchema.safeParse(valores);
  if (!parsed.success) {
    const erros: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const chave = String(issue.path[0] ?? "form");
      (erros[chave] ??= []).push(issue.message);
    }
    return { ok: false, mensagem: "Verifique os campos destacados.", erros };
  }
  const [portal, repo] = await Promise.all([getPortal(), getRepository()]);
  return repo.contatarAnunciante(portal.id, parsed.data);
}
