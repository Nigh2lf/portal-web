"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Camera, ChevronLeft, ChevronRight, ImageOff, LoaderCircle } from "lucide-react";
import type { ImovelFoto } from "@/lib/api/types";
import { cn } from "@/lib/utils";

interface Props {
  /** Slug do imóvel: busca as fotos em `/api/imoveis/<slug>/fotos` no primeiro clique. */
  slug: string;
  href: string;
  title: string;
  coverUrl: string | null;
  total: number;
  priority?: boolean;
  sizes: string;
}

const SWIPE_MIN_PX = 40;

/**
 * Foto do card com setas para passar as fotos. A lista só traz a capa: as demais fotos
 * são buscadas no primeiro clique numa seta, e cada imagem só carrega quando é mostrada.
 * Enquanto a próxima foto carrega, a atual continua na tela.
 */
export function CardPhotos({ slug, href, title, coverUrl, total, priority, sizes }: Props) {
  const [photos, setPhotos] = useState<ImovelFoto[] | null>(null);
  const [fetching, setFetching] = useState(false);
  // `target` é a foto pedida; `shown` a que já carregou e está na tela.
  const [target, setTarget] = useState(0);
  const [shown, setShown] = useState(0);
  const [broken, setBroken] = useState<Set<number>>(() => new Set());
  const touchX = useRef<number | null>(null);

  const count = photos?.length ?? total;
  const canNavigate = total > 1 && count > 1;
  const loading = fetching || target !== shown;

  const urlAt = (i: number) => (i === 0 ? coverUrl : (photos?.[i]?.url ?? null));

  async function loadPhotos(): Promise<ImovelFoto[] | null> {
    if (photos) return photos;
    setFetching(true);
    try {
      const r = await fetch(`/api/imoveis/${encodeURIComponent(slug)}/fotos`);
      const list: ImovelFoto[] = r.ok ? await r.json() : [];
      if (list.length) setPhotos(list);
      return list.length ? list : null;
    } catch {
      return null;
    } finally {
      setFetching(false);
    }
  }

  async function go(delta: number) {
    if (fetching) return;
    const list = await loadPhotos();
    if (!list || list.length < 2) return;
    const next = (target + delta + list.length) % list.length;
    setTarget(next);
    // A capa já está carregada (é a miniatura do card).
    if (next === 0) setShown(0);
  }

  const onArrow = (delta: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    void go(delta);
  };

  const renderImage = (i: number, pending: boolean) => {
    const url = urlAt(i);
    if (!url || broken.has(i)) {
      return (
        <div className="text-muted-foreground absolute inset-0 flex flex-col items-center justify-center gap-2">
          <ImageOff className="size-8" aria-hidden />
          <span className="text-xs">{i === 0 && !url ? "Sem foto" : "Foto indisponível"}</span>
        </div>
      );
    }
    return (
      <Image
        key={`${i}-${url}`}
        src={url}
        alt={i === 0 ? title : `${title} — foto ${i + 1} de ${count}`}
        fill
        priority={i === 0 && priority}
        sizes={sizes}
        onLoad={pending ? () => setShown(i) : undefined}
        onError={() => {
          setBroken((prev) => new Set(prev).add(i));
          if (pending) setShown(i);
        }}
        className={cn(
          "object-cover transition-transform duration-500 group-hover:scale-105",
          pending && "opacity-0",
        )}
      />
    );
  };

  return (
    <div
      className="absolute inset-0"
      onTouchStart={(e) => {
        touchX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        const start = touchX.current;
        touchX.current = null;
        const end = e.changedTouches[0]?.clientX;
        if (!canNavigate || start === null || end === undefined) return;
        const dx = end - start;
        if (Math.abs(dx) >= SWIPE_MIN_PX) void go(dx < 0 ? 1 : -1);
      }}
    >
      <Link href={href} className="absolute inset-0" aria-label={title} tabIndex={-1}>
        {renderImage(shown, false)}
        {target !== shown && renderImage(target, true)}
        <div
          className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/75 via-black/25 to-transparent"
          aria-hidden
        />
      </Link>

      {canNavigate && (
        <>
          <button
            type="button"
            onClick={onArrow(-1)}
            aria-label="Foto anterior"
            className="absolute top-1/2 left-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground opacity-0 shadow transition-opacity group-hover:opacity-100 hover:bg-white focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={onArrow(1)}
            aria-label="Próxima foto"
            className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground opacity-0 shadow transition-opacity group-hover:opacity-100 hover:bg-white focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
          >
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </>
      )}

      {loading && (
        <span className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/45 p-2 text-white">
          <LoaderCircle className="size-5 animate-spin" aria-hidden />
          <span className="sr-only">Carregando foto</span>
        </span>
      )}

      {total > 0 && (
        <span className="pointer-events-none absolute right-4 bottom-3 flex items-center gap-1 rounded-md bg-black/40 px-1.5 py-0.5 text-xs text-white tabular-nums backdrop-blur-sm">
          <Camera className="size-3.5" aria-hidden />
          {target > 0 || photos ? `${target + 1}/${count}` : total}
        </span>
      )}
    </div>
  );
}
