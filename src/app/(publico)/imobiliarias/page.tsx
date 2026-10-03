import type { Metadata } from "next";
import Link from "next/link";
import { Building2, UserRound } from "lucide-react";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { AnuncianteCard } from "@/features/anunciantes/components/anunciante-card";
import { getRepository } from "@/lib/api";
import type { AnuncianteResumo } from "@/lib/api/types";
import { JsonLd, breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { montarMetadata } from "@/lib/seo/metadata";
import { getPortal } from "@/lib/tenant/get-portal";

export async function generateMetadata(): Promise<Metadata> {
  const portal = await getPortal();
  return montarMetadata(portal, {
    titulo: `Imobiliárias em ${portal.cidade_principal_nome}`,
    descricao: `Imobiliárias e corretores de imóveis em ${portal.cidade_principal_nome} e região. Telefone, WhatsApp, CRECI e todos os imóveis anunciados no ${portal.nome}.`,
    path: "/imobiliarias",
  });
}

function Secao({ id, titulo, descricao, icone, lista, portalNome }: { id: string; titulo: string; descricao: string; icone: React.ReactNode; lista: AnuncianteResumo[]; portalNome: string }) {
  return (
    <section id={id} aria-labelledby={`${id}-titulo`} className="scroll-mt-24">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand">{icone}</span>
        <div>
          <h2 id={`${id}-titulo`} className="text-2xl font-bold">
            {titulo} <span className="text-base font-medium text-muted-foreground">({lista.length})</span>
          </h2>
          <p className="text-sm text-muted-foreground">{descricao}</p>
        </div>
      </div>
      {lista.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">Nenhum cadastro nesta categoria no momento.</p>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {lista.map((a) => (
            <li key={a.id}>
              <AnuncianteCard anunciante={a} portalNome={portalNome} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function ImobiliariasPage() {
  const [portal, repo] = await Promise.all([getPortal(), getRepository()]);
  const { imobiliarias, corretores } = await repo.listAnunciantes(portal.id);
  const titulo = `Imobiliárias em ${portal.cidade_principal_nome}`;

  return (
    <>
      <PageHeader
        titulo={titulo}
        subtitulo={`Conheça as imobiliárias e corretores parceiros do ${portal.nome}. Fale direto com quem anuncia e veja todos os imóveis de cada um.`}
        crumbs={[{ nome: "Imobiliárias" }]}
        acoes={
          <>
            <Button asChild variant="outline">
              <a href="#corretores">Corretores</a>
            </Button>
            <Button asChild>
              <Link href="/anunciar">Quero anunciar</Link>
            </Button>
          </>
        }
      />
      <Container className="space-y-16 py-10 sm:py-14">
        <Secao
          id="imobiliarias"
          titulo="Imobiliárias"
          descricao="Empresas com CRECI ativo e equipe para atender você."
          icone={<Building2 className="size-5" aria-hidden />}
          lista={imobiliarias}
          portalNome={portal.nome}
        />
        <Secao
          id="corretores"
          titulo="Corretores"
          descricao="Profissionais autônomos que anunciam no portal."
          icone={<UserRound className="size-5" aria-hidden />}
          lista={corretores}
          portalNome={portal.nome}
        />
        <section className="rounded-2xl bg-brand px-6 py-10 text-center text-brand-foreground sm:px-10">
          <h2 className="text-2xl font-bold">É corretor ou tem uma imobiliária?</h2>
          <p className="mx-auto mt-2 max-w-xl text-brand-foreground/80">
            Apareça nesta página, tenha um hotsite com seus imóveis e receba contatos direto no seu WhatsApp.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-cta text-cta-foreground hover:bg-cta/90">
              <Link href="/cadastro">Cadastre-se</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/30 bg-transparent text-brand-foreground hover:bg-white/10 hover:text-brand-foreground">
              <Link href="/planos">Ver planos</Link>
            </Button>
          </div>
        </section>
      </Container>
      <JsonLd data={breadcrumbJsonLd(portal, [{ nome: "Início", href: "/" }, { nome: titulo, href: "/imobiliarias" }])} />
    </>
  );
}
