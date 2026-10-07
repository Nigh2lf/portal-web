"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { iniciarNavegacao } from "@/components/layout/navegacao-progresso";
import { Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Cidade, ImovelTipo } from "@/lib/api/types";
import type { FiltrosMeusImoveis } from "@/lib/api/repository";
import { OBJETIVO_LABEL, queryDe } from "../utils";

const TODOS = "__todos";

interface Props {
  filtros: FiltrosMeusImoveis;
  tipos: ImovelTipo[];
  cidades: Cidade[];
}

export function ImoveisFiltros({ filtros, tipos, cidades }: Props) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();

  function aplicar(mudancas: Partial<Record<"busca" | "objetivo" | "status" | "tipo" | "cidade", string | undefined>>) {
    const proximo = {
      busca: filtros.busca,
      objetivo: filtros.objetivo,
      status: filtros.status,
      tipo: filtros.tipo,
      cidade: filtros.cidade,
      ...mudancas,
    };
    iniciarNavegacao();
    iniciar(() => router.push(`/painel/imoveis${queryDe(proximo)}`));
  }

  const valorSelect = (v: string | undefined) => v ?? TODOS;
  const deSelect = (v: string) => (v === TODOS ? undefined : v);
  const temFiltro = Boolean(filtros.busca || filtros.objetivo || filtros.status || filtros.tipo || filtros.cidade);

  return (
    <form
      role="search"
      aria-label="Filtrar meus imóveis"
      onSubmit={(e) => {
        e.preventDefault();
        const busca = String(new FormData(e.currentTarget).get("busca") ?? "").trim();
        aplicar({ busca: busca || undefined });
      }}
      className="card-elevated grid gap-3 p-4 md:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))_auto] md:items-end"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="f-busca">Código ou título</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          {/* Não controlado: a chave reinicia o valor quando a URL muda. */}
          <Input key={filtros.busca ?? ""} id="f-busca" name="busca" defaultValue={filtros.busca ?? ""} placeholder="Ex.: AP-102" className="pl-8" maxLength={80} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="f-objetivo">Objetivo</Label>
        <Select value={valorSelect(filtros.objetivo)} onValueChange={(v) => aplicar({ objetivo: deSelect(v) })}>
          <SelectTrigger id="f-objetivo" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos</SelectItem>
            {(Object.keys(OBJETIVO_LABEL) as Array<keyof typeof OBJETIVO_LABEL>).map((o) => (
              <SelectItem key={o} value={o}>
                {OBJETIVO_LABEL[o]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="f-status">Status</Label>
        <Select value={valorSelect(filtros.status)} onValueChange={(v) => aplicar({ status: deSelect(v) })}>
          <SelectTrigger id="f-status" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos</SelectItem>
            <SelectItem value="ativo">Ativos</SelectItem>
            <SelectItem value="inativo">Inativos</SelectItem>
            <SelectItem value="rascunho">Rascunhos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="f-tipo">Tipo</Label>
        <Select value={valorSelect(filtros.tipo)} onValueChange={(v) => aplicar({ tipo: deSelect(v) })}>
          <SelectTrigger id="f-tipo" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos</SelectItem>
            {tipos.map((t) => (
              <SelectItem key={t.id} value={t.slug}>
                {t.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="f-cidade">Cidade</Label>
        <Select value={valorSelect(filtros.cidade)} onValueChange={(v) => aplicar({ cidade: deSelect(v) })}>
          <SelectTrigger id="f-cidade" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todas</SelectItem>
            {cidades.map((c) => (
              <SelectItem key={c.id} value={c.slug}>
                {c.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button type="submit" variant="secondary" size="sm" className="h-8" disabled={pendente}>
          {pendente ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <Search data-icon="inline-start" />}
          Filtrar
        </Button>
        {temFiltro && (
          <Button type="button" variant="ghost" size="icon-sm" className="h-8" aria-label="Limpar filtros" onClick={() => {
              iniciarNavegacao();
              iniciar(() => router.push("/painel/imoveis"));
            }}>
            <X />
          </Button>
        )}
      </div>
    </form>
  );
}
