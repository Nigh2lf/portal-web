"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ResultadoAcao } from "@/lib/api/types";
import { Campo } from "@/features/contato/components/campo";
import { entrar } from "../actions";

interface Props {
  next?: string;
  /** Mostra a dica de credenciais do mock (só em desenvolvimento). */
  dicaMock?: boolean;
  className?: string;
}

export function LoginForm({ next, dicaMock = false, className }: Props) {
  const [estado, acao, pendente] = useActionState<ResultadoAcao | undefined, FormData>(entrar, undefined);
  const [verSenha, setVerSenha] = useState(false);
  const erroGeral = estado && !estado.ok ? estado.mensagem : undefined;

  return (
    <form action={acao} className={className} noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      <div className="space-y-4">
        {erroGeral && (
          <Alert variant="destructive">
            <AlertDescription>{erroGeral}</AlertDescription>
          </Alert>
        )}
        <Campo label="Seu e-mail" htmlFor="login-email" erro={estado?.erros?.email?.[0]}>
          <Input id="login-email" name="email" type="email" className="h-11" autoComplete="email" required aria-invalid={!!estado?.erros?.email} />
        </Campo>
        <Campo label="Senha" htmlFor="login-senha" erro={estado?.erros?.senha?.[0]}>
          <div className="relative">
            <Input id="login-senha" name="senha" type={verSenha ? "text" : "password"} className="h-11 pr-11" autoComplete="current-password" required aria-invalid={!!estado?.erros?.senha} />
            <button
              type="button"
              onClick={() => setVerSenha((v) => !v)}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground hover:text-foreground"
              aria-label={verSenha ? "Ocultar senha" : "Mostrar senha"}
            >
              {verSenha ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
            </button>
          </div>
        </Campo>
        <div className="flex items-center justify-end">
          <Link href="/recuperar-senha" className="text-sm font-medium text-brand underline-offset-4 hover:underline">
            Esqueci minha senha
          </Link>
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={pendente}>
          {pendente ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <LogIn data-icon="inline-start" />}
          {pendente ? "Entrando..." : "Entrar"}
        </Button>
      </div>
      {dicaMock && (
        <p className="mt-4 rounded-lg bg-highlight/15 px-3 py-2 text-xs text-foreground/80">
          <strong>Ambiente de testes:</strong> use o e-mail de qualquer anunciante e a senha <code className="rounded bg-background px-1">123456</code>.
        </p>
      )}
      <p className="mt-5 text-center text-sm text-muted-foreground">
        Não está cadastrado?{" "}
        <Link href="/cadastro" className="font-semibold text-brand underline-offset-4 hover:underline">
          Cadastre-se
        </Link>
      </p>
    </form>
  );
}
