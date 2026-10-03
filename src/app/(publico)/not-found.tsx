import Link from "next/link";
import { ArrowRight, Home, Search, SearchX } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getRepository } from "@/lib/api";
import { getPortal } from "@/lib/tenant/get-portal";

export default async function NotFound() {
  const [portal, repo] = await Promise.all([getPortal(), getRepository()]);
  const populares = await repo.getPesquisasPopulares(portal.id, 12).catch(() => []);

  return (
    <section className="bg-gradient-to-br from-brand-soft/60 via-background to-background">
      <Container className="py-16 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-brand-soft text-brand">
            <SearchX className="size-8" aria-hidden />
          </span>
          <p className="mt-6 font-heading text-sm font-semibold tracking-widest text-muted-foreground uppercase">Erro 404</p>
          <h1 className="mt-2 text-3xl font-bold text-brand sm:text-4xl">Oops! Não encontramos esta página</h1>
          <p className="mt-3 text-muted-foreground">O endereço pode ter mudado ou o imóvel já foi negociado. Que tal uma nova busca?</p>

          <form action="/imoveis" method="get" className="mx-auto mt-8 flex max-w-lg gap-2" role="search">
            <label htmlFor="busca-404" className="sr-only">
              Código do imóvel
            </label>
            <Input id="busca-404" name="codigo" placeholder="Buscar por código do imóvel" className="h-12 flex-1 bg-card text-base" />
            <Button type="submit" size="lg">
              <Search data-icon="inline-start" />
              Buscar
            </Button>
          </form>

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/">
                <Home data-icon="inline-start" />
                Página inicial
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/imoveis">Todos os imóveis</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/imobiliarias">Imobiliárias</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/contato">Contato</Link>
            </Button>
          </div>
        </div>

        {populares.length > 0 && (
          <div className="mx-auto mt-14 max-w-4xl">
            <h2 className="text-center text-lg font-semibold">Imóveis mais procurados</h2>
            <ul className="mt-4 flex flex-wrap justify-center gap-2">
              {populares.map((p) => (
                <li key={p.href}>
                  <Link href={p.href} className="inline-flex items-center gap-1 rounded-full border bg-card px-3 py-1.5 text-sm text-foreground/80 transition-colors hover:border-brand hover:text-brand">
                    {p.label}
                    <ArrowRight className="size-3.5" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Container>
    </section>
  );
}
