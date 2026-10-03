import type { Metadata } from "next";
import { KeyRound } from "lucide-react";
import { Container } from "@/components/layout/container";
import { RecuperarSenhaForm } from "@/features/conta/components/recuperar-senha-form";
import { montarMetadata } from "@/lib/seo/metadata";
import { getPortal } from "@/lib/tenant/get-portal";

export async function generateMetadata(): Promise<Metadata> {
  const portal = await getPortal();
  return montarMetadata(portal, { titulo: "Recuperar senha", path: "/recuperar-senha", noindex: true });
}

export default async function RecuperarSenhaPage() {
  const portal = await getPortal();
  return (
    <section className="bg-gradient-to-br from-brand-soft/60 via-background to-background">
      <Container className="flex min-h-[60vh] items-center justify-center py-14">
        <div className="card-elevated w-full max-w-md p-6 sm:p-8">
          <span className="flex size-12 items-center justify-center rounded-xl bg-brand-soft text-brand">
            <KeyRound className="size-6" aria-hidden />
          </span>
          <h1 className="mt-4 text-2xl font-bold">Recuperar senha</h1>
          <p className="mt-1 text-sm text-muted-foreground">Informe o e-mail da sua conta no {portal.nome} e enviaremos um link para criar uma nova senha.</p>
          <div className="mt-6">
            <RecuperarSenhaForm />
          </div>
        </div>
      </Container>
    </section>
  );
}
