import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { EstatisticaMensal } from "@/lib/api/types";
import { formatarMesAno, formatarNumero } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import { formatarMesCurto } from "../utils";

interface Serie {
  chave: keyof Omit<EstatisticaMensal, "ano_mes">;
  titulo: string;
  descricao: string;
}

const SERIES: Serie[] = [
  { chave: "visualizacoes", titulo: "Visualizações por mês", descricao: "Quantas vezes seus anúncios foram abertos." },
  { chave: "mensagens", titulo: "Mensagens por mês", descricao: "Contatos enviados pelo formulário dos anúncios." },
];

function Barras({ dados, serie }: { dados: EstatisticaMensal[]; serie: Serie }) {
  const valores = dados.map((d) => d[serie.chave]);
  const maximo = Math.max(1, ...valores);
  const ultimo = dados.length - 1;
  return (
    <figure className="card-elevated flex flex-col gap-3 p-4">
      <figcaption>
        <h3 className="text-sm font-semibold">{serie.titulo}</h3>
        <p className="text-xs text-muted-foreground">{serie.descricao}</p>
      </figcaption>
      <ol className="flex h-40 items-end gap-2 border-b" aria-label={serie.titulo}>
        {dados.map((d, idx) => {
          const v = d[serie.chave];
          const alt = Math.max(v > 0 ? 3 : 1, Math.round((v / maximo) * 100));
          const destaque = idx === ultimo;
          return (
            <li key={d.ano_mes} className="flex h-full flex-1 flex-col items-center justify-end gap-1" aria-label={`${formatarMesAno(d.ano_mes)}: ${formatarNumero(v)}`}>
              <span className={cn("text-xs tabular-nums", destaque ? "font-semibold text-foreground" : "text-muted-foreground")} aria-hidden>
                {formatarNumero(v)}
              </span>
              <div className="flex w-full justify-center px-1" style={{ height: `${alt}%` }}>
                <div className={cn("w-full max-w-10 rounded-t-[4px] transition-[height]", destaque ? "bg-brand" : "bg-brand/55")} title={`${formatarMesAno(d.ano_mes)}: ${formatarNumero(v)}`} />
              </div>
            </li>
          );
        })}
      </ol>
      <ol className="flex gap-2" aria-hidden>
        {dados.map((d) => (
          <li key={d.ano_mes} className="flex-1 text-center text-[11px] text-muted-foreground capitalize">
            {formatarMesCurto(d.ano_mes)}
          </li>
        ))}
      </ol>
    </figure>
  );
}

/**
 * Comparativo mensal como barras em CSS (sem biblioteca de gráficos), uma
 * série por figura, com tabela equivalente para leitores de tela e impressão.
 */
export function GraficoBarras({ dados }: { dados: EstatisticaMensal[] }) {
  const cronologico = [...dados].sort((a, b) => a.ano_mes.localeCompare(b.ano_mes));
  if (cronologico.length === 0) return null;
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        {SERIES.map((s) => (
          <Barras key={s.chave} dados={cronologico} serie={s} />
        ))}
      </div>
      <details className="card-elevated group p-4">
        <summary className="cursor-pointer text-sm font-medium select-none">Ver dados mensais em tabela</summary>
        <div className="mt-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mês</TableHead>
                <TableHead className="text-right">Imóveis</TableHead>
                <TableHead className="text-right">Visualizações</TableHead>
                <TableHead className="text-right">Telefone</TableHead>
                <TableHead className="text-right">WhatsApp</TableHead>
                <TableHead className="text-right">Mensagens</TableHead>
                <TableHead className="text-right">Encomendas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cronologico.map((d) => (
                <TableRow key={d.ano_mes}>
                  <TableCell className="capitalize">{formatarMesAno(d.ano_mes)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatarNumero(d.imoveis)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatarNumero(d.visualizacoes)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatarNumero(d.cliques_telefone)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatarNumero(d.cliques_whatsapp)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatarNumero(d.mensagens)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatarNumero(d.encomendas)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </details>
    </div>
  );
}
