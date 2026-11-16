import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { getSeoAlternates } from "@/lib/localization/localeHelper";
import { ECOSYSTEM_URLS } from "@qafnest/shared";

const baseUrl = ECOSYSTEM_URLS.guest;

export async function generateMetadata(): Promise<Metadata> {
  const [cookieStore, reqHeaders] = await Promise.all([cookies(), headers()]);
  const headerLang = reqHeaders.get("x-qafnest-locale");
  const rawLang = headerLang || cookieStore.get("qafnest_lang")?.value;
  const lang: "ar" | "en" = rawLang === "en" ? "en" : "ar";
  const { canonical, alternates } = getSeoAlternates("/search", lang, baseUrl);

  const title =
    lang === "ar"
      ? "البحث عن شاليهات وفلل ومزارع في السعودية | قاف نست"
      : "Search Chalets, Villas & Stays in Saudi Arabia | QAFNEST";

  const description =
    lang === "ar"
      ? "ابحث عن أفضل الشاليهات، الفلل الخاصة، المخيمات والمزارع في الرياض، جدة، العلا، أبها والطائف مع دخول ذاتي وتقسيط تابي وتمارا."
      : "Search luxury chalets, private villas, desert camps and farms in Riyadh, Jeddah, AlUla, Abha and Taif with smart lock access.";

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

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
