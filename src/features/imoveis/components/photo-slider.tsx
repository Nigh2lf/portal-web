"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { ImageOff, LoaderCircle } from "lucide-react";
import type { ImovelFoto } from "@/lib/api/types";
import { cn } from "@/lib/utils";

/** Movimento mínimo do mouse para virar arrasto (abaixo disso é clique). */
const DRAG_THRESHOLD_PX = 6;
/** Fração da largura que, arrastada e solta devagar, já passa para a próxima foto. */
const DRAG_COMMIT_RATIO = 0.12;
/** Velocidade (px/ms) a partir da qual soltar o mouse conta como "jogar" a foto. */
const FLICK_VELOCITY = 0.4;
/** Tempo sem eventos de rolagem para considerar que a foto parou. */
const SCROLL_SETTLE_MS = 150;

/** Distância entre duas fotos contando a volta (a última é vizinha da primeira). */
function circularDistance(a: number, b: number, total: number) {
  const d = Math.abs(a - b);
  return Math.min(d, total - d);
}

const subscribeToNothing = () => () => {};

/** `false` no HTML do servidor e na hidratação, `true` depois. */
function useIsClient() {
  return useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
}

interface MouseDragOptions {
  enabled: boolean;
  onStart: (element: HTMLElement) => void;
  onMove: (deltaX: number, element: HTMLElement) => void;
  onEnd: (deltaX: number, velocity: number, element: HTMLElement) => void;
}

/**
 * Arrastar com o mouse. Toque e caneta ficam com a rolagem nativa do navegador.
 * Depois de um arrasto, o clique que o navegador dispara ao soltar é descartado
 * (senão soltar a foto abriria a tela cheia ou escolheria uma miniatura).
 */
function useMouseDrag({ enabled, onStart, onMove, onEnd }: MouseDragOptions) {
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    lastX: number;
    lastTime: number;
    velocity: number;
    moved: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);

  const finish = (e: React.PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    dragRef.current = null;
    if (!drag.moved) return;
    suppressClickRef.current = true;
    // Mouse parado antes de soltar: não é "jogar", vale só a distância.
    const velocity = e.timeStamp - drag.lastTime > 100 ? 0 : drag.velocity;
    onEnd(e.clientX - drag.startX, velocity, e.currentTarget);
  };

  return {
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      suppressClickRef.current = false;
      if (!enabled || e.pointerType !== "mouse" || e.button !== 0) return;
      dragRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        lastX: e.clientX,
        lastTime: e.timeStamp,
        velocity: 0,
        moved: false,
      };
    },
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;
      const deltaX = e.clientX - drag.startX;
      if (!drag.moved) {
        if (Math.abs(deltaX) < DRAG_THRESHOLD_PX) return;
        drag.moved = true;
        // Captura só depois do limite: um clique simples continua indo para o botão.
        e.currentTarget.setPointerCapture(e.pointerId);
        onStart(e.currentTarget);
      }
      const elapsed = e.timeStamp - drag.lastTime;
      if (elapsed > 0) drag.velocity = (e.clientX - drag.lastX) / elapsed;
      drag.lastX = e.clientX;
      drag.lastTime = e.timeStamp;
      onMove(deltaX, e.currentTarget);
    },
    onPointerUp: finish,
    onPointerCancel: finish,
    onClickCapture: (e: React.MouseEvent<HTMLElement>) => {
      if (!suppressClickRef.current) return;
      suppressClickRef.current = false;
      e.preventDefault();
      e.stopPropagation();
    },
  };
}

interface PhotoSliderProps {
  photos: ImovelFoto[];
  /** Foto atual (controlada pelo pai, compartilhada com setas e miniaturas). */
  index: number;
  onIndexChange: (index: number) => void;
  altFor: (index: number) => string;
  fit: "cover" | "contain";
  sizes: string;
  /** Carrega a primeira foto com prioridade (imagem principal da página). */
  priority?: boolean;
  /** Toque ou clique numa foto, sem arrastar. */
  onPhotoClick?: (index: number) => void;
  photoClickLabel?: string;
  className?: string;
}

interface Slide {
  photo: ImovelFoto;
  /** Índice da foto real que o slide mostra. */
  index: number;
  /** Cópia usada para dar a volta: a última antes da primeira, a primeira depois da última. */
  clone: "head" | "tail" | null;
}

/**
 * Trilho de fotos com rolagem horizontal e scroll-snap: no celular a foto acompanha
 * o dedo, no desktop dá para arrastar com o mouse, e setas e miniaturas mudam o
 * `index`. Dá a volta: depois da última vem a primeira, e antes da primeira, a última.
 * Só as fotos vizinhas da atual são carregadas; as que já carregaram continuam montadas.
 *
 * A volta usa duas cópias nas pontas (posição 0 = cópia da última, posição
 * `total + 1` = cópia da primeira). Quando a rolagem para numa cópia, o trilho pula
 * sem animação para a foto real igual. As cópias só entram depois da hidratação,
 * para o HTML do servidor abrir direto na primeira foto.
 */
export function PhotoSlider({
  photos,
  index,
  onIndexChange,
  altFor,
  fit,
  sizes,
  priority,
  onPhotoClick,
  photoClickLabel,
  className,
}: PhotoSliderProps) {
  const total = photos.length;
  const isClient = useIsClient();
  const loop = isClient && total > 1;
  const offset = loop ? 1 : 0;

  const trackRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(index);
  const offsetRef = useRef(offset);
  // Posição para onde uma rolagem feita por código está indo: até chegar lá, a rolagem
  // não muda o índice (senão a animação de 2 → 3 devolveria o índice para 2 no meio).
  const scrollTargetRef = useRef<number | null>(null);
  const touchingRef = useRef(false);
  const draggingRef = useRef(false);
  const dragStartScrollRef = useRef(0);
  const settleTimerRef = useRef<number | undefined>(undefined);
  const [loaded, setLoaded] = useState<ReadonlySet<string>>(() => new Set());
  const [broken, setBroken] = useState<ReadonlySet<string>>(() => new Set());

  /** Foto real mostrada numa posição do trilho (as cópias apontam para a outra ponta). */
  const indexAt = useCallback(
    (position: number) => {
      if (!offsetRef.current) return Math.min(total - 1, Math.max(0, position));
      if (position <= 0) return total - 1;
      if (position > total) return 0;
      return position - 1;
    },
    [total],
  );

  const scrollToPosition = useCallback((position: number, smooth: boolean) => {
    const track = trackRef.current;
    if (!track || !track.clientWidth) return;
    const left = position * track.clientWidth;
    if (Math.abs(track.scrollLeft - left) < 1) return;
    scrollTargetRef.current = position;
    track.scrollTo({ left, behavior: smooth ? "smooth" : "auto" });
  }, []);

  // Parou numa cópia: pula, sem animação, para a foto real igual (visualmente nada muda).
  const settleLoop = useCallback(() => {
    const track = trackRef.current;
    if (!track || !track.clientWidth || !offsetRef.current) return;
    if (touchingRef.current || draggingRef.current) return;
    const exact = track.scrollLeft / track.clientWidth;
    const position = Math.round(exact);
    if (Math.abs(exact - position) > 0.01) return;
    if (position === 0 || position === total + 1) {
      scrollTargetRef.current = null;
      track.scrollLeft = (indexAt(position) + 1) * track.clientWidth;
    }
  }, [indexAt, total]);

  const scheduleSettle = useCallback(() => {
    window.clearTimeout(settleTimerRef.current);
    settleTimerRef.current = window.setTimeout(settleLoop, SCROLL_SETTLE_MS);
  }, [settleLoop]);

  // Ao montar (ex.: tela cheia aberta na foto 5) e quando as cópias entram, posiciona
  // na foto atual antes de pintar a tela.
  useLayoutEffect(() => {
    offsetRef.current = offset;
    const track = trackRef.current;
    if (!track || !track.clientWidth) return;
    scrollTargetRef.current = null;
    track.scrollLeft = (indexRef.current + offset) * track.clientWidth;
  }, [offset]);

  // Índice mudou por seta, miniatura ou teclado: rola até a foto. Vizinha anima
  // (inclusive da última para a primeira, passando pela cópia); salto maior é instantâneo.
  useEffect(() => {
    indexRef.current = index;
    const track = trackRef.current;
    if (!track || !track.clientWidth) return;
    const heading = scrollTargetRef.current;
    if (heading !== null && indexAt(heading) === index) return;
    const current = indexAt(Math.round(track.scrollLeft / track.clientWidth));
    if (current === index) return;
    const withLoop = offsetRef.current === 1;
    const neighbor = withLoop ? circularDistance(current, index, total) === 1 : Math.abs(current - index) === 1;
    let position = index + offsetRef.current;
    if (withLoop && neighbor && Math.abs(current - index) > 1) position = index === 0 ? total + 1 : 0;
    scrollToPosition(position, neighbor);
  }, [index, indexAt, scrollToPosition, total]);

  // Girar o celular ou redimensionar a janela muda a largura de cada foto.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const observer = new ResizeObserver(() => {
      if (!track.clientWidth) return;
      scrollTargetRef.current = null;
      track.scrollLeft = (indexRef.current + offsetRef.current) * track.clientWidth;
    });
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    track?.addEventListener("scrollend", settleLoop);
    return () => {
      track?.removeEventListener("scrollend", settleLoop);
      window.clearTimeout(settleTimerRef.current);
    };
  }, [settleLoop]);

  const handleScroll = () => {
    const track = trackRef.current;
    if (!track || !track.clientWidth) return;
    scheduleSettle();
    const position = Math.round(track.scrollLeft / track.clientWidth);
    if (scrollTargetRef.current !== null) {
      if (position !== scrollTargetRef.current) return;
      scrollTargetRef.current = null;
    }
    const current = indexAt(position);
    if (current !== indexRef.current) {
      indexRef.current = current;
      onIndexChange(current);
    }
  };

  const drag = useMouseDrag({
    enabled: total > 1,
    onStart: (track) => {
      draggingRef.current = true;
      scrollTargetRef.current = null;
      dragStartScrollRef.current = track.scrollLeft;
      // Com o snap ligado, cada mudança de scrollLeft voltaria para a foto inteira.
      track.style.scrollSnapType = "none";
      track.style.cursor = "grabbing";
    },
    onMove: (deltaX, track) => {
      track.scrollLeft = dragStartScrollRef.current - deltaX;
    },
    onEnd: (deltaX, velocity, track) => {
      draggingRef.current = false;
      track.style.cursor = "";
      const width = track.clientWidth;
      const exact = track.scrollLeft / width;
      const from = Math.round(dragStartScrollRef.current / width);
      let position = Math.round(exact);
      if (Math.abs(velocity) > FLICK_VELOCITY) {
        position = velocity < 0 ? Math.ceil(exact) : Math.floor(exact);
      } else if (position === from && Math.abs(deltaX) > width * DRAG_COMMIT_RATIO) {
        position = from + (deltaX < 0 ? 1 : -1);
      }
      position = Math.min(total - 1 + 2 * offsetRef.current, Math.max(0, position));

      const finishSnap = () => {
        track.style.scrollSnapType = "";
        settleLoop();
      };
      const left = position * width;
      if (Math.abs(track.scrollLeft - left) < 1) {
        finishSnap();
      } else {
        // O snap só volta quando a foto termina de encaixar; religar no meio da
        // animação faria o navegador puxar para a foto mais próxima.
        if ("onscrollend" in track) track.addEventListener("scrollend", finishSnap, { once: true });
        else window.setTimeout(finishSnap, 700);
        scrollTargetRef.current = position;
        track.scrollTo({ left, behavior: "smooth" });
      }
      const next = indexAt(position);
      if (next !== indexRef.current) {
        indexRef.current = next;
        onIndexChange(next);
      }
    },
  });

  const markLoaded = (id: string) => setLoaded((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  const markBroken = (id: string) => setBroken((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));

  const slides: Slide[] = photos.map((photo, i) => ({ photo, index: i, clone: null }));
  if (loop) {
    slides.unshift({ photo: photos[total - 1]!, index: total - 1, clone: "head" });
    slides.push({ photo: photos[0]!, index: 0, clone: "tail" });
  }

  return (
    <div
      ref={trackRef}
      onScroll={handleScroll}
      onTouchStart={() => {
        touchingRef.current = true;
        scrollTargetRef.current = null;
      }}
      onTouchEnd={() => {
        touchingRef.current = false;
        scheduleSettle();
      }}
      onTouchCancel={() => {
        touchingRef.current = false;
        scheduleSettle();
      }}
      onWheel={() => {
        scrollTargetRef.current = null;
      }}
      {...drag}
      className={cn(
        "flex snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain select-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        total > 1 && "cursor-grab",
        className,
      )}
    >
      {slides.map(({ photo, index: i, clone }) => {
        const isCurrent = clone === null && i === index;
        const isBroken = broken.has(photo.id);
        const isLoaded = loaded.has(photo.id);
        const shouldRender = isLoaded || circularDistance(i, index, total) <= 1;

        const content = isBroken ? (
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-70">
            <ImageOff className="size-8" aria-hidden />
            <span className="text-xs">Foto indisponível</span>
          </span>
        ) : (
          <>
            {!isLoaded && (
              <span className="absolute inset-0 flex items-center justify-center opacity-60">
                <LoaderCircle className="size-7 animate-spin" aria-hidden />
                <span className="sr-only">Carregando foto</span>
              </span>
            )}
            {shouldRender && (
              <Image
                src={photo.url}
                alt={clone ? "" : altFor(i)}
                fill
                sizes={sizes}
                priority={priority && clone === null && i === 0}
                draggable={false}
                onLoad={() => markLoaded(photo.id)}
                onError={() => markBroken(photo.id)}
                className={cn(
                  fit === "cover"
                    ? "object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    : "object-contain",
                )}
              />
            )}
          </>
        );

        return (
          <div
            key={clone ? `${clone}-${photo.id}` : photo.id}
            // Fotos fora da tela e cópias não recebem foco: o Tab não faz o trilho rolar sozinho.
            inert={!isCurrent}
            aria-hidden={clone ? true : undefined}
            className="relative h-full w-full shrink-0 snap-center snap-always overflow-hidden"
          >
            {onPhotoClick ? (
              <button
                type="button"
                onClick={() => onPhotoClick(i)}
                aria-label={photoClickLabel}
                className={cn(
                  "group absolute inset-0 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none focus-visible:ring-inset",
                  total > 1 ? "cursor-grab" : "cursor-zoom-in",
                )}
              >
                {content}
              </button>
            ) : (
              content
            )}
          </div>
        );
      })}
    </div>
  );
}

interface PhotoThumbnailsProps {
  photos: ImovelFoto[];
  index: number;
  onSelect: (index: number) => void;
  tone: "light" | "dark";
  className?: string;
}

/** Faixa de miniaturas que mantém a foto atual centralizada e pode ser arrastada com o mouse. */
export function PhotoThumbnails({ photos, index, onSelect, tone, className }: PhotoThumbnailsProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const mountedRef = useRef(false);
  const dragStartScrollRef = useRef(0);

  useEffect(() => {
    const list = listRef.current;
    const item = list?.children[index] as HTMLElement | undefined;
    if (!list || !item) return;
    // Rola só a faixa (scrollIntoView rolaria também a página por trás da tela cheia).
    const left = item.offsetLeft - (list.clientWidth - item.offsetWidth) / 2;
    list.scrollTo({ left: Math.max(0, left), behavior: mountedRef.current ? "smooth" : "auto" });
    mountedRef.current = true;
  }, [index]);

  const drag = useMouseDrag({
    enabled: photos.length > 1,
    onStart: (list) => {
      dragStartScrollRef.current = list.scrollLeft;
      list.style.cursor = "grabbing";
    },
    onMove: (deltaX, list) => {
      list.scrollLeft = dragStartScrollRef.current - deltaX;
    },
    onEnd: (_deltaX, _velocity, list) => {
      list.style.cursor = "";
    },
  });

  return (
    <ul
      ref={listRef}
      aria-label="Miniaturas"
      {...drag}
      className={cn(
        "relative flex gap-2 overflow-x-auto p-1 select-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {photos.map((photo, i) => (
        <li key={photo.id} className="shrink-0">
          <button
            type="button"
            onClick={() => onSelect(i)}
            aria-label={`Ver foto ${i + 1}`}
            aria-current={i === index}
            className={cn(
              "relative block overflow-hidden ring-2 transition-all focus-visible:outline-none",
              tone === "light"
                ? "h-16 w-24 rounded-lg ring-offset-2 ring-offset-background sm:h-20 sm:w-28"
                : "h-14 w-20 rounded-md",
              i === index
                ? tone === "light"
                  ? "ring-brand"
                  : "ring-white"
                : cn(
                    "ring-transparent focus-visible:ring-ring",
                    tone === "light" ? "opacity-70 hover:opacity-100" : "opacity-50 hover:opacity-90",
                  ),
            )}
          >
            <Image src={photo.mini_url} alt="" fill sizes={tone === "light" ? "112px" : "80px"} draggable={false} className="object-cover" />
          </button>
        </li>
      ))}
    </ul>
  );
}
