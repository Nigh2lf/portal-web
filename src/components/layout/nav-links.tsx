"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MenuItem } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export function NavLinks({ itens, vertical, onNavigate }: { itens: MenuItem[]; vertical?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <>
      {itens.map((item) => {
        const ativo = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={ativo ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              vertical ? "block text-base" : "",
              ativo ? "bg-brand-soft text-brand" : "text-foreground/80 hover:bg-muted hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
