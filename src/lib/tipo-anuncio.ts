import type { TipoAnuncio } from "@/lib/api/types";

export type TipoAnuncioApi = "NORMAL" | "FEATURED" | "SUPER_FEATURED";

const DA_API: Record<TipoAnuncioApi, TipoAnuncio> = { NORMAL: "normal", FEATURED: "destaque", SUPER_FEATURED: "superdestaque" };
const PARA_API: Record<TipoAnuncio, TipoAnuncioApi> = { normal: "NORMAL", destaque: "FEATURED", superdestaque: "SUPER_FEATURED" };

export function tipoAnuncioDaApi(valor: TipoAnuncioApi | null | undefined): TipoAnuncio {
  return (valor && DA_API[valor]) || "normal";
}

export function tipoAnuncioParaApi(valor: TipoAnuncio): TipoAnuncioApi {
  return PARA_API[valor];
}

/** Ordem de exibição nas listagens: superdestaque > destaque > normal. */
export const RANK_TIPO_ANUNCIO: Record<TipoAnuncio, number> = { normal: 0, destaque: 1, superdestaque: 2 };

export const TIPOS_ANUNCIO: Array<{ valor: TipoAnuncio; rotulo: string }> = [
  { valor: "normal", rotulo: "Normal" },
  { valor: "destaque", rotulo: "Destaque" },
  { valor: "superdestaque", rotulo: "Superdestaque" },
];
