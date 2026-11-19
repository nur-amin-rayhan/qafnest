import type { MetadataRoute } from "next";
import { hydrateSharedJsonFile } from "@qafnest/shared/serverJsonStore";
import type { SharedBlogPost } from "@qafnest/shared";
import { getServerPublicCmsWorkspace } from "@/lib/cms/serverCmsWorkspace";
import { getServiceRoleClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const DEFAULT_BASE_URL = (
  process.env.NEXT_PUBLIC_GUEST_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://qafnest.com"
).replace(/\/+$/, "");

const CITIES = [
  "riyadh",
  "jeddah",
  "alula",
  "khobar",
  "abha",
  "taif",
  "mecca",
  "dammam",
  "alhafuf",
  "tabuk",
  "buraidah",
];

const STATIC_PUBLIC_PATHS = [
  { path: "", changeFrequency: "daily" as const, priority: 1.0 },
  { path: "/search", changeFrequency: "hourly" as const, priority: 0.9 },
  { path: "/blog", changeFrequency: "daily" as const, priority: 0.85 },
  { path: "/about", changeFrequency: "weekly" as const, priority: 0.7 },
  { path: "/faq", changeFrequency: "weekly" as const, priority: 0.7 },
  { path: "/contact", changeFrequency: "monthly" as const, priority: 0.6 },
  { path: "/terms", changeFrequency: "monthly" as const, priority: 0.5 },
  { path: "/privacy", changeFrequency: "monthly" as const, priority: 0.5 },
  { path: "/cookies", changeFrequency: "monthly" as const, priority: 0.4 },
];

const STANDARD_LEGAL_SLUGS = new Set([
  "privacy",
  "privacy-policy",
  "terms",
  "terms-and-conditions",
  "cookies",
  "cookie-policy",
  "cookies-policy",
]);

function safeDate(raw?: string | null): Date {
  if (!raw) return new Date();
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const cms = await getServerPublicCmsWorkspace();
  if (cms.globals.siteSeo?.robots?.sitemapEnabled === false) {
    return [];
  }

  const baseUrl = (cms.globals.siteSeo?.openGraph?.url || DEFAULT_BASE_URL)
    .trim()
    .replace(/\/+$/, "");

  const routes: MetadataRoute.Sitemap = [];
  const seen = new Set<string>();
  const now = new Date();

  const addBilingualPath = (
    subPath: string,
    lastModified: Date,
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
    priority: number
  ) => {
    for (const locale of ["ar", "en"] as const) {
      const url = `${baseUrl}/${locale}${subPath}`;
      if (seen.has(url)) continue;
      seen.add(url);
      routes.push({
        url,
        lastModified,
        changeFrequency,
        priority,
        alternates: {
          languages: {
            ar: `${baseUrl}/ar${subPath}`,
            en: `${baseUrl}/en${subPath}`,
            "x-default": `${baseUrl}/ar${subPath}`,
          },
        },
      });
    }
  };

  // 0. Primary Canonical Root URL (https://qafnest.com/)
  const rootUrl = `${baseUrl}/`;
  if (!seen.has(rootUrl)) {
    seen.add(rootUrl);
    routes.push({
      url: rootUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
      alternates: {
        languages: {
          ar: `${baseUrl}/ar`,
          en: `${baseUrl}/en`,
          "x-default": `${baseUrl}/ar`,
        },
      },
    });
  }

  // 1. Core public pages (skip /about if noIndex is checked in CMS)
  for (const item of STATIC_PUBLIC_PATHS) {
    if (item.path === "/about" && cms.globals.aboutUs?.noIndex) continue;
    addBilingualPath(item.path, now, item.changeFrequency, item.priority);
  }

  // 2. City search landing pages (synced with enabled CMS destinations when configured)
  const activeCities =
    cms.destinations.length > 0
      ? cms.destinations
          .filter((d) => d.enabled !== false && !d.isMonthly && d.city && d.city !== "all")
          .map((d) => d.city.trim().toLowerCase())
      : CITIES;
  for (const city of Array.from(new Set(activeCities))) {
    addBilingualPath(`/search?city=${encodeURIComponent(city)}`, now, "daily", 0.8);
  }

  // 3. Extra CMS Legal Pages (published custom legal pages)
  for (const leg of cms.legalPages) {
    if (leg.showSection === false || !leg.slug) continue;
    const cleanSlug = leg.slug.trim().toLowerCase();
    if (!cleanSlug || STANDARD_LEGAL_SLUGS.has(cleanSlug)) continue;
    addBilingualPath(
      `/legal/${encodeURIComponent(cleanSlug)}`,
      safeDate(leg.updatedAt),
      "monthly",
      0.5
    );
  }

  // 4. Published CMS Blog Posts (auto-updated immediately upon publish)
  try {
    const blogs = await hydrateSharedJsonFile<SharedBlogPost[]>("cms-blogs.json", () => []);
    for (const post of Array.isArray(blogs) ? blogs : []) {
      if (!post?.slug || post.status !== "published") continue;
      addBilingualPath(
        `/blog/${encodeURIComponent(post.slug)}`,
        safeDate(post.updatedAt || post.createdAt || post.date),
        "weekly",
        0.75
      );
    }
  } catch {
    // non-fatal
  }

  // 5. Approved Live Properties from Supabase
  try {
    const admin = getServiceRoleClient();
    const { data: propRows } = await admin
      .from("properties")
      .select("id, updated_at, created_at, status, is_approved")
      .or("status.eq.approved,is_approved.eq.true")
      .limit(500);

    for (const row of propRows || []) {
      const id = String((row as { id?: string }).id || "").trim();
      if (!id) continue;
      const lm = safeDate(
        (row as { updated_at?: string; created_at?: string }).updated_at ||
          (row as { created_at?: string }).created_at
      );
      addBilingualPath(`/property/${encodeURIComponent(id)}`, lm, "daily", 0.85);
    }
  } catch {
    // non-fatal when offline
  }

  return routes;
}
