"use server";

import { getRepository } from "@/lib/api";
import type { ResultadoAcao } from "@/lib/api/types";
import { getPortal } from "@/lib/tenant/get-portal";
import { errosDoZod } from "@/features/contato/lib/form";
import { leadSiteSchema, type LeadSiteForm } from "./schemas";

/** Lead B2B da landing "Anunciar" (tabela `LeadSite` do legado). */
export async function enviarLeadSite(dados: LeadSiteForm): Promise<ResultadoAcao> {
  const parsed = leadSiteSchema.safeParse(dados);
  if (!parsed.success) return { ok: false, erros: errosDoZod(parsed.error) };
  const [portal, repo] = await Promise.all([getPortal(), getRepository()]);
  return repo.enviarLeadSite(portal.id, { ...parsed.data, mensagem: parsed.data.mensagem || undefined });
}
