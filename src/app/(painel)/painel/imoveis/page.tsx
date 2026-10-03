import type { Metadata } from "next";
import Link from "next/link";
import { Building2, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getRepository } from "@/lib/api";
import { exigirSessao } from "@/lib/auth/session";
import { montarMetadata } from "@/lib/seo/metadata";
import { getPortal } from "@/lib/tenant/get-portal";
import { EmptyState } from "@/features/painel/components/empty-state";
import { ImoveisFiltros } from "@/features/painel/components/imoveis-filtros";
import { ImoveisLista } from "@/features/painel/components/imoveis-lista";
import { NovoImovelBotao } from "@/features/painel/components/novo-imovel-botao";
import { PaginacaoPainel } from "@/features/painel/components/paginacao-painel";
import { PainelHeader } from "@/features/painel/components/painel-header";
import { filtrosMeusImoveisDe, queryDe, type SearchParamsLike } from "@/features/painel/utils";

export async function generateMetadata(): Promise<Metadata> {
  const portal = await getPortal();
  return montarMetadata(portal, { titulo: "Meus imóveis", noindex: true, path: "/painel/imoveis" });
}

export default async function MeusImoveisPage({ searchParams }: { searchParams: Promise<SearchParamsLike> }) {
  const sessao = await exigirSessao("/painel/imoveis");
  const sp = await searchParams;
  const filtros = filtrosMeusImoveisDe(sp);
  const [repo, portal] = await Promise.all([getRepository(), getPortal()]);

  const [lista, uso, tipos, cidades] = await Promise.all([
    repo.listMeusImoveis(sessao.anunciante_id, filtros),
    repo.getUsoPlano(sessao.anunciante_id),
    repo.listTipos(),
    repo.listCidades(portal.id),
  ]);

  const temFiltro = Boolean(filtros.busca || filtros.objetivo || filtros.status || filtros.tipo || filtros.cidade);
  const hrefPagina = (pagina: number) => `/painel/imoveis${queryDe({ busca: filtros.busca, objetivo: filtros.objetivo, status: filtros.status, tipo: filtros.tipo, cidade: filtros.cidade, pagina: pagina > 1 ? pagina : undefined })}`;
  const disponiveis = Math.max(0, uso.plano.imoveis - uso.imoveis_usados);

  return (
    <div className="flex flex-col gap-5">
      <PainelHeader
        titulo="Meus imóveis"
        descricao={
          <>
            Plano <strong className="text-foreground">{uso.plano.nome}</strong>: utilizado <strong className="text-foreground">{uso.imoveis_usados}</strong> de{" "}
            <strong className="text-foreground">{uso.plano.imoveis}</strong> {uso.plano.imoveis === 1 ? "imóvel ativo" : "imóveis ativos"} · disponível {disponiveis}.
          </>
        }
        crumbs={[{ nome: "Meus imóveis" }]}
        acoes={<NovoImovelBotao uso={uso} />}
      />

      <ImoveisFiltros filtros={filtros} tipos={tipos} cidades={cidades} />

      {lista.total === 0 ? (
        temFiltro ? (
          <EmptyState
            icon={SearchX}
            titulo="Nenhum imóvel com esses filtros"
            descricao="Tente ampliar a busca ou limpar os filtros."
            acao={
              <Button asChild variant="outline">
                <Link href="/painel/imoveis">Limpar filtros</Link>
              </Button>
            }
          />
        ) : (
          <EmptyState icon={Building2} titulo="Você ainda não cadastrou imóveis" descricao="Cadastre seu primeiro anúncio e adicione fotos para começar a receber contatos." acao={<NovoImovelBotao uso={uso} />} />
        )
      ) : (
        <>
          <ImoveisLista imoveis={lista.resultados} />
          <PaginacaoPainel dados={lista} hrefDe={hrefPagina} rotuloItens="imóveis" />
        </>
      )}
    </div>
  );
}
