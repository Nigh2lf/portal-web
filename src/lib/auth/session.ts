import "server-only";

import { createHash } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getRepository } from "@/lib/api";
import type { SessaoUsuario } from "@/lib/api/types";

export const SESSAO_COOKIE = "sessao";
export const ACCESS_COOKIE = "access";
export const REFRESH_COOKIE = "refresh";
const DURACAO_MOCK = 60 * 60 * 24 * 7;
const DURACAO_REFRESH = 60 * 60 * 24 * 30;

export const modoApi = () => (process.env.DATA_SOURCE ?? "mock") === "api";

/** Convenção do backend: o front envia a senha como MD5 hex maiúsculo. */
export function hashSenha(senha: string) {
  return createHash("md5").update(senha, "utf8").digest("hex").toUpperCase();
}

function expiracao(jwt: string) {
  try {
    const payload = JSON.parse(Buffer.from(jwt.split(".")[1]!, "base64url").toString("utf8")) as { exp?: number };
    return payload.exp ? new Date(payload.exp * 1000) : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Sessão do anunciante. Modo mock: cookie `sessao` com o id do anunciante.
 * Modo API: JWT em cookies httpOnly (`access`/`refresh`); o `proxy.ts`
 * renova o access antes de expirar. Memoizada por request.
 */
export const getSessao = cache(async (): Promise<SessaoUsuario | null> => {
  const jar = await cookies();
  const repo = await getRepository();
  if (modoApi()) {
    const access = jar.get(ACCESS_COOKIE)?.value ?? null;
    if (!access) return null;
    return repo.getSessaoAtual(access, null);
  }
  const id = jar.get(SESSAO_COOKIE)?.value;
  return id ? repo.getSessaoPorAnunciante(id) : null;
});

export async function exigirSessao(next?: string): Promise<SessaoUsuario> {
  const sessao = await getSessao();
  if (!sessao) redirect(`/anunciar${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  return sessao;
}

/** Access token atual (modo API), para o repositório HTTP chamar a área do anunciante. */
export async function getAccessToken() {
  const jar = await cookies();
  return jar.get(ACCESS_COOKIE)?.value ?? null;
}

export async function iniciarSessao(sessao: SessaoUsuario) {
  const jar = await cookies();
  const secure = process.env.NODE_ENV === "production";
  if (modoApi() && sessao.tokens) {
    jar.set(ACCESS_COOKIE, sessao.tokens.access, { httpOnly: true, sameSite: "lax", secure, path: "/", expires: expiracao(sessao.tokens.access) });
    jar.set(REFRESH_COOKIE, sessao.tokens.refresh, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: DURACAO_REFRESH });
    return;
  }
  jar.set(SESSAO_COOKIE, sessao.anunciante_id, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: DURACAO_MOCK });
}

export async function encerrarSessao() {
  const jar = await cookies();
  if (modoApi()) {
    const refresh = jar.get(REFRESH_COOKIE)?.value ?? null;
    const repo = await getRepository();
    await repo.encerrarSessao(refresh).catch(() => undefined);
    jar.delete(ACCESS_COOKIE);
    jar.delete(REFRESH_COOKIE);
  }
  jar.delete(SESSAO_COOKIE);
}
