import type { Metadata } from "next";
import { Download, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getRepository } from "@/lib/api";
import { exigirSessao } from "@/lib/auth/session";
import { montarMetadata } from "@/lib/seo/metadata";
import { getPortal } from "@/lib/tenant/get-portal";
import { EmptyState } from "@/features/painel/components/empty-state";
import { EncomendasLista } from "@/features/painel/components/encomendas-lista";
import { OfertasTabela } from "@/features/painel/components/ofertas-tabela";
import { PaginacaoPainel } from "@/features/painel/components/paginacao-painel";
import { PainelHeader } from "@/features/painel/components/painel-header";
import { PeriodoFiltro } from "@/features/painel/components/periodo-filtro";
import { diasAtrasISO, fimDoMesISO, hojeISO, inicioDoMesISO, paginaDe, periodoDe, queryDe, type SearchParamsLike } from "@/features/painel/utils";

export async function generateMetadata(): Promise<Metadata> {
  const portal = await getPortal();
  return montarMetadata(portal, { titulo: "Ofertas recebidas", noindex: true, path: "/painel/ofertas" });
}

const POR_PAGINA = 20;

export default async function OfertasPage({ searchParams }: { searchParams: Promise<SearchParamsLike> }) {
  const sessao = await exigirSessao("/painel/ofertas");
  const sp = await searchParams;
  const { inicio, fim } = periodoDe(sp, { inicio: diasAtrasISO(30), fim: hojeISO() });
  const pagina = paginaDe(sp);
  const [repo, portal] = await Promise.all([getRepository(), getPortal()]);

  const [mensagens, anunciante] = await Promise.all([
    repo.listMensagens(sessao.anunciante_id, { inicio, fim, pagina, por_pagina: POR_PAGINA }),
    repo.getAnunciante(sessao.anunciante_id),
  ]);

  // Slugs dos imóveis citados (para o link ao anúncio).
  const ids = Array.from(new Set(mensagens.resultados.map((m) => m.imovel_id).filter((x): x is string => Boolean(x))));
  const resumos = ids.length ? await repo.listImoveisPorIds(portal.id, ids) : [];
  const slugs = Object.fromEntries(resumos.map((r) => [r.id, r.slug]));

  const recebeEncomenda = Boolean(anunciante?.recebe_encomenda);
  const [encomendas, tipos, cidades, bairros] = recebeEncomenda
    ? await Promise.all([repo.listEncomendasRecebidas(sessao.anunciante_id), repo.listTipos(), repo.listCidades(portal.id), repo.listBairros({ portalId: portal.id })])
    : [[], [], [], []];

  const hrefPagina = (p: number) => `/painel/ofertas${queryDe({ inicio, fim, pagina: p > 1 ? p : undefined })}`;
  const hoje = hojeISO();

  return (
    <div className="flex flex-col gap-5">
      <PainelHeader titulo="Ofertas recebidas" descricao="Mensagens enviadas por interessados nos seus anúncios. Responda rápido: leads atendidos na primeira hora convertem muito mais." crumbs={[{ nome: "Ofertas recebidas" }]} />

      <PeriodoFiltro
        action="/painel/ofertas"
        inicio={inicio}
        fim={fim}
        atalhos={[
          { label: "Últimos 7 dias", inicio: diasAtrasISO(7), fim: hoje },
          { label: "Últimos 30 dias", inicio: diasAtrasISO(30), fim: hoje },
          { label: "Este mês", inicio: inicioDoMesISO(), fim: hoje },
          { label: "Mês passado", inicio: inicioDoMesISO(-1), fim: fimDoMesISO(-1) },
          { label: "Últimos 90 dias", inicio: diasAtrasISO(90), fim: hoje },
        ]}
        extra={
          <Button asChild variant="outline" size="sm" className="h-8">
            <a href={`/api/painel/ofertas/exportar${queryDe({ inicio, fim })}`} download>
              <Download data-icon="inline-start" /> Exportar CSV
            </a>
          </Button>
        }
      />

      {mensagens.total === 0 ? (
        <EmptyState icon={Inbox} titulo="Nenhuma oferta neste período" descricao="Ajuste o período ou aguarde: as mensagens enviadas pelos interessados aparecem aqui assim que chegam." />
      ) : (
        <>
          <OfertasTabela mensagens={mensagens.resultados} slugs={slugs} />
          <PaginacaoPainel dados={mensagens} hrefDe={hrefPagina} rotuloItens="mensagens" />
        </>
      )}

      {recebeEncomenda && (
        <section aria-labelledby="titulo-encomendas" className="mt-4 flex flex-col gap-3">
          <div>
            <h2 id="titulo-encomendas" className="text-lg font-semibold">
              Encomendas recebidas
            </h2>
            <p className="text-sm text-muted-foreground">Pedidos de imóveis feitos por visitantes do portal e compartilhados com anunciantes parceiros do seu plano.</p>
          </div>
          <EncomendasLista encomendas={encomendas} tipos={tipos} cidades={cidades} bairros={bairros} />
        </section>
      )}
    </div>
  );
}
