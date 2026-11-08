import { NextResponse, type NextRequest } from "next/server";
import { getRepository } from "@/lib/api";
import { getPortal } from "@/lib/tenant/get-portal";

/**
 * Fotos de um imóvel do portal da requisição, capa primeiro. O card da listagem só traz a
 * capa e chama esta rota quando o visitante passa para a próxima foto.
 */
export async function GET(_request: NextRequest, ctx: RouteContext<"/api/imoveis/[slug]/fotos">) {
  const { slug } = await ctx.params;
  const [portal, repo] = await Promise.all([getPortal(), getRepository()]);
  try {
    const photos = await repo.listPropertyPhotos(portal.id, slug);
    return NextResponse.json(photos, {
      headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=600" },
    });
  } catch {
    return NextResponse.json([], { status: 502 });
  }
}
