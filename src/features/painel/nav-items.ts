import type { SessaoUsuario } from "@/lib/api/types";

export type IconeNavPainel = "resumo" | "cadastro" | "imoveis" | "ofertas" | "estatisticas" | "importacao" | "senha";

export interface ItemNavPainel {
  label: string;
  href: string;
  /** Chave resolvida para o ícone no client (componentes não atravessam a fronteira server → client). */
  icon: IconeNavPainel;
  /** Quando true, o item só fica ativo em correspondência exata do pathname. */
  exato?: boolean;
}

/**
 * Menu do painel. Regra herdada do legado (`Painel.php`): anunciantes com
 * carga automática (URL_XML) não editam cadastro nem imóveis pelo site.
 */
export function itensNavPainel(sessao: Pick<SessaoUsuario, "carga_automatica">): ItemNavPainel[] {
  const itens: ItemNavPainel[] = [{ label: "Resumo", href: "/painel", icon: "resumo", exato: true }];
  if (!sessao.carga_automatica) {
    itens.push({ label: "Meu cadastro", href: "/painel/perfil", icon: "cadastro" });
    itens.push({ label: "Meus imóveis", href: "/painel/imoveis", icon: "imoveis" });
  }
  itens.push({ label: "Ofertas recebidas", href: "/painel/ofertas", icon: "ofertas" });
  itens.push({ label: "Estatísticas", href: "/painel/estatisticas", icon: "estatisticas" });
  if (sessao.carga_automatica) itens.push({ label: "Importação XML", href: "/painel/importacao", icon: "importacao" });
  itens.push({ label: "Trocar senha", href: "/painel/senha", icon: "senha" });
  return itens;
}
