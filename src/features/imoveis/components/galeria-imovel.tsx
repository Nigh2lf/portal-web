"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand, ImageOff, Images } from "lucide-react";
import type { ImovelFoto } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface Props {
  fotos: ImovelFoto[];
  titulo: string;
  destaque?: boolean;
}

export function GaleriaImovel({ fotos, titulo }: Props) {
  const ordenadas = [...fotos].sort((a, b) => Number(b.principal) - Number(a.principal) || a.ordem - b.ordem);
  const [indice, setIndice] = useState(0);
  const [aberto, setAberto] = useState(false);
  const total = ordenadas.length;

  const ir = useCallback(
    (delta: number) => {
      if (!total) return;
      setIndice((i) => (i + delta + total) % total);
    },
    [total],
  );

  useEffect(() => {
    if (!aberto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") ir(1);
      if (e.key === "ArrowLeft") ir(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [aberto, ir]);

  if (!total) {
    return (
      <div className="flex aspect-[16/10] w-full flex-col items-center justify-center gap-2 rounded-2xl bg-muted text-muted-foreground">
        <ImageOff className="size-10" aria-hidden />
        <span className="text-sm">Este anúncio ainda não tem fotos</span>
      </div>
    );
  }

  const atual = ordenadas[indice]!;

  return (
    <div className="space-y-3">
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-muted">
        <button type="button" onClick={() => setAberto(true)} className="group absolute inset-0 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none" aria-label="Ampliar foto">
          <Image key={atual.id} src={atual.url} alt={`${titulo} — foto ${indice + 1} de ${total}`} fill priority sizes="(min-width: 1024px) 800px, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
          <span className="absolute right-3 bottom-3 flex items-center gap-1.5 rounded-lg bg-black/55 px-2.5 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
            <Expand className="size-3.5" aria-hidden />
            Ampliar
          </span>
          <span className="absolute left-3 bottom-3 flex items-center gap-1.5 rounded-lg bg-black/55 px-2.5 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
            <Images className="size-3.5" aria-hidden />
            {indice + 1} / {total}
          </span>
        </button>
        {total > 1 && (
          <>
            <Button type="button" variant="secondary" size="icon" onClick={() => ir(-1)} aria-label="Foto anterior" className="absolute top-1/2 left-3 -translate-y-1/2 rounded-full bg-white/90 shadow hover:bg-white">
              <ChevronLeft />
            </Button>
            <Button type="button" variant="secondary" size="icon" onClick={() => ir(1)} aria-label="Próxima foto" className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full bg-white/90 shadow hover:bg-white">
              <ChevronRight />
            </Button>
          </>
        )}
      </div>

      {total > 1 && (
        <ul className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]" aria-label="Miniaturas">
          {ordenadas.map((f, i) => (
            <li key={f.id} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndice(i)}
                aria-label={`Ver foto ${i + 1}`}
                aria-current={i === indice}
                className={cn("relative block h-16 w-24 overflow-hidden rounded-lg ring-2 ring-offset-2 ring-offset-background transition-all sm:h-20 sm:w-28", i === indice ? "ring-brand" : "ring-transparent opacity-70 hover:opacity-100")}
              >
                <Image src={f.mini_url} alt="" fill sizes="112px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent showCloseButton className="h-[100dvh] max-h-none w-screen max-w-none! rounded-none border-0 bg-black/95 p-0 text-white ring-0 sm:h-[92dvh] sm:w-[96vw] sm:rounded-2xl [&_[data-slot=dialog-close]]:text-white [&_[data-slot=dialog-close]]:hover:bg-white/10 [&_[data-slot=dialog-close]]:hover:text-white">
          <DialogTitle className="sr-only">{titulo}</DialogTitle>
          <DialogDescription className="sr-only">Galeria de fotos. Use as setas do teclado para navegar.</DialogDescription>
          <div className="relative flex h-full flex-col">
            <div className="relative flex-1">
              <Image key={`lb-${atual.id}`} src={atual.url} alt={`${titulo} — foto ${indice + 1} de ${total}`} fill sizes="100vw" className="object-contain" />
            </div>
            {total > 1 && (
              <>
                <Button type="button" variant="ghost" size="icon-lg" onClick={() => ir(-1)} aria-label="Foto anterior" className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full text-white hover:bg-white/15 hover:text-white sm:left-4">
                  <ChevronLeft className="size-7" />
                </Button>
                <Button type="button" variant="ghost" size="icon-lg" onClick={() => ir(1)} aria-label="Próxima foto" className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full text-white hover:bg-white/15 hover:text-white sm:right-4">
                  <ChevronRight className="size-7" />
                </Button>
              </>
            )}
            <div className="flex items-center justify-between gap-4 px-4 py-3 text-xs text-white/80">
              <span className="truncate">{titulo}</span>
              <span className="shrink-0 tabular-nums">
                {indice + 1} / {total}
              </span>
            </div>
            {total > 1 && (
              <ul className="flex gap-2 overflow-x-auto px-4 pb-4 [scrollbar-width:thin]">
                {ordenadas.map((f, i) => (
                  <li key={f.id} className="shrink-0">
                    <button type="button" onClick={() => setIndice(i)} aria-label={`Ver foto ${i + 1}`} className={cn("relative block h-14 w-20 overflow-hidden rounded-md ring-2 transition-all", i === indice ? "ring-white" : "ring-transparent opacity-50 hover:opacity-90")}>
                      <Image src={f.mini_url} alt="" fill sizes="80px" className="object-cover" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
