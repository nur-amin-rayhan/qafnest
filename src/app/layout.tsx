import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
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
    <html lang="en" className="dark">
      <body
        className={`${plusJakartaSans.variable} ${spaceGrotesk.variable} ${cormorantGaramond.variable} font-body relative min-h-screen selection:bg-violet-500/30`}
      >
        {children}
      </body>
    </html>
  );
}
