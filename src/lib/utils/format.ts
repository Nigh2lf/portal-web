const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const brlCents = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

const numero = new Intl.NumberFormat("pt-BR");

export function formatarMoeda(valor: number | null | undefined, comCentavos = false) {
  if (valor === null || valor === undefined) return "Sob consulta";
  return comCentavos ? brlCents.format(valor) : brl.format(valor);
}

export function formatarNumero(valor: number | null | undefined) {
  if (valor === null || valor === undefined) return "--";
  return numero.format(valor);
}

export function formatarArea(valor: number | null | undefined) {
  if (!valor) return "--";
  return `${numero.format(valor)} m²`;
}

export function formatarData(iso: string, opcoes: Intl.DateTimeFormatOptions = {}) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
    ...opcoes,
  }).format(new Date(iso));
}

export function formatarDataLonga(iso: string) {
  return formatarData(iso, { day: "numeric", month: "long", year: "numeric" });
}

export function formatarMesAno(anoMes: string) {
  const [ano, mes] = anoMes.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(
    new Date(ano, mes - 1, 1),
  );
}

export function formatarTelefone(valor: string | null | undefined) {
  if (!valor) return "";
  const d = valor.replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return valor;
}

export function ocultarTelefone(valor: string | null | undefined) {
  const f = formatarTelefone(valor);
  return f ? f.replace(/\d(?=\d{0,3}$)/g, "•") : "";
}

export function formatarDocumento(valor: string) {
  const d = valor.replace(/\D/g, "");
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  return valor;
}

export function slugify(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function truncar(texto: string, max = 160) {
  const limpo = texto.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  if (limpo.length <= max) return limpo;
  return `${limpo.slice(0, max).replace(/\s+\S*$/, "")}…`;
}

export function plural(n: number, singular: string, pluralForm?: string) {
  return n === 1 ? singular : pluralForm ?? `${singular}s`;
}

export function iniciais(nome: string) {
  return nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

export function linkWhatsApp(numero: string, texto: string) {
  const d = numero.replace(/\D/g, "");
  const comPais = d.startsWith("55") ? d : `55${d}`;
  return `https://api.whatsapp.com/send?phone=${comPais}&text=${encodeURIComponent(texto)}`;
}
