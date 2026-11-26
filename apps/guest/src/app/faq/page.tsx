import React from "react";
import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import { getServerPublicCmsWorkspace } from "@/lib/cms/serverCmsWorkspace";
import { getSeoAlternates } from "@/lib/localization/localeHelper";
import FaqMasterContainer from "@/components/faq/FaqMasterContainer";

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

  const seo = cms.globals.siteSeo;
  const resolvedBaseUrl = seo?.openGraph?.url?.trim() || baseUrl;
  const { canonical, alternates } = getSeoAlternates("/faq", lang, resolvedBaseUrl);

  const title =
    lang === "ar"
      ? "مركز المساعدة والأسئلة الشائعة | قاف نست"
      : "Help Center & Frequently Asked Questions | QafNest";

  const description =
    lang === "ar"
      ? "إجابات واضحة وشاملة للضيوف والمضيفين حول الحجوزات، الدخول الذاتي، سياسات الإلغاء والضمان، والمدفوعات المعتمدة في قاف نست."
      : "Clear, instant answers for Guests and Hosts regarding verified reservations, smart locks, cancellation tiers, and electronic payments on QafNest.";

  return {
    metadataBase: new URL(resolvedBaseUrl),
    title,
    description,
    alternates,
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "QafNest",
      locale: lang === "ar" ? "ar_SA" : "en_US",
      type: "website",
    },
  };
}

export default async function FaqPage() {
  const cms = await getServerPublicCmsWorkspace();

  return (
    <div className="min-h-screen bg-[#FAFAFC] dark:bg-[#07060A] text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-[#4F2396]/20 scroll-smooth">
      <Navbar />
      <FaqMasterContainer initialCms={cms} />
      <Footer />
    </div>
  );
}
