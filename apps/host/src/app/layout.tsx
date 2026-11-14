import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { cookies } from "next/headers";
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
  const cookieStore = await cookies();
  const rawLang = cookieStore.get("qafnest_host_lang")?.value;
  const lang = rawLang === "en" ? "en" : "ar";

  return {
    metadataBase: new URL(baseUrl),
    title: lang === "en" ? "QafNest Business · Host with confidence" : "أعمال قاف نست · استضف بثقة",
    description:
      lang === "en"
        ? "A dedicated host platform to prepare property listings and manage availability, reservations and hosting activity on QafNest."
        : "منصة المضيفين لتجهيز قوائم العقارات وإدارة التوافر والحجوزات والأرباح على قاف نست.",
  };
}

export default async function HostRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const rawLang = cookieStore.get("qafnest_host_lang")?.value;
  const initialLang: "ar" | "en" = rawLang === "en" ? "en" : "ar";
  const initialDir = initialLang === "ar" ? "rtl" : "ltr";

  return (
    <html lang={initialLang} dir={initialDir} className={`${geist.variable} ${dinNext.variable} light`}>
      <body className="font-body relative min-h-screen bg-white text-slate-900 selection:bg-violet-200">
        <HostAuthProvider initialLang={initialLang}>
          {children}
          <HostAuthModal />
        </HostAuthProvider>
      </body>
    </html>
  );
}
