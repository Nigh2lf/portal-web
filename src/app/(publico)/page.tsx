import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { FaixaAnuncie, HeroHome, SecaoBairros, SecaoDestaques, SecaoMaisProcurados } from "@/features/home/components/secoes-home";
import { PopupHome } from "@/features/home/components/popup-home";
import { BannerPublicidade } from "@/features/imoveis/components/banner-publicidade";
import { getRepository } from "@/lib/api";
import { lerFavoritos } from "@/lib/favoritos/cookie";
import { montarMetadata } from "@/lib/seo/metadata";
import { getPortal } from "@/lib/tenant/get-portal";

export async function generateMetadata(): Promise<Metadata> {
  const portal = await getPortal();
  return montarMetadata(portal, { path: "/" });
}

export default async function HomePage() {
  const [portal, repo, favoritos] = await Promise.all([getPortal(), getRepository(), lerFavoritos()]);
  const [home, tipos, cidades] = await Promise.all([repo.getHome(portal.id), repo.listTipos(), repo.listCidades(portal.id)]);
  const cidadePadraoSlug = cidades.find((c) => c.id === portal.cidade_principal_id)?.slug ?? cidades[0]?.slug ?? "";
  const bairrosIniciais = portal.exibir_cidade ? [] : await repo.listBairros({ cidadeSlug: cidadePadraoSlug, portalId: portal.id, comImoveis: true });

  return (
    <>
      <HeroHome portal={portal} home={home} busca={{ tipos, cidades, bairrosIniciais, exibirCidade: portal.exibir_cidade, cidadePadraoSlug }} />

      {home.banner_home && (
        <Container className="pt-8">
          <BannerPublicidade pub={home.banner_home} />
        </Container>
      )}

      <SecaoDestaques home={home} portal={portal} favoritos={favoritos} />
      <SecaoMaisProcurados home={home} />
      <SecaoBairros home={home} />
      <FaixaAnuncie portal={portal} />

      <PopupHome pub={home.popup_home} />
    </>
  );
}
