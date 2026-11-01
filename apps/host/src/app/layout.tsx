import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

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
  themeColor: "#06060B",
};

export const metadata: Metadata = {
  title: "QAFNEST BUSINESS · Host & Property Partner Portal",
  description:
    "Manage your chalets, villas, farms, camps, dynamic pricing, calendar availability, smart lock PINs, and Saudi bank payouts on QafNest Business.",
};

export default function HostRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} ${dinNext.variable} dark`} suppressHydrationWarning>
      <body className="font-body relative min-h-screen bg-[#07070E] text-white selection:bg-violet-500/30" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
