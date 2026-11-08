import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Em desenvolvimento, mostra cada fetch da API e se veio do cache (HIT/MISS/SKIP).
  logging: { fetches: { fullUrl: true } },
  images: {
    // Fotos de imóveis integrados por XML ficam no servidor de cada anunciante,
    // então qualquer host é aceito; S3 e mocks entram no mesmo padrão. Muitos feeds
    // ainda mandam `http://` (às vezes com redirecionamento para https, que o
    // otimizador segue): o navegador recebe a imagem pelo nosso domínio em https.
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
    // As versões otimizadas ficam em `.next/cache/images`; sem limite o disco do
    // servidor (16 GB, compartilhado) enche. As mais antigas saem primeiro.
    maximumDiskCacheSize: 2_000_000_000,
  },
  experimental: {
    serverActions: { bodySizeLimit: "20mb" },
    // Com `proxy.ts`, o corpo passa antes por um buffer que corta em 10 MB por padrão;
    // sem igualar ao limite da server action, o envio de fotos chegava truncado.
    proxyClientMaxBodySize: "20mb",
  },
};

export default nextConfig;
