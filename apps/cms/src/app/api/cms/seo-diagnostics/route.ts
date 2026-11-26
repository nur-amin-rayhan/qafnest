import { NextRequest, NextResponse } from "next/server";
import { hydrateSharedJsonFile } from "@qafnest/shared/serverJsonStore";
import type { SharedBlogPost } from "@qafnest/shared";
import { createAdminDataClient, isAdminRequest } from "@/lib/adminApi";
import { createDefaultCmsWorkspace } from "@/data/cmsWorkspaceDefaults";
import type { CmsWorkspaceData } from "@/types/cms";

export const dynamic = "force-dynamic";

const DEFAULT_BASE_URL = (
  process.env.NEXT_PUBLIC_GUEST_URL || "https://qafnest.com"
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
  { path: "", changeFrequency: "daily", priority: 1.0 },
  { path: "/search", changeFrequency: "hourly", priority: 0.9 },
  { path: "/blog", changeFrequency: "daily", priority: 0.85 },
  { path: "/about", changeFrequency: "weekly", priority: 0.7 },
  { path: "/faq", changeFrequency: "weekly", priority: 0.7 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.6 },
  { path: "/terms", changeFrequency: "monthly", priority: 0.5 },
  { path: "/privacy", changeFrequency: "monthly", priority: 0.5 },
  { path: "/cookies", changeFrequency: "monthly", priority: 0.4 },
];

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

const STANDARD_LEGAL_SLUGS = new Set([
  "privacy",
  "privacy-policy",
  "terms",
  "terms-and-conditions",
  "cookies",
  "cookie-policy",
  "cookies-policy",
]);

interface SitemapEntryPreview {
  url: string;
  source: "static" | "city" | "blog" | "legal" | "property";
  changeFrequency: string;
  priority: number;
  lastModified: string;
}

interface ExcludedUrlEntry {
  url: string;
  source: "static" | "city" | "blog" | "legal" | "property" | "robots";
  reason: string;
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const defaults = createDefaultCmsWorkspace();
    const rawWs = await hydrateSharedJsonFile<Partial<CmsWorkspaceData>>(
      "cms-workspace-v2.json",
      () => defaults
    );
    const siteSeo = {
      ...defaults.globals.siteSeo,
      ...(rawWs?.globals?.siteSeo || {}),
      robots: {
        ...defaults.globals.siteSeo.robots,
        ...(rawWs?.globals?.siteSeo?.robots || {}),
      },
    };
    const gtm = rawWs?.globals?.gtm ?? defaults.globals.gtm;
    const aboutUs = rawWs?.globals?.aboutUs ?? defaults.globals.aboutUs;
    const legalPages = Array.isArray(rawWs?.legalPages)
      ? rawWs.legalPages
      : defaults.legalPages;
    const destinations =
      Array.isArray(rawWs?.destinations) && rawWs.destinations.length > 0
        ? rawWs.destinations
        : defaults.destinations;

    const baseUrl = (siteSeo.openGraph?.url || DEFAULT_BASE_URL)
      .trim()
      .replace(/\/+$/, "");
    const sitemapEnabled = siteSeo.robots.sitemapEnabled !== false;
    const nowIso = new Date().toISOString();

    const urls: SitemapEntryPreview[] = [];
    const excludedUrls: ExcludedUrlEntry[] = [];
    const seen = new Set<string>();
    const pushBilingual = (
      subPath: string,
      source: SitemapEntryPreview["source"],
      changeFrequency: string,
      priority: number,
      lastModified: string
    ) => {
      for (const locale of ["ar", "en"] as const) {
        const url = `${baseUrl}/${locale}${subPath}`;
        if (seen.has(url)) continue;
        seen.add(url);
        urls.push({ url, source, changeFrequency, priority, lastModified });
      }
    };

    if (sitemapEnabled) {
      // 0. Primary Canonical Root URL
      const rootCanonical = `${baseUrl}/`;
      if (!seen.has(rootCanonical)) {
        seen.add(rootCanonical);
        urls.push({
          url: rootCanonical,
          source: "static",
          changeFrequency: "daily",
          priority: 1.0,
          lastModified: nowIso,
        });
      }

      for (const item of STATIC_PUBLIC_PATHS) {
        if (item.path === "/about" && aboutUs?.noIndex) {
          excludedUrls.push({
            url: `${baseUrl}/en/about`,
            source: "static",
            reason: "Marked No Index in CMS About Us settings",
          });
          continue;
        }
        pushBilingual(item.path, "static", item.changeFrequency, item.priority, nowIso);
      }

      const enabledCityList = destinations
        .filter((d) => !d.isMonthly && d.city && d.city !== "all");
      for (const dest of enabledCityList) {
        const cleanCity = dest.city.trim().toLowerCase();
        if (dest.enabled === false) {
          excludedUrls.push({
            url: `${baseUrl}/en/search?city=${encodeURIComponent(cleanCity)}`,
            source: "city",
            reason: `Destination "${dest.name?.en || cleanCity}" is toggled OFF in CMS`,
          });
          continue;
        }
        pushBilingual(`/search?city=${encodeURIComponent(cleanCity)}`, "city", "daily", 0.8, nowIso);
      }
      if (enabledCityList.length === 0) {
        for (const city of CITIES) {
          pushBilingual(`/search?city=${city}`, "city", "daily", 0.8, nowIso);
        }
      }

      for (const leg of legalPages) {
        if (!leg.slug) continue;
        const cleanSlug = leg.slug.trim().toLowerCase();
        if (leg.showSection === false) {
          excludedUrls.push({
            url: `${baseUrl}/en/legal/${encodeURIComponent(cleanSlug)}`,
            source: "legal",
            reason: `Legal page "${leg.title?.en || cleanSlug}" is hidden (Show Section OFF)`,
          });
          continue;
        }
        if (!cleanSlug || STANDARD_LEGAL_SLUGS.has(cleanSlug)) continue;
        pushBilingual(
          `/legal/${encodeURIComponent(cleanSlug)}`,
          "legal",
          "monthly",
          0.5,
          leg.updatedAt || nowIso
        );
      }

      try {
        const blogs = await hydrateSharedJsonFile<SharedBlogPost[]>("cms-blogs.json", () => []);
        for (const post of Array.isArray(blogs) ? blogs : []) {
          if (!post?.slug) continue;
          if (post.status !== "published") {
            excludedUrls.push({
              url: `${baseUrl}/en/blog/${encodeURIComponent(post.slug)}`,
              source: "blog",
              reason: `Blog "${post.titleEn || post.slug}" is in Draft status (not published)`,
            });
            continue;
          }
          pushBilingual(
            `/blog/${encodeURIComponent(post.slug)}`,
            "blog",
            "weekly",
            0.75,
            post.updatedAt || post.createdAt || post.date || nowIso
          );
        }
      } catch {
        // non-fatal
      }

      try {
        const supabase = createAdminDataClient();
        if (supabase) {
          const { data: propRows } = await supabase
            .from("properties")
            .select("id, title, updated_at, created_at, status, is_approved")
            .limit(500);
          for (const row of propRows || []) {
            const p = row as {
              id?: string;
              title?: string;
              updated_at?: string;
              created_at?: string;
              status?: string;
              is_approved?: boolean;
            };
            const id = String(p.id || "").trim();
            if (!id) continue;
            const isApproved = p.status === "approved" || Boolean(p.is_approved);
            if (!isApproved) {
              excludedUrls.push({
                url: `${baseUrl}/en/property/${encodeURIComponent(id)}`,
                source: "property",
                reason: `Property "${p.title || id.slice(0, 8)}" status is "${p.status || "pending"}" (not approved)`,
              });
              continue;
            }
            const lm = p.updated_at || p.created_at || nowIso;
            pushBilingual(`/property/${encodeURIComponent(id)}`, "property", "daily", 0.85, lm);
          }
        }
      } catch {
        // non-fatal
      }
    } else {
      excludedUrls.push({
        url: `${baseUrl}/sitemap.xml`,
        source: "robots",
        reason: "Dynamic sitemap.xml generation is disabled in Site SEO settings",
      });
    }

    for (const dis of DEFAULT_DISALLOW) {
      excludedUrls.push({
        url: `${baseUrl}${dis}`,
        source: "robots",
        reason: "Protected private/system path blocked by robots.txt Disallow rule",
      });
    }

    // Build exact robots.txt preview matching apps/guest/src/app/robots.ts
    const robotsLines: string[] = ["User-Agent: *"];
    if (siteSeo.robots.noIndex) {
      robotsLines.push("Disallow: /");
    } else {
      const extraAllow: string[] = [];
      const extraDisallow: string[] = [];
      const customLines = String(siteSeo.robots.customRules || "")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#"));
      for (const rawLine of customLines) {
        const line = rawLine.trim();
        if (!line || line.startsWith("#")) continue;

        const am = /^(?:allow:\s*|\+\s*)(.+)$/i.exec(line);
        if (am?.[1]) {
          const p = am[1].trim();
          if (p) extraAllow.push(p.startsWith("/") ? p : `/${p}`);
          continue;
        }
        const dm = /^(?:disallow:\s*|-\s*)(.+)$/i.exec(line);
        if (dm?.[1]) {
          const p = dm[1].trim();
          if (p) extraDisallow.push(p.startsWith("/") ? p : `/${p}`);
          continue;
        }
        if (line.startsWith("/")) {
          extraDisallow.push(line);
        }
      }
      for (const a of Array.from(new Set(["/", "/ar/", "/en/", ...extraAllow]))) {
        robotsLines.push(`Allow: ${a}`);
      }
      for (const d of Array.from(new Set([...DEFAULT_DISALLOW, ...extraDisallow]))) {
        robotsLines.push(`Disallow: ${d}`);
      }
    }
    if (sitemapEnabled) {
      robotsLines.push("", `Sitemap: ${baseUrl}/sitemap.xml`);
    }

    const counts = {
      total: urls.length,
      excluded: excludedUrls.length,
      staticAndCities: urls.filter((u) => u.source === "static" || u.source === "city").length,
      properties: urls.filter((u) => u.source === "property").length,
      blogs: urls.filter((u) => u.source === "blog").length,
      legal: urls.filter((u) => u.source === "legal").length,
    };

    const gtmValid = /^GTM-[A-Z0-9]+$/i.test(String(gtm?.gtmId || "").trim());

    return NextResponse.json(
      {
        success: true,
        generatedAt: nowIso,
        baseUrl,
        sitemapUrl: `${baseUrl}/sitemap.xml`,
        robotsUrl: `${baseUrl}/robots.txt`,
        sitemapEnabled,
        gtm: {
          enabled: Boolean(gtm?.enabled),
          gtmId: String(gtm?.gtmId || "").trim(),
          valid: gtmValid,
          activeLive: Boolean(gtm?.enabled && gtmValid),
        },
        counts,
        urls,
        excludedUrls,
        robotsTxt: robotsLines.join("\n"),
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (err: unknown) {
    console.error("[cms seo-diagnostics] error:", err);
    return NextResponse.json({ error: "Failed to load SEO diagnostics" }, { status: 500 });
  }
}
