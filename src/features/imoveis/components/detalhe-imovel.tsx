import { Fragment, Suspense } from "react";
import Link from "next/link";
import { Building, Check, Clock3, Eye, Hash, Info, MapPin, Star } from "lucide-react";
import type { ImovelDetalhe } from "@/lib/api/repository";
import type { Portal } from "@/lib/api/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Container } from "@/components/layout/container";
import { ContatarForm } from "@/features/contatar/components/contatar-form";
import { FavoritoButton } from "@/features/favoritos/components/favorito-button";
import { OBJETIVOS, linkBusca } from "@/lib/busca/filtros";
import { JsonLd, breadcrumbJsonLd, imovelJsonLd } from "@/lib/seo/json-ld";
import { urlAbsoluta } from "@/lib/tenant/get-portal";
import { formatarData, formatarMoeda, slugify } from "@/lib/utils/format";
import { AnuncianteBox } from "./anunciante-box";
import { CaracteristicasIcones } from "./caracteristicas-icones";
import { Compartilhar } from "./compartilhar";
import { GaleriaImovel } from "./galeria-imovel";
import { SUFIXO_PRECO, objetivosDisponiveis, precoPorObjetivo } from "./preco-imovel";
import { RelacionadosImovel, RelacionadosImovelSkeleton } from "./relacionados-imovel";

interface Props {
  portal: Portal;
  detalhe: ImovelDetalhe;
  favoritos: string[];
  preview: boolean;
}

export function DetalheImovel({ portal, detalhe, favoritos, preview }: Props) {
  const { imovel, anunciante, links_relacionados } = detalhe;
  const url = urlAbsoluta(portal, `/imovel/${imovel.slug}`);
  const objetivos = objetivosDisponiveis(imovel);
  const crumbs = [
    { nome: "Imóveis", href: "/imoveis" },
    { nome: `${imovel.tipo_nome} em ${imovel.cidade_nome}`, href: linkBusca({ objetivo: objetivos[0], tipo: slugify(imovel.tipo_nome), cidade: slugify(imovel.cidade_nome) }) },
    { nome: imovel.bairro_nome, href: linkBusca({ objetivo: objetivos[0], tipo: slugify(imovel.tipo_nome), cidade: slugify(imovel.cidade_nome), bairro: slugify(imovel.bairro_nome) }) },
    { nome: imovel.codigo, href: `/imovel/${imovel.slug}` },
  ];

  return (
    <>
      <JsonLd data={imovelJsonLd(portal, imovel)} />
      <JsonLd data={breadcrumbJsonLd(portal, [{ nome: "Início", href: "/" }, ...crumbs])} />

      <Container className="py-5 sm:py-8">
        {preview && (
          <Alert className="mb-5 border-warning/50 bg-highlight/15">
            <Eye />
            <AlertTitle>Pré-visualização do anúncio</AlertTitle>
            <AlertDescription>
              Esta é a visualização do anunciante{imovel.status !== "publicado" || !imovel.ativo ? ": o imóvel ainda não está visível ao público" : ""}. Edite ou publique pelo{" "}
              <Link href={`/painel/imoveis/${imovel.id}/editar`}>painel</Link>.
            </AlertDescription>
          </Alert>
        )}

        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Início</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {crumbs.map((c, i) => {
              const oculto = i < crumbs.length - 2 ? "hidden sm:inline-flex" : undefined;
              return (
                <Fragment key={c.href}>
                  <BreadcrumbSeparator className={oculto} />
                  <BreadcrumbItem className={oculto}>
                    {i === crumbs.length - 1 ? (
                      <BreadcrumbPage>{c.nome}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={c.href}>{c.nome}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10">
          <div className="min-w-0 space-y-8">
            <GaleriaImovel fotos={imovel.fotos} titulo={imovel.titulo} />

            <header className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {imovel.tipo_anuncio !== "normal" && (
                  <Badge className={imovel.tipo_anuncio === "superdestaque" ? "bg-brand text-brand-foreground" : "bg-highlight text-foreground"}>
                    <Star className="fill-current" aria-hidden />
                    {imovel.tipo_anuncio === "superdestaque" ? "Superdestaque" : "Destaque"}
                  </Badge>
                )}
                <Badge variant="secondary">{imovel.tipo_nome}</Badge>
                {imovel.dentro_condominio && (
                  <Badge variant="outline">
                    <Building aria-hidden />
                    Em condomínio
                  </Badge>
                )}
              </div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h1 className="text-2xl font-bold text-brand sm:text-3xl">{imovel.titulo}</h1>
                  <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="size-4" aria-hidden />
                      {imovel.bairro_nome}, {imovel.cidade_nome} - {imovel.uf}
                    </span>
                    <span className="flex items-center gap-1">
                      <Hash className="size-4" aria-hidden />
                      Código {imovel.codigo}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock3 className="size-4" aria-hidden />
                      Atualizado em {formatarData(imovel.atualizado_em)}
                    </span>
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <FavoritoButton imovelId={imovel.id} inicial={favoritos.includes(imovel.id)} variante="botao" />
                  <Compartilhar url={url} titulo={imovel.titulo} />
                </div>
              </div>

              <div className="card-elevated grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-start">
                <dl className="flex flex-wrap gap-x-10 gap-y-3">
                  {objetivos.map((o) => {
                    const obj = OBJETIVOS.find((x) => x.valor === o)!;
                    return (
                      <div key={o}>
                        <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{obj.labelCurto}</dt>
                        <dd className="font-heading text-2xl font-bold text-brand tabular-nums sm:text-3xl">
                          {formatarMoeda(precoPorObjetivo(imovel, o))}
                          {SUFIXO_PRECO[o] && <span className="ml-1 text-sm font-medium text-muted-foreground">{SUFIXO_PRECO[o]}</span>}
                        </dd>
                      </div>
                    );
                  })}
                  {objetivos.length === 0 && (
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Preço</dt>
                      <dd className="font-heading text-2xl font-bold text-brand">Sob consulta</dd>
                    </div>
                  )}
                </dl>
                {imovel.taxas.length > 0 && (
                  <ul className="space-y-1 text-sm sm:text-right">
                    {imovel.taxas.map((t) => (
                      <li key={t.descricao} className="text-muted-foreground">
                        {t.descricao}: <strong className="text-foreground tabular-nums">{formatarMoeda(t.valor)}</strong>
                        {t.observacao && <span className="ml-1 text-xs">({t.observacao})</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </header>

            <CaracteristicasIcones imovel={imovel} variante="detalhado" />

            {imovel.descricao && (
              <section aria-labelledby="descricao">
                <h2 id="descricao" className="mb-3 text-xl font-semibold">
                  Sobre o imóvel
                </h2>
                <div className="prose-portal" dangerouslySetInnerHTML={{ __html: imovel.descricao }} />
              </section>
            )}

            {imovel.infraestrutura.length > 0 && <ListaCaracteristicas titulo="Características do imóvel" itens={imovel.infraestrutura} />}
            {imovel.infra_condominio.length > 0 && <ListaCaracteristicas titulo="Características do condomínio" itens={imovel.infra_condominio} />}

            <p className="flex items-start gap-2 rounded-xl bg-muted/70 px-4 py-3 text-sm text-muted-foreground">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
              Preços e condições sujeitos a confirmação com o anunciante. O {portal.nome} apenas divulga os anúncios e não participa da negociação.
            </p>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start" aria-label="Anunciante">
            <div className="card-elevated p-5 sm:p-6">
              <AnuncianteBox anunciante={anunciante} portalNome={portal.nome} imovelId={imovel.id} codigo={imovel.codigo} />
              <div className="my-5 border-t" />
              <h2 className="mb-3 font-heading text-base font-semibold">Fale com o anunciante</h2>
              <ContatarForm imovelId={imovel.id} codigo={imovel.codigo} titulo={imovel.titulo} portalNome={portal.nome} />
            </div>
          </aside>
        </div>

        <Suspense fallback={<RelacionadosImovelSkeleton />}>
          <RelacionadosImovel
            portal={portal}
            imovelSlug={imovel.slug}
            objetivo={objetivos[0]}
            verMaisHref={linkBusca({ objetivo: objetivos[0], tipo: slugify(imovel.tipo_nome), cidade: slugify(imovel.cidade_nome) })}
            favoritos={favoritos}
          />
        </Suspense>

        {links_relacionados.length > 0 && (
          <section className="mt-12" aria-labelledby="links-relacionados">
            <h2 id="links-relacionados" className="mb-4 text-lg font-semibold">
              Links relacionados
            </h2>
            <ul className="flex flex-wrap gap-2">
              {links_relacionados.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="inline-block rounded-full border bg-card px-3.5 py-1.5 text-sm transition-colors hover:border-brand/40 hover:bg-brand-soft hover:text-brand">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </Container>
    </>
  );
}

function ListaCaracteristicas({ titulo, itens }: { titulo: string; itens: string[] }) {
  const id = slugify(titulo);
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="mb-3 text-xl font-semibold">
        {titulo}
      </h2>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {itens.map((item) => (
          <li key={item} className="flex items-center gap-2 text-sm">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
              <Check className="size-3.5" aria-hidden />
            </span>
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
