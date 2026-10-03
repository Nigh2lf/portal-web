import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { DocNav, DocXml } from "@/features/institucional/components/doc-xml";
import { getRepository } from "@/lib/api";
import { JsonLd, breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { montarMetadata } from "@/lib/seo/metadata";
import { getPortal } from "@/lib/tenant/get-portal";

export async function generateMetadata(): Promise<Metadata> {
  const portal = await getPortal();
  return montarMetadata(portal, {
    titulo: "Integração XML",
    descricao: `Documentação da carga automática de imóveis via XML no ${portal.nome}: estrutura, exemplo e valores aceitos de tipos, cidades e bairros.`,
    path: "/integracao-xml",
  });
}

export default async function IntegracaoXmlPage() {
  const [portal, repo] = await Promise.all([getPortal(), getRepository()]);
  const [tipos, cidades, bairros] = await Promise.all([repo.listTipos(), repo.listCidades(portal.id), repo.listBairros({ portalId: portal.id })]);

  return (
    <>
      <PageHeader
        titulo="Integração XML"
        subtitulo="Manual para imobiliárias e CRMs enviarem anúncios automaticamente ao portal."
        crumbs={[{ nome: "Integração XML" }]}
        compacto
      />
      <Container className="grid gap-10 py-10 lg:grid-cols-[240px_1fr] sm:py-14">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <DocNav />
        </aside>
        <div className="min-w-0">
          <DocXml portalNome={portal.nome} tipos={tipos} cidades={cidades} bairros={bairros} />
        </div>
      </Container>
      <JsonLd data={breadcrumbJsonLd(portal, [{ nome: "Início", href: "/" }, { nome: "Integração XML", href: "/integracao-xml" }])} />
    </>
  );
}
