"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Mensagem } from "@/lib/api/types";
import { formatarTelefone, linkWhatsApp, truncar } from "@/lib/utils/format";
import { PREFERENCIAS_LABEL, formatarDataHora } from "../utils";

const ORIGEM_LABEL: Record<Mensagem["origem"], string> = { imovel: "Anúncio", hotsite: "Hotsite", mobile: "Celular" };

function Contatos({ m, compacto }: { m: Mensagem; compacto?: boolean }) {
  const tel = m.telefone.replace(/\D/g, "");
  return (
    <div className={compacto ? "flex flex-wrap gap-1.5" : "flex flex-col gap-1 text-sm"}>
      <a href={`mailto:${m.email}`} className="inline-flex items-center gap-1.5 text-brand hover:underline">
        <Mail className="size-3.5" aria-hidden /> <span className="truncate">{m.email}</span>
      </a>
      {tel && (
        <span className="inline-flex items-center gap-2">
          <a href={`tel:+55${tel}`} className="inline-flex items-center gap-1.5 hover:underline">
            <Phone className="size-3.5" aria-hidden /> {formatarTelefone(m.telefone)}
          </a>
          <a href={linkWhatsApp(tel, `Olá ${m.nome.split(" ")[0]}, recebi seu contato sobre o imóvel ${m.imovel_codigo ?? ""}.`)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-success hover:underline" aria-label={`Abrir WhatsApp de ${m.nome}`}>
            <MessageCircle className="size-3.5" aria-hidden /> WhatsApp
          </a>
        </span>
      )}
    </div>
  );
}

function Preferencias({ m }: { m: Mensagem }) {
  if (m.preferencias.length === 0) return <span className="text-xs text-muted-foreground">--</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {m.preferencias.map((p) => (
        <Badge key={p} variant="outline" className="h-4.5 text-[10px]">
          {PREFERENCIAS_LABEL[p]}
        </Badge>
      ))}
    </div>
  );
}

function ImovelRef({ m }: { m: Mensagem }) {
  if (!m.imovel_codigo) return <span className="text-muted-foreground">Contato geral</span>;
  return (
    <div className="min-w-0">
      <span className="font-medium">{m.imovel_codigo}</span>
      {m.imovel_titulo && (
        <p className="truncate text-xs text-muted-foreground" title={m.imovel_titulo}>
          {m.imovel_titulo}
        </p>
      )}
    </div>
  );
}

export function OfertasTabela({ mensagens, slugs }: { mensagens: Mensagem[]; slugs: Record<string, string> }) {
  const [aberta, setAberta] = useState<Mensagem | null>(null);

  const linkImovel = (m: Mensagem) => (m.imovel_id && slugs[m.imovel_id] ? `/imovel/${slugs[m.imovel_id]}` : null);

  return (
    <>
      <div className="card-elevated hidden overflow-hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Data</TableHead>
              <TableHead>Imóvel</TableHead>
              <TableHead>Interessado</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Prefere</TableHead>
              <TableHead>Mensagem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mensagens.map((m) => {
              const href = linkImovel(m);
              return (
                <TableRow key={m.id}>
                  <TableCell className="text-muted-foreground tabular-nums">
                    <time dateTime={m.criado_em}>{formatarDataHora(m.criado_em)}</time>
                  </TableCell>
                  <TableCell className="max-w-56">
                    {href ? (
                      <Link href={href} target="_blank" rel="noopener" className="block hover:text-brand">
                        <ImovelRef m={m} />
                      </Link>
                    ) : (
                      <ImovelRef m={m} />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{m.nome}</TableCell>
                  <TableCell className="max-w-60">
                    <Contatos m={m} />
                  </TableCell>
                  <TableCell>
                    <Preferencias m={m} />
                  </TableCell>
                  <TableCell className="max-w-xs whitespace-normal">
                    <p className="text-sm text-foreground/80">{truncar(m.mensagem, 90)}</p>
                    <Button variant="link" size="xs" className="h-auto px-0" onClick={() => setAberta(m)}>
                      Ver detalhes
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <ul className="flex flex-col gap-3 md:hidden">
        {mensagens.map((m) => {
          const href = linkImovel(m);
          return (
            <li key={m.id} className="card-elevated flex flex-col gap-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium">{m.nome}</p>
                  <time dateTime={m.criado_em} className="text-xs text-muted-foreground tabular-nums">
                    {formatarDataHora(m.criado_em)}
                  </time>
                </div>
                <Badge variant="secondary">{ORIGEM_LABEL[m.origem]}</Badge>
              </div>
              {href ? (
                <Link href={href} target="_blank" rel="noopener" className="text-sm hover:text-brand">
                  <ImovelRef m={m} />
                </Link>
              ) : (
                <div className="text-sm">
                  <ImovelRef m={m} />
                </div>
              )}
              <p className="text-sm text-foreground/80">{truncar(m.mensagem, 160)}</p>
              <Contatos m={m} compacto />
              <div className="flex items-center justify-between gap-2 pt-1">
                <Preferencias m={m} />
                <Button variant="outline" size="sm" onClick={() => setAberta(m)}>
                  Detalhes
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      <Dialog open={aberta !== null} onOpenChange={(o) => !o && setAberta(null)}>
        <DialogContent className="sm:max-w-lg">
          {aberta && (
            <>
              <DialogHeader>
                <DialogTitle>Mensagem de {aberta.nome}</DialogTitle>
                <DialogDescription>
                  Recebida em {formatarDataHora(aberta.criado_em)} via {ORIGEM_LABEL[aberta.origem].toLowerCase()}
                  {aberta.imovel_codigo && (
                    <>
                      {" "}
                      sobre o imóvel <strong>{aberta.imovel_codigo}</strong>
                    </>
                  )}
                  .
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 text-sm">
                {aberta.imovel_titulo && (
                  <div>
                    <p className="text-xs text-muted-foreground">Imóvel</p>
                    {linkImovel(aberta) ? (
                      <Link href={linkImovel(aberta)!} target="_blank" rel="noopener" className="font-medium text-brand hover:underline">
                        {aberta.imovel_titulo}
                      </Link>
                    ) : (
                      <p className="font-medium">{aberta.imovel_titulo}</p>
                    )}
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">Contato</p>
                  <Contatos m={aberta} />
                </div>
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">Prefere ser contatado por</p>
                  <Preferencias m={aberta} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Mensagem</p>
                  <p className="mt-1 rounded-lg bg-muted/60 p-3 leading-relaxed whitespace-pre-line">{aberta.mensagem}</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
