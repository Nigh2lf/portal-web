import Link from "next/link";

/** Fallback mínimo fora do grupo (publico); o 404 completo está em `(publico)/not-found.tsx`. */
export default function RootNotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <p className="font-heading text-sm font-semibold tracking-widest text-muted-foreground uppercase">Erro 404</p>
      <h1 className="mt-2 text-3xl font-bold text-brand">Página não encontrada</h1>
      <p className="mt-3 max-w-md text-muted-foreground">O endereço pode ter mudado ou não existe mais.</p>
      <Link href="/" className="mt-6 inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-medium text-brand-foreground hover:bg-brand/90">
        Voltar à página inicial
      </Link>
    </main>
  );
}
