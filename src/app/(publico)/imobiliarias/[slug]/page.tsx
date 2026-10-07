import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import type { AnuncianteResumo, BuscaFiltros, Portal } from "@/lib/api/types";
import { Container } from "@/components/layout/container";
import { AnuncianteBox } from "@/features/imoveis/components/anunciante-box";
import { BuscaCorpoSkeleton } from "@/features/imoveis/components/busca-skeleton";
import { ResultadoBusca } from "@/features/imoveis/components/resultado-busca";
import { carregarBusca } from "@/features/imoveis/server/busca";
import { getRepository } from "@/lib/api";
import { OBJETIVOS, linkBusca, parseFiltros } from "@/lib/busca/filtros";
import { lerFavoritos } from "@/lib/favoritos/cookie";
import { lerVisao } from "@/features/imoveis/visao";
import { JsonLd, breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { montarMetadata } from "@/lib/seo/metadata";
import { getPortal } from "@/lib/tenant/get-portal";
import { formatarNumero, plural } from "@/lib/utils/format";

type Props = PageProps<"/imobiliarias/[slug]">;

async function resolver(props: Props) {
  const [{ slug }, sp, portal, repo] = await Promise.all([props.params, props.searchParams, getPortal(), getRepository()]);
  const anunciante = await repo.getAnunciantePublico(portal.id, slug);
  return { slug, sp, portal, repo, anunciante };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug, portal, anunciante } = await resolver(props);
  if (!anunciante) return montarMetadata(portal, { titulo: "Anunciante não encontrado", noindex: true });
  const tipo = anunciante.tipo === "imobiliaria" ? "Imobiliária" : anunciante.tipo === "corretor" ? "Corretor" : "Anunciante";
  return montarMetadata(portal, {
    titulo: `${anunciante.nome} - Imóveis à venda e para alugar`,
    descricao: `${tipo} ${anunciante.nome}${anunciante.creci ? ` (CRECI ${anunciante.creci})` : ""}${anunciante.endereco ? `, ${anunciante.endereco}` : ""}. ${anunciante.total_imoveis} imóveis anunciados no ${portal.nome}.`,
    path: `/imobiliarias/${slug}`,
    imagem: anunciante.logo_url,
  });
}

export default async function HotsitePage(props: Props) {
  const { slug, sp, portal, anunciante } = await resolver(props);
  if (!anunciante) notFound();

  const base = `/imobiliarias/${slug}`;
  // Na UI o anunciante está no caminho; só a chamada ao repositório recebe o filtro.
  const filtrosUI: BuscaFiltros = { ...parseFiltros(sp), anunciante: undefined };

  const diretorio = `/${portal.slug_imobiliarias}`;
  const rotuloTipo = anunciante.tipo === "imobiliaria" ? "Imobiliária" : anunciante.tipo === "corretor" ? "Corretor" : "Anunciante";

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(portal, [{ nome: "Início", href: "/" }, { nome: "Imobiliárias", href: diretorio }, { nome: anunciante.nome, href: base }])} />

      <section className="border-b bg-gradient-to-br from-brand-soft/80 via-background to-background">
        <Container className="py-6 sm:py-8">
          <nav aria-label="Navegação estrutural" className="mb-4">
            <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-foreground">
                  Início
                </Link>
              </li>
              <li className="flex items-center gap-1">
                <ChevronRight className="size-3.5" aria-hidden />
                <Link href={diretorio} className="hover:text-foreground">
                  Imobiliárias
                </Link>
              </li>
              <li className="flex items-center gap-1">
                <ChevronRight className="size-3.5" aria-hidden />
                <span className="text-foreground" aria-current="page">
                  {anunciante.nome}
                </span>
              </li>
            </ol>
          </nav>

          <div className="card-elevated grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
            <div>
              <h1 className="sr-only">
                {rotuloTipo} {anunciante.nome}
              </h1>
              <AnuncianteBox anunciante={anunciante} portalNome={portal.nome} completo linkHotsite={false} className="sm:max-w-md" />
            </div>
            <dl className="grid grid-cols-3 gap-3 lg:w-80">
              {OBJETIVOS.map((o) => {
                const total = anunciante.totais_por_objetivo[o.valor];
                return (
                  <div key={o.valor} className="rounded-xl bg-muted/60 px-3 py-3 text-center">
                    <dt className="text-xs font-medium text-muted-foreground">{o.label}</dt>
                    <dd className="mt-1 font-heading text-2xl font-bold text-brand tabular-nums">
                      <Link href={linkBusca({ objetivo: o.valor }, base)} className="hover:underline">
                        {formatarNumero(total)}
                      </Link>
                    </dd>
                  </div>
                );
              })}
              <div className="col-span-3 text-center text-xs text-muted-foreground">
                {formatarNumero(anunciante.total_imoveis)} {plural(anunciante.total_imoveis, "imóvel anunciado", "imóveis anunciados")} no {portal.nome}
              </div>
            </dl>
          </div>
        </Container>
      </section>

      <Container className="py-6 sm:py-8">
        <h2 className="mb-5 text-2xl font-bold text-brand">Imóveis de {anunciante.nome}</h2>
        {/* `key` nos filtros: o skeleton aparece também quando só a query string muda. */}
        <Suspense key={JSON.stringify(filtrosUI)} fallback={<BuscaCorpoSkeleton />}>
          <ResultadosHotsite portal={portal} anunciante={anunciante} filtros={filtrosUI} base={base} />
        </Suspense>
      </Container>
    </>
  );
}

/** Parte lenta (busca na API), separada para a página responder antes dela. */
async function ResultadosHotsite({ portal, anunciante, filtros, base }: { portal: Portal; anunciante: AnuncianteResumo; filtros: BuscaFiltros; base: string }) {
  const [repo, favoritos, visao] = await Promise.all([getRepository(), lerFavoritos(), lerVisao()]);
  const filtrosRepo: BuscaFiltros = { ...filtros, anunciante: anunciante.slug };
  const [dados, banner] = await Promise.all([carregarBusca(portal, filtrosRepo, { anuncianteId: anunciante.id }), repo.getPublicidade(portal.id, "banner_lista")]);
  return <ResultadoBusca portal={portal} filtros={filtros} dados={dados} favoritos={favoritos} banner={banner} base={base} anuncianteId={anunciante.id} visao={visao} />;
}
