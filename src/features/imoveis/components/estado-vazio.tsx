import Link from "next/link";
import { SearchX } from "lucide-react";
import type { BuscaFiltros, Objetivo, PesquisaPopular } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { OBJETIVOS, linkBusca } from "@/lib/busca/filtros";

interface Props {
  filtros: BuscaFiltros;
  contadores?: Record<Objetivo, number>;
  sugestoes?: PesquisaPopular[];
  base?: string;
  titulo?: string;
  descricao?: string;
}

/** Nenhum resultado: sugere relaxar filtros ou trocar de objetivo. */
export function EstadoVazio({ filtros, contadores, sugestoes = [], base = "/imoveis", titulo = "Nenhum imóvel encontrado", descricao }: Props) {
  const alternativas: Array<{ label: string; href: string }> = [];
  if (filtros.bairro) alternativas.push({ label: "Buscar em toda a cidade", href: linkBusca({ ...filtros, bairro: undefined, pagina: 1 }, base) });
  if (filtros.tipo) alternativas.push({ label: "Todos os tipos de imóvel", href: linkBusca({ ...filtros, tipo: undefined, pagina: 1 }, base) });
  if (filtros.valor_min || filtros.valor_max) alternativas.push({ label: "Qualquer faixa de preço", href: linkBusca({ ...filtros, valor_min: undefined, valor_max: undefined, pagina: 1 }, base) });
  if (filtros.quartos?.length || filtros.vagas || filtros.condominio) {
    alternativas.push({ label: "Sem filtros de quartos, vagas e condomínio", href: linkBusca({ ...filtros, quartos: undefined, vagas: undefined, condominio: undefined, pagina: 1 }, base) });
  }
  if (filtros.codigo) alternativas.push({ label: "Ignorar o código", href: linkBusca({ ...filtros, codigo: undefined, pagina: 1 }, base) });
  for (const o of OBJETIVOS) {
    if (o.valor !== filtros.objetivo && (contadores?.[o.valor] ?? 0) > 0) {
      alternativas.push({ label: `Ver imóveis ${o.labelTitulo} (${contadores![o.valor]})`, href: linkBusca({ ...filtros, objetivo: o.valor, valor_min: undefined, valor_max: undefined, pagina: 1 }, base) });
    }
  }

  return (
    <div className="card-elevated flex flex-col items-center gap-5 px-6 py-12 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-brand-soft text-brand">
        <SearchX className="size-8" aria-hidden />
      </span>
      <div className="max-w-md">
        <h2 className="font-heading text-xl font-semibold">{titulo}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{descricao ?? "Não há imóveis com essa combinação de filtros. Experimente ampliar a busca com uma das sugestões abaixo."}</p>
      </div>
      {alternativas.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {alternativas.map((a) => (
            <Button key={a.href} asChild variant="outline" size="sm">
              <Link href={a.href}>{a.label}</Link>
            </Button>
          ))}
        </div>
      )}
      {sugestoes.length > 0 && (
        <div className="w-full max-w-2xl border-t pt-5">
          <p className="mb-3 text-sm font-medium">Buscas mais procuradas</p>
          <div className="flex flex-wrap justify-center gap-2">
            {sugestoes.slice(0, 8).map((s) => (
              <Link key={s.href} href={s.href} className="rounded-full bg-muted px-3 py-1.5 text-xs text-foreground/80 transition-colors hover:bg-brand-soft hover:text-brand">
                {s.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
