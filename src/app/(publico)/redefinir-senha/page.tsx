import type { Metadata } from "next";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { RedefinirSenhaForm } from "@/features/conta/components/redefinir-senha-form";
import { montarMetadata } from "@/lib/seo/metadata";
import { getPortal } from "@/lib/tenant/get-portal";

export async function generateMetadata(): Promise<Metadata> {
  const portal = await getPortal();
  return montarMetadata(portal, { titulo: "Redefinir senha", path: "/redefinir-senha", noindex: true });
}

export default async function RedefinirSenhaPage({ searchParams }: PageProps<"/redefinir-senha">) {
  const sp = await searchParams;
  const email = typeof sp.email === "string" ? sp.email : "";
  const hash = typeof sp.hash === "string" ? sp.hash : "";
  const valido = Boolean(email && hash);
  return (
    <section className="bg-gradient-to-br from-brand-soft/60 via-background to-background">
      <Container className="flex min-h-[60vh] items-center justify-center py-14">
        <div className="card-elevated w-full max-w-md p-6 sm:p-8">
          <span className="flex size-12 items-center justify-center rounded-xl bg-brand-soft text-brand">
            <LockKeyhole className="size-6" aria-hidden />
          </span>
          <h1 className="mt-4 text-2xl font-bold">Redefinir senha</h1>
          {valido ? (
            <>
              <p className="mt-1 text-sm text-muted-foreground">Crie uma nova senha para <strong>{email}</strong>.</p>
              <div className="mt-6">
                <RedefinirSenhaForm email={email} hash={hash} />
              </div>
            </>
          ) : (
            <>
              <p className="mt-1 text-sm text-muted-foreground">Este link está incompleto ou expirou. Peça um novo link de recuperação.</p>
              <Button asChild className="mt-6">
                <Link href="/recuperar-senha">Recuperar senha</Link>
              </Button>
            </>
          )}
        </div>
      </Container>
    </section>
  );
}
