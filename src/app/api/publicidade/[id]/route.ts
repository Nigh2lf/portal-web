import { NextResponse, type NextRequest } from "next/server";
import { getRepository } from "@/lib/api";

/**
 * Clique em banner publicitário (paridade com `PublicidadeRedirect.php`):
 * registra o clique e redireciona para o link do anúncio (ou para a home).
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/publicidade/[id]">) {
  const { id } = await ctx.params;
  const repo = await getRepository();
  let destino: string | null = null;
  try {
    destino = await repo.registrarCliquePublicidade(id);
  } catch {
    destino = null;
  }
  const url = new URL(destino && destino.trim() ? destino : "/", request.nextUrl.origin);
  return NextResponse.redirect(url, 302);
}
