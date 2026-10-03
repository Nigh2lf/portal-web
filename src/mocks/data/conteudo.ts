import type { Dica, Post, Publicidade } from "@/lib/api/types";
import { slugify } from "@/lib/utils/format";
import { dataAtras, fotoUrl, uuidFake } from "../random";
import { PORTAIS } from "./portais";

const postsSemente: Array<{ titulo: string; resumo: string; autor: string; dias: number }> = [
  {
    titulo: "Como avaliar o preço de um imóvel na região serrana",
    resumo: "Entenda os fatores que mais pesam no valor de casas e apartamentos em Petrópolis, Teresópolis e Nova Friburgo.",
    autor: "Equipe Portal",
    dias: 6,
  },
  {
    titulo: "Documentos necessários para comprar um imóvel",
    resumo: "Checklist completo do que o comprador e o vendedor precisam apresentar para fechar negócio com segurança.",
    autor: "Equipe Portal",
    dias: 19,
  },
  {
    titulo: "Itaipava ou Centro: onde morar em Petrópolis?",
    resumo: "Comparamos custo de vida, mobilidade, lazer e oferta de imóveis nos dois bairros mais procurados.",
    autor: "Redação",
    dias: 33,
  },
  {
    titulo: "Aluguel de temporada: o que o proprietário precisa saber",
    resumo: "Regras, impostos, contratos e dicas para anunciar bem um imóvel de temporada na serra.",
    autor: "Redação",
    dias: 47,
  },
  {
    titulo: "Financiamento imobiliário em 2026: taxas e simulações",
    resumo: "Panorama das principais linhas de crédito e como escolher a melhor para o seu perfil.",
    autor: "Equipe Portal",
    dias: 61,
  },
  {
    titulo: "5 erros comuns ao fotografar um imóvel para anúncio",
    resumo: "Fotos ruins afastam compradores. Veja o que evitar e como valorizar cada ambiente.",
    autor: "Redação",
    dias: 80,
  },
  {
    titulo: "Sítios e chácaras: cuidados antes de comprar",
    resumo: "Água, acesso, documentação rural e regularização ambiental: tudo o que verificar.",
    autor: "Equipe Portal",
    dias: 95,
  },
  {
    titulo: "Como funciona a integração XML com o portal",
    resumo: "Imobiliárias podem enviar seus anúncios automaticamente. Explicamos o passo a passo.",
    autor: "Equipe Portal",
    dias: 120,
  },
];

const corpo = (titulo: string, resumo: string) => `
<p>${resumo}</p>
<h2>Por que isso importa</h2>
<p>Comprar, vender ou alugar um imóvel é uma das decisões financeiras mais importantes da vida. Neste artigo reunimos orientações práticas para você tomar essa decisão com mais segurança.</p>
<h3>1. Pesquise a região</h3>
<p>Visite o bairro em horários diferentes, converse com moradores e verifique a oferta de comércio, transporte e serviços.</p>
<h3>2. Compare anúncios semelhantes</h3>
<p>Use a busca do portal para comparar imóveis do mesmo tipo, na mesma faixa de preço e bairro. Fique atento à área, ao estado de conservação e às taxas.</p>
<h3>3. Conte com um profissional</h3>
<p>Corretores e imobiliárias com CRECI ativo conhecem o mercado local e podem evitar dores de cabeça com documentação.</p>
<h2>Conclusão</h2>
<p><strong>${titulo}</strong> é um tema que merece atenção. Continue acompanhando o blog para mais conteúdo sobre o mercado imobiliário da região.</p>
`;

export const POSTS: Post[] = postsSemente.map((p, i) => ({
  id: uuidFake("post", i + 1),
  slug: slugify(p.titulo),
  titulo: p.titulo,
  resumo: p.resumo,
  conteudo_html: corpo(p.titulo, p.resumo),
  autor: p.autor,
  imagem_url: fotoUrl(`blog-${i + 1}`, 1200, 630),
  publicado_em: dataAtras(p.dias),
}));

const dicasSemente: Array<[string, string]> = [
  ["Como anunciar bem o meu imóvel?", "<p>Capriche nas fotos (ambientes iluminados e organizados), escreva uma descrição completa com metragem, quartos, vagas e diferenciais, e mantenha o preço alinhado ao mercado. Anúncios com mais de 8 fotos recebem até 3 vezes mais contatos.</p>"],
  ["O que verificar antes de comprar?", "<p>Certidão de ônus reais atualizada, matrícula do imóvel, IPTU em dia, situação do condomínio e, em casas, a regularidade da construção junto à prefeitura.</p>"],
  ["Quais são os custos além do preço do imóvel?", "<p>ITBI (em geral 2% a 3%), escritura, registro no cartório, eventuais honorários de corretagem e, se houver financiamento, a avaliação do banco.</p>"],
  ["Como funciona o contrato de locação?", "<p>O contrato define prazo, valor, índice de reajuste, garantia (fiador, caução ou seguro-fiança) e responsabilidades. A Lei do Inquilinato (8.245/91) rege as relações entre as partes.</p>"],
  ["Posso negociar o preço anunciado?", "<p>Sim. Imóveis anunciados há mais tempo costumam ter maior margem. Use a ferramenta de comparação do portal para embasar sua proposta.</p>"],
  ["Como escolher entre casa e apartamento na serra?", "<p>Casas oferecem área externa e privacidade, mas exigem mais manutenção. Apartamentos trazem segurança e praticidade. Avalie seu estilo de vida e o custo do condomínio.</p>"],
  ["O que é o CRECI e por que ele importa?", "<p>É o registro profissional obrigatório de corretores e imobiliárias. Verifique a situação no site do CRECI-RJ antes de fechar negócio.</p>"],
  ["Como funciona a encomenda de imóveis?", "<p>Você informa o que procura e o portal encaminha o pedido às imobiliárias parceiras, que entram em contato com as opções disponíveis.</p>"],
  ["Imóvel de temporada: o que observar?", "<p>Confirme as regras do condomínio, a política de limpeza e o que está incluso (roupa de cama, internet, gás). Peça sempre um recibo ou contrato simples.</p>"],
  ["Como denunciar um anúncio irregular?", "<p>Use o formulário de contato informando o código do imóvel. Nossa equipe analisa e remove anúncios que violem os termos de uso.</p>"],
];

export const DICAS: Dica[] = dicasSemente.map(([titulo, descricao_html], i) => ({
  id: String(i + 1),
  titulo,
  descricao_html,
  ativo: true,
}));

export const PUBLICIDADES: Publicidade[] = PORTAIS.flatMap((portal, i) => [
  {
    id: uuidFake("pub", i * 10 + 1),
    portal_id: portal.id,
    nome: "Feirão de Imóveis da Serra",
    imagem_url: fotoUrl(`pub-popup-${portal.slug}`, 800, 400),
    link: "/planos",
    nova_aba: false,
    categoria: "popup_home" as const,
    inicio: dataAtras(10),
    fim: dataAtras(-60),
    ativo: true,
  },
  {
    id: uuidFake("pub", i * 10 + 2),
    portal_id: portal.id,
    nome: "Anuncie seu imóvel no portal",
    imagem_url: fotoUrl(`pub-home-${portal.slug}`, 1140, 120),
    link: "/anunciar",
    nova_aba: false,
    categoria: "banner_home" as const,
    inicio: dataAtras(10),
    fim: dataAtras(-60),
    ativo: true,
  },
  {
    id: uuidFake("pub", i * 10 + 3),
    portal_id: portal.id,
    nome: "Crédito imobiliário",
    imagem_url: fotoUrl(`pub-lista-${portal.slug}`, 1140, 120),
    link: "https://example.com/credito",
    nova_aba: true,
    categoria: "banner_lista" as const,
    inicio: dataAtras(10),
    fim: dataAtras(-60),
    ativo: true,
  },
]);
