import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, Megaphone, MousePointerClick, Target } from "lucide-react";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { TabelaPrecosPublicidade } from "@/features/publicidade/components/tabela-publicidade";
import { getRepository } from "@/lib/api";
import { JsonLd, breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { montarMetadata } from "@/lib/seo/metadata";
import { getPortal } from "@/lib/tenant/get-portal";

export async function generateMetadata(): Promise<Metadata> {
  const portal = await getPortal();
  return montarMetadata(portal, {
    titulo: "Publicidade",
    descricao: `Anuncie sua marca no ${portal.nome}: banners na home, na lista e no detalhe dos imóveis. Tabela de preços e formatos.`,
    path: "/publicidade",
  });
}

const vantagens = [
  { icone: Target, titulo: "Público segmentado", texto: "Pessoas comprando, vendendo ou alugando imóveis na região." },
  { icone: MousePointerClick, titulo: "Cliques medidos", texto: "Cada clique no banner é registrado e redirecionado para o seu site." },
  { icone: BarChart3, titulo: "Relatório mensal", texto: "Você recebe o desempenho da campanha todo mês." },
];

export default async function PublicidadePage() {
  const [portal, repo] = await Promise.all([getPortal(), getRepository()]);
  const tabela = await repo.getTabelaPublicidade();

  return (
    <>
      <PageHeader
        titulo="Publicidade"
        subtitulo={`Coloque sua marca diante de quem está decidindo onde morar em ${portal.cidade_principal_nome}.`}
        crumbs={[{ nome: "Publicidade" }]}
        acoes={
          <Button asChild>
            <Link href="/contato?assunto=Publicidade%20no%20portal">
              <Megaphone data-icon="inline-start" />
              Solicitar proposta
            </Link>
          </Button>
        }
      />
      <Container className="py-10 sm:py-14">
        <ul className="grid gap-5 sm:grid-cols-3">
          {vantagens.map((v) => (
            <li key={v.titulo} className="card-elevated p-5">
              <span className="flex size-10 items-center justify-center rounded-lg bg-brand-soft text-brand">
                <v.icone className="size-5" aria-hidden />
              </span>
              <h2 className="mt-4 font-semibold">{v.titulo}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{v.texto}</p>
            </li>
          ))}
        </ul>

        <section className="mt-14" aria-labelledby="tabela-precos">
          <h2 id="tabela-precos" className="text-2xl font-bold">
            Formatos e valores
          </h2>
          <p className="mt-1 mb-6 text-muted-foreground">Banners para construtoras, financeiras, lojas de decoração, seguradoras e serviços ligados ao lar. Imagens em JPG ou PNG, link para o seu site.</p>
          <TabelaPrecosPublicidade itens={tabela} />
          <p className="mt-3 text-xs text-muted-foreground">* Valores mensais. Pacotes trimestrais e semestrais com desconto. Consulte disponibilidade das posições.</p>
        </section>

        <section className="mt-14 rounded-2xl bg-brand px-6 py-10 text-brand-foreground sm:px-10">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold">Vamos conversar?</h2>
              <p className="mt-1 max-w-xl text-brand-foreground/80">Conte qual é o seu objetivo e montamos uma proposta com as posições mais adequadas.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-cta text-cta-foreground hover:bg-cta/90">
                <Link href="/contato?assunto=Publicidade%20no%20portal">Falar com a equipe</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 bg-transparent text-brand-foreground hover:bg-white/10 hover:text-brand-foreground">
                <a href={`mailto:${portal.email}?subject=Publicidade%20no%20portal`}>{portal.email}</a>
              </Button>
            </div>
          </div>
        </section>
      </Container>
      <JsonLd data={breadcrumbJsonLd(portal, [{ nome: "Início", href: "/" }, { nome: "Publicidade", href: "/publicidade" }])} />
    </>
  );
}
