import type { NextRequest } from "next/server";
import { getRepository } from "@/lib/api";
import type { Mensagem } from "@/lib/api/types";
import { getSessao } from "@/lib/auth/session";
import { PREFERENCIAS_LABEL, dataValida, formatarDataHora, hojeISO } from "@/features/painel/utils";

const SEP = ";";
const LOTE = 200;
const COLUNAS = ["Data", "Código do imóvel", "Imóvel", "Nome", "E-mail", "Telefone", "Preferência de contato", "Origem", "Mensagem"];
const ORIGEM: Record<Mensagem["origem"], string> = { imovel: "Anúncio", hotsite: "Hotsite", mobile: "Celular" };

/** Escapa célula CSV: aspas duplas e quebras de linha preservadas dentro de aspas. */
function celula(v: string | null | undefined) {
  const s = (v ?? "").replace(/\r?\n/g, " ").trim();
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function linha(valores: Array<string | null | undefined>) {
  return `${valores.map(celula).join(SEP)}\r\n`;
}

/**
 * GET /api/painel/ofertas/exportar?inicio=YYYY-MM-DD&fim=YYYY-MM-DD
 * CSV (UTF-8 com BOM, separador ";") das mensagens recebidas no período,
 * gerado em streaming. Substitui o `Excel.php` do legado.
 */
export async function GET(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return new Response("Não autenticado.", { status: 401 });

  const sp = request.nextUrl.searchParams;
  let inicio = dataValida(sp.get("inicio") ?? undefined);
  let fim = dataValida(sp.get("fim") ?? undefined);
  if (inicio && fim && inicio > fim) [inicio, fim] = [fim, inicio];

  const repo = await getRepository();
  const anuncianteId = sessao.anunciante_id;
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(encoder.encode(`﻿${linha(COLUNAS)}`));
      let pagina = 1;
      let totalPaginas = 1;
      try {
        do {
          const r = await repo.listMensagens(anuncianteId, { inicio, fim, pagina, por_pagina: LOTE });
          totalPaginas = r.total_paginas;
          let bloco = "";
          for (const m of r.resultados) {
            bloco += linha([
              formatarDataHora(m.criado_em),
              m.imovel_codigo,
              m.imovel_titulo,
              m.nome,
              m.email,
              m.telefone,
              m.preferencias.map((p) => PREFERENCIAS_LABEL[p]).join(", "),
              ORIGEM[m.origem],
              m.mensagem,
            ]);
          }
          if (bloco) controller.enqueue(encoder.encode(bloco));
          pagina += 1;
        } while (pagina <= totalPaginas);
        controller.close();
      } catch (e) {
        controller.error(e);
      }
    },
  });

  const sufixo = inicio && fim ? `${inicio}_a_${fim}` : hojeISO();
  return new Response(stream, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ofertas-recebidas-${sufixo}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
