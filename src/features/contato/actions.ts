"use server";

import { getRepository } from "@/lib/api";
import type { ResultadoAcao } from "@/lib/api/types";
import { getPortal } from "@/lib/tenant/get-portal";
import { errosDoZod } from "./lib/form";
import { contatoSchema, type ContatoForm } from "./schemas";

/** Formulário "Contato" (paridade com `Contato.php`, modo ContatoTipo=Contato). */
export async function enviarContato(dados: ContatoForm): Promise<ResultadoAcao> {
  const parsed = contatoSchema.safeParse(dados);
  if (!parsed.success) return { ok: false, erros: errosDoZod(parsed.error) };
  const [portal, repo] = await Promise.all([getPortal(), getRepository()]);
  return repo.enviarContato(portal.id, parsed.data);
}
