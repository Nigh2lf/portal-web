import Image from "next/image";
import type { Publicidade } from "@/lib/api/types";
import { cn } from "@/lib/utils";

interface Props {
  pub: Publicidade | null;
  className?: string;
  /** Proporção da imagem: `faixa` (horizontal) ou `quadro`. */
  formato?: "faixa" | "quadro";
}

/**
 * Banner publicitário. Por enquanto aponta direto para `pub.link`; quando o
 * endpoint `/api/publicidade/{id}` existir, basta trocar o href para registrar o clique.
 */
export function BannerPublicidade({ pub, className, formato = "faixa" }: Props) {
  if (!pub) return null;
  return (
    <a
      href={pub.link}
      target={pub.nova_aba ? "_blank" : undefined}
      rel={pub.nova_aba ? "noopener noreferrer sponsored" : "sponsored"}
      aria-label={`Publicidade: ${pub.nome}`}
      className={cn("group relative block overflow-hidden rounded-xl ring-1 ring-foreground/10", formato === "faixa" ? "aspect-[6/1] max-sm:aspect-[3/1]" : "aspect-[4/3]", className)}
    >
      <Image src={pub.imagem_url} alt={pub.nome} fill sizes="(min-width: 1280px) 1200px, 100vw" className="object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
      <span className="absolute bottom-2 right-2 rounded-md bg-black/50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">Publicidade</span>
    </a>
  );
}
