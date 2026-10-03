/** PRNG determinístico (mulberry32) para gerar mocks estáveis entre reloads. */
export function criarRandom(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min,
    pick: <T>(arr: readonly T[]): T => arr[Math.floor(next() * arr.length)]!,
    chance: (p: number) => next() < p,
    sample: <T>(arr: readonly T[], n: number): T[] => {
      const copia = [...arr];
      const out: T[] = [];
      while (out.length < n && copia.length) {
        out.push(copia.splice(Math.floor(next() * copia.length), 1)[0]!);
      }
      return out;
    },
    shuffle: <T>(arr: readonly T[]): T[] => {
      const copia = [...arr];
      for (let i = copia.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [copia[i], copia[j]] = [copia[j]!, copia[i]!];
      }
      return copia;
    },
  };
}

export type Random = ReturnType<typeof criarRandom>;

export function uuidFake(prefixo: string, n: number) {
  const hex = n.toString(16).padStart(12, "0");
  const p = prefixo.padEnd(8, "0").slice(0, 8);
  return `${p}-0000-4000-8000-${hex}`;
}

export function dataAtras(dias: number, base = new Date("2026-10-03T12:00:00-03:00")) {
  const d = new Date(base);
  d.setDate(d.getDate() - dias);
  return d.toISOString();
}

export function fotoUrl(seed: string, w = 1200, h = 800) {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}
