"use client";

import { useState } from "react";
import { LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { ItemNavPainel } from "../nav-items";
import { PainelNav } from "./painel-nav";

interface Props {
  itens: ItemNavPainel[];
  portalNome: string;
  aviso?: React.ReactNode;
}

export function MobileNav({ itens, portalNome, aviso }: Props) {
  const [aberto, setAberto] = useState(false);
  return (
    <Sheet open={aberto} onOpenChange={setAberto}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Abrir menu do painel" className="lg:hidden">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[85vw] max-w-xs gap-0 p-0">
        <SheetHeader className="border-b">
          <SheetTitle>Painel do anunciante</SheetTitle>
          <SheetDescription>{portalNome}</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-3">
          <PainelNav itens={itens} onNavigate={() => setAberto(false)} />
          {aviso && <div className="mt-4">{aviso}</div>}
        </div>
        <div className="border-t p-3">
          <Button type="submit" form="form-sair" variant="outline" className="w-full">
            <LogOut data-icon="inline-start" /> Sair
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
