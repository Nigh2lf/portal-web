"use server";

import { revalidatePath } from "next/cache";
import type { ResultadoAcao } from "@/lib/api/types";
import { gravarFavoritos, lerFavoritos } from "@/lib/favoritos/cookie";

/**
 * Adiciona/remove um imóvel dos favoritos (cookie do visitante, como
 * `FavoritoAcoes.php`). Devolve o novo estado: `favorito: true` se passou a ser favorito.
 */
export async function alternarFavorito(imovelId: string): Promise<ResultadoAcao<{ favorito: boolean; total: number }>> {
  if (!imovelId) return { ok: false, mensagem: "Imóvel inválido." };
  const atuais = await lerFavoritos();
  const jaFavorito = atuais.includes(imovelId);
  const novos = jaFavorito ? atuais.filter((id) => id !== imovelId) : [...atuais, imovelId];
  await gravarFavoritos(novos);
  revalidatePath("/favoritos");
  return {
    ok: true,
    mensagem: jaFavorito ? "Imóvel removido dos favoritos." : "Imóvel salvo nos favoritos.",
    dados: { favorito: !jaFavorito, total: novos.length },
  };
}

export async function limparFavoritos(): Promise<ResultadoAcao> {
  await gravarFavoritos([]);
  revalidatePath("/favoritos");
  return { ok: true, mensagem: "Lista de favoritos limpa." };
}
