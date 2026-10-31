import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://qafnest.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/my-bookings", "/*?*payment=*"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
