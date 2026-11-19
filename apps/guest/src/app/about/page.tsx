"use client";

import React from "react";
import Link from "next/link";
import { Award, Building2, ShieldCheck, Sparkles } from "lucide-react";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import { useApp } from "@/context/AppContext";
import { localizePath } from "@/lib/localization/localeHelper";
import { usePublicCmsWorkspace } from "@/lib/cms/usePublicCmsWorkspace";
import { CmsRichContentCard } from "@/components/legal/CmsLegalHtmlSection";

const FALLBACK_ABOUT_EN = `<h2>About QafNest Hospitality</h2>
<p>QafNest is Saudi Arabia's modern vacation rental and private hospitality marketplace, licensed by the Ministry of Tourism (License #73102999). We connect travelers and families with verified luxury chalets, private pool villas, country farms, and desert glamping camps across Riyadh, Jeddah, AlUla, Abha, Taif, Khobar, and beyond.</p>
<h2>Our Mission</h2>
<p>We combine authentic Saudi hospitality with modern trust infrastructure—instant Smart Lock self check-in, Nafath/Yaqeen identity verification, ZATCA Phase 2 e-invoicing, 24-hour SAMA SARIE host payouts, and flexible payment options including Mada, Apple Pay, Tabby, and Tamara.</p>`;

const FALLBACK_ABOUT_AR = `<h2>عن منصة قاف نست للضيافة</h2>
<p>قاف نست هي منصة سعودية رائدة لحجز بيوت العطلات والضيافة الخاصة، مرخصة رسمياً من وزارة السياحة (ترخيص رقم 73102999). نربط الضيوف والعائلات بأفضل الشاليهات والفلل الخاصة والمزارع والمخيمات الصحراوية الموثقة في الرياض وجدة والعلا وأبها والطائف والخبر وكافة مناطق المملكة.</p>
<h2>رسالتنا</h2>
<p>نجمع بين أصالة الضيافة السعودية وأحدث معايير الثقة والتقنية؛ من الدخول الذاتي بالرمز السري، وتوثيق الهوية عبر نفاذ ويقين، والفوترة الإلكترونية المعتمدة من زاتكا، وتحويل مستحقات المضيفين خلال ٢٤ ساعة، وخيارات الدفع المتعددة عبر مدى وأبل باي وتابي وتمارا.</p>`;

export default function AboutUsPage() {
  const { language } = useApp();
  const isAr = language === "ar";
  const label = (en: string, ar: string) => (isAr ? ar : en);
  const { workspace } = usePublicCmsWorkspace();
  const about = workspace?.globals?.aboutUs;

  const html = isAr
    ? about?.content?.ar?.trim() || about?.content?.en?.trim() || FALLBACK_ABOUT_AR
    : about?.content?.en?.trim() || about?.content?.ar?.trim() || FALLBACK_ABOUT_EN;

  return (
    <div className="min-h-screen bg-[#FDFCFE] dark:bg-[#08070D] text-slate-900 dark:text-slate-100 flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-[1160px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-12 sm:pb-16 space-y-8">
        <div className="rounded-3xl bg-gradient-to-br from-[#4F2396] via-[#6B2BB8] to-[#904BE6] text-white p-8 sm:p-12 shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              {label("Ministry of Tourism Licensed #73102999", "مرخصة من وزارة السياحة · ترخيص 73102999")}
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              {label("About QafNest", "من نحن — قاف نست")}
            </h1>
            <p className="mt-3 text-sm sm:text-base text-violet-100 leading-relaxed">
              {label(
                "Feel at Home. Stay Exceptional. Discovering curated private stays across Saudi Arabia with instant booking, smart check-in, and complete regulatory transparency.",
                "اشعر وكأنك في بيتك. إقامة استثنائية. نقدم تجربة حجز موثوقة لأجمل الشاليهات والفلل والمخيمات في جميع أنحاء المملكة."
              )}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12101a] p-5 flex items-start gap-3">
            <Award className="w-6 h-6 text-purple-600 dark:text-violet-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-extrabold">{label("Licensed Marketplace", "منصة سياحية مرخصة")}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {label("Regulated under Saudi Ministry of Tourism & ZATCA Phase 2.", "متوافقة بالكامل مع وزارة السياحة والفوترة الإلكترونية.")}
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12101a] p-5 flex items-start gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-extrabold">{label("Verified Hosts & Guests", "ضيوف ومضيفون موثقون")}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {label("Protected by Nafath/Yaqeen identity checks & Saudi PDPL.", "حماية كاملة عبر توثيق نفاذ ويقين ونظام حماية البيانات الشخصية.")}
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12101a] p-5 flex items-start gap-3">
            <Building2 className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-extrabold">{label("Kingdom-Wide Stays", "تغطية شاملة للمملكة")}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {label("Riyadh, Jeddah, AlUla, Abha, Taif, Khobar & more.", "الرياض، جدة، العلا، أبها، الطائف، الخبر والمزيد.")}
              </p>
            </div>
          </div>
        </div>

        <CmsRichContentCard
          html={html}
          metaTitle={isAr ? about?.metaTitle?.ar : about?.metaTitle?.en}
          metaDescription={isAr ? about?.metaDescription?.ar : about?.metaDescription?.en}
          language={language}
          accent="purple"
        />

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href={localizePath("/search", language)}
            className="px-6 py-3 rounded-2xl bg-[#4F2396] hover:bg-[#3f1c7a] text-white text-sm font-bold transition shadow-md"
          >
            {label("Explore Properties", "استكشف العقارات")}
          </Link>
          <Link
            href={localizePath("/contact", language)}
            className="px-6 py-3 rounded-2xl border border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 text-sm font-bold hover:border-purple-400 transition"
          >
            {label("Contact Us", "تواصل معنا")}
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
