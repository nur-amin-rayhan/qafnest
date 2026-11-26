"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { usePublicCmsWorkspace, sanitizeCmsHtml } from "@/lib/cms/usePublicCmsWorkspace";
import PolicyTocSidebar from "./PolicyTocSidebar";
import { POLICY_CHAPTERS } from "./policyChaptersData";
import { Scale, CheckCircle2, Clock } from "lucide-react";
import type { PublicCmsWorkspace, PublicCmsLegalPage } from "@/lib/cms/serverCmsWorkspace";

interface PolicyMasterContainerProps {
  initialCms?: PublicCmsWorkspace;
}

export default function PolicyMasterContainer({ initialCms }: PolicyMasterContainerProps) {
  const { language } = useApp();
  const { workspace: clientWorkspace } = usePublicCmsWorkspace();
  const cms = clientWorkspace || initialCms;

  const isAr = language === "ar";
  const label = (en: string, ar: string) => (isAr ? ar : en);

  // Helper to extract CMS content for a given chapter slug
  const getChapterContent = (slug: string) => {
    if (!cms?.legalPages) return "";
    const cleanSlug = slug.replace(/-/g, "").toLowerCase();
    const cmsPage = cms.legalPages.find(
      (p: PublicCmsLegalPage) =>
        p.showSection !== false &&
        (p.slug === slug || p.slug.replace(/-/g, "").toLowerCase() === cleanSlug)
    );
    const rawHtml = cmsPage?.content?.[language] || (isAr ? cmsPage?.content?.ar : cmsPage?.content?.en) || "";
    return rawHtml
      .replace(
        /class="[^"]*bg-emerald-200[^"]*"/g,
        'class="tier-badge-flexible"'
      )
      .replace(
        /class="[^"]*bg-blue-200[^"]*"/g,
        'class="tier-badge-moderate"'
      )
      .replace(
        /class="[^"]*bg-rose-200[^"]*"/g,
        'class="tier-badge-strict"'
      );
  };

  return (
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-20">
      {/* Header: Quiet, grounded, authentically Saudi */}
      <header className="mb-10 sm:mb-12 border-b border-slate-200/80 dark:border-white/10 pb-8 sm:pb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs font-semibold mb-4">
          <Scale className="w-3.5 h-3.5 text-[#4F2396] dark:text-violet-300" />
          <span>{label("Official Regulatory & Governance Charter", "مركز الحوكمة والميثاق النظامي الموحد")}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.25]">
          {label("Platform Policies & Trust Center", "ميثاق السياسات والشفافية وحماية النزلاء")}
        </h1>

        <p className="mt-3.5 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
          {label(
            "Clear, honest, and legally binding guidelines governing stays, data protection, transparent cancellations, and host licensing under the laws of the Kingdom of Saudi Arabia.",
            "إطار قانوني وتشغيلي شفاف ومكتمل الأركان يُنظّم علاقة الضيافة، ويحمي بياناتك الشخصية، ويضمن استرداد أموالك، ويوثق تراخيص المضيفين وفق أنظمة المملكة العربية السعودية."
          )}
        </p>

        {/* Regulatory Credential Badges */}
        <div className="mt-6 flex flex-wrap items-center gap-3 text-xs sm:text-[13px] text-slate-600 dark:text-slate-400">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{label("Ministry of Tourism License #73102999", "ترخيص وزارة السياحة 73102999")}</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{label("Commercial Reg 1010648921", "سجل تجاري 1010648921")}</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{label("Saudi PDPL & SDAIA Compliant", "نظام حماية البيانات الشخصية (سدايا)")}</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{label("SAMA SARIE 24h Payouts", "تحويلات سريعة ومعتمدة (ساما)")}</span>
          </div>
        </div>
      </header>

      {/* Master Layout: 2-column on desktop (Sticky TOC sidebar + Unified Content Container) */}
      <div className="grid grid-cols-1 lg:grid-cols-[290px_1fr] gap-8 xl:gap-12 items-start">
        {/* Column 1: Smooth Interactive Sidebar Navigation */}
        <PolicyTocSidebar chapters={POLICY_CHAPTERS} lang={language} initialCms={cms} />

        {/* Column 2: Continuous Master Charter Container */}
        <div className="space-y-12">
          {POLICY_CHAPTERS.map((item) => {
            const htmlContent = getChapterContent(item.slug);

            return (
              <article
                id={item.slug}
                key={item.slug}
                className="scroll-mt-32 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#12101A] p-6 sm:p-10 shadow-xs"
              >
                {/* Clean Chapter Header without extraneous external buttons */}
                <header className="pb-6 mb-8 border-b border-slate-100 dark:border-white/10">
                  <div className="flex flex-wrap items-center gap-2.5 mb-2.5">
                    <span className="font-mono text-xs sm:text-sm font-bold text-slate-400">
                      {label(`Chapter ${item.num}`, `القسم ${item.num}`)}
                    </span>
                    <span className={`text-xs font-bold px-3 py-0.5 rounded-full ${item.badgeColor}`}>
                      {label(item.badgeEn, item.badgeAr)}
                    </span>
                    <span className="text-xs sm:text-sm text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{label(item.readTimeEn, item.readTimeAr)}</span>
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                    {label(item.labelEn, item.labelAr)}
                  </h2>
                  <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-2 max-w-3xl leading-relaxed">
                    {label(item.descEn, item.descAr)}
                  </p>
                </header>

                {/* Rich Rendered Content with enhanced font size & line height */}
                <div
                  className="prose prose-slate dark:prose-invert max-w-none text-[15.5px] sm:text-[17px] leading-[1.85] sm:leading-[1.95] text-slate-700 dark:text-slate-200 font-normal [&>h3]:text-xl [&>h3]:sm:text-2xl [&>h4]:text-lg [&>h4]:sm:text-xl [&>p]:mb-5 [&>ul]:mb-5 [&>li]:leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: sanitizeCmsHtml(htmlContent) }}
                />
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}
