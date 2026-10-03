"use client";

import { useState } from "react";
import { Home, MessageSquareText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Bairro, Cidade, ImovelTipo } from "@/lib/api/types";
import { EncomendaForm } from "@/features/encomenda/components/encomenda-form";
import { ContatoForm } from "./contato-form";

export type ModoContato = "contato" | "encomenda";

interface Props {
  modoInicial: ModoContato;
  assuntoInicial?: string;
  tipos: ImovelTipo[];
  cidades: Cidade[];
  bairrosIniciais: Bairro[];
}

/** Dois modos do `Contato.php` (radio "Contato" / "Encomenda") como abas. */
export function ContatoTabs({ modoInicial, assuntoInicial, tipos, cidades, bairrosIniciais }: Props) {
  const [modo, setModo] = useState<ModoContato>(modoInicial);
  return (
    <Tabs value={modo} onValueChange={(v) => setModo(v as ModoContato)} className="gap-6">
      <TabsList className="grid h-auto w-full grid-cols-2 rounded-xl p-1 group-data-horizontal/tabs:h-auto">
        <TabsTrigger value="contato" className="h-10 rounded-lg text-sm sm:text-base">
          <MessageSquareText data-icon="inline-start" />
          Fale conosco
        </TabsTrigger>
        <TabsTrigger value="encomenda" className="h-10 rounded-lg text-sm sm:text-base">
          <Home data-icon="inline-start" />
          Encomendar imóvel
        </TabsTrigger>
      </TabsList>
      <TabsContent value="contato">
        <ContatoForm assuntoInicial={assuntoInicial} />
      </TabsContent>
      <TabsContent value="encomenda">
        <EncomendaForm tipos={tipos} cidades={cidades} bairrosIniciais={bairrosIniciais} />
      </TabsContent>
    </Tabs>
  );
}
