import React from "react";
import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import { getServerPublicCmsWorkspace } from "@/lib/cms/serverCmsWorkspace";
import { getSeoAlternates } from "@/lib/localization/localeHelper";
import AboutMasterContainer from "@/components/about/AboutMasterContainer";

export const dynamic = "force-dynamic";

const baseUrl =
  process.env.NEXT_PUBLIC_GUEST_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NODE_ENV === "production" ? "https://qafnest.com" : "http://localhost:3000");

export async function generateMetadata(): Promise<Metadata> {
  const [cookieStore, reqHeaders, cms] = await Promise.all([
    cookies(),
    headers(),
    getServerPublicCmsWorkspace(),
  ]);

  const headerLang = reqHeaders.get("x-qafnest-locale");
  const rawLang = headerLang || cookieStore.get("qafnest_lang")?.value;
  const lang: "ar" | "en" = rawLang === "en" ? "en" : "ar";

  const about = cms.globals.aboutUs;
  const seo = cms.globals.siteSeo;
  const resolvedBaseUrl = seo?.openGraph?.url?.trim() || baseUrl;
  const { canonical, alternates } = getSeoAlternates("/about", lang, resolvedBaseUrl);

  const fallbackTitle =
    lang === "ar"
      ? "عن قاف نست | شركة الوساطة العقارية المرخصة لبيوت العطلات في المملكة"
      : "About QafNest | Licensed Vacation Rental Marketplace in Saudi Arabia";

  const fallbackDesc =
    lang === "ar"
      ? "تعرف على شركة قاف نست المرخصة من وزارة السياحة (ترخيص 73102999) لحجز الشاليهات، الفلل الخاصة، والمزارع في المملكة العربية السعودية برؤية 2030."
      : "Learn about QafNest, Saudi Arabia's Ministry of Tourism licensed digital marketplace (#73102999) for chalets, luxury villas, and private vacation retreats.";

  const title = about?.metaTitle?.[lang]?.trim() || fallbackTitle;
  const description = about?.metaDescription?.[lang]?.trim() || fallbackDesc;

  return {
    metadataBase: new URL(resolvedBaseUrl),
    title,
    description,
    alternates,
    robots: {
      index: !about?.noIndex,
      follow: !about?.noIndex,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "QafNest",
      locale: lang === "ar" ? "ar_SA" : "en_US",
      type: "website",
      ...(about?.ogImage ? { images: [{ url: about.ogImage }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      site: "@qafnest",
    },
  };
}

export default async function AboutPage() {
  const [cookieStore, reqHeaders, cms] = await Promise.all([
    cookies(),
    headers(),
    getServerPublicCmsWorkspace(),
  ]);

  const headerLang = reqHeaders.get("x-qafnest-locale");
  const rawLang = headerLang || cookieStore.get("qafnest_lang")?.value;
  const lang: "ar" | "en" = rawLang === "en" ? "en" : "ar";

  const about = cms.globals.aboutUs;
  const seo = cms.globals.siteSeo;
  const resolvedBaseUrl = seo?.openGraph?.url?.trim() || baseUrl;
  const { canonical } = getSeoAlternates("/about", lang, resolvedBaseUrl);

  const title =
    about?.metaTitle?.[lang]?.trim() ||
    (lang === "ar"
      ? "عن قاف نست | شركة الوساطة العقارية المرخصة لبيوت العطلات في المملكة"
      : "About QafNest | Licensed Vacation Rental Marketplace in Saudi Arabia");

  const description =
    about?.metaDescription?.[lang]?.trim() ||
    (lang === "ar"
      ? "شركة قاف نست المرخصة من وزارة السياحة (ترخيص 73102999) لحجز بيوت العطلات والضيافة الخاصة."
      : "QafNest Real Estate Vacation Rentals Co. Ministry of Tourism License #73102999.");

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${resolvedBaseUrl}/#organization`,
        name: "QafNest Real Estate Vacation Rentals Co.",
        alternateName: ["قاف نست", "QafNest", "شركة قاف نست للعقارات وبيوت العطلات"],
        url: resolvedBaseUrl,
        logo: `${resolvedBaseUrl}/icon.png`,
        contactPoint: [
          {
            "@type": "ContactPoint",
            telephone: "+966576707709",
            contactType: "customer service",
            areaServed: "SA",
            availableLanguage: ["Arabic", "English"],
            hoursAvailable: "Mo-Su 00:00-24:00",
          },
        ],
        address: {
          "@type": "PostalAddress",
          streetAddress: "5040 Abu Masaoud Al Badri, 8121، حي طيبة",
          addressLocality: "Jeddah",
          addressRegion: "Makkah Province",
          postalCode: "23835",
          addressCountry: "SA",
        },
        taxID: "310123456700003",
        identifier: "1010648921",
      },
      {
        "@type": "AboutPage",
        "@id": `${canonical}#webpage`,
        url: canonical,
        name: title,
        description: description,
        isPartOf: {
          "@type": "WebSite",
          "@id": `${resolvedBaseUrl}/#website`,
          url: resolvedBaseUrl,
          name: "QafNest",
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC] dark:bg-[#07060A] text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-[#4F2396]/20 scroll-smooth">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd)
            .replace(/</g, "\\u003c")
            .replace(/\u2028/g, "\\u2028")
            .replace(/\u2029/g, "\\u2029"),
        }}
      />
      <Navbar />
      <AboutMasterContainer initialCms={cms} />
      <Footer />
    </div>
  );
}
