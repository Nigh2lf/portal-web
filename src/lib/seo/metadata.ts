import type { Metadata } from "next";
import type { Portal } from "@/lib/api/types";
import { urlAbsoluta } from "@/lib/tenant/get-portal";

interface Opcoes {
  titulo?: string;
  descricao?: string;
  path?: string;
  imagem?: string | null;
  noindex?: boolean;
  tipo?: "website" | "article";
}

/** Metadata padrão por portal. Título vira "X | Nome do Portal". */
export function montarMetadata(portal: Portal, o: Opcoes = {}): Metadata {
  const titulo = o.titulo ? `${o.titulo} | ${portal.nome}` : portal.titulo_padrao;
  const descricao = o.descricao ?? portal.descricao_padrao;
  const url = urlAbsoluta(portal, o.path ?? "/");
  const imagem = o.imagem ?? urlAbsoluta(portal, portal.logo_url);
  return {
    title: titulo,
    description: descricao,
    keywords: portal.keywords_padrao,
    alternates: { canonical: url },
    robots: o.noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: titulo,
      description: descricao,
      url,
      siteName: portal.nome,
      locale: "pt_BR",
      type: o.tipo ?? "website",
      images: [{ url: imagem }],
    },
    twitter: { card: "summary_large_image", title: titulo, description: descricao, images: [imagem] },
  };
}
