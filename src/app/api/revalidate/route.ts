import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { tagValida } from "@/lib/api/cache-tags";

function segredoConfere(recebido: string | null) {
  const esperado = process.env.REVALIDATE_SECRET ?? "";
  if (!esperado || !recebido) return false;
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Chamado pelo portal-api quando um dado público muda (sinais do Django ou limpeza
 * manual no admin). Expira as tags na hora: a próxima leitura já busca o dado novo.
 */
export async function POST(request: NextRequest) {
  if (!segredoConfere(request.headers.get("x-revalidate-secret"))) {
    return NextResponse.json({ ok: false, erro: "Não autorizado." }, { status: 401 });
  }
  const corpo = (await request.json().catch(() => null)) as { tags?: unknown } | null;
  const tags = Array.isArray(corpo?.tags) ? corpo.tags.filter(tagValida).slice(0, 50) : [];
  if (!tags.length) {
    return NextResponse.json({ ok: false, erro: "Informe ao menos uma tag válida." }, { status: 400 });
  }
  for (const tag of tags) revalidateTag(tag, { expire: 0 });
  return NextResponse.json({ ok: true, tags });
}
