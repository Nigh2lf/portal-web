import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { SECOES_TERMOS, TermosDeUso } from "@/features/institucional/components/termos-de-uso";
import { JsonLd, breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { montarMetadata } from "@/lib/seo/metadata";
import { getPortal } from "@/lib/tenant/get-portal";

export async function generateMetadata(): Promise<Metadata> {
  const portal = await getPortal();
  return montarMetadata(portal, { titulo: "Termos de uso", descricao: `Termos de uso do ${portal.nome} para usuários e anunciantes.`, path: "/termos-de-uso" });
}

export default async function TermosDeUsoPage() {
  const portal = await getPortal();
  return (
    <>
      <PageHeader titulo="Termos de uso" subtitulo={`Condições para uso do ${portal.nome} por usuários e anunciantes.`} crumbs={[{ nome: "Termos de uso" }]} compacto />
      <Container className="grid gap-10 py-10 lg:grid-cols-[240px_1fr] sm:py-14">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <nav aria-label="Seções dos termos" className="card-elevated p-4">
            <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nesta página</p>
            <ol className="space-y-0.5 text-sm">
              {SECOES_TERMOS.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-foreground/80 hover:bg-muted hover:text-foreground">
                    <span className="w-4 text-xs text-muted-foreground">{i + 1}.</span>
                    {s.titulo}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>
        <article className="card-elevated min-w-0 p-6 sm:p-10 [&_h2]:scroll-mt-28">
          <TermosDeUso portal={portal} />
        </article>
      </Container>
      <JsonLd data={breadcrumbJsonLd(portal, [{ nome: "Início", href: "/" }, { nome: "Termos de uso", href: "/termos-de-uso" }])} />
    </>
  );
}
