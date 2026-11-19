import type { MetadataRoute } from "next";
import { getServerPublicCmsWorkspace } from "@/lib/cms/serverCmsWorkspace";

export const dynamic = "force-dynamic";

const DEFAULT_BASE_URL = (
  process.env.NEXT_PUBLIC_GUEST_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://qafnest.com"
).replace(/\/+$/, "");

const DEFAULT_DISALLOW = [
  "/api/",
  "/auth/",
  "/my-bookings",
  "/ar/my-bookings",
  "/en/my-bookings",
  "/account",
  "/ar/account",
  "/en/account",
  "/wishlist",
  "/ar/wishlist",
  "/en/wishlist",
  "/*?*payment=*",
];

export default async function robots(): Promise<MetadataRoute.Robots> {
  const cms = await getServerPublicCmsWorkspace();
  const seo = cms.globals.siteSeo;
  const baseUrl = (seo?.openGraph?.url || DEFAULT_BASE_URL).trim().replace(/\/+$/, "");
  const sitemapEnabled = seo?.robots?.sitemapEnabled !== false;

  if (seo?.robots?.noIndex) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
      ...(sitemapEnabled ? { sitemap: `${baseUrl}/sitemap.xml` } : {}),
    };
  }

  const extraAllow: string[] = [];
  const extraDisallow: string[] = [];
  const customLines = String(seo?.robots?.customRules || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));

  for (const rawLine of customLines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const allowMatch = /^(?:allow:\s*|\+\s*)(.+)$/i.exec(line);
    if (allowMatch?.[1]) {
      const p = allowMatch[1].trim();
      if (p) extraAllow.push(p.startsWith("/") ? p : `/${p}`);
      continue;
    }
    const disallowMatch = /^(?:disallow:\s*|-\s*)(.+)$/i.exec(line);
    if (disallowMatch?.[1]) {
      const p = disallowMatch[1].trim();
      if (p) extraDisallow.push(p.startsWith("/") ? p : `/${p}`);
      continue;
    }
    // If user simply entered a path like "/test" or "/api/internal", treat as Disallow
    if (line.startsWith("/")) {
      extraDisallow.push(line);
    }
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: Array.from(new Set(["/", "/ar/", "/en/", ...extraAllow])),
        disallow: Array.from(new Set([...DEFAULT_DISALLOW, ...extraDisallow])),
      },
    ],
    ...(sitemapEnabled ? { sitemap: `${baseUrl}/sitemap.xml` } : {}),
  };
}
