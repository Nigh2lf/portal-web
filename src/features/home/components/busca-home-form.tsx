"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Hash, LoaderCircle, Search } from "lucide-react";
import type { Bairro, BuscaFiltros, Cidade, ImovelTipo } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import {
  CONDOMINIO,
  ChipsQuartos,
  type EstadoBusca,
  FaixaPreco,
  SelectBairros,
  SelectCampo,
  SeletorObjetivo,
  estadoInicial,
  useBairros,
} from "@/features/imoveis/components/campos-busca";
import { linkBusca } from "@/lib/busca/filtros";

interface Props {
  tipos: ImovelTipo[];
  cidades: Cidade[];
  bairrosIniciais: Bairro[];
  exibirCidade: boolean;
  cidadePadraoSlug: string;
}

/** Formulário de busca do hero da home (paridade com `Pesquisa()` do legado). */
export function BuscaHomeForm({ tipos, cidades, bairrosIniciais, exibirCidade, cidadePadraoSlug }: Props) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [estado, setEstado] = useState<EstadoBusca>(() => estadoInicial({}));
  const cidadeEfetiva = exibirCidade ? estado.cidade : cidadePadraoSlug;
  const { bairros, carregando } = useBairros(cidadeEfetiva, bairrosIniciais);
  const set = (p: Partial<EstadoBusca>) => setEstado((e) => ({ ...e, ...p }));

  function buscar(e: React.FormEvent) {
    e.preventDefault();
    const final: Partial<BuscaFiltros> = { ...estado, pagina: 1 };
    if (final.bairros?.length && !final.cidade) final.cidade = cidadePadraoSlug;
    iniciar(() => router.push(linkBusca(final)));
  }

  return (
    <form onSubmit={buscar} className="card-elevated grid gap-4 p-4 sm:p-6" aria-label="Buscar imóveis">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SeletorObjetivo
          valor={estado.objetivo}
          onChange={(o) => set({ objetivo: o, valor_min: undefined, valor_max: undefined })}
        />
        <Link
          href="/imoveis"
          className="text-muted-foreground hover:text-brand flex items-center gap-1 text-sm"
        >
          <Hash className="size-3.5" aria-hidden />
          Buscar por código
        </Link>
      </div>

      <div
        className={exibirCidade ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-4" : "grid gap-3 sm:grid-cols-3"}
      >
        <SelectCampo
          id="h-tipo"
          label="Tipo de imóvel"
          valor={estado.tipo}
          onChange={(v) => set({ tipo: v })}
          opcoes={tipos.map((t) => ({ valor: t.slug, label: t.nome }))}
          placeholder="Todos os tipos"
        />
        {exibirCidade && (
          <SelectCampo
            id="h-cidade"
            label="Cidade"
            valor={estado.cidade}
            onChange={(v) => set({ cidade: v, bairros: [] })}
            opcoes={cidades.map((c) => ({ valor: c.slug, label: c.nome }))}
            placeholder="Todas as cidades"
          />
        )}
        <SelectBairros
          id="h-bairro"
          bairros={bairros}
          valor={estado.bairros ?? []}
          onChange={(v) => set({ bairros: v })}
          placeholder={cidadeEfetiva ? "Todos os bairros" : "Escolha a cidade"}
          carregando={carregando}
          desabilitado={!cidadeEfetiva}
        />
        <SelectCampo
          id="h-condominio"
          label="Condomínio"
          valor={estado.condominio}
          onChange={(v) => set({ condominio: v as EstadoBusca["condominio"] })}
          opcoes={CONDOMINIO}
          placeholder="Indiferente"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-end">
        <ChipsQuartos valor={estado.quartos} onChange={(q) => set({ quartos: q })} className="lg:w-56" />
        <FaixaPreco
          objetivo={estado.objetivo}
          maximo={10000000}
          valorMin={estado.valor_min}
          valorMax={estado.valor_max}
          onChange={(min, max) => set({ valor_min: min, valor_max: max })}
          className="lg:px-4"
        />
        <Button
          type="submit"
          size="lg"
          disabled={pendente}
          className="bg-cta text-cta-foreground hover:bg-cta/90 w-full lg:w-auto lg:px-8"
        >
          {pendente ? (
            <LoaderCircle data-icon="inline-start" className="animate-spin" />
          ) : (
            <Search data-icon="inline-start" />
          )}
          Buscar imóveis
        </Button>
      </div>
    </form>
  );
}
