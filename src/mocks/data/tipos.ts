import type { ImovelTipo, Infraestrutura } from "@/lib/api/types";
import { slugify } from "@/lib/utils/format";

const nomesTipos = [
  "Apartamento", "Área", "Casa", "Chácara", "Cobertura", "Fazenda/Sítio", "Flat", "Galpão", "Haras",
  "Hotel", "Imóvel Comercial", "Kitnet/Conjugado", "Loja", "Pousada", "Sala", "Sobrelojas", "Studio",
  "Terreno Comercial", "Terreno Residencial",
];

export const TIPOS: ImovelTipo[] = nomesTipos.map((nome, i) => ({
  id: String(i + 1),
  nome,
  slug: slugify(nome),
}));

/** Tipos residenciais com quartos; o resto é terreno/comercial. */
export const TIPOS_RESIDENCIAIS = ["Apartamento", "Casa", "Chácara", "Cobertura", "Fazenda/Sítio", "Flat", "Kitnet/Conjugado", "Studio"];
export const TIPOS_TERRENO = ["Área", "Terreno Comercial", "Terreno Residencial"];

const infraImovel = [
  "Área de serviço", "Churrasqueira", "Piscina", "Varanda", "Lareira", "Armários embutidos", "Cozinha planejada",
  "Jardim", "Quintal", "Sauna", "Hidromassagem", "Escritório", "Dependência de empregada", "Aquecimento solar",
  "Mobiliado", "Vista para montanha", "Closet", "Despensa", "Ar-condicionado", "Interfone",
];
const infraCondominio = [
  "Portaria 24h", "Salão de festas", "Playground", "Quadra poliesportiva", "Piscina", "Academia", "Churrasqueira",
  "Área verde", "Elevador", "Segurança", "Lago", "Trilhas", "Gerador", "Bicicletário",
];

export const INFRAESTRUTURAS: Infraestrutura[] = [
  ...infraImovel.map((nome, i) => ({ id: `i${i + 1}`, nome, escopo: "imovel" as const })),
  ...infraCondominio.map((nome, i) => ({ id: `c${i + 1}`, nome, escopo: "condominio" as const })),
];

export function tipoPorSlug(slug: string) {
  return TIPOS.find((t) => t.slug === slug);
}
export function tipoPorId(id: string) {
  return TIPOS.find((t) => t.id === id);
}
