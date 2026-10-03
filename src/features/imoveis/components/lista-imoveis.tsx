import type { ImovelResumo, Objetivo, Publicidade } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import type { VisaoImoveis } from "../visao";
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
  /** `grade` (padrão) ou `lista` (um imóvel por linha, card horizontal). */
  visao?: VisaoImoveis;
  className?: string;
}

export function ListaImoveis({ imoveis, objetivo, favoritos, portalNome, banner, modoFavoritos, colunas = 3, visao = "grade", className }: Props) {
  const set = new Set(favoritos);
  const grade =
    visao === "lista"
      ? cn("grid gap-4", className)
      : cn("grid gap-5 sm:grid-cols-2", colunas === 3 && "xl:grid-cols-3", colunas === 4 && "lg:grid-cols-3 xl:grid-cols-4", className);
  const antes = banner ? imoveis.slice(0, 6) : imoveis;
  const depois = banner ? imoveis.slice(6) : [];
  const card = (i: ImovelResumo, idx: number) => (
    <ImovelCard key={i.id} imovel={i} objetivo={objetivo} favorito={set.has(i.id)} portalNome={portalNome} prioridade={idx < 3} modoFavoritos={modoFavoritos} layout={visao} />
  );

  return (
    <div className="space-y-6">
      <div className={grade}>{antes.map(card)}</div>
      {banner && imoveis.length > 0 && <BannerPublicidade pub={banner} />}
      {depois.length > 0 && <div className={grade}>{depois.map((i) => card(i, 99))}</div>}
    </div>
  );
}
