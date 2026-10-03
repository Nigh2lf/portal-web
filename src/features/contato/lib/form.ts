import type { z } from "zod";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import type { ResultadoAcao } from "@/lib/api/types";

/** Converte os issues do zod no formato `erros` de `ResultadoAcao` (campo → mensagens). */
export function errosDoZod(error: z.ZodError): Record<string, string[]> {
  const erros: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const chave = issue.path.length ? issue.path.map(String).join(".") : "_form";
    (erros[chave] ??= []).push(issue.message);
  }
  return erros;
}

/** Aplica os `erros` devolvidos por um server action nos campos do react-hook-form. */
export function aplicarErros<T extends FieldValues>(resultado: ResultadoAcao, setError: UseFormSetError<T>) {
  if (!resultado.erros) return;
  for (const [campo, mensagens] of Object.entries(resultado.erros)) {
    if (campo === "_form" || !mensagens?.length) continue;
    setError(campo as Path<T>, { type: "server", message: mensagens[0] });
  }
}

/** Mensagem geral de erro (fora dos campos) de um `ResultadoAcao`. */
export function mensagemErro(resultado: ResultadoAcao, padrao = "Não foi possível concluir. Tente novamente.") {
  return resultado.mensagem ?? resultado.erros?._form?.[0] ?? padrao;
}
