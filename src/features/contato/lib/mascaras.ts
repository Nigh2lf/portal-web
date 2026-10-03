export const somenteDigitos = (valor: string) => valor.replace(/\D/g, "");

export function mascaraTelefone(valor: string) {
  const d = somenteDigitos(valor).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function mascaraCPF(valor: string) {
  const d = somenteDigitos(valor).slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function mascaraCNPJ(valor: string) {
  const d = somenteDigitos(valor).slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

/** "1500000" → "1.500.000" (sem centavos). */
export function mascaraMoeda(valor: string) {
  const d = somenteDigitos(valor).slice(0, 12);
  if (!d) return "";
  return Number(d).toLocaleString("pt-BR");
}

export function moedaParaNumero(valor: string | undefined | null): number | null {
  if (!valor) return null;
  const d = somenteDigitos(valor);
  if (!d) return null;
  const n = Number(d);
  return Number.isFinite(n) && n > 0 ? n : null;
}
