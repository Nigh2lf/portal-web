import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Container } from "@/components/layout/container";
import { ResultadoBusca } from "@/features/imoveis/components/resultado-busca";
import { buscarImoveis, carregarBusca, resolverIdsLegado } from "@/features/imoveis/server/busca";
import { getRepository } from "@/lib/api";
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

export default async function BuscaPage({ searchParams }: PageProps<"/imoveis">) {
  const [sp, portal, repo, favoritos] = await Promise.all([searchParams, getPortal(), getRepository(), lerFavoritos()]);
  const visao = await lerVisao();
  const filtros = parseFiltros(sp);

  const urlLimpa = await resolverIdsLegado(sp, portal.id, filtros);
  if (urlLimpa) redirect(urlLimpa);

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
