"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { usePublicCmsWorkspace, sanitizeCmsHtml } from "@/lib/cms/usePublicCmsWorkspace";
import { QAFNEST_SUPPORT_CONTACT } from "@qafnest/shared";
import type { PublicCmsWorkspace } from "@/lib/cms/serverCmsWorkspace";
import {
  Building2,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Award,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  MapPin,
  Shield,
  KeyRound,
  FileCheck2,
  Landmark,
} from "lucide-react";

export interface AboutChapter {
  id: string;
  num: string;
  shortLabelEn: string;
  shortLabelAr: string;
  titleEn: string;
  titleAr: string;
  badgeEn: string;
  badgeAr: string;
  badgeColor: string;
  readTimeEn: string;
  readTimeAr: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ABOUT_CHAPTERS: AboutChapter[] = [
  {
    id: "corporate-profile",
    num: "01",
    shortLabelEn: "Corporate Profile",
    shortLabelAr: "الملف المؤسسي",
    titleEn: "Corporate Identity & Saudi Vision 2030",
    titleAr: "الهوية المؤسسية ورؤية المملكة 2030",
    badgeEn: "Vision 2030 Domestic Stays",
    badgeAr: "مستهدفات رؤية 2030",
    badgeColor: "bg-purple-100 text-[#4F2396] dark:bg-purple-950/60 dark:text-purple-300",
    readTimeEn: "4 min read",
    readTimeAr: "٤ دقائق قراءة",
    icon: Building2,
  },
  {
    id: "stay-ecosystem",
    num: "02",
    shortLabelEn: "Stay Ecosystem",
    shortLabelAr: "منظومة بيوت العطلات",
    titleEn: "Curated Stays Across 13 Saudi Provinces",
    titleAr: "بيوت عطلات موثقة عبر كافة مناطق المملكة",
    badgeEn: "13 Saudi Provinces",
    badgeAr: "١٣ منطقة سعودية",
    badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
    readTimeEn: "5 min read",
    readTimeAr: "٥ دقائق قراءة",
    icon: Sparkles,
  },
  {
    id: "trust-security",
    num: "03",
    shortLabelEn: "Trust & Safety",
    shortLabelAr: "الأمان والتحقق",
    titleEn: "Digital Identity & Smart Access Infrastructure",
    titleAr: "البنية التقنية للتحقق والدخول الذاتي الآمن",
    badgeEn: "Nafath & SDAIA PDPL",
    badgeAr: "نفاذ وحماية البيانات سدايا",
    badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300",
    readTimeEn: "4 min read",
    readTimeAr: "٤ دقائق قراءة",
    icon: ShieldCheck,
  },
  {
    id: "financial-governance",
    num: "04",
    shortLabelEn: "Financial Integrity",
    shortLabelAr: "الحوكمة والمدفوعات",
    titleEn: "Fair Settlements, ZATCA Invoicing & SAMA Standards",
    titleAr: "تسويات سريعة وفواتير زاتكا وأنظمة ساما البنكية",
    badgeEn: "ZATCA & SAMA SARIE",
    badgeAr: "فوترة زاتكا وسريع ساما",
    badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
    readTimeEn: "3 min read",
    readTimeAr: "٣ دقائق قراءة",
    icon: CreditCard,
  },
  {
    id: "hq-leadership",
    num: "05",
    shortLabelEn: "HQ & Governance",
    shortLabelAr: "المقر الرئيسي والحوكمة",
    titleEn: "Corporate Governance, Jeddah HQ & 24/7 Operations",
    titleAr: "المقر الرئيسي بجدة ومكتب الامتثال والعمليات",
    badgeEn: "Ministry License #73102999",
    badgeAr: "ترخيص رسمي 73102999",
    badgeColor: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300",
    readTimeEn: "3 min read",
    readTimeAr: "٣ دقائق قراءة",
    icon: Award,
  },
];

interface AboutMasterContainerProps {
  initialCms?: PublicCmsWorkspace;
}

export default function AboutMasterContainer({ initialCms }: AboutMasterContainerProps = {}) {
  const { language } = useApp();
  const isAr = language === "ar";
  const label = (en: string, ar: string) => (isAr ? ar : en);
  const { workspace: clientWorkspace } = usePublicCmsWorkspace();
  const cmsWorkspace = clientWorkspace || initialCms;

  const [activeChapter, setActiveChapter] = useState<string>("corporate-profile");

  const cmsContact = cmsWorkspace?.globals?.contactUs;
  const rawPhone =
    cmsContact?.phone?.trim() && !cmsContact.phone.includes("500000000")
      ? cmsContact.phone.trim()
      : QAFNEST_SUPPORT_CONTACT.displayPhone;
  const displayPhone = rawPhone.startsWith("05")
    ? `+966${rawPhone.slice(1)}`
    : rawPhone.startsWith("966")
    ? `+${rawPhone}`
    : rawPhone;
  const telHref = `tel:${displayPhone.replace(/[^\d+]/g, "")}`;
  const supportEmail = cmsContact?.supportEmail?.trim() || "support@qafnest.com";

  // ScrollSpy to track active chapter during scroll
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash && ABOUT_CHAPTERS.some((c) => c.id === hash)) {
      setActiveChapter(hash);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible?.target?.id) {
          setActiveChapter(visible.target.id);
        }
      },
      {
        rootMargin: "-20% 0px -60% 0px",
        threshold: 0,
      }
    );

    ABOUT_CHAPTERS.forEach((ch) => {
      const el = document.getElementById(ch.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleScrollTo = (chapterId: string, e: React.MouseEvent) => {
    e.preventDefault();
    setActiveChapter(chapterId);
    const target = document.getElementById(chapterId);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      if (window.history.pushState) {
        window.history.pushState(null, "", `#${chapterId}`);
      }
    }
  };

  return (
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-20">
      {/* Header: Quiet, grounded, authentically Saudi corporate identity */}
      <header className="mb-10 sm:mb-12 border-b border-slate-200/80 dark:border-white/10 pb-8 sm:pb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs font-semibold mb-4">
          <Landmark className="w-3.5 h-3.5 text-[#4F2396] dark:text-violet-300" />
          <span>{label("Corporate Profile & Hospitality Charter", "الملف التعريفي وميثاق الضيافة السعودية")}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.25]">
          {label("About QafNest Hospitality", "عن قاف نست — منصة الضيافة وبيوت العطلات")}
        </h1>

        <p className="mt-3.5 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
          {label(
            "Headquartered in Jeddah with operations across Riyadh and all 13 provinces, QafNest is an authorized digital marketplace connecting travelers with verified chalets, private pool villas, rural farms, and desert camps under strict Saudi Ministry of Tourism and SAMA standards.",
            "تأسست شركة قاف نست في جدة وتغطي عملياتها الرياض وكافة مناطق المملكة الـ ١٣ كمنصة رقمية مرخصة للوساطة في بيوت العطلات والضيافة الخاصة، تجمع بين أصالة الاستضافة السعودية وأعلى معايير الحوكمة المعتمدة من وزارة السياحة والبنك المركزي السعودي."
          )}
        </p>

        {/* Regulatory Credential Strip */}
        <div className="mt-6 flex flex-wrap items-center gap-3 text-xs sm:text-[13px] text-slate-600 dark:text-slate-400">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{label("Ministry of Tourism License #73102999", "ترخيص وزارة السياحة 73102999")}</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{label("Commercial Reg: 1010648921", "سجل تجاري: 1010648921")}</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{label("SDAIA & Saudi PDPL Compliant", "نظام حماية البيانات الشخصية سدايا")}</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{label("SAMA SARIE 24h Payouts", "تسويات سريعة معتمدة (ساما)")}</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{label("15% ZATCA Phase-2 Tax Compliant", "فاتورة ضريبية إلكترونية معتمدة")}</span>
          </div>
        </div>
      </header>

      {/* Master 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[310px_1fr] xl:grid-cols-[330px_1fr] gap-8 xl:gap-12 items-start">
        {/* Column 1: Sticky Navigation & Helpdesk Sidebar */}
        <aside className="lg:sticky lg:top-28 space-y-4">
          {/* Chapters Navigation Card */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#12101A] p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-white/10">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {label("About QafNest", "أقسام الملف التعريفي")}
              </span>
              <span className="text-[11px] font-semibold text-slate-400">
                {ABOUT_CHAPTERS.length} {label("Chapters", "أقسام")}
              </span>
            </div>

            <nav aria-label={label("About Navigation", "فهرس الملف التعريفي")} className="space-y-1">
              {ABOUT_CHAPTERS.map((ch) => {
                const Icon = ch.icon;
                const isActive = activeChapter === ch.id;

                return (
                  <a
                    key={ch.id}
                    href={`#${ch.id}`}
                    onClick={(e) => handleScrollTo(ch.id, e)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition group cursor-pointer ${
                      isActive
                        ? "bg-[#4F2396] text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive
                            ? "text-white"
                            : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200"
                        }`}
                      />
                      <span className="truncate">{label(ch.shortLabelEn, ch.shortLabelAr)}</span>
                    </div>
                    <span
                      className={`text-[11px] font-mono shrink-0 transition-colors ${
                        isActive ? "text-white/80" : "text-slate-400"
                      }`}
                    >
                      {ch.num}
                    </span>
                  </a>
                );
              })}
            </nav>
          </div>

          {/* Quick Stats Pillar Card */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#12101A] p-4 text-xs space-y-3 shadow-xs">
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider block border-b border-slate-100 dark:border-white/10 pb-2">
              {label("Platform Highlights", "أبرز أرقام المنصة")}
            </span>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5">
                <span className="block text-lg font-extrabold text-[#4F2396] dark:text-violet-300">13</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{label("Saudi Provinces", "منطقة بالمملكة")}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5">
                <span className="block text-lg font-extrabold text-emerald-600 dark:text-emerald-400">100%</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{label("Verified Units", "عقارات مفحوصة")}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5">
                <span className="block text-lg font-extrabold text-blue-600 dark:text-blue-400">&lt;60m</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{label("Relocation SLA", "ضمان حماية النزيل")}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5">
                <span className="block text-lg font-extrabold text-amber-600 dark:text-amber-400">24/7</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{label("Bilingual Concierge", "دعم على مدار الساعة")}</span>
              </div>
            </div>
          </div>

          {/* 24/7 Hospitality & Regulatory Concierge Box */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#12101A] p-4 text-xs space-y-2.5 shadow-xs">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold">
              <Phone className="w-4 h-4 text-[#4F2396] dark:text-violet-300" />
              <span>{label("Hospitality Concierge", "خدمة العناية بالنزلاء والشركاء")}</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              {label(
                "Have corporate inquiries, media questions, or need booking verification? Our dedicated Saudi hospitality team is available around the clock.",
                "هل لديك استفسارات مؤسسية أو شراكات أو تحتاج مساعدة فورية في حجزك؟ فريق خدمة النزلاء والمضيفين متاح على مدار الساعة."
              )}
            </p>
            <div className="pt-1 flex flex-col gap-1.5 font-semibold">
              <a
                href={telHref}
                className="inline-flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-slate-200 hover:text-[#4F2396] transition"
              >
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{label("Phone / Support:", "الهاتف المباشر:")}</span>
                </span>
                <span dir="ltr">{displayPhone}</span>
              </a>
              <a
                href={`mailto:${supportEmail}`}
                className="inline-flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-slate-200 hover:text-[#4F2396] transition"
              >
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                  <span>{label("Direct Email:", "البريد الإلكتروني:")}</span>
                </span>
                <span>{supportEmail}</span>
              </a>
            </div>
          </div>
        </aside>

        {/* Column 2: Continuous Master Charter / Corporate Articles */}
        <div className="space-y-12">
          {/* Chapter 01: Corporate Profile & Vision 2030 */}
          <article
            id="corporate-profile"
            className="scroll-mt-32 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#12101A] p-6 sm:p-10 shadow-xs space-y-6"
          >
            <header className="pb-6 border-b border-slate-100 dark:border-white/10">
              <div className="flex flex-wrap items-center gap-2.5 mb-2.5">
                <span className="font-mono text-xs sm:text-sm font-bold text-slate-400">
                  {label("Chapter 01", "القسم ٠١")}
                </span>
                <span className="text-xs font-bold px-3 py-0.5 rounded-full bg-purple-100 text-[#4F2396] dark:bg-purple-950/60 dark:text-purple-300">
                  {label("Saudi Vision 2030 Partner", "شريك مستهدفات الضيافة ٢٠٣٠")}
                </span>
                <span className="text-xs sm:text-sm text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{label("4 min read", "٤ دقائق قراءة")}</span>
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                {label("Corporate Identity & Saudi Vision 2030 Alignment", "الهوية المؤسسية ودعم مستهدفات رؤية المملكة 2030")}
              </h2>
            </header>

            {cmsWorkspace?.globals?.aboutUs?.content?.[isAr ? "ar" : "en"] && (
              <div
                className="p-5 rounded-xl border border-purple-200/80 dark:border-purple-900/40 bg-purple-50/50 dark:bg-purple-950/20 text-slate-800 dark:text-slate-200 text-sm sm:text-base leading-relaxed space-y-2 cms-about-narrative"
                dangerouslySetInnerHTML={{
                  __html: sanitizeCmsHtml(cmsWorkspace.globals.aboutUs.content[isAr ? "ar" : "en"]),
                }}
              />
            )}

            <div className="space-y-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
              <p>
                {label(
                  "QafNest Real Estate Vacation Rentals Co. is an authorized digital hospitality marketplace incorporated in the Kingdom of Saudi Arabia. Operating under Commercial Registration #1010648921 and regulated by the Ministry of Tourism (License #73102999), QafNest was founded to bring world-class trust, transparent pricing, and instantaneous digital booking to private vacation stays across the Kingdom.",
                  "تعد شركة قاف نست للعقارات وبيوت العطلات منصة وساطة رقمية مرخصة في المملكة العربية السعودية (سجل تجاري 1010648921) ومصرحة من وزارة السياحة (ترخيص رقم 73102999). تأسست المنصة لتطوير سوق تأجير بيوت العطلات والضيافة الخاصة ورفع معايير الثقة والشفافية عبر توظيف أحدث الحلول الرقمية للدخول الذاتي والتحقق النظامي."
                )}
              </p>
              <p>
                {label(
                  "In direct alignment with the National Tourism Strategy of Saudi Vision 2030—which aims to welcome 150 million annual domestic and international visitors—QafNest bridges the gap between discerning Saudi families, tourists, and verified property owners. We provide institutional governance, identity authentication, standardized cancellation protections, and electronic tax invoicing across every single booking.",
                  "وانطلاقاً من مستهدفات الاستراتيجية الوطنية للسياحة ضمن رؤية المملكة 2030 لجذب ١٥٠ مليون زائر محلي ودولي، تعمل قاف نست كهمزة وصل موثوقة تجمع العائلات والزوار بالملاك المرخصين، مع توفير منظومة حوكمة شاملة تتضمن توثيق الهويات الوطنية، وإدارة مبالغ التأمين، وحماية الإلغاء الشفافة، وإصدار الفواتير الضريبية المعتمدة فورياً."
                )}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02]">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1.5 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{label("Institutional Trust", "الثقة المؤسسية")}</span>
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {label(
                    "All properties are subject to verified licensing, physical checks, and accurate photographic documentation.",
                    "فحص ترخيص المنشأة، والتحقق الميداني من دقة الصور والمواصفات المعروضة للنزلاء."
                  )}
                </p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02]">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1.5 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{label("Zero Hidden Fees", "شفافية الأسعار")}</span>
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {label(
                    "Transparent breakdown of accommodation rates, security deposits, and mandatory 15% ZATCA VAT.",
                    "وضوح كامل لقيمة الإقامة، ومبلغ التأمين، والضريبة الرسمية دون أي رسوم مخفية عند الدفع."
                  )}
                </p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02]">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1.5 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{label("Sovereign Infrastructure", "بنية تقنية سيادية")}</span>
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {label(
                    "End-to-end hosted in sovereign Saudi data centers adhering strictly to SDAIA and Saudi PDPL regulations.",
                    "استضافة البيانات داخل مراكز بيانات سيادية بالمملكة وفق لوائح الهيئة السعودية للبيانات سدايا."
                  )}
                </p>
              </div>
            </div>
          </article>

          {/* Chapter 02: Stay Ecosystem */}
          <article
            id="stay-ecosystem"
            className="scroll-mt-32 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#12101A] p-6 sm:p-10 shadow-xs space-y-6"
          >
            <header className="pb-6 border-b border-slate-100 dark:border-white/10">
              <div className="flex flex-wrap items-center gap-2.5 mb-2.5">
                <span className="font-mono text-xs sm:text-sm font-bold text-slate-400">
                  {label("Chapter 02", "القسم ٠٢")}
                </span>
                <span className="text-xs font-bold px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  {label("Kingdom-Wide Reach", "تغطية جغرافية شاملة")}
                </span>
                <span className="text-xs sm:text-sm text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{label("5 min read", "٥ دقائق قراءة")}</span>
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                {label("Curated Private Stay Ecosystem Across 13 Provinces", "منظومة بيوت العطلات والضيافة الخاصة عبر مناطق المملكة")}
              </h2>
            </header>

            <div className="space-y-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
              <p>
                {label(
                  "QafNest powers five distinctive vacation categories tailored to local family gatherings, weekend getaways, seasonal events, and tourism expeditions:",
                  "تغطي محفظة قاف نست خمس فئات عقارية مميزة صُممت لتلبي احتياجات العائلات السعودية، والإجازات الأسبوعية، والفعاليات السياحية:"
                )}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#4F2396] dark:text-violet-300 block">
                  {label("Luxury Chalets & Resorts (Istirahat)", "الشاليهات والاستراحات الفاخرة")}
                </span>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {label(
                    "Private indoor and outdoor pools, expansive green lawns, barbeque zones, and premium majlis facilities across Riyadh (Al-Rimal, Diriyah), Jeddah (Obhur), and Al-Khobar.",
                    "شاليهات مجهزة بمسابح خاصة مفلترة، ومسطحات خضراء، ومجالس ضيافة متكاملة في الرياض (الرمال، الدرعية)، وجدة (أبحر)، والمنطقة الشرقية."
                  )}
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                  {label("Private Villas & Coastal Residences", "الفلل الخاصة والواجهات البحرية")}
                </span>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {label(
                    "Independent multi-bedroom residential villas featuring modern architectural design, smart appliances, high-speed fiber internet, and family privacy.",
                    "فلل سكنية مستقلة متعددة الغرف بتصاميم عصرية، وأنظمة تكييف مركزية، وإنترنت عالي السرعة، وخصوصية تامة للعائلات."
                  )}
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                  {label("Private Rural Farms & Estates", "المزارع الريفية والواحات الطبيعية")}
                </span>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {label(
                    "Authentic countryside experiences nestled among palm groves and mountain vistas in Al-Ahsa, Taif, Qassim, and Al-Kharj with full leisure amenities.",
                    "إقامات ريفية ساحرة بين بساتين النخيل وأجواء الطبيعة في الأحساء، الطائف، القصيم، والخرج مع مرافق ترفيهية متكاملة."
                  )}
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block">
                  {label("Desert Glamping & Mountain Domes", "المخيمات الفاخرة والقباب الجبلية")}
                </span>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {label(
                    "Heritage desert camps and climate-controlled panoramic domes under the starry night skies of AlUla, Thumamah, and the Asir highlands of Abha.",
                    "تجارب تخييم فاخرة وقباب بانورامية مجهزة بالتكييف في صحراء العلا، الثمامة، ومرتفعات عسير وأبها الساحرة."
                  )}
                </p>
              </div>
            </div>
          </article>

          {/* Chapter 03: Digital Verification & Smart Infrastructure */}
          <article
            id="trust-security"
            className="scroll-mt-32 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#12101A] p-6 sm:p-10 shadow-xs space-y-6"
          >
            <header className="pb-6 border-b border-slate-100 dark:border-white/10">
              <div className="flex flex-wrap items-center gap-2.5 mb-2.5">
                <span className="font-mono text-xs sm:text-sm font-bold text-slate-400">
                  {label("Chapter 03", "القسم ٠٣")}
                </span>
                <span className="text-xs font-bold px-3 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                  {label("Trust & Technology", "البنية التقنية والأمان")}
                </span>
                <span className="text-xs sm:text-sm text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{label("4 min read", "٤ دقائق قراءة")}</span>
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                {label("Digital Identity & Keyless Self Check-In Infrastructure", "البنية التقنية للتحقق الرقمي والدخول الذاتي الآمن")}
              </h2>
            </header>

            <div className="space-y-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
              <p>
                {label(
                  "We have replaced legacy key handovers and undocumented arrivals with modern Saudi-integrated verification systems that eliminate uncertainty for both Guests and Hosts:",
                  "ودعنا الطرق التقليدية لتسليم المفاتيح الورقية والإجراءات غير الموثقة، واستبدلناها ببنية تقنية سعودية موثوقة تضمن راحة النزيل والمضيف:"
                )}
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] flex items-start gap-3.5">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 shrink-0 mt-0.5">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {label("Nafath & Elm Yaqeen Identity Validation", "التوثيق عبر نفاذ ويقين")}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {label(
                      "In compliance with Ministry of Tourism security guidelines, all booking parties verify their Saudi National ID or Iqama alongside verified mobile numbers via SMS OTP prior to check-in confirmation.",
                      "التزاماً باللوائح الأمنية والتنظيمية لوزارة السياحة، يتم التحقق من هويات النزلاء والمضيفين عبر المنصات الوطنية المعتمدة وتأكيد أرقام الجوال المسجلة."
                    )}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] flex items-start gap-3.5">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50 text-[#4F2396] dark:text-purple-300 shrink-0 mt-0.5">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {label("Automated Smart Lock & Dynamic PIN Codes", "الأقفال الذكية ورموز الدخول الآلية")}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {label(
                      "Keyless Self Check-In properties allow contactless access. Hosts configure unique digital door access codes transmitted directly to the Guest's verified 'My Bookings' portal ahead of their scheduled arrival window.",
                      "تتيح العقارات المزودة بالدخول الذاتي الوصول في أي وقت دون انتظار، حيث يستلم النزيل رمز القفل الرقمي المشفر مباشرة في حسابه قبل موعد الوصول."
                    )}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] flex items-start gap-3.5">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 shrink-0 mt-0.5">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {label("SDAIA & Saudi PDPL Sovereign Privacy", "الامتثال لنظام حماية البيانات الشخصية سدايا")}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {label(
                      "Your personal details, booking history, and contact numbers are stored exclusively inside sovereign Saudi cloud regions under AES-256 encryption. We never sell or broker user information to third-party ad exchanges.",
                      "تُحفظ كافة البيانات الشخصية وسجلات الحجز داخل المملكة بتشفير كامل وفق ضوابط نظام حماية البيانات الشخصية، دون أي مشاركة إعلانية خارجية."
                    )}
                  </p>
                </div>
              </div>
            </div>
          </article>

          {/* Chapter 04: Financial Governance & SAMA Standards */}
          <article
            id="financial-governance"
            className="scroll-mt-32 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#12101A] p-6 sm:p-10 shadow-xs space-y-6"
          >
            <header className="pb-6 border-b border-slate-100 dark:border-white/10">
              <div className="flex flex-wrap items-center gap-2.5 mb-2.5">
                <span className="font-mono text-xs sm:text-sm font-bold text-slate-400">
                  {label("Chapter 04", "القسم ٠٤")}
                </span>
                <span className="text-xs font-bold px-3 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                  {label("Financial Compliance", "الحوكمة المالية")}
                </span>
                <span className="text-xs sm:text-sm text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{label("3 min read", "٣ دقائق قراءة")}</span>
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                {label("Fair Financial Settlements, ZATCA Invoices & SAMA Standards", "النزاهة المالية وتسويات ساما السريعة وفواتير زاتكا")}
              </h2>
            </header>

            <div className="space-y-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
              <p>
                {label(
                  "Financial transactions on QafNest are governed by certified regulatory pipelines designed to guarantee guest refunds and swift host payouts:",
                  "تخضع كافة المعاملات المالية على منصة قاف نست لأنظمة مصرفية صارمة تحفظ حقوق النزيل وسرعة سداد المضيف:"
                )}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#4F2396] dark:text-violet-300 block">
                  {label("24-Hour Host Payouts via SAMA SARIE", "تحويل المستحقات خلال ٢٤ ساعة عبر سريع")}
                </span>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {label(
                    "Once a guest successfully checks in, host payouts are processed directly to verified Saudi IBAN accounts within 24 hours via SAMA's SARIE network.",
                    "بمجرد تسجيل دخول النزيل، تُحول أرباح المضيف الصافية لحسابه البنكي المعتمد خلال ٢٤ ساعة عبر شبكة سريع التابعة للبنك المركزي السعودي."
                  )}
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                  {label("15% ZATCA Phase-2 Tax Invoicing", "الفاتورة الضريبية الإلكترونية زاتكا")}
                </span>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {label(
                    "Every booking generates an official Phase-2 e-invoice equipped with encrypted cryptographic TLV QR codes compliant with the Zakat, Tax and Customs Authority.",
                    "تصدر لكل حجز فاتورة ضريبية رسمية متوافقة مع متطلبات المرحلة الثانية لهيئة الزكاة والضريبة والجمارك مزودة برمز الاستجابة السريعة QR."
                  )}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                {label("Instant Guest Protection Guarantee (Host Default)", "ضمان حماية النزيل الفوري")}
              </span>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {label(
                  "If a host unexpectedly cancels or a property does not match its verified listing, QafNest Operations intervenes within 60 minutes with an immediate equal or superior relocation, full refund without deductions, and a 10% courtesy credit.",
                  "في حال إلغاء المضيف أو تعذر تسليم الوحدة أو اختلافها عن الصور، يتدخل فريق العمليات خلال ٦٠ دقيقة بتوفير بديل فوري مماثل أو أعلى، أو استرداد كامل المبلغ بنسبة ١٠٠٪ فوراً مع رصيد اعتذاري."
                )}
              </p>
            </div>
          </article>

          {/* Chapter 05: Headquarters, Leadership & Governance */}
          <article
            id="hq-leadership"
            className="scroll-mt-32 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#12101A] p-6 sm:p-10 shadow-xs space-y-6"
          >
            <header className="pb-6 border-b border-slate-100 dark:border-white/10">
              <div className="flex flex-wrap items-center gap-2.5 mb-2.5">
                <span className="font-mono text-xs sm:text-sm font-bold text-slate-400">
                  {label("Chapter 05", "القسم ٠٥")}
                </span>
                <span className="text-xs font-bold px-3 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                  {label("Corporate Presence", "المقر والامتثال")}
                </span>
                <span className="text-xs sm:text-sm text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{label("3 min read", "٣ دقائق قراءة")}</span>
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                {label("Headquarters, Governance & Regulatory Compliance", "المقر الرئيسي في جدة والرياض ومكتب الامتثال")}
              </h2>
            </header>

            <div className="space-y-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
              <p>
                {label(
                  "QafNest operates from executive corporate offices in Jeddah and operations hubs in Riyadh. Our interdisciplinary team consists of hospitality experts, legal and regulatory counsel, security specialists, and software engineers dedicated to redefining the vacation rental landscape across Saudi Arabia.",
                  "تتخذ شركة قاف نست من مدينة جدة مقراً رئيسياً لعملياتها الإدارية، إلى جانب مركز العمليات الميدانية في الرياض. يضم فريق عملنا نخبة من خبراء الضيافة، والمستشارين القانونيين، ومهندسي البرمجيات الملتزمين بتطوير تجربة الإقامة السياحية في المملكة."
                )}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] space-y-2">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                  <MapPin className="w-4 h-4 text-[#4F2396] dark:text-violet-300 shrink-0" />
                  <span>{label("Jeddah HQ Address", "مقر جدة الرئيسي")}</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-mono">
                  {label(
                    "5040 Abu Masaoud Al Badri, 8121، حي طيبة، Jeddah 23835, Kingdom of Saudi Arabia",
                    "٥٠٤٠ أبو مسعود البدري، ٨١٢١، حي طيبة، جدة ٢٣٨٣٥، المملكة العربية السعودية"
                  )}
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] space-y-2">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                  <Award className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{label("Regulatory Identifiers", "البيانات النظامية والتراخيص")}</span>
                </div>
                <ul className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 space-y-1 font-mono">
                  <li><strong>CR:</strong> 1010648921</li>
                  <li><strong>License:</strong> #73102999 (Ministry of Tourism)</li>
                  <li><strong>VAT ID:</strong> 310123456700003</li>
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-white/10 flex flex-wrap items-center justify-between gap-4">
              <div className="text-xs text-slate-500">
                {label("Ready to explore certified vacation rentals?", "جاهز لاستكشاف بيوت العطلات المعتمدة؟")}
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={isAr ? "/ar/policies" : "/en/policies"}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition"
                >
                  {label("Review Governance Charter", "ميثاق السياسات والحوكمة")}
                </Link>
                <Link
                  href={isAr ? "/ar/search" : "/en/search"}
                  className="px-4 py-2 rounded-xl bg-[#4F2396] hover:bg-violet-800 text-white text-xs font-bold transition shadow-xs"
                >
                  {label("Explore Stays", "استكشف العقارات")}
                </Link>
              </div>
            </div>
          </article>
        </div>
      </div>
    </main>
  );
}
