import { MetadataRoute } from "next";
import { PROPERTIES } from "@/data/properties";

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

export default function sitemap(): MetadataRoute.Sitemap {
  const routes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/search`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/wishlist`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/host/new`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  // City landing searches
  CITIES.forEach((city) => {
    routes.push({
      url: `${BASE_URL}/search?city=${city}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    });
  });

  // Individual Property Detail Pages
  PROPERTIES.forEach((prop) => {
    routes.push({
      url: `${BASE_URL}/property/${encodeURIComponent(prop.id)}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    });
  });

  return routes;
}
