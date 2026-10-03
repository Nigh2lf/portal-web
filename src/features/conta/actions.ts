"use server";

import { redirect } from "next/navigation";
import { getRepository } from "@/lib/api";
import type { CadastroPayload, ResultadoAcao } from "@/lib/api/types";
import { iniciarSessao } from "@/lib/auth/session";
import { getPortal } from "@/lib/tenant/get-portal";
import { errosDoZod } from "@/features/contato/lib/form";
import { somenteDigitos } from "@/features/contato/lib/mascaras";
import { cadastroSchema, loginSchema, recuperarSenhaSchema, redefinirSenhaSchema, type CadastroForm, type RedefinirSenhaForm } from "./schemas";

/** Só aceita caminhos internos como destino pós-login (evita open redirect). */
function destinoSeguro(next: string | undefined) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/painel";
  return next;
}

/** Login do anunciante (`Anunciar.php`, Tipo=Login). Usado com `useActionState`. */
export async function entrar(_prev: ResultadoAcao | undefined, formData: FormData): Promise<ResultadoAcao> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    senha: formData.get("senha"),
    next: formData.get("next") || undefined,
  });
  if (!parsed.success) return { ok: false, erros: errosDoZod(parsed.error) };

  const repo = await getRepository();
  const r = await repo.login(parsed.data.email, parsed.data.senha);
  if (!r.ok || !r.dados) return { ok: false, mensagem: r.mensagem ?? "E-mail ou senha inválidos." };

  await iniciarSessao(r.dados);
  redirect(destinoSeguro(parsed.data.next));
}

/** Cadastro de anunciante (`Cadastro.php`). Em sucesso inicia a sessão e redireciona ao painel. */
export async function cadastrar(dados: CadastroForm): Promise<ResultadoAcao> {
  const parsed = cadastroSchema.safeParse(dados);
  if (!parsed.success) return { ok: false, erros: errosDoZod(parsed.error) };
  const d = parsed.data;

  const [portal, repo] = await Promise.all([getPortal(), getRepository()]);

  const planos = await repo.listPlanos();
  const plano = planos.find((p) => p.id === d.plano_id);
  if (!plano) return { ok: false, erros: { plano_id: ["Plano inválido."] } };
  if (d.tipo === "proprietario" && !plano.exclusivo_proprietario) return { ok: false, erros: { plano_id: ["Proprietários usam o plano gratuito."] } };
  if (d.tipo !== "proprietario" && plano.exclusivo_proprietario) return { ok: false, erros: { plano_id: ["Este plano é exclusivo para proprietários."] } };

  const proprietario = d.tipo === "proprietario";
  const limpar = (v?: string) => (v && v.trim() ? v.trim() : undefined);
  const payload: CadastroPayload = {
    tipo: d.tipo,
    plano_id: plano.id,
    nome: d.nome,
    documento: somenteDigitos(d.documento),
    email: d.email.toLowerCase(),
    senha: d.senha,
    telefone: d.telefone,
    telefone2: limpar(d.telefone2),
    contato: proprietario ? undefined : limpar(d.contato),
    site: proprietario ? undefined : limpar(d.site),
    endereco: proprietario ? undefined : limpar(d.endereco),
    creci: proprietario ? undefined : limpar(d.creci),
    cupom: proprietario ? undefined : limpar(d.cupom),
    aceite_termos: d.aceite_termos,
  };

  const r = await repo.cadastrar(portal.id, payload);
  if (!r.ok || !r.dados) return { ok: false, mensagem: r.mensagem, erros: r.erros };

  await iniciarSessao(r.dados);
  redirect(`/painel?bemvindo=1${plano.preco_mensal ? "&ativacao=pendente" : ""}`);
}

/** `RecuperarSenha.php`: pede o link de redefinição. */
export async function recuperarSenha(dados: { email: string }): Promise<ResultadoAcao> {
  const parsed = recuperarSenhaSchema.safeParse(dados);
  if (!parsed.success) return { ok: false, erros: errosDoZod(parsed.error) };
  const repo = await getRepository();
  return repo.recuperarSenha(parsed.data.email);
}

/** Página do link enviado por e-mail: grava a nova senha a partir de `email` + `hash`. */
export async function redefinirSenha(dados: RedefinirSenhaForm): Promise<ResultadoAcao> {
  const parsed = redefinirSenhaSchema.safeParse(dados);
  if (!parsed.success) return { ok: false, erros: errosDoZod(parsed.error) };
  const repo = await getRepository();
  return repo.redefinirSenha(parsed.data.email.toLowerCase(), parsed.data.hash, parsed.data.senha);
}
