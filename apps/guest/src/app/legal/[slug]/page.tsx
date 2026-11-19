"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, FileText, Loader2 } from "lucide-react";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import { useApp } from "@/context/AppContext";
import { localizePath } from "@/lib/localization/localeHelper";
import { usePublicCmsWorkspace } from "@/lib/cms/usePublicCmsWorkspace";
import { CmsRichContentCard } from "@/components/legal/CmsLegalHtmlSection";

export default function DynamicLegalPage() {
  const params = useParams();
  const rawSlug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug || "";
  const slug = decodeURIComponent(String(rawSlug)).trim().toLowerCase();
  const { language } = useApp();
  const isAr = language === "ar";
  const label = (en: string, ar: string) => (isAr ? ar : en);

  const { workspace, loading } = usePublicCmsWorkspace();
  const page = workspace?.legalPages?.find(
    (p) => p.showSection !== false && p.slug.trim().toLowerCase() === slug
  );

  const title = page ? (isAr ? page.title.ar || page.title.en : page.title.en || page.title.ar) : "";
  const html = page ? (isAr ? page.content.ar || page.content.en : page.content.en || page.content.ar) : "";

  return (
    <div className="min-h-screen bg-[#FDFCFE] dark:bg-[#08070D] text-slate-900 dark:text-slate-100 flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-[1100px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-12 sm:pb-16">
        <div className="mb-6">
          <Link
            href={localizePath("/", language)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 dark:text-violet-300 hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
            <span>{label("Back to Home", "العودة للرئيسية")}</span>
          </Link>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12101a] p-12 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-purple-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500">{label("Loading policy...", "جاري تحميل الوثيقة...")}</p>
          </div>
        ) : !page ? (
          <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12101a] p-12 text-center space-y-3">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <h1 className="text-xl font-extrabold">{label("Policy Page Not Found", "الصفحة غير موجودة")}</h1>
            <p className="text-xs text-slate-500">
              {label(
                "This legal document is unavailable or currently unpublished.",
                "هذه الوثيقة القانونية غير متوفرة حالياً."
              )}
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-3xl bg-gradient-to-br from-[#4F2396] via-[#6B2BB8] to-[#904BE6] text-white p-8 sm:p-12 mb-8 shadow-xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider mb-3">
                <FileText className="w-3.5 h-3.5" />
                {label("QafNest Legal & Governance", "السياسات والحوكمة — قاف نست")}
              </span>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">{title}</h1>
            </div>

            <CmsRichContentCard
              html={html}
              metaTitle={isAr ? page.metaTitle?.ar : page.metaTitle?.en}
              metaDescription={isAr ? page.metaDescription?.ar : page.metaDescription?.en}
              updatedAt={page.updatedAt}
              language={language}
              accent="purple"
            />
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
