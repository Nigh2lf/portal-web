"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eraser, Hash, LoaderCircle, Search, SlidersHorizontal } from "lucide-react";
import type { Bairro, BuscaFiltros, Cidade, ImovelTipo } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { iniciarNavegacao } from "@/components/layout/navegacao-progresso";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { linkBusca } from "@/lib/busca/filtros";
import { cn } from "@/lib/utils";
import {
  CONDOMINIO,
  ChipsQuartos,
  type EstadoBusca,
  FaixaPreco,
  SelectBairros,
  SelectCampo,
  SelectVagas,
  SeletorObjetivo,
  estadoInicial,
  totalFiltrosAtivos,
  useBairros,
} from "./campos-busca";

export interface FiltrosBuscaProps {
  filtros: BuscaFiltros;
  tipos: ImovelTipo[];
  cidades: Cidade[];
  /** Bairros da cidade atual (ou da cidade padrão quando o portal não exibe cidade). */
  bairros: Bairro[];
  valorMaximo: number;
  exibirCidade: boolean;
  cidadePadraoSlug: string;
  /** Rota base dos resultados. */
  base?: string;
  /** Hotsite: restringe bairros ao anunciante. */
  anuncianteId?: string;
  /** `lateral`: coluna fixa (lg+). `gaveta`: botão que abre um Sheet (mobile). */
  modo?: "lateral" | "gaveta";
  className?: string;
}

/**
 * Filtros da busca: coluna lateral em `lg+` e gaveta (Sheet) no mobile.
 * O estado local só existe até "Aplicar"; a URL é a fonte de verdade.
 */
export function FiltrosBusca({ modo = "lateral", className, ...props }: FiltrosBuscaProps) {
  const [aberto, setAberto] = useState(false);
  const ativos = totalFiltrosAtivos(estadoInicial(props.filtros));

  if (modo === "gaveta") {
    return (
      <Sheet open={aberto} onOpenChange={setAberto}>
        <SheetTrigger asChild>
          <Button variant="outline" className={cn("bg-card h-9", className)}>
            <SlidersHorizontal data-icon="inline-start" />
            Filtros
            {ativos > 0 && (
              <span className="bg-brand text-brand-foreground ml-1 rounded-full px-1.5 py-0.5 text-[11px] leading-none">
                {ativos}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[92vw] overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="text-brand">Filtrar imóveis</SheetTitle>
            <SheetDescription>Refine a busca e toque em aplicar.</SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-4">
            <FormularioFiltros {...props} prefixo="g" aoAplicar={() => setAberto(false)} />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside className={className} aria-label="Filtros da busca">
      <div className="card-elevated sticky top-24 p-5">
        <h2 className="font-heading mb-4 flex items-center gap-2 text-base font-semibold">
          <SlidersHorizontal className="text-brand size-4" aria-hidden />
          Filtrar imóveis
        </h2>
        <FormularioFiltros {...props} prefixo="l" />
      </div>
    </aside>
  );
}

function FormularioFiltros({
  filtros,
  tipos,
  cidades,
  bairros: bairrosIniciais,
  valorMaximo,
  exibirCidade,
  cidadePadraoSlug,
  base = "/imoveis",
  anuncianteId,
  aoAplicar,
  prefixo,
}: FiltrosBuscaProps & { aoAplicar?: () => void; prefixo: string }) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [estado, setEstado] = useState<EstadoBusca>(() =>
    estadoInicial({
      ...filtros,
      cidade: filtros.cidade ?? (filtros.bairros?.length ? cidadePadraoSlug : undefined),
    }),
  );
  const cidadeEfetiva = exibirCidade ? estado.cidade : (estado.cidade ?? cidadePadraoSlug);
  const { bairros, carregando } = useBairros(cidadeEfetiva, bairrosIniciais, anuncianteId);

  const set = (parcial: Partial<EstadoBusca>) => setEstado((e) => ({ ...e, ...parcial }));

  function aplicar(e?: React.FormEvent) {
    e?.preventDefault();
    const final: Partial<BuscaFiltros> = { ...estado, ordenacao: filtros.ordenacao, pagina: 1 };
    // Bairro sem cidade é ambíguo (ex.: "Centro"): fixa a cidade padrão do portal.
    if (final.bairros?.length && !final.cidade) final.cidade = cidadePadraoSlug;
    iniciarNavegacao();
    iniciar(() => {
      router.push(linkBusca(final, base));
      aoAplicar?.();
    });
  }

  function limpar() {
    setEstado(estadoInicial({ objetivo: estado.objetivo }));
    iniciarNavegacao();
    iniciar(() => {
      router.push(linkBusca({ objetivo: estado.objetivo }, base));
      aoAplicar?.();
    });
  }

  return (
    <form onSubmit={aplicar} className="grid gap-4">
      <SeletorObjetivo
        valor={estado.objetivo}
        onChange={(o) => set({ objetivo: o, valor_min: undefined, valor_max: undefined })}
        tamanho="sm"
        className="w-full"
      />

      <SelectCampo
        id={`${prefixo}-tipo`}
        label="Tipo de imóvel"
        valor={estado.tipo}
        onChange={(v) => set({ tipo: v })}
        opcoes={tipos.map((t) => ({ valor: t.slug, label: t.nome }))}
        placeholder="Todos os tipos"
      />

      {exibirCidade && (
        <SelectCampo
          id={`${prefixo}-cidade`}
          label="Cidade"
          valor={estado.cidade}
          onChange={(v) => set({ cidade: v, bairros: [] })}
          opcoes={cidades.map((c) => ({ valor: c.slug, label: c.nome }))}
          placeholder="Todas as cidades"
        />
      )}

      <SelectBairros
        id={`${prefixo}-bairro`}
        bairros={bairros}
        valor={estado.bairros ?? []}
        onChange={(v) => set({ bairros: v })}
        placeholder={cidadeEfetiva ? "Todos os bairros" : "Escolha a cidade"}
        carregando={carregando}
        desabilitado={!cidadeEfetiva}
        comEtiquetas
      />

      <SelectCampo
        id={`${prefixo}-condominio`}
        label="Condomínio"
        valor={estado.condominio}
        onChange={(v) => set({ condominio: v as EstadoBusca["condominio"] })}
        opcoes={CONDOMINIO}
        placeholder="Indiferente"
      />

      <ChipsQuartos valor={estado.quartos} onChange={(q) => set({ quartos: q })} />

      <SelectVagas id={`${prefixo}-vagas`} valor={estado.vagas} onChange={(v) => set({ vagas: v })} />

      <FaixaPreco
        objetivo={estado.objetivo}
        maximo={valorMaximo}
        valorMin={estado.valor_min}
        valorMax={estado.valor_max}
        onChange={(min, max) => set({ valor_min: min, valor_max: max })}
      />

      <div className="grid gap-1.5">
        <Label htmlFor={`${prefixo}-codigo`}>Código do imóvel</Label>
        <div className="relative">
          <Hash
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
            aria-hidden
          />
          <Input
            id={`${prefixo}-codigo`}
            value={estado.codigo ?? ""}
            onChange={(e) => set({ codigo: e.target.value || undefined })}
            placeholder="Ex.: PI1234"
            className="bg-card h-10 pl-8"
          />
        </div>
      </div>

      <div className="mt-1 grid gap-2">
        <Button
          type="submit"
          size="lg"
          disabled={pendente}
          className="bg-cta text-cta-foreground hover:bg-cta/90 w-full"
        >
          {pendente ? (
            <LoaderCircle data-icon="inline-start" className="animate-spin" />
          ) : (
            <Search data-icon="inline-start" />
          )}
          Aplicar filtros
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={limpar} disabled={pendente}>
          <Eraser data-icon="inline-start" />
          Limpar filtros
        </Button>
      </div>
    </form>
  );
}
