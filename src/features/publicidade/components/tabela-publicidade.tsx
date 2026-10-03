import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { TabelaPublicidade } from "@/lib/api/types";
import { formatarMoeda } from "@/lib/utils/format";

export function TabelaPrecosPublicidade({ itens }: { itens: TabelaPublicidade[] }) {
  return (
    <>
      {/* Desktop */}
      <div className="card-elevated hidden overflow-hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[90px]">Código</TableHead>
              <TableHead>Página</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Tamanho</TableHead>
              <TableHead>Observação</TableHead>
              <TableHead className="text-right">Valor / mês</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {itens.map((i) => (
              <TableRow key={i.codigo}>
                <TableCell className="font-mono text-xs font-semibold text-brand">{i.codigo}</TableCell>
                <TableCell className="font-medium">{i.pagina}</TableCell>
                <TableCell>{i.tipo}</TableCell>
                <TableCell className="tabular-nums">{i.tamanho.replace("x", " × ")} px</TableCell>
                <TableCell className="text-muted-foreground">{i.observacao || "—"}</TableCell>
                <TableCell className="text-right font-semibold">{formatarMoeda(i.preco_mensal, true)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {/* Mobile */}
      <ul className="grid gap-3 md:hidden">
        {itens.map((i) => (
          <li key={i.codigo} className="card-elevated p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs font-semibold text-brand">{i.codigo}</p>
                <p className="font-semibold">
                  {i.pagina} · {i.tipo}
                </p>
              </div>
              <p className="font-heading text-lg font-bold">{formatarMoeda(i.preco_mensal, true)}</p>
            </div>
            <dl className="mt-2 text-sm text-muted-foreground">
              <div className="flex gap-2">
                <dt className="font-medium">Tamanho:</dt>
                <dd>{i.tamanho.replace("x", " × ")} px</dd>
              </div>
              {i.observacao && (
                <div className="flex gap-2">
                  <dt className="font-medium">Obs.:</dt>
                  <dd>{i.observacao}</dd>
                </div>
              )}
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}
