import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { cookies, headers } from "next/headers";
import { DynamicHostSeoTags } from "@/components/common/DynamicHostSeoTags";
import {
  DEFAULT_HOST_LOCALE,
  HOST_LANG_COOKIE,
  HOST_LOCALE_HEADER,
  HOST_PATHNAME_HEADER,
  getHostBaseUrl,
  getHostSeoAlternates,
  isPrivateHostPath,
  normalizeHostLocale,
} from "@/lib/hostLocale";
import "./globals.css";
import { HostAuthProvider } from "@/context/HostAuthContext";
import HostAuthModal from "@/components/modals/HostAuthModal";

const geist = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist",
  weight: "100 900",
  display: "swap",
});

const dinNext = localFont({
  src: [
    { path: "./fonts/DINNextLTArabic-Light.woff", weight: "300", style: "normal" },
    { path: "./fonts/DINNextLTArabic-Regular.woff", weight: "400", style: "normal" },
    { path: "./fonts/DINNextLTArabic-Medium.woff", weight: "500", style: "normal" },
    { path: "./fonts/DINNextLTArabic-Bold.woff", weight: "700", style: "normal" },
    { path: "./fonts/DINNextLTArabic-Black.woff", weight: "900", style: "normal" },
  ],
  variable: "--font-arabic",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#ffffff",
};

const baseUrl =
  process.env.NEXT_PUBLIC_HOST_URL ||
  process.env.NEXT_PUBLIC_HOST_PORTAL_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://business.qafnest.com"
    : "http://localhost:3001");

export async function generateMetadata(): Promise<Metadata> {
  const headerStore = await headers();
  const cookieStore = await cookies();
  const headerLocale = normalizeHostLocale(headerStore.get(HOST_LOCALE_HEADER));
  const cookieLocale = normalizeHostLocale(cookieStore.get(HOST_LANG_COOKIE)?.value);
  const lang = headerLocale ?? cookieLocale ?? DEFAULT_HOST_LOCALE;
  const pathname = headerStore.get(HOST_PATHNAME_HEADER) || "/";
  const resolvedBaseUrl = getHostBaseUrl() || baseUrl;

  const title =
    lang === "en" ? "QafNest Business · Host with confidence" : "أعمال قاف نست · استضف بثقة";
  const description =
    lang === "en"
      ? "A dedicated host platform to prepare property listings and manage availability, reservations and hosting activity on QafNest."
      : "منصة المضيفين لتجهيز قوائم العقارات وإدارة التوافر والحجوزات والأرباح على قاف نست.";

  const isPrivate = isPrivateHostPath(pathname);
  const alternates = isPrivate ? undefined : getHostSeoAlternates(pathname, lang, resolvedBaseUrl);

  return {
    metadataBase: new URL(resolvedBaseUrl),
    title,
    description,
    alternates,
    openGraph: alternates
      ? {
          title,
          description,
          url: alternates.canonical,
          locale: lang === "en" ? "en_US" : "ar_SA",
          alternateLocale: lang === "en" ? ["ar_SA"] : ["en_US"],
          siteName: "QafNest Business",
          type: "website",
        }
      : undefined,
  };
}

export default async function HostRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerStore = await headers();
  const cookieStore = await cookies();
  const headerLocale = normalizeHostLocale(headerStore.get(HOST_LOCALE_HEADER));
  const cookieLocale = normalizeHostLocale(cookieStore.get(HOST_LANG_COOKIE)?.value);
  const initialLang: "ar" | "en" = headerLocale ?? cookieLocale ?? DEFAULT_HOST_LOCALE;
  const initialDir = initialLang === "ar" ? "rtl" : "ltr";

  const prePaintLocaleScript = `(function(){try{var p=window.location.pathname||"";var m=p.match(/^\\/(ar|en)(?:\\/|$)/);if(m){var l=m[1];document.documentElement.lang=l;document.documentElement.dir=l==="ar"?"rtl":"ltr";localStorage.setItem("qafnest_host_lang",l);}}catch(e){}})();`;

  return (
    <html
      lang={initialLang}
      dir={initialDir}
      className={`${geist.variable} ${dinNext.variable} light`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: prePaintLocaleScript }} />
      </head>
      <body
        className="font-body relative min-h-screen bg-white text-slate-900 selection:bg-violet-200"
        suppressHydrationWarning
      >
        <HostAuthProvider initialLang={initialLang}>
          <DynamicHostSeoTags lang={initialLang} />
          {children}
          <HostAuthModal />
        </HostAuthProvider>
      </body>
    </html>
  );
}
