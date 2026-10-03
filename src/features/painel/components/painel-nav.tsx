"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Building2, FileDown, Inbox, KeyRound, LayoutDashboard, UserRound, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { IconeNavPainel, ItemNavPainel } from "../nav-items";

const ICONES: Record<IconeNavPainel, LucideIcon> = {
  resumo: LayoutDashboard,
  cadastro: UserRound,
  imoveis: Building2,
  ofertas: Inbox,
  estatisticas: BarChart3,
  importacao: FileDown,
  senha: KeyRound,
};

interface Props {
  itens: ItemNavPainel[];
  onNavigate?: () => void;
  className?: string;
}

export function PainelNav({ itens, onNavigate, className }: Props) {
  const pathname = usePathname();
  return (
    <nav aria-label="Painel do anunciante" className={cn("flex flex-col gap-1", className)}>
      {itens.map((item) => {
        const ativo = item.exato ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = ICONES[item.icon];
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={ativo ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              ativo ? "bg-brand text-brand-foreground shadow-sm" : "text-foreground/75 hover:bg-brand-soft hover:text-brand",
            )}
          >
            <Icon className="size-4.5 shrink-0" aria-hidden />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
