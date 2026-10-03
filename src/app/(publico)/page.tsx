import { Suspense } from "react";
import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import {
  BairrosHome,
  BairrosHomeSkeleton,
  DestaquesHome,
  DestaquesHomeSkeleton,
  MaisProcuradosHome,
  MaisProcuradosHomeSkeleton,
} from "@/features/home/components/secoes-home-async";
import { FaixaAnuncie, HeroHome } from "@/features/home/components/secoes-home";
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
  // Só o topo (hero, busca e banner) espera os dados; as seções abaixo chegam em seguida.
  const [topo, tipos, cidades] = await Promise.all([repo.getHomeTopo(portal.id), repo.listTipos(), repo.listCidades(portal.id)]);
  const cidadePadraoSlug = cidades.find((c) => c.id === portal.cidade_principal_id)?.slug ?? cidades[0]?.slug ?? "";
  const bairrosIniciais = portal.exibir_cidade ? [] : await repo.listBairros({ cidadeSlug: cidadePadraoSlug, portalId: portal.id, comImoveis: true });

  return (
    <>
      <HeroHome portal={portal} home={topo} busca={{ tipos, cidades, bairrosIniciais, exibirCidade: portal.exibir_cidade, cidadePadraoSlug }} />

      {topo.banner_home && (
        <Container className="pt-8">
          <BannerPublicidade pub={topo.banner_home} />
        </Container>
      )}

      <Suspense fallback={<DestaquesHomeSkeleton />}>
        <DestaquesHome portal={portal} favoritos={favoritos} />
      </Suspense>
      <Suspense fallback={<MaisProcuradosHomeSkeleton />}>
        <MaisProcuradosHome portal={portal} />
      </Suspense>
      <Suspense fallback={<BairrosHomeSkeleton />}>
        <BairrosHome portal={portal} />
      </Suspense>
      <FaixaAnuncie portal={portal} />

      <PopupHome pub={topo.popup_home} />
    </>
  );
}
