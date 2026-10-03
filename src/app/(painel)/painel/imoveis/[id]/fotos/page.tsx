import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Eye, PartyPopper, Pencil, SearchX } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getRepository } from "@/lib/api";
import { exigirSessao } from "@/lib/auth/session";
import { montarMetadata } from "@/lib/seo/metadata";
import { getPortal } from "@/lib/tenant/get-portal";
import { EmptyState } from "@/features/painel/components/empty-state";
import { FotosGerenciador } from "@/features/painel/components/fotos-gerenciador";
import { FotosUploader } from "@/features/painel/components/fotos-uploader";
import { PainelHeader } from "@/features/painel/components/painel-header";
import { ehIdLegado, linkPreview, um, type SearchParamsLike } from "@/features/painel/utils";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const portal = await getPortal();
  return montarMetadata(portal, { titulo: "Fotos do imóvel", noindex: true, path: `/painel/imoveis/${id}/fotos` });
}

export default async function FotosImovelPage({ params, searchParams }: { params: Params; searchParams: Promise<SearchParamsLike> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const sessao = await exigirSessao(`/painel/imoveis/${id}/fotos`);

  if (ehIdLegado(id)) {
    return (
      <div className="flex flex-col gap-6">
        <PainelHeader titulo="Imóvel não encontrado" crumbs={[{ nome: "Meus imóveis", href: "/painel/imoveis" }, { nome: "Fotos" }]} />
        <EmptyState
          icon={SearchX}
          titulo="Este link veio do site antigo"
          descricao="Os endereços do painel mudaram. Localize o imóvel pelo código na sua lista para gerenciar as fotos."
          acao={
            <Button asChild>
              <Link href="/painel/imoveis">Ir para meus imóveis</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const repo = await getRepository();
  const [imovel, uso] = await Promise.all([repo.getMeuImovel(sessao.anunciante_id, id), repo.getUsoPlano(sessao.anunciante_id)]);
  if (!imovel) notFound();

  const novo = um(sp.novo) === "1";
  const limite = uso.plano.fotos;

  return (
    <div className="flex flex-col gap-6">
      <PainelHeader
        titulo={`Fotos do imóvel ${imovel.codigo}`}
        descricao={
          <span className="flex flex-wrap items-center gap-2">
            <span>{imovel.titulo}</span>
            <Badge variant="outline" className="tabular-nums">
              {imovel.fotos.length} de {limite} fotos (limite do plano)
            </Badge>
          </span>
        }
        crumbs={[{ nome: "Meus imóveis", href: "/painel/imoveis" }, { nome: imovel.codigo, href: `/painel/imoveis/${imovel.id}/editar` }, { nome: "Fotos" }]}
        acoes={
          <>
            <Button asChild variant="outline">
              <Link href={`/painel/imoveis/${imovel.id}/editar`}>
                <Pencil data-icon="inline-start" /> Editar dados
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

      {novo && (
        <Alert className="border-success/30 bg-success/10">
          <PartyPopper className="text-success" />
          <AlertTitle>Imóvel cadastrado!</AlertTitle>
          <AlertDescription>Agora adicione as fotos. Anúncios com imagens de qualidade aparecem melhor e recebem mais contatos.</AlertDescription>
        </Alert>
      )}

      <FotosUploader imovelId={imovel.id} totalAtual={imovel.fotos.length} limite={limite} />
      <FotosGerenciador imovelId={imovel.id} fotos={imovel.fotos} />
    </div>
  );
}
