"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, ImageIcon, Loader2, MoreHorizontal, Pencil, Power, PowerOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Imovel } from "@/lib/api/types";
import { alternarAtivoAction, excluirImovelAction } from "../actions";
import { linkPreview } from "../utils";

interface Props {
  imovel: Pick<Imovel, "id" | "codigo" | "titulo" | "slug" | "ativo">;
}

export function ImovelAcoes({ imovel }: Props) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);

  function alternar() {
    iniciar(async () => {
      const r = await alternarAtivoAction(imovel.id);
      if (r.ok) toast.success(r.mensagem);
      else toast.error(r.mensagem ?? "Não foi possível alterar o status.");
      router.refresh();
    });
  }

  function excluir() {
    iniciar(async () => {
      const r = await excluirImovelAction(imovel.id);
      setConfirmarExclusao(false);
      if (r.ok) toast.success(r.mensagem ?? "Imóvel excluído.");
      else toast.error(r.mensagem ?? "Não foi possível excluir o imóvel.");
      router.refresh();
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Ações do imóvel ${imovel.codigo}`} disabled={pendente}>
            {pendente ? <Loader2 className="animate-spin" /> : <MoreHorizontal />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel>Imóvel {imovel.codigo}</DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link href={`/painel/imoveis/${imovel.id}/editar`}>
              <Pencil /> Editar
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/painel/imoveis/${imovel.id}/fotos`}>
              <ImageIcon /> Fotos
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={linkPreview(imovel)} target="_blank" rel="noopener noreferrer">
              <Eye /> Pré-visualizar
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={alternar}>
            {imovel.ativo ? (
              <>
                <PowerOff /> Desativar
              </>
            ) : (
              <>
                <Power /> Ativar
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirmarExclusao(true)}>
            <Trash2 /> Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmarExclusao} onOpenChange={setConfirmarExclusao}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir imóvel {imovel.codigo}?</DialogTitle>
            <DialogDescription>
              Esta ação remove o anúncio, as fotos e as estatísticas de <strong>{imovel.titulo}</strong>. Não é possível desfazer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={pendente}>
                Cancelar
              </Button>
            </DialogClose>
            <Button variant="destructive" onClick={excluir} disabled={pendente}>
              {pendente ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <Trash2 data-icon="inline-start" />}
              Excluir definitivamente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
