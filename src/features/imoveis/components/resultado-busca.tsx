import type { BuscaFiltros, PesquisaPopular, Portal, Publicidade } from "@/lib/api/types";
import { formatarNumero, plural } from "@/lib/utils/format";
import type { DadosBusca } from "@/features/imoveis/server/busca";
import { AbasObjetivo } from "./abas-objetivo";
import { EstadoVazio } from "./estado-vazio";
import { FiltrosBusca } from "./filtros-busca";
import { ListaImoveis } from "./lista-imoveis";
import { OrdenacaoSelect } from "./ordenacao-select";
import { Paginacao } from "./paginacao";
import { VisaoToggle } from "./visao-toggle";
import type { VisaoImoveis } from "../visao";

interface Props {
  portal: Portal;
  filtros: BuscaFiltros;
  dados: DadosBusca;
  favoritos: string[];
  banner?: Publicidade | null;
  sugestoes?: PesquisaPopular[];
  base?: string;
  /** Hotsite: restringe bairros do filtro ao anunciante. */
  anuncianteId?: string;
  /** Grade (padrão) ou um imóvel por linha. */
  visao?: VisaoImoveis;
}

/** Layout da busca (filtros + abas + ordenação + cards + paginação). Usado em `/imoveis` e no hotsite. */
export function ResultadoBusca({ portal, filtros, dados, favoritos, banner, sugestoes, base = "/imoveis", anuncianteId, visao = "grade" }: Props) {
  const { resultado, tipos, cidades, bairros, cidadePadraoSlug } = dados;
  const inicio = (resultado.pagina - 1) * resultado.por_pagina + 1;
  const fim = Math.min(resultado.total, resultado.pagina * resultado.por_pagina);

  const chave = JSON.stringify({ ...filtros, pagina: 0, ordenacao: "" });
  const propsFiltros = {
    filtros,
    tipos,
    cidades,
    bairros,
    valorMaximo: resultado.valor_maximo,
    exibirCidade: portal.exibir_cidade,
    cidadePadraoSlug,
    base,
    anuncianteId,
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[288px_minmax(0,1fr)] lg:gap-8">
      <FiltrosBusca key={chave} modo="lateral" className="hidden lg:block" {...propsFiltros} />

      <section aria-label="Resultados" className="min-w-0 space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <AbasObjetivo filtros={filtros} contadores={resultado.contadores} base={base} />
          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <FiltrosBusca key={`g-${chave}`} modo="gaveta" className="lg:hidden" {...propsFiltros} />
            <OrdenacaoSelect filtros={filtros} base={base} />
            <VisaoToggle visao={visao} />
          </div>
        </div>

        <p className="text-sm text-muted-foreground" aria-live="polite">
          {resultado.total === 0 ? (
            "Nenhum imóvel encontrado"
          ) : (
            <>
              Mostrando <strong className="text-foreground">{inicio}</strong>–<strong className="text-foreground">{fim}</strong> de{" "}
              <strong className="text-foreground">{formatarNumero(resultado.total)}</strong> {plural(resultado.total, "imóvel", "imóveis")}
            </>
          )}
        </p>

        {resultado.total === 0 ? (
          <EstadoVazio filtros={filtros} contadores={resultado.contadores} sugestoes={sugestoes} base={base} />
        ) : (
          <ListaImoveis imoveis={resultado.resultados} objetivo={filtros.objetivo} favoritos={favoritos} portalNome={portal.nome} banner={banner} colunas={3} visao={visao} />
        )}

        <Paginacao pagina={resultado.pagina} totalPaginas={resultado.total_paginas} filtros={filtros} base={base} />
      </section>
    </div>
  );
}
