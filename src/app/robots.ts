import type { MetadataRoute } from "next";
import { getPortal, urlAbsoluta } from "@/lib/tenant/get-portal";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const portal = await getPortal();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/painel", "/painel/", "/api/", "/recuperar-senha", "/favoritos"],
      },
    ],
    sitemap: urlAbsoluta(portal, "/sitemap.xml"),
    host: urlAbsoluta(portal, "/").replace(/\/$/, ""),
  };
}
