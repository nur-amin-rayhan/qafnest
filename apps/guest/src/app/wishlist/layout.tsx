import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getSeoAlternates } from "@/lib/localization/localeHelper";
import { ECOSYSTEM_URLS } from "@qafnest/shared";

const baseUrl = ECOSYSTEM_URLS.guest;

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const rawLang = cookieStore.get("qafnest_lang")?.value;
  const lang: "ar" | "en" = rawLang === "en" ? "en" : "ar";
  const { canonical, alternates } = getSeoAlternates("/wishlist", lang, baseUrl);

  const title =
    lang === "ar"
      ? "قائمة الرغبات والمفضلات | قاف نست"
      : "Saved Wishlist & Favorite Stays | QAFNEST";

  const description =
    lang === "ar"
      ? "تصفح قائمة إقاماتك وشاليهاتك المفضلة المحفوظة في المملكة العربية السعودية."
      : "View and manage your saved chalets, villas and favorite stays across Saudi Arabia.";

  return {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      url: canonical,
      locale: lang === "ar" ? "ar_SA" : "en_US",
      type: "website",
    },
  };
}

export default function WishlistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
