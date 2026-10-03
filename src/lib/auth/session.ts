import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getRepository } from "@/lib/api";
import type { SessaoUsuario } from "@/lib/api/types";

export const SESSAO_COOKIE = "sessao";
const DURACAO = 60 * 60 * 24 * 7;

/**
 * Sessão do anunciante. Na fase mock o cookie guarda o id do anunciante; na
 * fase API guardará o par access/refresh JWT (httpOnly) e `getSessao` fará o
 * refresh transparente. A assinatura pública não muda.
 */
export const getSessao = cache(async (): Promise<SessaoUsuario | null> => {
  const jar = await cookies();
  const id = jar.get(SESSAO_COOKIE)?.value;
  if (!id) return null;
  const repo = await getRepository();
  return repo.getSessaoPorAnunciante(id);
});

export async function exigirSessao(next?: string): Promise<SessaoUsuario> {
  const sessao = await getSessao();
  if (!sessao) redirect(`/anunciar${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  return sessao;
}

export async function iniciarSessao(sessao: SessaoUsuario) {
  const jar = await cookies();
  jar.set(SESSAO_COOKIE, sessao.anunciante_id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DURACAO,
  });
}

export async function encerrarSessao() {
  const jar = await cookies();
  jar.delete(SESSAO_COOKIE);
}
