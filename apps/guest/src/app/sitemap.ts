import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://qafnest.com";

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
  { path: "/blog", changeFrequency: "daily" as const, priority: 0.8 },
  { path: "/faq", changeFrequency: "weekly" as const, priority: 0.7 },
  { path: "/contact", changeFrequency: "monthly" as const, priority: 0.6 },
  { path: "/terms", changeFrequency: "monthly" as const, priority: 0.5 },
  { path: "/privacy", changeFrequency: "monthly" as const, priority: 0.5 },
  { path: "/cookies", changeFrequency: "monthly" as const, priority: 0.4 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const routes: MetadataRoute.Sitemap = [];
  const now = new Date();

  for (const locale of ["ar", "en"] as const) {
    for (const item of STATIC_PUBLIC_PATHS) {
      routes.push({
        url: `${BASE_URL}/${locale}${item.path}`,
        lastModified: now,
        changeFrequency: item.changeFrequency,
        priority: item.priority,
        alternates: {
          languages: {
            ar: `${BASE_URL}/ar${item.path}`,
            en: `${BASE_URL}/en${item.path}`,
            "x-default": `${BASE_URL}/ar${item.path}`,
          },
        },
      });
    }

    for (const city of CITIES) {
      routes.push({
        url: `${BASE_URL}/${locale}/search?city=${city}`,
        lastModified: now,
        changeFrequency: "daily",
        priority: 0.8,
        alternates: {
          languages: {
            ar: `${BASE_URL}/ar/search?city=${city}`,
            en: `${BASE_URL}/en/search?city=${city}`,
            "x-default": `${BASE_URL}/ar/search?city=${city}`,
          },
        },
      });
    }
  }

  return routes;
}
