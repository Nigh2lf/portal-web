import type { Plano } from "@/lib/api/types";
import { formatarMoeda, formatarNumero } from "@/lib/utils/format";

export interface RecursoPlano {
  chave: string;
  label: string;
  descricao: string;
  /** Texto (ou boolean) a exibir para o plano. */
  valor: (p: Plano) => string | boolean;
}

/** Linhas da tabela de planos (paridade com `Planos.php`, com tooltips do legado como `descricao`). */
export const RECURSOS_PLANO: RecursoPlano[] = [
  { chave: "imoveis", label: "Anúncios ativos", descricao: "Quantidade de imóveis permitidos", valor: (p) => (p.imoveis >= 99999 ? "Ilimitados" : formatarNumero(p.imoveis)) },
  { chave: "fotos", label: "Fotos por anúncio", descricao: "Quantidade de imagens que podem ser publicadas em cada anúncio", valor: (p) => (p.fotos >= 99999 ? "Ilimitadas" : formatarNumero(p.fotos)) },
  { chave: "destaques", label: "Destaques", descricao: "Anúncios em destaque aparecem nas primeiras posições da lista de imóveis", valor: (p) => (p.destaques > 0 ? formatarNumero(p.destaques) : false) },
  { chave: "pagina_imobiliaria", label: "Página de imobiliárias", descricao: "Apareça na página das imobiliárias e corretores", valor: (p) => p.pagina_imobiliaria },
  { chave: "encomenda", label: "Encomendas de imóveis", descricao: "Receba encomendas de imóveis diretamente no seu e-mail", valor: (p) => p.encomenda },
  { chave: "hotsite", label: "Hotsite", descricao: "Tenha um site somente com os seus imóveis dentro do portal", valor: (p) => p.hotsite },
];

export function precoPlano(p: Plano) {
  if (p.preco_mensal === null) return { principal: "Sob consulta", sufixo: "" };
  if (p.preco_mensal === 0) return { principal: "Grátis", sufixo: "" };
  return { principal: formatarMoeda(p.preco_mensal), sufixo: "/mês" };
}

export const DESCRICOES_PLANO: Record<string, string> = {
  gratis: "Para o proprietário que quer anunciar um único imóvel.",
  bronze: "Sua porta de entrada no mercado imobiliário.",
  prata: "Para uma divulgação mais expressiva.",
  ouro: "O melhor custo-benefício. Um posicionamento profissional.",
  max: "Para grandes carteiras e integração automática via XML.",
};

export const NOTA_PLANOS = "Contrato mensal com renovação automática, sem fidelidade. Valores sujeitos a alteração sem aviso prévio.";
