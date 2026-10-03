import type { Bairro, Cidade } from "@/lib/api/types";
import { slugify } from "@/lib/utils/format";

const cidade = (id: string, nome: string, uf = "RJ"): Cidade => ({ id, nome, uf, slug: slugify(nome) });

export const CIDADES: Cidade[] = [
  cidade("1", "Petrópolis"),
  cidade("2", "Areal"),
  cidade("3", "Paraíba do Sul"),
  cidade("4", "Três Rios"),
  cidade("5", "Teresópolis"),
  cidade("6", "Juiz de Fora", "MG"),
  cidade("7", "Nova Friburgo"),
  cidade("8", "Paty do Alferes"),
  cidade("9", "São José do Vale do Rio Preto"),
  cidade("10", "Rio de Janeiro"),
  cidade("11", "Niterói"),
  cidade("12", "Cabo Frio"),
  cidade("13", "Guapimirim"),
];

const bairrosPorCidade: Record<string, string[]> = {
  "1": [
    "Itaipava", "Centro", "Corrêas", "Araras", "Quitandinha", "Nogueira", "Pedro do Rio", "Bingen",
    "Alto da Serra", "Mosela", "Valparaíso", "Secretário", "Samambaia", "Retiro", "Morin",
    "Quarteirão Ingelheim", "Castelânea", "Carangola", "Cascatinha", "Bonsucesso", "Posse",
    "Fazenda Inglesa", "Duarte da Silveira", "Vale do Cuiabá", "Coronel Veiga", "Caxambu", "Vila Militar",
  ],
  "2": ["Centro", "Alberto Torres"],
  "3": ["Centro", "Vila Salutaris"],
  "4": ["Centro", "Vila Isabel", "Purys"],
  "5": [
    "Alto", "Várzea", "Agriões", "Tijuca", "Golfe", "Bom Retiro", "Comary", "Albuquerque",
    "Parque do Imbuí", "Fazendinha", "Barra do Imbuí", "Araras", "Pimenteiras", "Quebra Frascos",
  ],
  "6": [
    "Centro", "São Mateus", "Bom Pastor", "Cascatinha", "Alto dos Passos", "Granbery", "Santa Helena",
    "Jardim Glória", "São Pedro", "Aeroporto", "Manoel Honório", "Paineiras",
  ],
  "7": ["Centro", "Cônego", "Olaria", "Braunes", "Mury", "Lumiar", "Vila Nova", "Riograndina", "Amparo", "Prado"],
  "8": ["Centro", "Arcozelo"],
  "9": ["Centro", "Águas Claras"],
  "10": ["Barra da Tijuca", "Copacabana", "Recreio dos Bandeirantes", "Tijuca"],
  "11": ["Icaraí", "Centro"],
  "12": ["Praia do Forte", "Braga"],
  "13": ["Centro", "Parada Modelo"],
};

let seq = 1;
export const BAIRROS: Bairro[] = Object.entries(bairrosPorCidade).flatMap(([cidadeId, nomes]) =>
  nomes.map((nome) => ({
    id: String(seq++),
    cidade_id: cidadeId,
    nome,
    slug: slugify(nome),
    total_imoveis: 0,
  })),
);

export const BAIRRO_OUTRO_ID = "417";

export function cidadePorId(id: string) {
  return CIDADES.find((c) => c.id === id);
}
export function bairroPorId(id: string) {
  return BAIRROS.find((b) => b.id === id);
}
