import Link from "next/link";
import { ArrowRight, Inbox } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Mensagem } from "@/lib/api/types";
import { iniciais, truncar } from "@/lib/utils/format";
import { PREFERENCIAS_LABEL, formatarDataHora } from "../utils";
import { EmptyState } from "./empty-state";

export function LeadsRecentes({ mensagens, className }: { mensagens: Mensagem[]; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Últimos contatos</CardTitle>
        <CardDescription>Interessados que enviaram mensagem pelos seus anúncios.</CardDescription>
        <CardAction>
          <Button asChild variant="ghost" size="sm">
            <Link href="/painel/ofertas">
              Ver todas <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {mensagens.length === 0 ? (
          <EmptyState icon={Inbox} titulo="Nenhuma mensagem ainda" descricao="Quando alguém se interessar por um imóvel seu, o contato aparece aqui." className="py-8" />
        ) : (
          <ul className="divide-y">
            {mensagens.map((m) => (
              <li key={m.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                <Avatar>
                  <AvatarFallback className="bg-brand-soft text-brand text-xs font-semibold">{iniciais(m.nome)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <p className="truncate text-sm font-medium">{m.nome}</p>
                    <time dateTime={m.criado_em} className="text-xs text-muted-foreground tabular-nums">
                      {formatarDataHora(m.criado_em)}
                    </time>
                  </div>
                  {m.imovel_codigo && (
                    <p className="truncate text-xs text-muted-foreground">
                      Imóvel <span className="font-medium text-foreground">{m.imovel_codigo}</span>
                      {m.imovel_titulo ? ` · ${m.imovel_titulo}` : ""}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-foreground/80">{truncar(m.mensagem, 140)}</p>
                  {m.preferencias.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {m.preferencias.map((p) => (
                        <Badge key={p} variant="outline" className="h-4.5 text-[10px]">
                          {PREFERENCIAS_LABEL[p]}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
