"use client";

import React from "react";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import { useApp } from "@/context/AppContext";
import { Cookie, ShieldCheck, Info, Settings } from "lucide-react";
import { findCmsLegalPage, usePublicCmsWorkspace } from "@/lib/cms/usePublicCmsWorkspace";
import { CmsRichContentCard } from "@/components/legal/CmsLegalHtmlSection";

export default function CookiesPolicyPage() {
  const { language } = useApp();
  const label = (en: string, ar: string) => (language === "ar" ? ar : en);
  const { workspace } = usePublicCmsWorkspace();
  const cmsLegal = findCmsLegalPage(workspace, ["cookies-policy", "cookie-policy", "cookies"]);
  const cmsHtml = cmsLegal
    ? (language === "ar" ? cmsLegal.content.ar || cmsLegal.content.en : cmsLegal.content.en || cmsLegal.content.ar)
    : "";
  const pageTitle = cmsLegal
    ? (language === "ar" ? cmsLegal.title.ar || cmsLegal.title.en : cmsLegal.title.en || cmsLegal.title.ar)
    : label("Cookies Policy", "سياسة ملفات تعريف الارتباط (الكوكيز)");

  const cookieTypes = [
    {
      titleEn: "1. Strictly Necessary Cookies (Essential)",
      titleAr: "١. ملفات تعريف الارتباط الأساسية (الضرورية)",
      descEn: "Essential for platform security, account authentication, anti-CSRF protection, booking checkout continuity, and PDPL consent state tracking. These cannot be disabled without breaking core reservation functions.",
      descAr: "ضرورية لتأمين المنصة، وتسجيل الدخول، والحماية من التلاعب (CSRF)، واستقرار خطوات الدفع والحجز، وحفظ حالة موافقتك على الخصوصية. لا يمكن إيقافها دون التأثير على عمل الموقع الأساسي.",
      required: true,
    },
    {
      titleEn: "2. Preference & Localization Cookies",
      titleAr: "٢. ملفات التفضيلات واللغة والمظهر",
      descEn: "Preserve your selected language (English / Arabic), display theme (Light / Dark), and recent Saudi city/category filters across QafNest web and app sessions.",
      descAr: "تحفظ تفضيلاتك الشخصية مثل اختيار اللغة (العربية / الإنجليزية)، ونمط العرض (فاتح / داكن)، وآخر مدن وفئات البحث في قاف نست لتقديم تجربة مخصصة دون إعادة الضبط.",
      required: false,
    },
    {
      titleEn: "3. Performance & Diagnostic Analytics",
      titleAr: "٣. ملفات قياس الأداء والتحليلات التشغيلية",
      descEn: "Gather aggregated, non-identifying metrics on page speed, map loading, and search reliability so we can optimize accommodation discovery across Riyadh, Jeddah, AlUla, and the Kingdom.",
      descAr: "تجمع مؤشرات إحصائية مجمعة ومجهولة الهوية لقياس سرعة التصفح واستقرار البحث وعرض الخرائط بما يساعدنا على تحسين تجربة المستخدمين في جميع مدن المملكة.",
      required: false,
    },
    {
      titleEn: "4. Security & Anti-Fraud Protection",
      titleAr: "٤. ملفات الحماية والأمان ومكافحة الاحتيال",
      descEn: "Safeguard Guest and Host accounts from automated scraping, rate-abuse, unauthorized login attempts, and payment tampering in coordination with Saudi cybersecurity controls.",
      descAr: "تسهم في حماية حسابات الضيوف والمضيفين من محاولات الدخول غير المصرح بها والتجميع الآلي والتلاعب بعمليات السداد بما يتوافق مع ضوابط الأمن السيبراني.",
      required: true,
    },
  ];

  return (
    <div className="min-h-screen bg-[#FDFCFE] dark:bg-[#08070D] text-slate-900 dark:text-slate-100 flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-[1000px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-10 sm:pb-14">
        {/* Header Banner */}
        <div className="rounded-3xl bg-gradient-to-br from-amber-900 via-amber-800 to-amber-700 text-white p-8 sm:p-12 mb-10 shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-xs mb-3">
              <Cookie className="w-3.5 h-3.5 text-amber-200" />
              {label("Transparency & User Control", "الشفافية والتحكم للمستخدم")}
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              {pageTitle}
            </h1>
            <p className="mt-3 text-sm sm:text-base text-amber-100 leading-relaxed">
              {label(
                "Learn how QafNest uses cookies and modern browser storage technologies to provide a fast, secure, and personalized residential stay booking experience.",
                "تعرف على كيفية استخدام قاف نست لملفات تعريف الارتباط وتقنيات التخزين المحلية لتقديم تجربة حجز سلسة وآمنة ومخصصة لاحتياجاتك."
              )}
            </p>
          </div>
        </div>

        {/* Live CMS-Managed Cookies Content */}
        {cmsLegal && cmsHtml.trim() ? (
          <CmsRichContentCard
            html={cmsHtml}
            metaTitle={language === "ar" ? cmsLegal.metaTitle?.ar : cmsLegal.metaTitle?.en}
            metaDescription={language === "ar" ? cmsLegal.metaDescription?.ar : cmsLegal.metaDescription?.en}
            updatedAt={cmsLegal.updatedAt}
            language={language}
            accent="amber"
          />
        ) : (
        <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#12101a] p-6 sm:p-10 shadow-xs space-y-8">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Info className="w-5 h-5 text-amber-600" />
              <span>{label("What Are Cookies?", "ما هي ملفات تعريف الارتباط؟")}</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {label(
                "Cookies are small data files stored on your browser or device when you visit websites. They allow platforms to remember your actions, login sessions, and preferences over time so you enjoy a smoother navigation experience without repeatedly re-entering data.",
                "ملفات تعريف الارتباط هي ملفات نصية صغيرة تُحفظ على جهازك أو متصفحك عند زيارة الموقع. تمكننا هذه الملفات من التعرف على جهازك وحفظ تفضيلاتك لتسهيل التنقل دون الحاجة لإعادة إدخال المعلومات في كل زيارة."
              )}
            </p>
          </section>

          <section className="space-y-4 pt-6 border-t border-slate-100 dark:border-white/10">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-amber-600" />
              <span>{label("How We Categorize Our Cookies", "تصنيف ملفات الكوكيز في المنصة")}</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cookieTypes.map((c, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 dark:text-white">
                      {label(c.titleEn, c.titleAr)}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.required
                          ? "bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
                          : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      {c.required ? label("Mandatory", "إلزامي") : label("Optional", "اختياري")}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {label(c.descEn, c.descAr)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3 pt-6 border-t border-slate-100 dark:border-white/10">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-600" />
              <span>{label("Managing and Disabling Cookies", "إدارة وتعطيل ملفات الكوكيز")}</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {label(
                "You can configure your web browser settings to block or notify you about cookies. Please note that disabling essential cookies may impact the operation of secure checkout sessions, smart lock credential displays, and user authentication on QafNest.",
                "يمكنك التحكم في ملفات تعريف الارتباط أو حذفها عبر إعدادات متصفحك في أي وقت. يُرجى ملاحظة أن تعطيل الملفات الضرورية قد يؤثر على عمل وظائف الدخول الذكي وتأكيد الحجوزات السكنية."
              )}
            </p>
          </section>
        </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
