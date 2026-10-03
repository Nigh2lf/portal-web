import type { Imovel, Portal } from "@/lib/api/types";
import { urlAbsoluta } from "@/lib/tenant/get-portal";

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export function organizacaoJsonLd(portal: Portal) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: portal.nome,
    url: urlAbsoluta(portal),
    logo: urlAbsoluta(portal, portal.logo_url),
    email: portal.email,
    telephone: portal.telefone,
    address: { "@type": "PostalAddress", streetAddress: portal.endereco, addressLocality: portal.cidade_principal_nome, addressRegion: portal.cidade_principal_uf, addressCountry: "BR" },
    sameAs: [portal.facebook, portal.instagram].filter(Boolean),
  };
}

export function breadcrumbJsonLd(portal: Portal, itens: Array<{ nome: string; href: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: itens.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.nome, item: urlAbsoluta(portal, it.href) })),
  };
}

export function imovelJsonLd(portal: Portal, imovel: Imovel) {
  const preco = imovel.preco_venda ?? imovel.preco_locacao ?? imovel.preco_temporada ?? 0;
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: imovel.titulo,
    url: urlAbsoluta(portal, `/imovel/${imovel.slug}`),
    description: imovel.descricao.replace(/<[^>]+>/g, " ").trim(),
    image: imovel.fotos.map((f) => f.url),
    datePosted: imovel.criado_em,
    offers: { "@type": "Offer", price: preco, priceCurrency: "BRL", availability: "https://schema.org/InStock" },
    address: { "@type": "PostalAddress", addressLocality: imovel.cidade_nome, addressRegion: imovel.uf, addressCountry: "BR" },
    numberOfRooms: imovel.quartos,
    floorSize: imovel.area_construida ? { "@type": "QuantitativeValue", value: imovel.area_construida, unitCode: "MTK" } : undefined,
  };
}
