import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DetalheImovel } from "@/features/imoveis/components/detalhe-imovel";
import { carregarImovel } from "@/features/imoveis/server/detalhe";
import { getSessao } from "@/lib/auth/session";
import { lerFavoritos } from "@/lib/favoritos/cookie";
import { montarMetadata } from "@/lib/seo/metadata";
import { getPortal } from "@/lib/tenant/get-portal";
import { formatarMoeda, truncar } from "@/lib/utils/format";

type Props = PageProps<"/imovel/[slug]">;

async function resolver(props: Props) {
  const [{ slug }, sp, portal] = await Promise.all([props.params, props.searchParams, getPortal()]);
  const preview = sp.preview === "1";
  const sessao = preview ? await getSessao() : null;
  const detalhe = await carregarImovel(portal.id, slug, preview, sessao?.anunciante_id);
  return { portal, detalhe, preview };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { portal, detalhe, preview } = await resolver(props);
  if (!detalhe) return montarMetadata(portal, { titulo: "Imóvel não encontrado", noindex: true });
  const { imovel } = detalhe;
  const preco = imovel.preco_venda ?? imovel.preco_locacao ?? imovel.preco_temporada;
  const descricao = `${imovel.titulo}${preco ? ` por ${formatarMoeda(preco)}` : ""}. ${truncar(imovel.descricao, 140)} Código ${imovel.codigo}.`;
  return montarMetadata(portal, {
    titulo: `${imovel.titulo} - Cód. ${imovel.codigo}`,
    descricao,
    path: `/imovel/${imovel.slug}`,
    imagem: imovel.fotos[0]?.url ?? imovel.foto_principal_url,
    tipo: "article",
    noindex: preview,
  });
}

export default async function ImovelPage(props: Props) {
  const [{ portal, detalhe, preview }, favoritos] = await Promise.all([resolver(props), lerFavoritos()]);
  if (!detalhe) notFound();
  return <DetalheImovel portal={portal} detalhe={detalhe} favoritos={favoritos} preview={preview} />;
}
