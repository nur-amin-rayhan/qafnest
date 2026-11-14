import type { MetadataRoute } from "next";
import { getHostBaseUrl } from "@/lib/hostLocale";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getHostBaseUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/ar", "/en", "/ar/login", "/en/login"],
        disallow: [
          "/api/",
          "/app/",
          "/ar/app/",
          "/en/app/",
          "/properties/",
          "/ar/properties/",
          "/en/properties/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
