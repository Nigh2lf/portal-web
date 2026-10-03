"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ImageIcon, Loader2, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ImovelFoto } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { definirFotoPrincipalAction, removerFotoAction, removerTodasFotosAction, reordenarFotosAction } from "../actions";
import { EmptyState } from "./empty-state";
import { FotoImovel } from "./foto-imovel";

interface Props {
  imovelId: string;
  fotos: ImovelFoto[];
}

export function FotosGerenciador({ imovelId, fotos }: Props) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [ocupada, setOcupada] = useState<string | null>(null);
  const [confirmarTodas, setConfirmarTodas] = useState(false);
  const ordenadas = [...fotos].sort((a, b) => a.ordem - b.ordem);

  function executar(chave: string, fn: () => Promise<{ ok: boolean; mensagem?: string }>, silencioso = false) {
    setOcupada(chave);
    iniciar(async () => {
      const r = await fn();
      if (r.ok) {
        if (!silencioso) toast.success(r.mensagem);
      } else toast.error(r.mensagem ?? "Não foi possível concluir a ação.");
      router.refresh();
      setOcupada(null);
    });
  }

  function mover(idx: number, delta: -1 | 1) {
    const destino = idx + delta;
    if (destino < 0 || destino >= ordenadas.length) return;
    const ids = ordenadas.map((f) => f.id);
    [ids[idx], ids[destino]] = [ids[destino]!, ids[idx]!];
    executar(`mover-${ordenadas[idx]!.id}`, () => reordenarFotosAction(imovelId, ids), true);
  }

  if (ordenadas.length === 0) {
    return <EmptyState icon={ImageIcon} titulo="Este imóvel ainda não tem fotos" descricao="Anúncios com fotos recebem muito mais contatos. Use o envio abaixo para adicionar." />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">A foto marcada como principal é a capa do anúncio. Use as setas para definir a ordem na galeria.</p>
        <Button variant="destructive" size="sm" onClick={() => setConfirmarTodas(true)} disabled={pendente}>
          <Trash2 data-icon="inline-start" /> Remover todas
        </Button>
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" aria-label="Fotos do imóvel">
        {ordenadas.map((f, idx) => {
          const estaOcupada = ocupada?.endsWith(f.id) ?? false;
          return (
            <li key={f.id} className={cn("card-elevated group relative flex flex-col overflow-hidden", f.principal && "ring-2 ring-brand")}>
              <FotoImovel src={f.mini_url || f.url} alt={`Foto ${idx + 1}`} className="aspect-[4/3] w-full" sizes="(min-width:1024px) 240px, 45vw" prioridade={idx < 4} />
              <div className="absolute top-2 left-2 flex gap-1">
                <Badge variant="secondary" className="bg-background/90 tabular-nums">
                  {idx + 1}
                </Badge>
                {f.principal && (
                  <Badge className="bg-brand text-brand-foreground">
                    <Star className="fill-current" aria-hidden /> Principal
                  </Badge>
                )}
              </div>
              {estaOcupada && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                  <Loader2 className="size-6 animate-spin text-brand" aria-label="Processando" />
                </div>
              )}
              <div className="flex items-center justify-between gap-1 p-2">
                <div className="flex gap-0.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon-sm" onClick={() => mover(idx, -1)} disabled={pendente || idx === 0} aria-label={`Mover foto ${idx + 1} para antes`}>
                        <ArrowUp />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Mover para antes</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon-sm" onClick={() => mover(idx, 1)} disabled={pendente || idx === ordenadas.length - 1} aria-label={`Mover foto ${idx + 1} para depois`}>
                        <ArrowDown />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Mover para depois</TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex gap-0.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => executar(`principal-${f.id}`, () => definirFotoPrincipalAction(imovelId, f.id))}
                        disabled={pendente || f.principal}
                        aria-pressed={f.principal}
                        aria-label={f.principal ? `Foto ${idx + 1} é a principal` : `Definir foto ${idx + 1} como principal`}
                      >
                        <Star className={cn(f.principal && "fill-highlight text-highlight")} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{f.principal ? "Foto principal" : "Definir como principal"}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => executar(`remover-${f.id}`, () => removerFotoAction(imovelId, f.id))} disabled={pendente} aria-label={`Remover foto ${idx + 1}`}>
                        <Trash2 />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Remover foto</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <Dialog open={confirmarTodas} onOpenChange={setConfirmarTodas}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover todas as fotos?</DialogTitle>
            <DialogDescription>As {ordenadas.length} fotos deste imóvel serão apagadas. O anúncio ficará sem imagens até que você envie novas.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={pendente}>
                Cancelar
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              disabled={pendente}
              onClick={() => {
                setConfirmarTodas(false);
                executar("todas", () => removerTodasFotosAction(imovelId));
              }}
            >
              <Trash2 data-icon="inline-start" /> Remover todas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
