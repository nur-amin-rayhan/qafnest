import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { AdminAuthProvider } from "@/context/AdminAuthContext";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#faf8ff",
};

export const metadata: Metadata = {
  title: "QafNest Executive Command • Admin Operations Hub",
  description: "Enterprise operations, yield, reservations, and property approval hub for QafNest.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const rawLang = cookieStore.get("qafnest_admin_lang")?.value;
  const initialLang: "ar" | "en" = rawLang === "ar" ? "ar" : "en";
  const initialDir = initialLang === "ar" ? "rtl" : "ltr";

  return (
    <html lang={initialLang} dir={initialDir} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500&family=Manrope:wght@400;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
      </head>
      <body className="bg-surface font-body text-on-surface antialiased selection:bg-primary-container selection:text-on-primary" suppressHydrationWarning>
        <AdminAuthProvider initialLang={initialLang}>
          {children}
        </AdminAuthProvider>
      </body>
    </html>
  );
}
