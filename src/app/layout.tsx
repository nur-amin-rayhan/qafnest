import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import ClientProviders from "@/components/providers/ClientProviders";
import "./globals.css";

const geist = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist",
  weight: "100 900",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#06060B",
};

export const metadata: Metadata = {
  title: "QAFNEST · Feel at Home. Stay Exceptional.",
  description: "Peer-to-peer vacation rental platform for luxury chalets, private villas, country farms, and desert camps across Saudi Arabia. Licensed by the Ministry of Tourism.",
  keywords: "QafNest, chalets in Riyadh, villas in Jeddah, AlUla glamping, vacation rental Saudi Arabia, luxury chalets, Tabby installment stays, Ministry of Tourism licensed",
  authors: [{ name: "QafNest Hospitality Group" }],
  openGraph: {
    title: "QAFNEST · Feel at Home. Stay Exceptional.",
    description: "Book verified chalets, private villas, and desert camps across Saudi Arabia with instant smart lock check-in and 4 interest-free installments.",
    url: "https://qafnest.com",
    siteName: "QAFNEST",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} dark`} suppressHydrationWarning>
      <Script id="qafnest-preferences" strategy="beforeInteractive">
        {`try { const root = document.documentElement; const lang = localStorage.getItem('qafnest_lang'); const theme = localStorage.getItem('qafnest_theme'); if (lang === 'ar' || lang === 'en') { root.lang = lang; root.dir = lang === 'ar' ? 'rtl' : 'ltr'; root.classList.toggle('rtl', lang === 'ar'); } if (theme === 'light') { root.classList.add('light'); root.classList.remove('dark'); } else { root.classList.add('dark'); root.classList.remove('light'); } } catch {}`}
      </Script>
      <body
        className="font-body relative min-h-screen selection:bg-violet-500/30"
      >
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
