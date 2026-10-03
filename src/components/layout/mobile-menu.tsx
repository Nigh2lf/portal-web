"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Megaphone, UserRound } from "lucide-react";
import type { Portal, SessaoUsuario } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { NavLinks } from "./nav-links";

export function MobileMenu({ portal, sessao }: { portal: Portal; sessao: SessaoUsuario | null }) {
  const [aberto, setAberto] = useState(false);
  const fechar = () => setAberto(false);
  return (
    <Sheet open={aberto} onOpenChange={setAberto}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Abrir menu">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px]">
        <SheetHeader>
          <SheetTitle className="text-brand">{portal.nome}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-1 px-4">
          <NavLinks itens={portal.menu} vertical onNavigate={fechar} />
          <Separator className="my-3" />
          {sessao ? (
            <Button asChild variant="outline" onClick={fechar}>
              <Link href="/painel">
                <UserRound data-icon="inline-start" />
                Meu painel
              </Link>
            </Button>
          ) : (
            <Button asChild variant="outline" onClick={fechar}>
              <Link href="/anunciar">Entrar</Link>
            </Button>
          )}
          <Button asChild className="mt-2 bg-cta text-cta-foreground hover:bg-cta/90" onClick={fechar}>
            <Link href={sessao ? "/painel/imoveis/novo" : "/anunciar"}>
              <Megaphone data-icon="inline-start" />
              Anunciar imóvel
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
