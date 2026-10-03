"use server";

import { cookies } from "next/headers";
import { VISAO_COOKIE, type VisaoImoveis } from "./visao";

import { getRepository } from "@/lib/api";
import type { Bairro } from "@/lib/api/types";
import { getPortal } from "@/lib/tenant/get-portal";

/**
 * Bairros com imóveis de uma cidade (substitui `AjaxAtualizarBairro.php`).
 * Com `anuncianteId`, restringe aos bairros em que o anunciante tem imóveis
 * (busca do hotsite).
 */
export async function listarBairros(cidadeSlug: string, anuncianteId?: string): Promise<Bairro[]> {
  if (!cidadeSlug) return [];
  const [portal, repo] = await Promise.all([getPortal(), getRepository()]);
  return repo.listBairros({ cidadeSlug, portalId: portal.id, anuncianteId, comImoveis: true });
}

/** Registra clique em "Ver telefone" / WhatsApp (substitui `AjaxIncrementoTelefone.php`). */
export async function registrarClique(input: { imovelId?: string; anuncianteId: string; tipo: "telefone" | "whatsapp" }): Promise<void> {
  if (!input.anuncianteId) return;
  const repo = await getRepository();
  await repo.registrarClique(input);
}

/** Grava a preferência de exibição da listagem (grade ou um por linha) por 1 ano. */
export async function definirVisao(visao: VisaoImoveis) {
  const jar = await cookies();
  jar.set(VISAO_COOKIE, visao === "lista" ? "lista" : "grade", { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
}
