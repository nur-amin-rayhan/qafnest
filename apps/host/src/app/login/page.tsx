import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import HostLoginForm from "@/components/auth/HostLoginForm";
import {
  DEFAULT_HOST_LOCALE,
  HOST_LANG_COOKIE,
  HOST_LOCALE_HEADER,
  getHostBaseUrl,
  getHostSeoAlternates,
  normalizeHostLocale,
} from "@/lib/hostLocale";

async function resolveLoginLocale(fallbackParam?: string): Promise<"ar" | "en"> {
  const headerStore = await headers();
  const cookieStore = await cookies();
  return (
    normalizeHostLocale(headerStore.get(HOST_LOCALE_HEADER)) ??
    normalizeHostLocale(cookieStore.get(HOST_LANG_COOKIE)?.value) ??
    normalizeHostLocale(fallbackParam) ??
    DEFAULT_HOST_LOCALE
  );
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const lang = await resolveLoginLocale(params.lang);
  const baseUrl = getHostBaseUrl();

  const title =
    lang === "en"
      ? "Host Partner Sign In · QafNest Business"
      : "تسجيل دخول المضيفين · أعمال قاف نست";

  const description =
    lang === "en"
      ? "Sign in to your QafNest Host partner portal to manage property listings, guest reservations, availability calendar, and monthly earnings."
      : "سجّل دخولك إلى منصة مضيفي قاف نست لإدارة عقاراتك المعروضة، حجوزات الضيوف، تقويم التوافر، وأرباحك الشهرية بأمان.";

  const alternates = getHostSeoAlternates("/login", lang, baseUrl);

  return {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      url: alternates.canonical,
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
  const lang = await resolveLoginLocale(params.lang);
  const initialAuthMode = params.mode === "signup" ? "signup" : "signin";

  return (
    <HostLoginForm
      initialLang={lang}
      initialReturnUrl={params.returnUrl}
      initialAuthMode={initialAuthMode}
    />
  );
}
