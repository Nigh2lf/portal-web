"use client";

import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { iniciarNavegacao } from "@/components/layout/navegacao-progresso";

/**
 * Seletor de portal para desenvolvimento: grava `?portal=` que o proxy
 * converte em cookie. Em produção o portal vem do domínio e isto não aparece.
 */
export function PortalSwitcher({ atual, portais }: { atual: string; portais: Array<{ slug: string; nome: string }> }) {
  const router = useRouter();
  if (process.env.NODE_ENV === "production") return null;
  return (
    <label className="flex items-center gap-2">
      <Globe className="size-3.5" aria-hidden />
      <span className="sr-only">Trocar portal (dev)</span>
      <select
        value={atual}
        onChange={(e) => {
          iniciarNavegacao();
          router.push(`/?portal=${e.target.value}`);
        }}
        className="rounded border border-white/20 bg-transparent px-2 py-1 text-xs text-brand-foreground/80"
      >
        {portais.map((p) => (
          <option key={p.slug} value={p.slug} className="text-foreground">
            {p.nome}
          </option>
        ))}
      </select>
    </label>
  );
}
