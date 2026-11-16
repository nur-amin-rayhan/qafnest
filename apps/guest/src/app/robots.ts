import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://qafnest.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/ar/", "/en/"],
        disallow: [
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
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
