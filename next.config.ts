import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Em desenvolvimento, mostra cada fetch da API e se veio do cache (HIT/MISS/SKIP).
  logging: { fetches: { fullUrl: true } },
  images: {
    // Fotos de imóveis integrados por XML ficam no servidor de cada anunciante,
    // então qualquer host https é aceito; S3 e mocks entram no mesmo padrão.
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
  experimental: {
    serverActions: { bodySizeLimit: "20mb" },
    // Com `proxy.ts`, o corpo passa antes por um buffer que corta em 10 MB por padrão;
    // sem igualar ao limite da server action, o envio de fotos chegava truncado.
    proxyClientMaxBodySize: "20mb",
  },
};

export default nextConfig;
