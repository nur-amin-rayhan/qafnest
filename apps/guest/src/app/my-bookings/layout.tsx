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
  const { canonical, alternates } = getSeoAlternates("/my-bookings", lang, baseUrl);

  const title =
    lang === "ar"
      ? "حجوزاتي وإدارتها | قاف نست"
      : "My Bookings & Reservations | QAFNEST";

  const description =
    lang === "ar"
      ? "إدارة حجوزاتك، رموز القفل الذكي للدخول الذاتي، وفواتير هيئة الزكاة والضريبة والجمارك المعتمدة."
      : "Manage your reservations, smart lock PIN codes for self check-in, and official ZATCA tax invoices.";

  return {
    title,
    description,
    alternates,
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      url: canonical,
      locale: lang === "ar" ? "ar_SA" : "en_US",
      type: "website",
    },
  };
}

export default function MyBookingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
