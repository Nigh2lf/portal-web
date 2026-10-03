import Link from "next/link";
import { Eye } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Imovel } from "@/lib/api/types";
import { formatarData, formatarMoeda, formatarNumero } from "@/lib/utils/format";
import { FotoImovel } from "./foto-imovel";
import { ImovelAcoes } from "./imovel-acoes";
import { DestaqueBadge, StatusBadge } from "./status-badge";

function Precos({ i }: { i: Imovel }) {
  const itens = [
    i.preco_venda ? { r: "Venda", v: formatarMoeda(i.preco_venda) } : null,
    i.preco_locacao ? { r: "Aluguel", v: `${formatarMoeda(i.preco_locacao)}/mês` } : null,
    i.preco_temporada ? { r: "Temporada", v: `${formatarMoeda(i.preco_temporada)}/dia` } : null,
  ].filter((x): x is { r: string; v: string } => Boolean(x));
  if (itens.length === 0) return <span className="text-muted-foreground">Sob consulta</span>;
  return (
    <ul className="flex flex-col gap-0.5 text-sm">
      {itens.map((p) => (
        <li key={p.r} className="whitespace-nowrap">
          <span className="text-xs text-muted-foreground">{p.r}: </span>
          <span className="font-medium tabular-nums">{p.v}</span>
        </li>
      ))}
    </ul>
  );
}

export function ImoveisLista({ imoveis }: { imoveis: Imovel[] }) {
  return (
    <>
      {/* Tabela (md+) */}
      <div className="card-elevated hidden overflow-hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-24">Foto</TableHead>
              <TableHead>Imóvel</TableHead>
              <TableHead>Preços</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Visualizações</TableHead>
              <TableHead>Atualizado</TableHead>
              <TableHead className="w-12 text-right">
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {imoveis.map((i) => (
              <TableRow key={i.id}>
                <TableCell>
                  <Link href={`/painel/imoveis/${i.id}/fotos`} aria-label={`Fotos do imóvel ${i.codigo}`}>
                    <FotoImovel src={i.foto_principal_url} alt="" className="h-14 w-20 rounded-md" sizes="80px" />
                  </Link>
                </TableCell>
                <TableCell className="max-w-xs whitespace-normal">
                  <Link href={`/painel/imoveis/${i.id}/editar`} className="font-medium hover:text-brand hover:underline">
                    {i.titulo}
                  </Link>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Cód. <span className="font-medium text-foreground">{i.codigo}</span> · {i.tipo_nome} · {i.fotos.length} {i.fotos.length === 1 ? "foto" : "fotos"}
                  </p>
                </TableCell>
                <TableCell>
                  <Precos i={i} />
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    <StatusBadge imovel={i} />
                    {i.tipo_anuncio !== "normal" && <DestaqueBadge tipo={i.tipo_anuncio} />}
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums">{formatarNumero(i.visualizacoes)}</TableCell>
                <TableCell className="text-muted-foreground">
                  <time dateTime={i.atualizado_em}>{formatarData(i.atualizado_em)}</time>
                </TableCell>
                <TableCell className="text-right">
                  <ImovelAcoes imovel={i} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Cards (mobile) */}
      <ul className="flex flex-col gap-3 md:hidden">
        {imoveis.map((i) => (
          <li key={i.id} className="card-elevated flex gap-3 p-3">
            <Link href={`/painel/imoveis/${i.id}/fotos`} aria-label={`Fotos do imóvel ${i.codigo}`} className="shrink-0">
              <FotoImovel src={i.foto_principal_url} alt="" className="h-20 w-24 rounded-md" sizes="96px" />
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Cód. {i.codigo}</p>
                  <Link href={`/painel/imoveis/${i.id}/editar`} className="line-clamp-2 text-sm font-medium hover:text-brand">
                    {i.titulo}
                  </Link>
                </div>
                <ImovelAcoes imovel={i} />
              </div>
              <div className="mt-1.5">
                <Precos i={i} />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <StatusBadge imovel={i} />
                {i.tipo_anuncio !== "normal" && <DestaqueBadge tipo={i.tipo_anuncio} />}
                <span className="ml-auto inline-flex items-center gap-1 tabular-nums">
                  <Eye className="size-3.5" aria-hidden /> {formatarNumero(i.visualizacoes)}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
