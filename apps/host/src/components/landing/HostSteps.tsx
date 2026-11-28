"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface HostStepsProps {
  t: (en: string, ar: string) => string;
  lang: "ar" | "en";
}

export function HostSteps({ t, lang }: HostStepsProps) {
  const steps = [
    {
      step: "01",
      titleAr: "سجل عقارك مجاناً",
      titleEn: "Register Property Free",
      descAr: "أضف اسم العقار، الموقع على الخريطة، المساحة، وتفاصيل الغرف والمجالس.",
      descEn: "Enter your property name, map location, area, bedrooms, and majlis details.",
    },
    {
      step: "02",
      titleAr: "ارفع الصور وحدد الأسعار",
      titleEn: "Upload Photos & Set Prices",
      descAr: "أضف صوراً واضحة للمرافق وحدد أسعار وسط الأسبوع ونهاية الأسبوع.",
      descEn: "Add clear photos of your spaces and set weekday & weekend nightly rates.",
    },
    {
      step: "03",
      titleAr: "التوثيق والاعتماد السريع",
      titleEn: "Quick License Verification",
      descAr: "يربط فريقنا ترخيص وزارة السياحة ويعتمد وحدتك لتظهر لملايين الضيوف.",
      descEn: "We verify your Ministry of Tourism permit and publish your unit to guests.",
    },
    {
      step: "04",
      titleAr: "استقبل الضيوف واستلم أرباحك",
      titleEn: "Host Guests & Get Paid",
      descAr: "تستلم حوالتك البنكية تلقائياً خلال 48 ساعة من تسجيل دخول الضيف.",
      descEn: "Receive automatic bank transfers within 48 hours of guest check-in.",
    },
  ];

  return (
    <section id="how-to-host" className="mx-auto max-w-[1440px] px-5 py-14 sm:px-8 lg:py-20 text-center">
      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
        {t("How to Host with QafNest", "طريقة الاستضافة في قاف نست")}
      </h2>
      <p className="mx-auto mt-2.5 max-w-2xl text-sm sm:text-base font-normal text-slate-600 dark:text-slate-400">
        {t(
          "Four simple steps to list your property for free and start receiving verified guests.",
          "أربع خطوات بسيطة لتسجيل عقارك مجاناً والبدء في استقبال الضيوف وتحقيق عوائد شهرية."
        )}
      </p>

      <div className="mt-10 sm:mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((item) => (
          <div
            key={item.step}
            dir={lang === "ar" ? "rtl" : "ltr"}
            className={`relative rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#12101a] p-6 ${lang === "ar" ? "text-right" : "text-left"} flex flex-col justify-between shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition`}
          >
            <div>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-950/60 text-xs font-black text-[#4F2396] dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60">
                {item.step}
              </span>
              <h3 className="mt-4 text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {lang === "ar" ? item.titleAr : item.titleEn}
              </h3>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400 font-normal">
                {lang === "ar" ? item.descAr : item.descEn}
              </p>
            </div>
            <div className="mt-5 border-t border-slate-100 dark:border-slate-800 pt-3">
              <Link
                href={`/${lang}/properties/new?mode=new`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4F2396] dark:text-purple-300 hover:text-purple-700 dark:hover:text-purple-200"
              >
                <span>{t("Start now", "ابدأ الآن")}</span>
                {lang === "ar" ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
