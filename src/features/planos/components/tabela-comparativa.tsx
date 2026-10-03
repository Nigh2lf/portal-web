import Link from "next/link";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Plano } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { RECURSOS_PLANO, precoPlano } from "../lib/recursos";

export function TabelaComparativa({ planos }: { planos: Plano[] }) {
  return (
    <div className="card-elevated overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-[260px] py-4 text-base font-semibold text-foreground">Detalhes</TableHead>
            {planos.map((p) => {
              const preco = precoPlano(p);
              return (
                <TableHead key={p.id} className={cn("py-4 text-center", p.recomendado && "bg-brand-soft/60")}>
                  <div className="font-heading text-base font-bold text-foreground">{p.nome}</div>
                  <div className="text-sm text-brand">
                    <span className="font-semibold">{preco.principal}</span>
                    {preco.sufixo}
                  </div>
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {RECURSOS_PLANO.map((r) => (
            <TableRow key={r.chave}>
              <TableCell className="py-3.5">
                <div className="font-medium">{r.label}</div>
                <div className="text-xs text-muted-foreground">{r.descricao}</div>
              </TableCell>
              {planos.map((p) => {
                const v = r.valor(p);
                return (
                  <TableCell key={p.id} className={cn("py-3.5 text-center", p.recomendado && "bg-brand-soft/30")}>
                    {typeof v === "string" ? (
                      <span className="font-semibold">{v}</span>
                    ) : v ? (
                      <Check className="mx-auto size-5 text-success" aria-label="Incluído" />
                    ) : (
                      <X className="mx-auto size-5 text-muted-foreground/60" aria-label="Não incluído" />
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
          <TableRow className="hover:bg-transparent">
            <TableCell />
            {planos.map((p) => (
              <TableCell key={p.id} className={cn("py-4 text-center", p.recomendado && "bg-brand-soft/30")}>
                <Button asChild size="sm" variant={p.recomendado ? "default" : "outline"}>
                  <Link href={p.preco_mensal === null ? "/contato?assunto=Planos%20e%20pagamento" : `/cadastro?plano=${p.slug}`}>{p.preco_mensal === null ? "Consultar" : "Assinar"}</Link>
                </Button>
              </TableCell>
            ))}
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
