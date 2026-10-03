import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Paginacao } from "@/features/blog/components/paginacao";
import { PostCard } from "@/features/blog/components/post-card";
import { getRepository } from "@/lib/api";
import { JsonLd, breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { montarMetadata } from "@/lib/seo/metadata";
import { getPortal } from "@/lib/tenant/get-portal";

const POR_PAGINA = 9;

function paginaDe(sp: Record<string, string | string[] | undefined>) {
  const raw = Array.isArray(sp.pagina) ? sp.pagina[0] : sp.pagina;
  const n = Number(raw ?? 1);
  return Number.isInteger(n) && n > 0 ? n : 1;
}

const hrefPagina = (p: number) => (p <= 1 ? "/blog" : `/blog?pagina=${p}`);

export async function generateMetadata({ searchParams }: PageProps<"/blog">): Promise<Metadata> {
  const [portal, sp] = await Promise.all([getPortal(), searchParams]);
  const pagina = paginaDe(sp);
  return montarMetadata(portal, {
    titulo: pagina > 1 ? `Blog - página ${pagina}` : "Blog",
    descricao: `Dicas, notícias e guias sobre o mercado imobiliário de ${portal.cidade_principal_nome} e região serrana. Conteúdo do ${portal.nome}.`,
    path: hrefPagina(pagina),
  });
}

export default async function BlogPage({ searchParams }: PageProps<"/blog">) {
  const [portal, repo, sp] = await Promise.all([getPortal(), getRepository(), searchParams]);
  const pagina = paginaDe(sp);
  const { resultados, total, total_paginas } = await repo.listPosts(pagina, POR_PAGINA);
  if (pagina > 1 && pagina > total_paginas) notFound();

  const [primeiro, ...resto] = resultados;

  return (
    <>
      <PageHeader
        titulo="Blog"
        subtitulo={`Guias, dicas e novidades sobre comprar, vender e alugar imóveis em ${portal.cidade_principal_nome} e região.`}
        crumbs={[{ nome: "Blog" }]}
      />
      <Container className="py-10 sm:py-14">
        {resultados.length === 0 ? (
          <p className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">Ainda não há publicações.</p>
        ) : (
          <>
            {pagina === 1 && primeiro && (
              <div className="mb-10">
                <PostCard post={primeiro} destaque />
              </div>
            )}
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {(pagina === 1 ? resto : resultados).map((post) => (
                <li key={post.id}>
                  <PostCard post={post} />
                </li>
              ))}
            </ul>
            <div className="mt-12 flex flex-col items-center gap-3">
              <Paginacao pagina={pagina} totalPaginas={total_paginas} href={hrefPagina} />
              <p className="text-xs text-muted-foreground">
                {total} {total === 1 ? "publicação" : "publicações"}
              </p>
            </div>
          </>
        )}
      </Container>
      <JsonLd data={breadcrumbJsonLd(portal, [{ nome: "Início", href: "/" }, { nome: "Blog", href: "/blog" }])} />
    </>
  );
}
