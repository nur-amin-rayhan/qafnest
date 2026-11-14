import type { Metadata } from "next";
import { Suspense } from "react";
import HostLoginForm from "@/components/auth/HostLoginForm";

import { ECOSYSTEM_URLS } from "@qafnest/shared";

const baseUrl = ECOSYSTEM_URLS.host;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const lang = params.lang === "en" ? "en" : "ar";

  const title =
    lang === "en"
      ? "Host Partner Sign In · QafNest Business"
      : "تسجيل دخول المضيفين · أعمال قاف نست";

  const description =
    lang === "en"
      ? "Sign in to your QafNest Host partner portal to manage property listings, guest reservations, availability calendar, and monthly earnings."
      : "سجّل دخولك إلى منصة مضيفي قاف نست لإدارة عقاراتك المعروضة، حجوزات الضيوف، تقويم التوافر، وأرباحك الشهرية بأمان.";

  const canonicalUrl = `${baseUrl}/login?lang=${lang}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ar: `${baseUrl}/login?lang=ar`,
        en: `${baseUrl}/login?lang=en`,
        "x-default": `${baseUrl}/login`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      locale: lang === "en" ? "en_US" : "ar_SA",
      alternateLocale: lang === "en" ? ["ar_SA"] : ["en_US"],
      siteName: "QafNest Business",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function HostLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string; returnUrl?: string; mode?: string }>;
}) {
  const params = await searchParams;
  const lang: "ar" | "en" = params.lang === "en" ? "en" : "ar";

  return <HostLoginForm initialLang={lang} initialReturnUrl={params.returnUrl} />;
}
