import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, UserRound } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Compartilhar } from "@/features/blog/components/compartilhar";
import { PostCard } from "@/features/blog/components/post-card";
import { getRepository } from "@/lib/api";
import { JsonLd, breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { montarMetadata } from "@/lib/seo/metadata";
import { getPortal, urlAbsoluta } from "@/lib/tenant/get-portal";
import { formatarDataLonga } from "@/lib/utils/format";

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const [portal, repo, { slug }] = await Promise.all([getPortal(), getRepository(), params]);
  const post = await repo.getPost(slug);
  if (!post) return montarMetadata(portal, { titulo: "Publicação não encontrada", noindex: true });
  return {
    ...montarMetadata(portal, { titulo: post.titulo, descricao: post.resumo, path: `/blog/${post.slug}`, imagem: post.imagem_url, tipo: "article" }),
    authors: [{ name: post.autor }],
    openGraph: {
      type: "article",
      title: `${post.titulo} | ${portal.nome}`,
      description: post.resumo,
      url: urlAbsoluta(portal, `/blog/${post.slug}`),
      siteName: portal.nome,
      locale: "pt_BR",
      images: [{ url: post.imagem_url }],
      publishedTime: post.publicado_em,
      authors: [post.autor],
    },
  };
}

export default async function PostPage({ params }: PageProps<"/blog/[slug]">) {
  const [portal, repo, { slug }] = await Promise.all([getPortal(), getRepository(), params]);
  const post = await repo.getPost(slug);
  if (!post) notFound();

  const outros = (await repo.listPosts(1, 4)).resultados.filter((p) => p.id !== post.id).slice(0, 3);
  const url = urlAbsoluta(portal, `/blog/${post.slug}`);

  return (
    <>
      <article>
        <header className="border-b bg-gradient-to-br from-brand-soft/80 via-background to-background">
          <Container className="max-w-4xl py-8 sm:py-12">
            <nav aria-label="Navegação estrutural" className="mb-4 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground">
                Início
              </Link>
              <span className="mx-1.5">/</span>
              <Link href="/blog" className="hover:text-foreground">
                Blog
              </Link>
            </nav>
            <h1 className="text-3xl font-bold leading-tight text-brand sm:text-4xl lg:text-5xl">{post.titulo}</h1>
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{post.resumo}</p>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <UserRound className="size-4" aria-hidden />
                {post.autor}
              </span>
              <time dateTime={post.publicado_em} className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-4" aria-hidden />
                {formatarDataLonga(post.publicado_em)}
              </time>
            </div>
          </Container>
        </header>

        <Container className="max-w-4xl py-8 sm:py-10">
          <div className="relative aspect-[1200/630] overflow-hidden rounded-2xl shadow-[var(--shadow-card)]">
            <Image src={post.imagem_url} alt={post.titulo} fill priority sizes="(min-width: 1024px) 896px, 100vw" className="object-cover" />
          </div>

          <div className="prose-portal mx-auto mt-10 max-w-3xl text-[1.05rem]" dangerouslySetInnerHTML={{ __html: post.conteudo_html }} />

          <Separator className="my-10" />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Compartilhar url={url} titulo={post.titulo} />
            <Button asChild variant="ghost">
              <Link href="/blog">
                <ArrowLeft data-icon="inline-start" />
                Voltar ao blog
              </Link>
            </Button>
          </div>
        </Container>
      </article>

      {outros.length > 0 && (
        <section className="border-t bg-muted/40" aria-labelledby="outros-posts">
          <Container className="py-12">
            <h2 id="outros-posts" className="text-2xl font-bold">
              Outros posts
            </h2>
            <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {outros.map((p) => (
                <li key={p.id}>
                  <PostCard post={p} />
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.titulo,
          description: post.resumo,
          image: [post.imagem_url],
          datePublished: post.publicado_em,
          dateModified: post.publicado_em,
          author: { "@type": "Person", name: post.autor },
          publisher: { "@type": "Organization", name: portal.nome, logo: { "@type": "ImageObject", url: urlAbsoluta(portal, portal.logo_url) } },
          mainEntityOfPage: url,
          inLanguage: "pt-BR",
        }}
      />
      <JsonLd data={breadcrumbJsonLd(portal, [{ nome: "Início", href: "/" }, { nome: "Blog", href: "/blog" }, { nome: post.titulo, href: `/blog/${post.slug}` }])} />
    </>
  );
}
