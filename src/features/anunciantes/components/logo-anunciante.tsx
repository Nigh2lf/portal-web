import Image from "next/image";
import { iniciais } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

interface Props {
  nome: string;
  logoUrl: string | null;
  tamanho?: number;
  className?: string;
}

/** Logo do anunciante com fallback em iniciais (sem dependência de client). */
export function LogoAnunciante({ nome, logoUrl, tamanho = 72, className }: Props) {
  if (logoUrl) {
    return (
      <div
        className={cn("flex shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-white p-1.5", className)}
        style={{ width: tamanho, height: tamanho }}
      >
        <Image src={logoUrl} alt={nome} width={tamanho} height={tamanho} className="h-full w-full object-contain" />
      </div>
    );
  }
  return (
    <div
      className={cn("flex shrink-0 items-center justify-center rounded-xl bg-brand-soft font-heading text-xl font-bold text-brand", className)}
      style={{ width: tamanho, height: tamanho }}
      aria-hidden
    >
      {iniciais(nome)}
    </div>
  );
}
