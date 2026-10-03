import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Building, Megaphone, Sparkles, TrendingUp, UserRound, Wallet } from "lucide-react";
import type { HomeDados, Portal } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { ListaImoveis } from "@/features/imoveis/components/lista-imoveis";
import { formatarNumero } from "@/lib/utils/format";
import { BuscaHomeForm } from "./busca-home-form";
import type { ComponentProps } from "react";

type PropsBusca = ComponentProps<typeof BuscaHomeForm>;

export function HeroHome({ portal, home, busca }: { portal: Portal; home: HomeDados; busca: PropsBusca }) {
  return (
    <section className="relative isolate overflow-hidden bg-brand text-brand-foreground">
      <Image src={home.hero_imagem_url} alt="" fill priority sizes="100vw" className="object-cover opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-b from-brand/70 via-brand/60 to-background" aria-hidden />
      <Container className="relative pt-14 pb-10 sm:pt-20 sm:pb-14">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold leading-tight drop-shadow-sm sm:text-5xl">
            Encontre o imóvel certo em <span className="text-highlight">{portal.cidade_principal_nome}</span>
          </h1>
          <p className="mt-3 text-base text-brand-foreground/85 sm:text-lg">
            Mais de <strong className="font-semibold text-brand-foreground">{formatarNumero(home.total_imoveis)}</strong> imóveis anunciados por imobiliárias, corretores e proprietários da região.
          </p>
        </div>
        <div className="mx-auto mt-8 max-w-5xl text-foreground">
          <BuscaHomeForm {...busca} />
        </div>
      </Container>
    </section>
  );
}

export function SecaoTitulo({ titulo, descricao, icone: Icone, acao }: { titulo: string; descricao?: string; icone?: typeof Sparkles; acao?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="flex items-center gap-2 text-2xl font-bold text-brand sm:text-3xl">
          {Icone && <Icone className="size-6 text-cta" aria-hidden />}
          {titulo}
        </h2>
        {descricao && <p className="mt-1 text-muted-foreground">{descricao}</p>}
      </div>
      {acao}
    </div>
  );
}

export function SecaoDestaques({ home, portal, favoritos }: { home: HomeDados; portal: Portal; favoritos: string[] }) {
  if (!home.destaques.length) return null;
  return (
    <section className="py-12 sm:py-16">
      <Container>
        <SecaoTitulo
          titulo="Imóveis em destaque"
          descricao="Seleção de anúncios em evidência neste momento."
          icone={Sparkles}
          acao={
            <Button asChild variant="ghost" className="text-brand">
              <Link href="/imoveis">
                Ver todos os imóveis
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          }
        />
        <ListaImoveis imoveis={home.destaques} favoritos={favoritos} portalNome={portal.nome} colunas={4} />
      </Container>
    </section>
  );
}

export function SecaoMaisProcurados({ home }: { home: HomeDados }) {
  if (!home.mais_procurados.length) return null;
  return (
    <section className="bg-brand-soft/50 py-12 sm:py-16">
      <Container>
        <SecaoTitulo titulo="Imóveis mais procurados" descricao="As buscas mais feitas pelos visitantes nos últimos dias." icone={TrendingUp} />
        <ul className="flex flex-wrap gap-2.5">
          {home.mais_procurados.map((p) => (
            <li key={p.href}>
              <Link href={p.href} className="group flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:text-brand hover:shadow">
                {p.label}
                {p.total > 0 && <span className="rounded-full bg-muted px-1.5 py-0.5 text-[11px] tabular-nums text-muted-foreground group-hover:bg-brand-soft group-hover:text-brand">{p.total}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

export function SecaoBairros({ home }: { home: HomeDados }) {
  if (!home.bairros_mais_anunciados.length) return null;
  return (
    <section className="py-12 sm:py-16">
      <Container>
        <SecaoTitulo titulo="Bairros mais anunciados" descricao="Explore os bairros com mais imóveis disponíveis." icone={Building} />
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {home.bairros_mais_anunciados.map(({ bairro, cidade, href }) => (
            <li key={`${cidade.id}-${bairro.id}`}>
              <Link href={href} className="card-elevated card-elevated-hover flex h-full flex-col justify-between gap-2 p-4">
                <span>
                  <span className="block font-heading font-semibold leading-tight">{bairro.nome}</span>
                  <span className="block text-xs text-muted-foreground">{cidade.nome}</span>
                </span>
                <span className="text-sm text-brand">
                  <strong className="tabular-nums">{formatarNumero(bairro.total_imoveis)}</strong> {bairro.total_imoveis === 1 ? "imóvel" : "imóveis"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

export function FaixaAnuncie({ portal }: { portal: Portal }) {
  const passos = [
    { Icone: UserRound, titulo: "Crie sua conta", texto: "Cadastro rápido para imobiliárias, corretores e proprietários." },
    { Icone: Wallet, titulo: "Escolha um plano", texto: "Planos para todos os tamanhos, inclusive gratuito para começar." },
    { Icone: Megaphone, titulo: "Publique e receba contatos", texto: `Seu anúncio visível para quem procura imóveis em ${portal.cidade_principal_nome}.` },
  ];
  return (
    <section className="bg-brand py-12 text-brand-foreground sm:py-16">
      <Container className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <h2 className="text-2xl font-bold sm:text-3xl">Anuncie seu imóvel no {portal.nome}</h2>
          <p className="mt-2 max-w-xl text-brand-foreground/80">Alcance milhares de pessoas que buscam imóveis na região todos os meses. Simples, rápido e com contato direto com o interessado.</p>
          <ol className="mt-8 grid gap-6 sm:grid-cols-3">
            {passos.map((p, i) => (
              <li key={p.titulo} className="flex gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                  <p.Icone className="size-5" aria-hidden />
                </span>
                <span>
                  <span className="block text-xs font-medium text-brand-foreground/60">Passo {i + 1}</span>
                  <span className="block font-semibold">{p.titulo}</span>
                  <span className="mt-0.5 block text-sm text-brand-foreground/75">{p.texto}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
          <Button asChild size="lg" className="bg-cta text-cta-foreground hover:bg-cta/90">
            <Link href="/anunciar">
              <Megaphone data-icon="inline-start" />
              Anunciar imóvel
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-white/30 bg-transparent text-brand-foreground hover:bg-white/10 hover:text-brand-foreground">
            <Link href="/planos">Conhecer os planos</Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
