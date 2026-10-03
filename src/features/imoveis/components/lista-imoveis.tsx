import type { ImovelResumo, Objetivo, Publicidade } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { BannerPublicidade } from "./banner-publicidade";
import { ImovelCard } from "./imovel-card";

interface Props {
  imoveis: ImovelResumo[];
  objetivo?: Objetivo;
  favoritos: string[];
  portalNome: string;
  /** Banner inserido após o 6º card (categoria `banner_lista`). */
  banner?: Publicidade | null;
  modoFavoritos?: boolean;
  colunas?: 2 | 3 | 4;
  /**
   * Dentro de `<VisaoArea>`: segue a escolha grade / um por linha do visitante
   * (`data-visao` no contêiner), sem nova requisição.
   */
  alternavel?: boolean;
  className?: string;
}

// Em "lista" a grade vira uma coluna a partir do sm (no celular já é uma coluna).
const LISTA_UMA_COLUNA =
  "group-data-[visao=lista]/visao:gap-4 sm:group-data-[visao=lista]/visao:grid-cols-1 lg:group-data-[visao=lista]/visao:grid-cols-1 xl:group-data-[visao=lista]/visao:grid-cols-1";

export function ListaImoveis({
  imoveis,
  objetivo,
  favoritos,
  portalNome,
  banner,
  modoFavoritos,
  colunas = 3,
  alternavel,
  className,
}: Props) {
  const set = new Set(favoritos);
  const grade = cn(
    "grid gap-5 sm:grid-cols-2",
    colunas === 3 && "xl:grid-cols-3",
    colunas === 4 && "lg:grid-cols-3 xl:grid-cols-4",
    alternavel && LISTA_UMA_COLUNA,
    className,
  );
  const antes = banner ? imoveis.slice(0, 6) : imoveis;
  const depois = banner ? imoveis.slice(6) : [];
  const card = (i: ImovelResumo, idx: number) => (
    <ImovelCard
      key={i.id}
      imovel={i}
      objetivo={objetivo}
      favorito={set.has(i.id)}
      portalNome={portalNome}
      prioridade={idx < 3}
      modoFavoritos={modoFavoritos}
      alternavel={alternavel}
    />
  );

  return (
    <div className="space-y-6">
      <div className={grade}>{antes.map(card)}</div>
      {banner && imoveis.length > 0 && <BannerPublicidade pub={banner} />}
      {depois.length > 0 && <div className={grade}>{depois.map((i) => card(i, 99))}</div>}
    </div>
  );
}
