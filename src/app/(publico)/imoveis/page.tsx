import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Container } from "@/components/layout/container";
import { BuscaPaginaSkeleton } from "@/features/imoveis/components/busca-skeleton";
import { ResultadoBusca } from "@/features/imoveis/components/resultado-busca";
import { buscarImoveis, carregarBusca, resolverIdsLegado } from "@/features/imoveis/server/busca";
import { getRepository } from "@/lib/api";
import type { BuscaFiltros, Portal } from "@/lib/api/types";
import { linkBusca, parseFiltros } from "@/lib/busca/filtros";
import { lerFavoritos } from "@/lib/favoritos/cookie";
import { lerVisao } from "@/features/imoveis/visao";
import { JsonLd, breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { montarMetadata } from "@/lib/seo/metadata";
import { getPortal } from "@/lib/tenant/get-portal";

export async function generateMetadata({ searchParams }: PageProps<"/imoveis">): Promise<Metadata> {
  const [sp, portal] = await Promise.all([searchParams, getPortal()]);
  const filtros = parseFiltros(sp);
  const resultado = await buscarImoveis(portal.id, filtros);
  const titulo = filtros.pagina > 1 ? `${resultado.titulo} - Página ${filtros.pagina}` : resultado.titulo;
  return montarMetadata(portal, {
    titulo,
    descricao: resultado.descricao_seo,
    path: linkBusca(filtros),
    imagem: resultado.resultados[0]?.foto_principal_url ?? undefined,
    noindex: Boolean(filtros.codigo || filtros.anunciante),
  });
}

/**
 * A página em si só resolve o portal e os filtros (rápido). A consulta à API fica
 * em `CorpoBusca`, dentro de um Suspense com `key` dos filtros: assim o skeleton
 * aparece também quando só a query string muda (abas, ordenação, paginação),
 * caso em que o `loading.tsx` não é exibido pelo App Router.
 */
export default async function BuscaPage({ searchParams }: PageProps<"/imoveis">) {
  const [sp, portal] = await Promise.all([searchParams, getPortal()]);
  const filtros = parseFiltros(sp);

  const urlLimpa = await resolverIdsLegado(sp, portal.id, filtros);
  if (urlLimpa) redirect(urlLimpa);

  return (
    <Suspense key={JSON.stringify(filtros)} fallback={<BuscaPaginaSkeleton />}>
      <CorpoBusca portal={portal} filtros={filtros} />
    </Suspense>
  );
}

async function CorpoBusca({ portal, filtros }: { portal: Portal; filtros: BuscaFiltros }) {
  const [repo, favoritos, visao] = await Promise.all([getRepository(), lerFavoritos(), lerVisao()]);
  const [dados, banner] = await Promise.all([carregarBusca(portal, filtros), repo.getPublicidade(portal.id, "banner_lista")]);
  const sugestoes = dados.resultado.total === 0 ? await repo.getPesquisasPopulares(portal.id, 8) : [];

  const crumbs = [{ nome: "Imóveis", href: "/imoveis" }, { nome: dados.resultado.titulo }];

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(portal, [{ nome: "Início", href: "/" }, { nome: "Imóveis", href: "/imoveis" }, { nome: dados.resultado.titulo, href: linkBusca(filtros) }])} />
      <PageHeader titulo={dados.resultado.titulo} subtitulo={`Imóveis anunciados no ${portal.nome}. Filtre por bairro, tipo, quartos e faixa de preço.`} crumbs={crumbs} compacto />
      <Container className="py-6 sm:py-8">
        <ResultadoBusca portal={portal} filtros={filtros} dados={dados} favoritos={favoritos} banner={banner} sugestoes={sugestoes} visao={visao} />
      </Container>
    </>
  );
}
