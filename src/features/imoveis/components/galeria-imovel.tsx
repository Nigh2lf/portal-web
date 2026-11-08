"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, ImageOff, Images, X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import type { ImovelFoto } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PhotoSlider, PhotoThumbnails } from "./photo-slider";

interface Props {
  fotos: ImovelFoto[];
  titulo: string;
  destaque?: boolean;
}

const lightboxArrowClass =
  "absolute top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-colors hover:bg-black/70 focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none sm:size-12";

export function GaleriaImovel({ fotos, titulo }: Props) {
  const photos = useMemo(
    () => [...fotos].sort((a, b) => Number(b.principal) - Number(a.principal) || a.ordem - b.ordem),
    [fotos],
  );
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const expandButtonRef = useRef<HTMLButtonElement>(null);
  const total = photos.length;

  const go = useCallback(
    (delta: number) => {
      if (total < 2) return;
      setIndex((i) => (i + delta + total) % total);
    },
    [total],
  );

  const altFor = useCallback((i: number) => `${titulo} — foto ${i + 1} de ${total}`, [titulo, total]);

  if (!total) {
    return (
      <div className="flex aspect-[16/10] w-full flex-col items-center justify-center gap-2 rounded-2xl bg-muted text-muted-foreground">
        <ImageOff className="size-10" aria-hidden />
        <span className="text-sm">Este anúncio ainda não tem fotos</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-muted text-muted-foreground">
        <PhotoSlider
          className="absolute inset-0"
          photos={photos}
          index={index}
          onIndexChange={setIndex}
          altFor={altFor}
          fit="cover"
          sizes="(min-width: 1024px) 800px, 100vw"
          priority
          onPhotoClick={() => setOpen(true)}
          photoClickLabel="Ampliar foto"
        />
        <span className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-1.5 rounded-lg bg-black/55 px-2.5 py-1.5 text-xs font-medium text-white tabular-nums backdrop-blur-sm">
          <Images className="size-3.5" aria-hidden />
          {index + 1} / {total}
        </span>
        <button
          ref={expandButtonRef}
          type="button"
          onClick={() => setOpen(true)}
          className="absolute right-3 bottom-3 flex items-center gap-1.5 rounded-lg bg-black/55 px-2.5 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/75 focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none"
        >
          <Expand className="size-3.5" aria-hidden />
          Ampliar
        </button>
        {total > 1 && (
          <>
            <Button type="button" variant="secondary" size="icon" onClick={() => go(-1)} aria-label="Foto anterior" className="absolute top-1/2 left-3 -translate-y-1/2 rounded-full bg-white/90 shadow hover:bg-white">
              <ChevronLeft />
            </Button>
            <Button type="button" variant="secondary" size="icon" onClick={() => go(1)} aria-label="Próxima foto" className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full bg-white/90 shadow hover:bg-white">
              <ChevronRight />
            </Button>
          </>
        )}
      </div>

      {total > 1 && <PhotoThumbnails photos={photos} index={index} onSelect={setIndex} tone="light" />}

      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
          <DialogPrimitive.Content
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                e.preventDefault();
                go(e.key === "ArrowRight" ? 1 : -1);
              }
            }}
            onCloseAutoFocus={(e) => {
              // A foto que abriu a tela cheia pode ter saído de vista: o foco volta para "Ampliar".
              e.preventDefault();
              expandButtonRef.current?.focus({ preventScroll: true });
            }}
            className="fixed inset-0 z-50 flex flex-col bg-black text-white outline-none data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
          >
            <DialogPrimitive.Title className="sr-only">{titulo}</DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only">
              Galeria de fotos. Arraste para os lados ou use as setas para navegar.
            </DialogPrimitive.Description>

            <div className="flex shrink-0 items-center gap-3 py-2 pr-2 pl-4 pt-[max(0.5rem,env(safe-area-inset-top))] sm:pr-3 sm:pl-5">
              <span className="text-sm font-medium tabular-nums">
                {index + 1} / {total}
              </span>
              <p className="min-w-0 flex-1 truncate text-sm text-white/70">{titulo}</p>
              <DialogPrimitive.Close
                aria-label="Fechar galeria"
                className="flex size-11 shrink-0 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none"
              >
                <X className="size-6" aria-hidden />
              </DialogPrimitive.Close>
            </div>

            <div className="relative min-h-0 flex-1">
              <PhotoSlider
                className="absolute inset-0 text-white"
                photos={photos}
                index={index}
                onIndexChange={setIndex}
                altFor={altFor}
                fit="contain"
                sizes="100vw"
              />
              {total > 1 && (
                <>
                  <button type="button" onClick={() => go(-1)} aria-label="Foto anterior" className={cn(lightboxArrowClass, "left-2 sm:left-4")}>
                    <ChevronLeft className="size-6 sm:size-7" aria-hidden />
                  </button>
                  <button type="button" onClick={() => go(1)} aria-label="Próxima foto" className={cn(lightboxArrowClass, "right-2 sm:right-4")}>
                    <ChevronRight className="size-6 sm:size-7" aria-hidden />
                  </button>
                </>
              )}
            </div>

            {total > 1 && (
              // Celular deitado: sem miniaturas, a foto ocupa a altura toda.
              <div className="shrink-0 px-2 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] [@media(max-height:480px)]:hidden">
                <PhotoThumbnails photos={photos} index={index} onSelect={setIndex} tone="dark" className="justify-center-safe" />
              </div>
            )}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  );
}
