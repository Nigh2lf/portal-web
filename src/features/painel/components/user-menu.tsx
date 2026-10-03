"use client";

import Link from "next/link";
import { ChevronDown, ExternalLink, KeyRound, LogOut, UserRound } from "lucide-react";
import type { SessaoUsuario } from "@/lib/api/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { iniciais } from "@/lib/utils/format";

const TIPO_LABEL: Record<SessaoUsuario["tipo"], string> = {
  proprietario: "Proprietário",
  corretor: "Corretor",
  imobiliaria: "Imobiliária",
};

export function UserMenu({ sessao }: { sessao: SessaoUsuario }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-10 gap-2 px-2" aria-label={`Conta de ${sessao.nome}`}>
          <Avatar>
            <AvatarFallback className="bg-brand-soft text-brand text-xs font-semibold">{iniciais(sessao.nome)}</AvatarFallback>
          </Avatar>
          <span className="hidden max-w-40 truncate text-sm font-medium sm:inline">{sessao.nome.split(" ")[0]}</span>
          <ChevronDown className="size-4 text-muted-foreground" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-semibold text-foreground">{sessao.nome}</p>
          <p className="truncate text-xs text-muted-foreground">{sessao.email}</p>
          <p className="mt-1 text-[11px] tracking-wide text-muted-foreground uppercase">{TIPO_LABEL[sessao.tipo]}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {!sessao.carga_automatica && (
          <DropdownMenuItem asChild>
            <Link href="/painel/perfil">
              <UserRound /> Meu cadastro
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href="/painel/senha">
            <KeyRound /> Trocar senha
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/" target="_blank" rel="noopener">
            <ExternalLink /> Ver site
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild variant="destructive">
          <button type="submit" form="form-sair" className="w-full">
            <LogOut /> Sair
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
