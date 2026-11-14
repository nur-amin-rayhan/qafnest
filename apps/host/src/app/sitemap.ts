import type { MetadataRoute } from "next";
import { getHostBaseUrl } from "@/lib/hostLocale";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getHostBaseUrl();
  const lastModified = new Date();

  const publicRoutes = [
    { ar: `${baseUrl}/ar`, en: `${baseUrl}/en`, priority: 1.0 },
    { ar: `${baseUrl}/ar/login`, en: `${baseUrl}/en/login`, priority: 0.7 },
  ];

  const entries: MetadataRoute.Sitemap = [];
  for (const route of publicRoutes) {
    const alternates = {
      languages: {
        ar: route.ar,
        en: route.en,
        "x-default": route.ar,
      },
    };
    entries.push(
      {
        url: route.ar,
        lastModified,
        changeFrequency: "weekly",
        priority: route.priority,
        alternates,
      },
      {
        url: route.en,
        lastModified,
        changeFrequency: "weekly",
        priority: route.priority,
        alternates,
      },
    );
  }

  return entries;
}
