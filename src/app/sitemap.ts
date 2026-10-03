import type { MetadataRoute } from "next";
import { getRepository } from "@/lib/api";
import { getPortal, urlAbsoluta } from "@/lib/tenant/get-portal";

const ESTATICAS: Array<{ path: string; prioridade: number; freq: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
  { path: "/", prioridade: 1, freq: "daily" },
  { path: "/imoveis", prioridade: 0.9, freq: "hourly" },
  { path: "/imobiliarias", prioridade: 0.8, freq: "weekly" },
  { path: "/blog", prioridade: 0.7, freq: "weekly" },
  { path: "/dicas", prioridade: 0.6, freq: "monthly" },
  { path: "/planos", prioridade: 0.7, freq: "monthly" },
  { path: "/anunciar", prioridade: 0.7, freq: "monthly" },
  { path: "/cadastro", prioridade: 0.5, freq: "monthly" },
  { path: "/encomendar", prioridade: 0.6, freq: "monthly" },
  { path: "/encomendar/parceiro", prioridade: 0.5, freq: "monthly" },
  { path: "/contato", prioridade: 0.6, freq: "yearly" },
  { path: "/publicidade", prioridade: 0.4, freq: "yearly" },
  { path: "/integracao-xml", prioridade: 0.4, freq: "yearly" },
  { path: "/quem-somos", prioridade: 0.4, freq: "yearly" },
  { path: "/termos-de-uso", prioridade: 0.2, freq: "yearly" },
  { path: "/mapa-do-site", prioridade: 0.3, freq: "monthly" },
];

/** Sitemap por portal (tenant resolvido pelo host da requisição). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [portal, repo] = await Promise.all([getPortal(), getRepository()]);
  const [posts, anunciantes, pesquisas] = await Promise.all([repo.listPosts(1, 500), repo.listAnunciantes(portal.id), repo.getPesquisasPopulares(portal.id, 50)]);
  const agora = new Date();

  const estaticas: MetadataRoute.Sitemap = ESTATICAS.map((e) => ({
    url: urlAbsoluta(portal, e.path),
    lastModified: agora,
    changeFrequency: e.freq,
    priority: e.prioridade,
  }));

  const blog: MetadataRoute.Sitemap = posts.resultados.map((p) => ({
    url: urlAbsoluta(portal, `/blog/${p.slug}`),
    lastModified: new Date(p.publicado_em),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const hotsites: MetadataRoute.Sitemap = [...anunciantes.imobiliarias, ...anunciantes.corretores]
    .filter((a) => a.hotsite)
    .map((a) => ({
      url: urlAbsoluta(portal, `/imobiliarias/${a.slug}`),
      lastModified: agora,
      changeFrequency: "weekly",
      priority: 0.6,
    }));

  const buscas: MetadataRoute.Sitemap = pesquisas.map((p) => ({
    url: urlAbsoluta(portal, p.href),
    lastModified: agora,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  const vistos = new Set<string>();
  return [...estaticas, ...buscas, ...hotsites, ...blog].filter((e) => {
    if (vistos.has(e.url)) return false;
    vistos.add(e.url);
    return true;
  });
}
