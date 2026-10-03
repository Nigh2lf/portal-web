"use client";

import { useState } from "react";
import { MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ContatarForm, type ContatarFormProps } from "./contatar-form";

interface Props extends Omit<ContatarFormProps, "onSucesso" | "className"> {
  /** Elemento que abre o diálogo. */
  children: React.ReactNode;
}

export function ContatarDialog({ children, ...form }: Props) {
  const [aberto, setAberto] = useState(false);
  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto p-6 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg text-brand">
            <MessageSquareText className="size-5" aria-hidden />
            Fale com o anunciante
          </DialogTitle>
          <DialogDescription>
            Imóvel <strong className="text-foreground">{form.codigo}</strong> — {form.titulo}
          </DialogDescription>
        </DialogHeader>
        <ContatarForm {...form} />
      </DialogContent>
    </Dialog>
  );
}

interface BotaoProps extends Omit<ContatarFormProps, "onSucesso" | "className"> {
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "cta";
  className?: string;
  label?: string;
}

/** Botão "Contatar" dos cards: abre o diálogo com o formulário. */
export function ContatarButton({ size = "sm", variant = "outline", className, label = "Contatar", ...form }: BotaoProps) {
  return (
    <ContatarDialog {...form}>
      <Button type="button" size={size} variant={variant === "cta" ? "default" : variant} className={variant === "cta" ? `bg-cta text-cta-foreground hover:bg-cta/90 ${className ?? ""}` : className}>
        <MessageSquareText data-icon="inline-start" />
        {label}
      </Button>
    </ContatarDialog>
  );
}
