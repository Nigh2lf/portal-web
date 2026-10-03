import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Building2, Compass, Megaphone, Search } from "lucide-react";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { getRepository } from "@/lib/api";
import { linkBusca } from "@/lib/busca/filtros";
import { montarMetadata } from "@/lib/seo/metadata";
import { getPortal } from "@/lib/tenant/get-portal";

export async function generateMetadata(): Promise<Metadata> {
  const portal = await getPortal();
  return montarMetadata(portal, { titulo: "Mapa do site", descricao: `Todas as páginas e buscas do ${portal.nome}.`, path: "/mapa-do-site" });
}

interface Grupo {
  id: string;
  titulo: string;
  icone: React.ReactNode;
  links: Array<{ label: string; href: string }>;
  colunas?: boolean;
}

function Bloco({ g }: { g: Grupo }) {
  if (g.links.length === 0) return null;
  return (
    <section id={g.id} aria-labelledby={`${g.id}-titulo`} className="card-elevated p-6">
      <div className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-lg bg-brand-soft text-brand">{g.icone}</span>
        <h2 id={`${g.id}-titulo`} className="text-lg font-semibold">
          {g.titulo} <span className="text-sm font-normal text-muted-foreground">({g.links.length})</span>
        </h2>
      </div>
      <ul className={g.colunas ? "mt-4 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2" : "mt-4 space-y-1.5 text-sm"}>
        {g.links.map((l) => (
          <li key={`${l.href}-${l.label}`}>
            <Link href={l.href} className="text-foreground/80 underline-offset-4 hover:text-brand hover:underline">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function MapaDoSitePage() {
  const [portal, repo] = await Promise.all([getPortal(), getRepository()]);
  const [pesquisas, { imobiliarias, corretores }, posts, dicas] = await Promise.all([
    repo.getPesquisasPopulares(portal.id, 30),
    repo.listAnunciantes(portal.id),
    repo.listPosts(1, 50),
    repo.listDicas(),
  ]);
  const hotsites = [...imobiliarias, ...corretores].filter((a) => a.hotsite).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  const grupos: Grupo[] = [
    {
      id: "principais",
      titulo: "Principais páginas",
      icone: <Compass className="size-4" aria-hidden />,
      links: [
        { label: "Página inicial", href: "/" },
        { label: "Buscar imóveis", href: "/imoveis" },
        { label: "Comprar", href: linkBusca({ objetivo: "comprar" }) },
        { label: "Alugar", href: linkBusca({ objetivo: "alugar" }) },
        { label: "Temporada", href: linkBusca({ objetivo: "temporada" }) },
        { label: "Meus favoritos", href: "/favoritos" },
        { label: `Imobiliárias em ${portal.cidade_principal_nome}`, href: "/imobiliarias" },
        { label: "Encomende um imóvel", href: "/encomendar" },
        { label: "Encomenda às imobiliárias parceiras", href: "/encomendar/parceiro" },
        { label: "Contato", href: "/contato" },
        { label: "Quem somos", href: "/quem-somos" },
        { label: "Termos de uso", href: "/termos-de-uso" },
      ],
      colunas: true,
    },
    {
      id: "buscas",
      titulo: "Buscas mais procuradas",
      icone: <Search className="size-4" aria-hidden />,
      links: pesquisas.map((p) => ({ label: p.label, href: p.href })),
      colunas: true,
    },
    {
      id: "imobiliarias",
      titulo: "Imobiliárias e corretores com hotsite",
      icone: <Building2 className="size-4" aria-hidden />,
      links: hotsites.map((a) => ({ label: a.nome, href: `/imobiliarias/${a.slug}` })),
      colunas: true,
    },
    {
      id: "conteudo",
      titulo: "Conteúdo",
      icone: <BookOpen className="size-4" aria-hidden />,
      links: [
        { label: "Dicas", href: "/dicas" },
        ...dicas.slice(0, 10).map((d) => ({ label: `Dica: ${d.titulo}`, href: "/dicas" })),
        { label: "Blog", href: "/blog" },
        ...posts.resultados.map((p) => ({ label: p.titulo, href: `/blog/${p.slug}` })),
      ],
      colunas: true,
    },
    {
      id: "anunciante",
      titulo: "Para anunciantes",
      icone: <Megaphone className="size-4" aria-hidden />,
      links: [
        { label: "Anunciar / Área do anunciante", href: "/anunciar" },
        { label: "Planos", href: "/planos" },
        { label: "Cadastre-se", href: "/cadastro" },
        { label: "Recuperar senha", href: "/recuperar-senha" },
        { label: "Painel do anunciante", href: "/painel" },
        { label: "Publicidade", href: "/publicidade" },
        { label: "Integração XML", href: "/integracao-xml" },
      ],
    },
  ];

  return (
    <>
      <PageHeader titulo="Mapa do site" subtitulo={`Todas as páginas, buscas e conteúdos do ${portal.nome}.`} crumbs={[{ nome: "Mapa do site" }]} compacto />
      <Container className="py-10 sm:py-14">
        <nav aria-label="Seções" className="mb-8 flex flex-wrap gap-2 text-sm">
          {grupos
            .filter((g) => g.links.length)
            .map((g) => (
              <a key={g.id} href={`#${g.id}`} className="rounded-full border bg-card px-3 py-1 hover:border-brand hover:text-brand">
                {g.titulo}
              </a>
            ))}
        </nav>
        <div className="grid gap-6 lg:grid-cols-2">
          {grupos.map((g) => (
            <Bloco key={g.id} g={g} />
          ))}
        </div>
      </Container>
    </>
  );
}
