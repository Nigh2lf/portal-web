/**
 * Redirects 301 das URLs do portal legado (`.htaccess`) para as rotas novas.
 * Slugs eram decorativos no legado: o que vale são os ids numéricos, que a API
 * mapeia por `legacy_id`. Aqui tratamos só o que dá para resolver no edge.
 */

export const REDIRECTS_LEGADO: Array<{ de: RegExp; para: (m: RegExpMatchArray) => string }> = [
  { de: /^\/principal\/?$/i, para: () => "/" },
  { de: /^\/index\.php$/i, para: () => "/" },
  { de: /^\/busca-de-imoveis\/?$/i, para: () => "/imoveis" },
  { de: /^\/lista-de-imoveis\/?$/i, para: () => "/favoritos" },
  { de: /^\/quem-somos\/?$/i, para: () => "/quem-somos" },
  { de: /^\/dicas\/?$/i, para: () => "/dicas" },
  { de: /^\/contato(-envio)?\/?$/i, para: () => "/contato" },
  { de: /^\/documentacao\/?$/i, para: () => "/integracao-xml" },
  { de: /^\/padrao-informacoes-do-xml\/?$/i, para: () => "/integracao-xml#valores-aceitos" },
  { de: /^\/imobiliarias-(em|na)-[a-z-]+\/?$/i, para: () => "/imobiliarias" },
  { de: /^\/imobiliaria\/([a-z0-9-]+)\/(\d+)\/?/i, para: (m) => `/imobiliarias/${m[1]}` },
  { de: /^\/anunciar\/?$/i, para: () => "/anunciar" },
  { de: /^\/painel\/?$/i, para: () => "/painel" },
  { de: /^\/cadastro-altera\/?$/i, para: () => "/painel/perfil" },
  { de: /^\/alterar-senha\/?$/i, para: () => "/painel/senha" },
  { de: /^\/ofertas-recebidas\/?$/i, para: () => "/painel/ofertas" },
  { de: /^\/meus-imoveis(\/.*)?$/i, para: () => "/painel/imoveis" },
  { de: /^\/imoveis-fotos\/(\d+)\/?$/i, para: (m) => `/painel/imoveis/legado-${m[1]}/fotos` },
  { de: /^\/incluir-imovel\/?$/i, para: () => "/painel/imoveis/novo" },
  { de: /^\/imovel-altera\/(\d+)\/(\d+)\/.*$/i, para: (m) => `/painel/imoveis/legado-${m[2]}/editar` },
  { de: /^\/planos\/?$/i, para: () => "/planos" },
  { de: /^\/recuperar-senha\/?$/i, para: () => "/recuperar-senha" },
  { de: /^\/cadastre-se\/?$/i, para: () => "/cadastro" },
  { de: /^\/blog(-posts)?\/?$/i, para: () => "/blog" },
  { de: /^\/blog-post-detalhe\/(\d+)\/([a-z0-9-]+)\/?$/i, para: (m) => `/blog/${m[2]}` },
  { de: /^\/encomenda-de-imoveis\/?$/i, para: () => "/encomendar" },
  { de: /^\/encomenda-de-imoveis-parceiro\/?$/i, para: () => "/encomendar/parceiro" },
  { de: /^\/mapa-do-site\/?$/i, para: () => "/mapa-do-site" },
  { de: /^\/estatistica-imobiliaria\/.*$/i, para: () => "/painel/estatisticas" },
  { de: /^\/relatorio-importacao\/.*$/i, para: () => "/painel/importacao" },
  { de: /^\/busca-de-imoveis\/(\d+)\/(\d+)\/([a-z0-9-]+)\/?$/i, para: (m) => `/imovel/legado-${m[2]}` },
  { de: /^\/busca-de-imoveis\/[a-z0-9-]+\/(\d)\/[a-z0-9-]+\/(\d+)\/?$/i, para: (m) => `/imoveis?objetivo=${objetivoLegado(m[1]!)}&pagina=${m[2]}` },
  { de: /^\/imovel\/[a-z0-9-]+\/(\d+)\/(\d+)\/?$/i, para: (m) => `/imoveis?objetivo=${objetivoLegado(m[1]!)}&tipo_id=${m[2]}` },
  { de: /^\/imovel\/[a-z0-9-]+\/(\d+)\/(\d+)\/(\d+)\/(\d+)\/?$/i, para: (m) => `/imoveis?objetivo=${objetivoLegado(m[1]!)}&tipo_id=${m[2]}&cidade_id=${m[3]}&bairro_id=${m[4]}` },
  { de: /^\/busca-de-imoveis-bairro\/(\d+)\/(\d+)\/[a-z0-9-]+\/?$/i, para: (m) => `/imoveis?cidade_id=${m[2]}&bairro_id=${m[1]}` },
  { de: /^\/mais-procurados\/(\d+)\/(\d+)\/(\d+)\/(\d+)\/.*$/i, para: (m) => `/imoveis?objetivo=${objetivoLegado(m[3]!)}&tipo_id=${m[4]}&cidade_id=${m[2]}&bairro_id=${m[1]}` },
  { de: /^\/objetivo\/(\d+)\/.*$/i, para: (m) => `/imoveis?objetivo=${objetivoLegado(m[1]!)}` },
  { de: /^\/tipo-do-imovel\/(\d+)\/.*$/i, para: (m) => `/imoveis?tipo_id=${m[1]}` },
  { de: /^\/cidade\/[a-z0-9-]+\/(\d+)\/?$/i, para: (m) => `/imoveis?cidade_id=${m[1]}` },
  { de: /^\/cidade\/(\d+)\/[a-z0-9-]+\/?$/i, para: (m) => `/imoveis?cidade_id=${m[1]}` },
  { de: /^\/bairro\/(\d+)\/.*$/i, para: (m) => `/imoveis?bairro_id=${m[1]}` },
  { de: /^\/sair\/?$/i, para: () => "/api/auth/logout" },
  { de: /^\/mobile(\/.*)?$/i, para: (m) => m[1] ?? "/" },
  { de: /^\/landing2?\/?$/i, para: () => "/anunciar" },
  { de: /^\/[A-Za-z]+\.php$/, para: () => "/" },
];

function objetivoLegado(id: string) {
  return id === "2" ? "alugar" : id === "3" ? "temporada" : "comprar";
}

export function resolverRedirectLegado(pathname: string): string | null {
  const atual = pathname.replace(/\/+$/, "") || "/";
  for (const r of REDIRECTS_LEGADO) {
    const m = pathname.match(r.de);
    if (!m) continue;
    const destino = r.para(m);
    const destinoPath = destino.split(/[?#]/)[0]!.replace(/\/+$/, "") || "/";
    return destinoPath === atual ? null : destino;
  }
  return null;
}
