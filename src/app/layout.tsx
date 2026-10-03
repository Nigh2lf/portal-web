import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { getPortal } from "@/lib/tenant/get-portal";
import { montarMetadata } from "@/lib/seo/metadata";
import "./globals.css";

const inter = Inter({ variable: "--font-sans", subsets: ["latin"], display: "swap" });
const jakarta = Plus_Jakarta_Sans({ variable: "--font-heading", subsets: ["latin"], display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const portal = await getPortal();
  return {
    ...montarMetadata(portal),
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? `https://${portal.dominio}`),
    icons: { icon: "/favicon.ico" },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const portal = await getPortal();
  return (
    <html lang="pt-BR" data-portal={portal.slug} className={`${inter.variable} ${jakarta.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
