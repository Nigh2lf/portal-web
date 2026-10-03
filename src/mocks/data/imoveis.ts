import type { Imovel, ImovelFoto, ImovelTaxa, TipoAnuncio } from "@/lib/api/types";
import { slugify } from "@/lib/utils/format";
import { criarRandom, dataAtras, fotoUrl, uuidFake } from "../random";
import { ANUNCIANTES } from "./anunciantes";
import { BAIRROS, CIDADES } from "./localidades";
import { PLANOS } from "./planos";
import { PORTAIS } from "./portais";
import { INFRAESTRUTURAS, TIPOS, TIPOS_RESIDENCIAIS, TIPOS_TERRENO } from "./tipos";

const rnd = criarRandom(20261003);

const pesosTipo: Array<[string, number]> = [
  ["Casa", 30], ["Apartamento", 28], ["Terreno Residencial", 8], ["Fazenda/Sítio", 7], ["Cobertura", 4],
  ["Chácara", 4], ["Sala", 4], ["Loja", 3], ["Imóvel Comercial", 3], ["Kitnet/Conjugado", 2], ["Studio", 2],
  ["Flat", 1], ["Galpão", 1], ["Área", 1], ["Terreno Comercial", 1], ["Pousada", 0.5], ["Hotel", 0.3], ["Haras", 0.3], ["Sobrelojas", 0.5],
];

function sortearTipo() {
  const total = pesosTipo.reduce((s, [, p]) => s + p, 0);
  let r = rnd.next() * total;
  for (const [nome, p] of pesosTipo) {
    r -= p;
    if (r <= 0) return TIPOS.find((t) => t.nome === nome)!;
  }
  return TIPOS[2]!;
}

const aberturas = [
  "Excelente oportunidade", "Imóvel impecável", "Localização privilegiada", "Ótimo para morar ou investir",
  "Raridade no bairro", "Pronto para morar", "Imóvel amplo e arejado", "Charme de serra com conforto urbano",
];
const detalhes = [
  "Sala ampla com lareira, cozinha planejada e área de serviço independente.",
  "Varanda com vista para as montanhas e muito sol da manhã.",
  "Condomínio com portaria 24h, área verde e segurança.",
  "Acabamento de primeira, piso em porcelanato e esquadrias de alumínio.",
  "Terreno plano, murado, com água de nascente e acesso asfaltado.",
  "Próximo a comércio, escolas, farmácias e ponto de ônibus.",
  "Garagem coberta e espaço para hortas e animais.",
  "Documentação em dia, aceita financiamento bancário.",
  "Reformado recentemente, com hidráulica e elétrica novas.",
  "Ideal para quem busca tranquilidade sem abrir mão da praticidade.",
];
const fechamentos = [
  "Agende sua visita e surpreenda-se.", "Entre em contato para mais informações.",
  "Aceita propostas. Fale com o anunciante.", "Não perca essa chance, agende uma visita hoje mesmo.",
];

function descricao(tipo: string, bairro: string, cidade: string) {
  const partes = [
    `${rnd.pick(aberturas)}: ${tipo.toLowerCase()} em ${bairro}, ${cidade}.`,
    ...rnd.sample(detalhes, rnd.int(2, 4)),
    rnd.pick(fechamentos),
  ];
  return `<p>${partes.slice(0, 2).join(" ")}</p><p>${partes.slice(2).join(" ")}</p>`;
}

function arred(valor: number, passo: number) {
  return Math.round(valor / passo) * passo;
}

function precos(tipo: string, area: number, cidadeId: string) {
  const fatorCidade = cidadeId === "10" || cidadeId === "11" ? 1.6 : cidadeId === "1" ? 1.15 : 0.9;
  const base = TIPOS_TERRENO.includes(tipo) ? area * 350 : area * 5200;
  const venda = arred(base * fatorCidade * (0.75 + rnd.next() * 0.7), 10000);
  const temVenda = rnd.chance(0.72);
  const temLocacao = rnd.chance(temVenda ? 0.12 : 0.9) && !TIPOS_TERRENO.includes(tipo);
  const temTemporada = !temLocacao && rnd.chance(0.08) && ["Casa", "Fazenda/Sítio", "Chácara", "Apartamento", "Flat"].includes(tipo);
  return {
    preco_venda: temVenda ? Math.max(venda, 60000) : null,
    preco_locacao: temLocacao ? arred(Math.max(venda * 0.0042, 700), 50) : null,
    preco_temporada: temTemporada ? arred(Math.max(venda * 0.0012, 300), 50) : null,
  };
}

function fotos(seed: string, qtd: number): ImovelFoto[] {
  return Array.from({ length: qtd }, (_, i) => ({
    id: `${seed}-f${i + 1}`,
    url: fotoUrl(`${seed}-${i + 1}`, 1200, 800),
    mini_url: fotoUrl(`${seed}-${i + 1}`, 480, 320),
    ordem: i + 1,
    principal: i === 0,
  }));
}

function qtdPorPlano(planoId: string) {
  switch (planoId) {
    case "1": return 1;
    case "3": return rnd.int(4, 8);
    case "4": return rnd.int(8, 14);
    case "5": return rnd.int(10, 16);
    default: return rnd.int(14, 20);
  }
}

export function gerarImoveis(): Imovel[] {
  const lista: Imovel[] = [];
  let n = 0;
  for (const anunciante of ANUNCIANTES) {
    const plano = PLANOS.find((p) => p.id === anunciante.plano_id)!;
    const portal = PORTAIS.find((p) => p.id === anunciante.portal_id)!;
    const qtd = qtdPorPlano(plano.id);
    let destaquesRestantes = plano.destaques;

    for (let k = 0; k < qtd; k++) {
      n++;
      const tipo = sortearTipo();
      const cidadeId = rnd.chance(0.78) ? portal.cidade_principal_id : rnd.pick(portal.cidades_ids);
      const cidade = CIDADES.find((c) => c.id === cidadeId)!;
      const bairro = rnd.pick(BAIRROS.filter((b) => b.cidade_id === cidadeId));
      const residencial = TIPOS_RESIDENCIAIS.includes(tipo.nome);
      const terreno = TIPOS_TERRENO.includes(tipo.nome);
      const quartos = residencial ? (tipo.nome === "Kitnet/Conjugado" || tipo.nome === "Studio" ? 1 : rnd.int(1, 5)) : 0;
      const suites = residencial ? Math.min(quartos, rnd.int(0, 2)) : 0;
      const banheiros = residencial ? Math.max(1, suites + rnd.int(0, 2)) : terreno ? 0 : rnd.int(1, 2);
      const vagas = terreno ? 0 : rnd.int(0, residencial ? 4 : 2);
      const areaConstruida = terreno ? null : residencial ? rnd.int(35, 450) : rnd.int(25, 600);
      const areaTotal = terreno ? rnd.int(300, 20000) : ["Casa", "Fazenda/Sítio", "Chácara", "Haras", "Pousada"].includes(tipo.nome) ? rnd.int(200, 30000) : areaConstruida;
      const p = precos(tipo.nome, areaConstruida ?? areaTotal ?? 100, cidadeId);
      if (!p.preco_venda && !p.preco_locacao && !p.preco_temporada) p.preco_venda = 250000;
      const dentroCondominio = rnd.chance(residencial ? 0.45 : 0.15);
      const tipo_anuncio: TipoAnuncio = destaquesRestantes > 0 && rnd.chance(0.35) ? (destaquesRestantes--, rnd.chance(0.2) ? "superdestaque" : "destaque") : "normal";
      const taxas: ImovelTaxa[] = [];
      if (rnd.chance(0.7)) taxas.push({ descricao: "IPTU", valor: arred((p.preco_venda ?? 300000) * 0.0008, 10), observacao: "anual" });
      if (dentroCondominio) taxas.push({ descricao: "Condomínio", valor: arred(rnd.int(250, 1800), 10), observacao: "mensal" });
      const objetivoTitulo = p.preco_venda ? "à venda" : p.preco_locacao ? "para alugar" : "para temporada";
      const titulo = `${tipo.nome} ${objetivoTitulo} em ${bairro.nome}, ${cidade.nome} - ${cidade.uf}`;
      const codigo = `${anunciante.nome.replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase()}${String(1000 + n)}`;
      const dias = rnd.int(0, 240);
      const seed = `imv-${n}`;

      lista.push({
        id: uuidFake("imovel", n),
        codigo,
        slug: `${slugify(titulo)}-${codigo.toLowerCase()}`,
        titulo,
        anunciante_id: anunciante.id,
        portal_id: portal.id,
        ativo: rnd.chance(0.95),
        tipo_anuncio,
        status: rnd.chance(0.94) ? "publicado" : "rascunho",
        tipo_id: tipo.id,
        tipo_nome: tipo.nome,
        cidade_id: cidade.id,
        cidade_nome: cidade.nome,
        bairro_id: bairro.id,
        bairro_nome: bairro.nome,
        uf: cidade.uf,
        quartos,
        suites,
        banheiros,
        vagas,
        area_construida: areaConstruida,
        area_total: areaTotal,
        descricao: descricao(tipo.nome, bairro.nome, cidade.nome),
        infraestrutura: terreno ? [] : rnd.sample(INFRAESTRUTURAS.filter((i) => i.escopo === "imovel").map((i) => i.nome), rnd.int(2, 8)),
        infra_condominio: dentroCondominio ? rnd.sample(INFRAESTRUTURAS.filter((i) => i.escopo === "condominio").map((i) => i.nome), rnd.int(2, 6)) : [],
        dentro_condominio: dentroCondominio,
        taxas,
        ...p,
        fotos: fotos(seed, rnd.chance(0.08) ? 0 : rnd.int(3, Math.min(plano.fotos, 12))),
        foto_principal_url: null,
        visualizacoes: rnd.int(5, 900),
        criado_em: dataAtras(dias + rnd.int(0, 60)),
        atualizado_em: dataAtras(dias),
      });
      const ultimo = lista[lista.length - 1]!;
      ultimo.foto_principal_url = ultimo.fotos[0]?.mini_url ?? null;
    }
  }
  return lista;
}
