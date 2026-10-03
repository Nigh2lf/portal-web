import Image from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  src: string | null | undefined;
  alt: string;
  className?: string;
  sizes?: string;
  prioridade?: boolean;
}

/**
 * Miniatura de imóvel. Fotos recém-enviadas no mock são data URLs, que o
 * otimizador do Next não processa; nesse caso usa `unoptimized`.
 */
export function FotoImovel({ src, alt, className, sizes = "160px", prioridade }: Props) {
  if (!src) {
    return (
      <div className={cn("flex items-center justify-center bg-muted text-muted-foreground", className)} aria-label="Sem foto" role="img">
        <ImageOff className="size-5" aria-hidden />
      </div>
    );
  }
  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      <Image src={src} alt={alt} fill sizes={sizes} priority={prioridade} unoptimized={src.startsWith("data:")} className="object-cover" />
    </div>
  );
}
