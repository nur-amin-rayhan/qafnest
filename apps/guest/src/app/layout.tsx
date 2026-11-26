import { safeJsonLdStringify } from "@qafnest/shared/escapeHtml";
import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import Script from "next/script";
import localFont from "next/font/local";
import { cookies, headers } from "next/headers";
import ClientProviders from "@/components/providers/ClientProviders";
import { DynamicSeoTags } from "@/components/common/DynamicSeoTags";
import { GoogleTagManagerTracker } from "@/components/common/GoogleTagManager";
import { getSeoAlternates } from "@/lib/localization/localeHelper";
import { getServerPublicCmsWorkspace } from "@/lib/cms/serverCmsWorkspace";
import "./globals.css";

const geist = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist",
  weight: "100 900",
  display: "swap",
});

const dinNext = localFont({
  src: [
    {
      path: "./fonts/DINNextLTArabic-Light.woff",
      weight: "300",
      style: "normal",
    },
    {
      path: "./fonts/DINNextLTArabic-Regular.woff",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/DINNextLTArabic-Medium.woff",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/DINNextLTArabic-Bold.woff",
      weight: "700",
      style: "normal",
    },
    {
      path: "./fonts/DINNextLTArabic-Black.woff",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-arabic",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#06060B",
};

const baseUrl =
  process.env.NEXT_PUBLIC_GUEST_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://qafnest.com"
    : "http://localhost:3000");

export async function generateMetadata(): Promise<Metadata> {
  const [cookieStore, reqHeaders, cms] = await Promise.all([
    cookies(),
    headers(),
    getServerPublicCmsWorkspace(),
  ]);
  const headerLang = reqHeaders.get("x-qafnest-locale");
  const rawLang = headerLang || cookieStore.get("qafnest_lang")?.value;
  const lang: "ar" | "en" = rawLang === "en" ? "en" : "ar";
  const activePathname = reqHeaders.get("x-qafnest-pathname") || "/";
  const seo = cms.globals.siteSeo;
  const resolvedBaseUrl = seo?.openGraph?.url?.trim() || baseUrl;
  const { canonical, alternates } = getSeoAlternates(activePathname, lang, resolvedBaseUrl);

  const fallbackTitle =
    lang === "ar"
      ? "قاف نست · اشعر وكأنك في بيتك. إقامة استثنائية."
      : "QAFNEST · Feel at Home. Stay Exceptional.";
  const fallbackDescription =
    lang === "ar"
      ? "منصة وساطة لتأجير بيوت العطلات والشاليهات الفاخرة والفلل الخاصة والمزارع والمخيمات الصحراوية في المملكة العربية السعودية."
      : "Peer-to-peer vacation rental platform for luxury chalets, private villas, country farms, and desert camps across Saudi Arabia.";

  const title = seo?.defaultTitle?.[lang]?.trim() || fallbackTitle;
  const description = seo?.defaultDescription?.[lang]?.trim() || fallbackDescription;
  const keywords =
    seo?.keywords?.[lang]?.trim() ||
    "QafNest, chalets in Riyadh, villas in Jeddah, AlUla glamping, vacation rental Saudi Arabia, luxury chalets, Tabby installment stays";
  const ogTitle = seo?.openGraph?.title?.[lang]?.trim() || title;
  const ogDescription = seo?.openGraph?.description?.[lang]?.trim() || description;
  const ogImage = seo?.openGraph?.image?.trim() || "";
  const siteName = seo?.siteName?.[lang]?.trim() || "QAFNEST";
  const twitterHandle = seo?.twitter?.handle?.trim() || undefined;
  const twitterCard =
    seo?.twitter?.card === "summary" ? "summary" : "summary_large_image";

  let safeMetadataBase: URL;
  try {
    safeMetadataBase = new URL(resolvedBaseUrl);
  } catch {
    safeMetadataBase = new URL(baseUrl);
  }

  return {
    metadataBase: safeMetadataBase,
    alternates,
    title,
    description,
    keywords,
    authors: [{ name: "QafNest Hospitality Group" }],
    robots: {
      index: !seo?.robots?.noIndex,
      follow: !seo?.robots?.noFollow,
    },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: canonical,
      siteName,
      locale: lang === "ar" ? "ar_SA" : "en_US",
      type: "website",
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: twitterCard,
      title: seo?.twitter?.title?.[lang]?.trim() || ogTitle,
      description: seo?.twitter?.description?.[lang]?.trim() || ogDescription,
      ...(twitterHandle ? { site: twitterHandle, creator: twitterHandle } : {}),
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [cookieStore, reqHeaders, cms] = await Promise.all([
    cookies(),
    headers(),
    getServerPublicCmsWorkspace(),
  ]);
  const headerLang = reqHeaders.get("x-qafnest-locale");
  const rawLang = headerLang || cookieStore.get("qafnest_lang")?.value;
  const initialLang: "ar" | "en" = rawLang === "en" ? "en" : "ar";
  const initialDir = initialLang === "ar" ? "rtl" : "ltr";
  const rawTheme = cookieStore.get("qafnest_theme")?.value;
  const initialTheme: "light" | "dark" = rawTheme === "light" ? "light" : "dark";
  const rawGtmId = cms.globals.gtm?.enabled ? String(cms.globals.gtm.gtmId || "").trim() : "";
  const gtmId = /^GTM-[A-Z0-9]{4,12}$/i.test(rawGtmId) ? rawGtmId.toUpperCase() : "";

  const sameAs = Array.from(
    new Set([
      ...Object.values(cms.globals.siteSeo?.socialProfiles || {}),
      ...cms.socialLinks.filter((s) => s.enabled).map((s) => s.url),
    ])
  ).filter((u) => typeof u === "string" && /^https?:\/\//i.test(u.trim()));

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: cms.globals.siteSeo?.siteName?.en || "QafNest",
    url: cms.globals.siteSeo?.openGraph?.url || baseUrl,
    ...(cms.globals.siteSeo?.openGraph?.image
      ? { logo: cms.globals.siteSeo.openGraph.image }
      : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };

  const initialRtlClass = initialLang === "ar" ? "rtl" : "";

  return (
    <html lang={initialLang} dir={initialDir} className={`${geist.variable} ${dinNext.variable} ${initialTheme} ${initialRtlClass}`.trim()} suppressHydrationWarning>
      <head>
        {/* Critical Origin Preconnects for Performance */}
        <link rel="preconnect" href="https://apis.google.com" />
        <link rel="preconnect" href="https://qafnest.firebaseapp.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://identitytoolkit.googleapis.com" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(orgJsonLd) }}
        />
        <script
          id="qafnest-preferences"
          dangerouslySetInnerHTML={{
            __html: `try { const root = document.documentElement; const p = window.location.pathname; const pathLang = p === '/ar' || p.startsWith('/ar/') ? 'ar' : (p === '/en' || p.startsWith('/en/') ? 'en' : null); const lang = pathLang || localStorage.getItem('qafnest_lang'); const theme = localStorage.getItem('qafnest_theme') || (root.classList.contains('light') ? 'light' : 'dark'); if (lang === 'ar' || lang === 'en') { root.lang = lang; root.dir = lang === 'ar' ? 'rtl' : 'ltr'; root.classList.toggle('rtl', lang === 'ar'); localStorage.setItem('qafnest_lang', lang); } if (theme === 'light') { root.classList.add('light'); root.classList.remove('dark'); document.cookie = 'qafnest_theme=light; path=/; max-age=31536000; SameSite=Lax'; } else { root.classList.add('dark'); root.classList.remove('light'); document.cookie = 'qafnest_theme=dark; path=/; max-age=31536000; SameSite=Lax'; } } catch {}`,
          }}
        />
        {gtmId && (
          <Script
            id="qafnest-gtm-head"
            strategy="lazyOnload"
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`,
            }}
          />
        )}
        <Script
          id="cloudflare-turnstile"
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="lazyOnload"
        />
      </head>
      <body
        className="font-body relative min-h-screen selection:bg-violet-500/30"
        suppressHydrationWarning
      >
        {gtmId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(gtmId)}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}
        <ClientProviders initialLang={initialLang} initialTheme={initialTheme}>
          <DynamicSeoTags />
          {gtmId && (
            <Suspense fallback={null}>
              <GoogleTagManagerTracker gtmId={gtmId} />
            </Suspense>
          )}
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
