import type { Anunciante } from "@/lib/api/types";
import { slugify } from "@/lib/utils/format";
import { dataAtras, uuidFake } from "../random";
import { PORTAIS } from "./portais";

type Semente = {
  nome: string;
  tipo: Anunciante["tipo"];
  creci?: string;
  plano: string;
  portal: number;
  hotsite?: boolean;
  xml?: boolean;
};

const sementes: Semente[] = [
  { nome: "Tim Imóveis", tipo: "imobiliaria", creci: "6292-0", plano: "5", portal: 1, hotsite: true, xml: true },
  { nome: "Iga Imóveis", tipo: "imobiliaria", creci: "J-380", plano: "4", portal: 1, hotsite: true },
  { nome: "Itaipava Imobiliária", tipo: "imobiliaria", creci: "J-7692", plano: "5", portal: 1, hotsite: true, xml: true },
  { nome: "RS Patrimônio Imóveis", tipo: "imobiliaria", creci: "J-5137/0", plano: "4", portal: 1, hotsite: true },
  { nome: "Aica Imóveis", tipo: "imobiliaria", creci: "J-1872 RJ", plano: "3", portal: 1 },
  { nome: "Imperial Administradora", tipo: "imobiliaria", creci: "J-4448", plano: "6", portal: 1, hotsite: true, xml: true },
  { nome: "Sandri Imóveis", tipo: "imobiliaria", creci: "12833 J", plano: "4", portal: 1, hotsite: true },
  { nome: "Oliveira Imóveis Itaipava", tipo: "imobiliaria", creci: "J-42064", plano: "3", portal: 1 },
  { nome: "D'Angelo Imóveis", tipo: "imobiliaria", creci: "34693", plano: "4", portal: 1, hotsite: true },
  { nome: "Indalécio Vilas Imóveis", tipo: "imobiliaria", creci: "16801", plano: "5", portal: 1, hotsite: true },
  { nome: "Admoby - Imobiliária Digital", tipo: "imobiliaria", creci: "J-7405", plano: "4", portal: 1, hotsite: true, xml: true },
  { nome: "Rocha Santos Imóveis", tipo: "imobiliaria", creci: "022.375/RJ", plano: "3", portal: 1 },
  { nome: "Gelli Consultoria", tipo: "imobiliaria", creci: "J-5120", plano: "4", portal: 1, hotsite: true },
  { nome: "Corretora Claudia Maria", tipo: "corretor", creci: "33.254", plano: "3", portal: 1 },
  { nome: "Morar Itaipava", tipo: "corretor", creci: "17787", plano: "4", portal: 1, hotsite: true },
  { nome: "Elas Corretoras Associadas", tipo: "corretor", creci: "J-7081", plano: "3", portal: 1 },
  { nome: "Felipe Machado Imóveis", tipo: "corretor", creci: "071023", plano: "3", portal: 1 },
  { nome: "Natália Warwar", tipo: "corretor", creci: "67757", plano: "3", portal: 1 },
  { nome: "Alexandre Sorsonas", tipo: "corretor", creci: "41120", plano: "3", portal: 1 },
  { nome: "Marcos Pereira", tipo: "proprietario", plano: "1", portal: 1 },
  { nome: "Ana Lúcia Ferreira", tipo: "proprietario", plano: "1", portal: 1 },
  { nome: "Serrana Imóveis Teresópolis", tipo: "imobiliaria", creci: "J-3310", plano: "4", portal: 2, hotsite: true },
  { nome: "Alto Imóveis", tipo: "imobiliaria", creci: "J-2208", plano: "3", portal: 2 },
  { nome: "Carla Mendes Corretora", tipo: "corretor", creci: "51234", plano: "3", portal: 2 },
  { nome: "JF Prime Imóveis", tipo: "imobiliaria", creci: "J-MG 4410", plano: "4", portal: 3, hotsite: true },
  { nome: "Granbery Imobiliária", tipo: "imobiliaria", creci: "J-MG 2201", plano: "3", portal: 3 },
  { nome: "Friburgo Casas", tipo: "imobiliaria", creci: "J-6611", plano: "4", portal: 4, hotsite: true },
  { nome: "Lumiar Imóveis & Sítios", tipo: "corretor", creci: "45870", plano: "3", portal: 4 },
];

const dddPorPortal: Record<number, string> = { 1: "24", 2: "21", 3: "32", 4: "22" };

export const ANUNCIANTES: Anunciante[] = sementes.map((s, i) => {
  const n = i + 1;
  const slug = slugify(s.nome);
  const ddd = dddPorPortal[s.portal] ?? "24";
  const fixo = `${ddd}2${String(200 + n).padStart(3, "0")}${String(1000 + n * 7).slice(-4)}`;
  const cel = `${ddd}9${String(8000 + n * 13).slice(-4)}${String(1000 + n * 11).slice(-4)}`;
  const pessoaFisica = s.tipo !== "imobiliaria";
  return {
    id: uuidFake("anunc", n),
    slug,
    tipo: s.tipo,
    nome: s.nome,
    documento: pessoaFisica ? `${String(10000000000 + n * 987654).slice(0, 11)}` : `${String(10000000000000 + n * 123456789).slice(0, 14)}`,
    email: `contato@${slug.replace(/-/g, "")}.com.br`,
    telefone: fixo,
    telefone2: s.tipo === "proprietario" ? null : cel,
    whatsapp: cel,
    logo_url: s.tipo === "proprietario" ? null : `/logos/${slug}.svg`,
    creci: s.creci ?? null,
    contato: s.tipo === "imobiliaria" ? ["Roberto", "Fernanda", "Luciana", "Paulo", "Mariana"][n % 5]! : null,
    site: s.tipo === "proprietario" ? null : `https://www.${slug.replace(/-/g, "")}.com.br`,
    endereco:
      s.tipo === "proprietario"
        ? null
        : s.portal === 1
          ? ["Estr. União e Indústria, 11.000 - Itaipava", "Rua do Imperador, 288 - Centro", "Av. Koeler, 45 - Centro", "Rua Teresa, 1.500 - Alto da Serra", "Estr. Bernardo Coutinho, 8.900 - Araras"][n % 5]!
          : "Rua Principal, 100 - Centro",
    plano_id: s.plano,
    portal_id: PORTAIS[s.portal - 1]!.id,
    ativo: true,
    hotsite: Boolean(s.hotsite),
    pagina_imobiliaria: s.tipo !== "proprietario",
    recebe_encomenda: ["4", "5", "6"].includes(s.plano),
    url_xml: s.xml ? `https://www.${slug.replace(/-/g, "")}.com.br/integracao/portal.xml` : null,
    cadastrado_em: dataAtras(400 + n * 23),
  };
});

export function anunciantePorId(id: string) {
  return ANUNCIANTES.find((a) => a.id === id);
}
export function anunciantePorSlug(slug: string) {
  return ANUNCIANTES.find((a) => a.slug === slug);
}
