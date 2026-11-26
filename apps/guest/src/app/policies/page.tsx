import React from "react";
import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import { getServerPublicCmsWorkspace } from "@/lib/cms/serverCmsWorkspace";
import { getSeoAlternates } from "@/lib/localization/localeHelper";
import PolicyMasterContainer from "@/components/policies/PolicyMasterContainer";

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
  const { canonical, alternates } = getSeoAlternates("/policies", lang, resolvedBaseUrl);

  const title =
    lang === "ar"
      ? "الميثاق الموحد للسياسات والحوكمة | قاف نست"
      : "Unified Governance & Policy Charter | QafNest";

  const description =
    lang === "ar"
      ? "الميثاق الموحد لسياسات منصة قاف نست: الشروط والأحكام، حماية البيانات وفق سدايا، سياسة الإلغاء والاسترداد، وتراخيص المضيفين المعتمدة من وزارة السياحة."
      : "Complete unified governance charter for QafNest: Terms of Use, Saudi PDPL Privacy, Cancellation & SAMA Refunds, and Host Licensing under the Ministry of Tourism.";

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
      type: "article",
    },
  };
}

export default async function PoliciesMasterPage() {
  const cms = await getServerPublicCmsWorkspace();

  return (
    <div className="min-h-screen bg-[#FAFAFC] dark:bg-[#07060A] text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-[#4F2396]/20 scroll-smooth">
      <Navbar />
      <PolicyMasterContainer initialCms={cms} />
      <Footer />
    </div>
  );
}
