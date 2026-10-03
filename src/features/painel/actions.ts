"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getRepository } from "@/lib/api";
import type { Bairro, ResultadoAcao } from "@/lib/api/types";
import { getSessao } from "@/lib/auth/session";
import { formParaPayload, imovelSchema, payloadDeImovel, perfilSchema, senhaSchema, type ImovelFormValues, type PerfilFormValues, type SenhaFormValues } from "./schemas";

const NAO_AUTENTICADO: ResultadoAcao<never> = { ok: false, mensagem: "Sua sessão expirou. Entre novamente." };

function errosDoZod(issues: Array<{ path: PropertyKey[]; message: string }>): Record<string, string[]> {
  const erros: Record<string, string[]> = {};
  for (const i of issues) {
    const chave = String(i.path[0] ?? "_");
    (erros[chave] ??= []).push(i.message);
  }
  return erros;
}

function revalidarPainel(imovelId?: string) {
  revalidatePath("/painel");
  revalidatePath("/painel/imoveis");
  if (imovelId) {
    revalidatePath(`/painel/imoveis/${imovelId}/editar`);
    revalidatePath(`/painel/imoveis/${imovelId}/fotos`);
  }
}

function limpar(v: string | undefined) {
  const t = v?.trim();
  return t ? t : null;
}

// ---------------------------------------------------------------- perfil
export async function atualizarPerfilAction(valores: PerfilFormValues): Promise<ResultadoAcao> {
  const sessao = await getSessao();
  if (!sessao) return NAO_AUTENTICADO;
  const parsed = perfilSchema.safeParse(valores);
  if (!parsed.success) return { ok: false, mensagem: "Verifique os campos destacados.", erros: errosDoZod(parsed.error.issues) };
  const v = parsed.data;
  const repo = await getRepository();
  const proprietario = sessao.tipo === "proprietario";
  const atual = await repo.getAnunciante(sessao.anunciante_id);
  const r = await repo.atualizarPerfil(sessao.anunciante_id, {
    nome: v.nome,
    email: v.email,
    telefone: v.telefone,
    telefone2: limpar(v.telefone2),
    whatsapp: limpar(v.whatsapp),
    // Proprietário não edita estes campos: preserva o que já existe.
    contato: proprietario ? (atual?.contato ?? null) : limpar(v.contato),
    site: proprietario ? (atual?.site ?? null) : limpar(v.site),
    endereco: proprietario ? (atual?.endereco ?? null) : limpar(v.endereco),
    creci: proprietario ? (atual?.creci ?? null) : limpar(v.creci),
  });
  if (r.ok) {
    revalidatePath("/painel/perfil");
    revalidatePath("/painel", "layout");
  }
  return { ok: r.ok, mensagem: r.mensagem, erros: r.erros };
}

// ---------------------------------------------------------------- senha
export async function alterarSenhaAction(valores: SenhaFormValues): Promise<ResultadoAcao> {
  const sessao = await getSessao();
  if (!sessao) return NAO_AUTENTICADO;
  const parsed = senhaSchema.safeParse(valores);
  if (!parsed.success) return { ok: false, mensagem: "Verifique os campos destacados.", erros: errosDoZod(parsed.error.issues) };
  const repo = await getRepository();
  return repo.alterarSenha(sessao.anunciante_id, parsed.data.senha_atual, parsed.data.senha_nova);
}

// ---------------------------------------------------------------- catálogos
export async function listarBairrosPainel(cidadeId: string): Promise<Bairro[]> {
  const sessao = await getSessao();
  if (!sessao || !cidadeId) return [];
  const repo = await getRepository();
  return repo.listBairros({ cidadeId });
}

// ---------------------------------------------------------------- imóveis
export async function criarImovelAction(valores: ImovelFormValues): Promise<ResultadoAcao<{ id: string }>> {
  const sessao = await getSessao();
  if (!sessao) return NAO_AUTENTICADO;
  const parsed = imovelSchema.safeParse(valores);
  if (!parsed.success) return { ok: false, mensagem: "Verifique os campos destacados.", erros: errosDoZod(parsed.error.issues) };
  const repo = await getRepository();
  const r = await repo.criarImovel(sessao.anunciante_id, formParaPayload(parsed.data));
  if (!r.ok || !r.dados) return { ok: false, mensagem: r.mensagem, erros: r.erros };
  revalidarPainel(r.dados.id);
  redirect(`/painel/imoveis/${r.dados.id}/fotos?novo=1`);
}

export async function atualizarImovelAction(imovelId: string, valores: ImovelFormValues): Promise<ResultadoAcao<{ id: string }>> {
  const sessao = await getSessao();
  if (!sessao) return NAO_AUTENTICADO;
  const parsed = imovelSchema.safeParse(valores);
  if (!parsed.success) return { ok: false, mensagem: "Verifique os campos destacados.", erros: errosDoZod(parsed.error.issues) };
  const repo = await getRepository();
  const r = await repo.atualizarImovel(sessao.anunciante_id, imovelId, formParaPayload(parsed.data));
  if (!r.ok || !r.dados) return { ok: false, mensagem: r.mensagem, erros: r.erros };
  revalidarPainel(imovelId);
  return { ok: true, mensagem: r.mensagem ?? "Imóvel atualizado.", dados: { id: r.dados.id } };
}

/** Ativa/desativa mantendo os demais dados do imóvel. */
export async function alternarAtivoAction(imovelId: string): Promise<ResultadoAcao<{ ativo: boolean }>> {
  const sessao = await getSessao();
  if (!sessao) return NAO_AUTENTICADO;
  const repo = await getRepository();
  const atual = await repo.getMeuImovel(sessao.anunciante_id, imovelId);
  if (!atual) return { ok: false, mensagem: "Imóvel não encontrado." };
  const payload = payloadDeImovel(atual);
  payload.ativo = !atual.ativo;
  // Imóvel inativo não ocupa cota de destaque.
  if (!payload.ativo) payload.tipo_anuncio = "normal";
  const r = await repo.atualizarImovel(sessao.anunciante_id, imovelId, payload);
  if (!r.ok) {
    const motivo = r.erros ? Object.values(r.erros).flat().join(" ") : r.mensagem;
    return { ok: false, mensagem: motivo || "Não foi possível alterar o status." };
  }
  revalidarPainel(imovelId);
  return { ok: true, mensagem: payload.ativo ? "Imóvel ativado." : "Imóvel desativado.", dados: { ativo: payload.ativo } };
}

export async function excluirImovelAction(imovelId: string): Promise<ResultadoAcao> {
  const sessao = await getSessao();
  if (!sessao) return NAO_AUTENTICADO;
  const repo = await getRepository();
  const r = await repo.excluirImovel(sessao.anunciante_id, imovelId);
  if (r.ok) revalidarPainel(imovelId);
  return r;
}

// ---------------------------------------------------------------- fotos
const MAX_FOTO_BYTES = 5 * 1024 * 1024;

export async function adicionarFotosAction(imovelId: string, urls: string[]): Promise<ResultadoAcao<{ total: number }>> {
  const sessao = await getSessao();
  if (!sessao) return NAO_AUTENTICADO;
  if (!Array.isArray(urls) || urls.length === 0) return { ok: false, mensagem: "Selecione ao menos uma imagem." };
  for (const u of urls) {
    if (typeof u !== "string" || !/^data:image\/(jpeg|jpg|png|gif|webp);base64,/i.test(u)) return { ok: false, mensagem: "Formato de imagem não suportado. Use JPG, PNG, GIF ou WebP." };
    // base64 ~ 4/3 do tamanho real
    if (u.length * 0.75 > MAX_FOTO_BYTES) return { ok: false, mensagem: "Cada foto deve ter no máximo 5 MB." };
  }
  const repo = await getRepository();
  const r = await repo.adicionarFotos(sessao.anunciante_id, imovelId, urls);
  if (!r.ok || !r.dados) return { ok: false, mensagem: r.mensagem, erros: r.erros };
  revalidarPainel(imovelId);
  return { ok: true, mensagem: `${urls.length === 1 ? "1 foto adicionada" : `${urls.length} fotos adicionadas`}.`, dados: { total: r.dados.fotos.length } };
}

export async function removerFotoAction(imovelId: string, fotoId: string): Promise<ResultadoAcao> {
  const sessao = await getSessao();
  if (!sessao) return NAO_AUTENTICADO;
  const repo = await getRepository();
  const r = await repo.removerFoto(sessao.anunciante_id, imovelId, fotoId);
  if (r.ok) revalidarPainel(imovelId);
  return { ok: r.ok, mensagem: r.ok ? "Foto removida." : r.mensagem };
}

export async function removerTodasFotosAction(imovelId: string): Promise<ResultadoAcao> {
  const sessao = await getSessao();
  if (!sessao) return NAO_AUTENTICADO;
  const repo = await getRepository();
  const r = await repo.removerTodasFotos(sessao.anunciante_id, imovelId);
  if (r.ok) revalidarPainel(imovelId);
  return { ok: r.ok, mensagem: r.ok ? "Todas as fotos foram removidas." : r.mensagem };
}

export async function definirFotoPrincipalAction(imovelId: string, fotoId: string): Promise<ResultadoAcao> {
  const sessao = await getSessao();
  if (!sessao) return NAO_AUTENTICADO;
  const repo = await getRepository();
  const r = await repo.definirFotoPrincipal(sessao.anunciante_id, imovelId, fotoId);
  if (r.ok) revalidarPainel(imovelId);
  return { ok: r.ok, mensagem: r.ok ? "Foto principal definida." : r.mensagem };
}

export async function reordenarFotosAction(imovelId: string, fotoIds: string[]): Promise<ResultadoAcao> {
  const sessao = await getSessao();
  if (!sessao) return NAO_AUTENTICADO;
  if (!Array.isArray(fotoIds) || fotoIds.some((id) => typeof id !== "string")) return { ok: false, mensagem: "Ordem inválida." };
  const repo = await getRepository();
  const r = await repo.reordenarFotos(sessao.anunciante_id, imovelId, fotoIds);
  if (r.ok) revalidarPainel(imovelId);
  return { ok: r.ok, mensagem: r.ok ? "Ordem atualizada." : r.mensagem };
}
