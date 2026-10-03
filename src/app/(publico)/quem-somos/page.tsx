import type { Metadata } from "next";
import Link from "next/link";
import { Building2, HeartHandshake, Rocket, Sparkles } from "lucide-react";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { getRepository } from "@/lib/api";
import { JsonLd, breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { montarMetadata } from "@/lib/seo/metadata";
import { getPortal } from "@/lib/tenant/get-portal";
import { formatarNumero } from "@/lib/utils/format";

export async function generateMetadata(): Promise<Metadata> {
  const portal = await getPortal();
  return montarMetadata(portal, {
    titulo: "Quem somos",
    descricao: `Conheça o ${portal.nome}, portal de classificados de imóveis focado em ${portal.cidade_principal_nome} e arredores, uma divisão da TrustInfo.`,
    path: "/quem-somos",
  });
}

export default async function QuemSomosPage() {
  const [portal, repo] = await Promise.all([getPortal(), getRepository()]);
  const { imobiliarias, corretores } = await repo.listAnunciantes(portal.id);
  const dominio = portal.dominio.replace(/^www\./, "");
  const marcos = [
    { ano: "2000", icone: Building2, titulo: "Nasce a TrustInfo", texto: "Empresa de tecnologia em Itaipava/RJ, totalmente focada em soluções web." },
    { ano: "2004", icone: Rocket, titulo: "TrustImóvel", texto: "Lançamos nosso sistema de gestão de conteúdo para sites de imobiliárias." },
    { ano: "Hoje", icone: Sparkles, titulo: portal.nome, texto: `Uma mídia que unifica os imóveis de ${portal.cidade_principal_nome} e arredores em um só lugar.` },
  ];
  const numeros = [
    { valor: `+${formatarNumero(portal.total_imoveis)}`, label: "imóveis anunciados" },
    { valor: formatarNumero(imobiliarias.length + corretores.length), label: "imobiliárias e corretores" },
    { valor: "+18 mil", label: "buscas por mês" },
  ];

  return (
    <>
      <PageHeader titulo="O que nós somos" subtitulo={portal.o_que_somos} crumbs={[{ nome: "Quem somos" }]} />
      <Container className="grid gap-12 py-10 lg:grid-cols-[1.3fr_1fr] sm:py-14">
        <div className="prose-portal max-w-none text-[1.05rem]">
          <p>
            O <strong>{portal.nome}</strong> é um portal de classificados de imóveis focado em {portal.cidade_principal_nome} e arredores.
          </p>
          <p>
            O portal é uma divisão da <strong>TrustInfo</strong>, uma empresa de tecnologia fundada em 2000, localizada em Itaipava/RJ, totalmente focada em soluções web.
          </p>
          <p>
            Somos determinados em gerar valor. Desde 2004, quando lançamos o <strong>TrustImóvel</strong> (nosso sistema de gerenciamento de conteúdo para sites de imobiliárias), observamos um
            mercado carente de uma mídia que pudesse unificar todos os imóveis da nossa região.
          </p>
          <p>
            E assim foi feito. O {portal.nome} oferece ao visitante uma experiência de navegação simples, rápida e intuitiva, com grande conteúdo do mercado imobiliário da região serrana do Rio de
            Janeiro. Em <strong>{dominio}</strong> você encontra casas, apartamentos, sítios e terrenos anunciados por imobiliárias, corretores e proprietários, com contato direto com quem anuncia.
          </p>
          <p>Estamos honrados com a sua visita. Aproveite... e bons negócios.</p>

          <div className="not-prose mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/imoveis">Buscar imóveis</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/anunciar">Quero anunciar</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/contato">Fale conosco</Link>
            </Button>
          </div>
        </div>

        <aside className="space-y-6">
          <dl className="grid grid-cols-3 gap-3">
            {numeros.map((n) => (
              <div key={n.label} className="card-elevated p-4 text-center">
                <dd className="font-heading text-xl font-extrabold text-brand sm:text-2xl">{n.valor}</dd>
                <dt className="mt-1 text-[11px] leading-tight text-muted-foreground">{n.label}</dt>
              </div>
            ))}
          </dl>
          <ol className="card-elevated relative space-y-6 p-6">
            <span className="absolute top-8 bottom-8 left-[2.45rem] w-px bg-border" aria-hidden />
            {marcos.map((m) => (
              <li key={m.ano} className="relative flex gap-4">
                <span className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand ring-4 ring-card">
                  <m.icone className="size-4" aria-hidden />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{m.ano}</p>
                  <p className="font-semibold">{m.titulo}</p>
                  <p className="text-sm text-muted-foreground">{m.texto}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="rounded-xl border border-dashed p-5 text-sm">
            <HeartHandshake className="size-6 text-brand" aria-hidden />
            <p className="mt-2 text-muted-foreground">
              <strong className="text-foreground">{portal.nome}</strong>
              <br />
              {portal.endereco}
              <br />
              {portal.telefone} ·{" "}
              <a href={`mailto:${portal.email}`} className="text-brand underline-offset-4 hover:underline">
                {portal.email}
              </a>
            </p>
          </div>
        </aside>
      </Container>
      <JsonLd data={breadcrumbJsonLd(portal, [{ nome: "Início", href: "/" }, { nome: "Quem somos", href: "/quem-somos" }])} />
    </>
  );
}
