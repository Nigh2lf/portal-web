import type { Metadata } from "next";
import Link from "next/link";
import { Gift, Info } from "lucide-react";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { FaqPlanos } from "@/features/planos/components/faq-planos";
import { PlanoCard } from "@/features/planos/components/plano-card";
import { TabelaComparativa } from "@/features/planos/components/tabela-comparativa";
import { NOTA_PLANOS } from "@/features/planos/lib/recursos";
import { getRepository } from "@/lib/api";
import { JsonLd, breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { montarMetadata } from "@/lib/seo/metadata";
import { getPortal } from "@/lib/tenant/get-portal";

export async function generateMetadata(): Promise<Metadata> {
  const portal = await getPortal();
  return montarMetadata(portal, {
    titulo: "Planos para anunciar",
    descricao: `Planos para imobiliárias e corretores anunciarem no ${portal.nome}: anúncios, fotos, destaques, hotsite e encomendas. Proprietário anuncia grátis.`,
    path: "/planos",
  });
}

export default async function PlanosPage() {
  const [portal, repo] = await Promise.all([getPortal(), getRepository()]);
  const planos = await repo.listPlanos();
  const principais = planos.filter((p) => !p.exclusivo_proprietario).sort((a, b) => (a.preco_mensal ?? Number.MAX_SAFE_INTEGER) - (b.preco_mensal ?? Number.MAX_SAFE_INTEGER));
  const gratis = planos.find((p) => p.exclusivo_proprietario);

  return (
    <>
      <PageHeader
        titulo="Nossos planos"
        subtitulo={`Escolha o plano ideal para divulgar seus imóveis em ${portal.cidade_principal_nome} e região. Sem fidelidade, cancele quando quiser.`}
        crumbs={[{ nome: "Planos" }]}
      />

      <Container className="py-10 sm:py-14">
        <ul className="grid gap-6 pt-3 sm:grid-cols-2 xl:grid-cols-4">
          {principais.map((p) => (
            <li key={p.id}>
              <PlanoCard plano={p} />
            </li>
          ))}
        </ul>
        <p className="mt-6 flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {NOTA_PLANOS}
        </p>

        {gratis && (
          <section className="mt-12 flex flex-col items-start gap-5 rounded-2xl bg-brand-soft/70 p-6 sm:flex-row sm:items-center sm:p-8" aria-labelledby="proprietario-gratis">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand text-brand-foreground">
              <Gift className="size-6" aria-hidden />
            </span>
            <div className="flex-1">
              <h2 id="proprietario-gratis" className="text-xl font-bold text-brand">
                Proprietário anuncia grátis
              </h2>
              <p className="mt-1 text-sm text-foreground/80">
                É dono do imóvel? Publique {gratis.imoveis === 1 ? "1 anúncio" : `${gratis.imoveis} anúncios`} com até {gratis.fotos} fotos sem pagar nada e receba contatos direto de interessados.
              </p>
            </div>
            <Button asChild size="lg" className="bg-cta text-cta-foreground hover:bg-cta/90">
              <Link href="/cadastro">Anunciar grátis</Link>
            </Button>
          </section>
        )}
      </Container>

      <section className="hidden border-y bg-muted/30 lg:block" aria-labelledby="comparar">
        <Container className="py-14">
          <h2 id="comparar" className="text-2xl font-bold">
            Compare os planos
          </h2>
          <p className="mt-1 mb-6 text-muted-foreground">Todos os recursos, lado a lado.</p>
          <TabelaComparativa planos={principais} />
        </Container>
      </section>

      <Container className="grid gap-10 py-14 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <h2 className="text-2xl font-bold">Perguntas frequentes</h2>
          <p className="mt-2 text-muted-foreground">Ainda com dúvidas? Fale com a nossa equipe comercial.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/contato?assunto=Planos%20e%20pagamento">Fale conosco</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/anunciar">Saiba mais sobre anunciar</Link>
            </Button>
          </div>
        </div>
        <FaqPlanos portalNome={portal.nome} />
      </Container>
      <JsonLd data={breadcrumbJsonLd(portal, [{ nome: "Início", href: "/" }, { nome: "Planos", href: "/planos" }])} />
    </>
  );
}
