import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { NavegacaoProgresso } from "@/components/layout/navegacao-progresso";
import { Toaster } from "@/components/ui/sonner";
import { getPortal } from "@/lib/tenant/get-portal";
import { montarMetadata } from "@/lib/seo/metadata";
import "./globals.css";

const inter = Inter({ variable: "--font-sans", subsets: ["latin"], display: "swap" });
const jakarta = Plus_Jakarta_Sans({ variable: "--font-heading", subsets: ["latin"], display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const portal = await getPortal();
  const i = portal.icones;
  return {
    ...montarMetadata(portal),
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? `https://${portal.dominio}`),
    icons: i
      ? {
          icon: [
            { url: i.favicon, sizes: "any" },
            { url: i.icon_192, type: "image/png", sizes: "192x192" },
            { url: i.icon_512, type: "image/png", sizes: "512x512" },
          ],
          apple: [{ url: i.apple, sizes: "180x180" }],
          shortcut: i.favicon,
        }
      : { icon: "/favicon.ico" },
  };
}

export async function generateViewport(): Promise<Viewport> {
  const portal = await getPortal();
  return { themeColor: portal.cor_primaria, width: "device-width", initialScale: 1 };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const portal = await getPortal();
  return (
    <html lang="pt-BR" data-portal={portal.slug} className={`${inter.variable} ${jakarta.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        {/* useSearchParams exige Suspense; a barra não tem fallback. */}
        <Suspense>
          <NavegacaoProgresso />
        </Suspense>
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
