"use server";

import { getRepository } from "@/lib/api";
import type { Bairro, Encomenda, EncomendaPayload, ResultadoAcao } from "@/lib/api/types";
import { getPortal } from "@/lib/tenant/get-portal";
import { errosDoZod } from "@/features/contato/lib/form";
import { moedaParaNumero } from "@/features/contato/lib/mascaras";
import { RECURSOS_ENCOMENDA, encomendaSchema, type EncomendaForm } from "./schemas";

const RECURSOS = new Set<string>(RECURSOS_ENCOMENDA.map((r) => r.valor));

/** Bairros da cidade escolhida no formulário (select dependente). */
export async function listarBairrosEncomenda(cidadeId: string): Promise<Bairro[]> {
  if (!cidadeId) return [];
  const [portal, repo] = await Promise.all([getPortal(), getRepository()]);
  return repo.listBairros({ cidadeId, portalId: portal.id });
}

/**
 * Encomenda de imóvel. `parceiro=true` corresponde ao `ImovelEncomenda2.php`:
 * o pedido é repassado aos anunciantes que recebem encomendas.
 */
export async function enviarEncomenda(dados: EncomendaForm, parceiro = false): Promise<ResultadoAcao> {
  const parsed = encomendaSchema.safeParse(dados);
  if (!parsed.success) return { ok: false, erros: errosDoZod(parsed.error) };
  const d = parsed.data;

  const valorMin = moedaParaNumero(d.valor_min);
  const valorMax = moedaParaNumero(d.valor_max);
  if (valorMin && valorMax && valorMin > valorMax) {
    return { ok: false, erros: { valor_max: ["O valor máximo deve ser maior que o mínimo."] } };
  }

  const payload: EncomendaPayload = {
    nome: d.nome,
    email: d.email,
    telefone: d.telefone,
    objetivo: d.objetivo,
    tipo_id: d.tipo_id || null,
    cidade_id: d.cidade_id || null,
    bairro_id: d.bairro_id || null,
    valor_min: valorMin,
    valor_max: valorMax,
    dentro_condominio: d.condominio === "indiferente" ? null : d.condominio === "dentro",
    recurso: d.recurso && RECURSOS.has(d.recurso) ? (d.recurso as Encomenda["recurso"]) : null,
    mensagem: d.mensagem ?? "",
    parceiro,
  };

  const [portal, repo] = await Promise.all([getPortal(), getRepository()]);
  return repo.enviarEncomenda(portal.id, payload);
}
