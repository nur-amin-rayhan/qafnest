import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { cookies } from "next/headers";
import ClientProviders from "@/components/providers/ClientProviders";
import { DynamicSeoTags } from "@/components/common/DynamicSeoTags";
import { getSeoAlternates } from "@/lib/localization/localeHelper";
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
  const cookieStore = await cookies();
  const rawLang = cookieStore.get("qafnest_lang")?.value;
  const lang: "ar" | "en" = rawLang === "en" ? "en" : "ar";
  const { canonical, alternates } = getSeoAlternates("/", lang, baseUrl);

  return {
    metadataBase: new URL(baseUrl),
    alternates,
    title:
      lang === "ar"
        ? "قاف نست · اشعر وكأنك في بيتك. إقامة استثنائية."
        : "QAFNEST · Feel at Home. Stay Exceptional.",
    description:
      lang === "ar"
        ? "منصة وساطة لتأجير بيوت العطلات والشاليهات الفاخرة والفلل الخاصة والمزارع والمخيمات الصحراوية في المملكة العربية السعودية. مرخصة من وزارة السياحة."
        : "Peer-to-peer vacation rental platform for luxury chalets, private villas, country farms, and desert camps across Saudi Arabia. Licensed by the Ministry of Tourism.",
    keywords:
      "QafNest, chalets in Riyadh, villas in Jeddah, AlUla glamping, vacation rental Saudi Arabia, luxury chalets, Tabby installment stays, Ministry of Tourism licensed",
    authors: [{ name: "QafNest Hospitality Group" }],
    openGraph: {
      title:
        lang === "ar"
          ? "قاف نست · اشعر وكأنك في بيتك. إقامة استثنائية."
          : "QAFNEST · Feel at Home. Stay Exceptional.",
      description:
        lang === "ar"
          ? "احجز شاليهات موثوقة وفلل خاصة ومخيمات صحراوية في جميع أنحاء المملكة العربية السعودية مع تسجيل دخول فوري بالرمز الذكي وتقسيط ميسر بدون فوائد."
          : "Book verified chalets, private villas, and desert camps across Saudi Arabia with instant smart lock check-in and 4 interest-free installments.",
      url: canonical,
      siteName: "QAFNEST",
      locale: lang === "ar" ? "ar_SA" : "en_US",
      type: "website",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const rawLang = cookieStore.get("qafnest_lang")?.value;
  const initialLang: "ar" | "en" = rawLang === "en" ? "en" : "ar";
  const initialDir = initialLang === "ar" ? "rtl" : "ltr";

  return (
    <html lang={initialLang} dir={initialDir} className={`${geist.variable} ${dinNext.variable} dark`} suppressHydrationWarning>
      <body
        className="font-body relative min-h-screen selection:bg-violet-500/30"
        suppressHydrationWarning
      >
        <script
          id="qafnest-preferences"
          dangerouslySetInnerHTML={{
            __html: `try { const root = document.documentElement; const p = window.location.pathname; const pathLang = p === '/ar' || p.startsWith('/ar/') ? 'ar' : (p === '/en' || p.startsWith('/en/') ? 'en' : null); const lang = pathLang || localStorage.getItem('qafnest_lang'); const theme = localStorage.getItem('qafnest_theme'); if (lang === 'ar' || lang === 'en') { root.lang = lang; root.dir = lang === 'ar' ? 'rtl' : 'ltr'; root.classList.toggle('rtl', lang === 'ar'); localStorage.setItem('qafnest_lang', lang); } if (theme === 'light') { root.classList.add('light'); root.classList.remove('dark'); } else { root.classList.add('dark'); root.classList.remove('light'); } } catch {}`,
          }}
        />
        <ClientProviders initialLang={initialLang}>
          <DynamicSeoTags />
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
