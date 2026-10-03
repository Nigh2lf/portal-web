import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Eye, ImageIcon, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getRepository } from "@/lib/api";
import { exigirSessao } from "@/lib/auth/session";
import { montarMetadata } from "@/lib/seo/metadata";
import { getPortal } from "@/lib/tenant/get-portal";
import { EmptyState } from "@/features/painel/components/empty-state";
import { ImovelForm } from "@/features/painel/components/imovel-form";
import { PainelHeader } from "@/features/painel/components/painel-header";
import { ehIdLegado, linkPreview } from "@/features/painel/utils";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const portal = await getPortal();
  return montarMetadata(portal, { titulo: "Editar imóvel", noindex: true, path: `/painel/imoveis/${id}/editar` });
}

export default async function EditarImovelPage({ params }: { params: Params }) {
  const { id } = await params;
  const sessao = await exigirSessao(`/painel/imoveis/${id}/editar`);

  if (ehIdLegado(id)) return <ImovelLegado />;

  const [repo, portal] = await Promise.all([getRepository(), getPortal()]);
  const imovel = await repo.getMeuImovel(sessao.anunciante_id, id);
  if (!imovel) notFound();

  const [tipos, cidades, bairros, infraestruturas, uso] = await Promise.all([
    repo.listTipos(),
    repo.listCidades(portal.id),
    repo.listBairros({ cidadeId: imovel.cidade_id }),
    repo.listInfraestruturas(),
    repo.getUsoPlano(sessao.anunciante_id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PainelHeader
        titulo={`Editar imóvel ${imovel.codigo}`}
        descricao={imovel.titulo}
        crumbs={[{ nome: "Meus imóveis", href: "/painel/imoveis" }, { nome: imovel.codigo }]}
        acoes={
          <>
            <Button asChild variant="outline">
              <Link href={`/painel/imoveis/${imovel.id}/fotos`}>
                <ImageIcon data-icon="inline-start" /> Fotos ({imovel.fotos.length})
              </Link>
            </Button>
            <Button asChild variant="outline">
              <a href={linkPreview(imovel)} target="_blank" rel="noopener noreferrer">
                <Eye data-icon="inline-start" /> Pré-visualizar
              </a>
            </Button>
          </>
        }
      />
      <ImovelForm imovel={imovel} tipos={tipos} cidades={cidades} bairrosIniciais={bairros} infraestruturas={infraestruturas} uso={uso} />
    </div>
  );
}

function ImovelLegado() {
  return (
    <div className="flex flex-col gap-6">
      <PainelHeader titulo="Imóvel não encontrado" crumbs={[{ nome: "Meus imóveis", href: "/painel/imoveis" }, { nome: "Editar" }]} />
      <EmptyState
        icon={SearchX}
        titulo="Este link veio do site antigo"
        descricao="Os endereços do painel mudaram. Localize o imóvel pelo código na sua lista para continuar editando."
        acao={
          <Button asChild>
            <Link href="/painel/imoveis">Ir para meus imóveis</Link>
          </Button>
        }
      />
    </div>
  );
}
