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
      <h2 className="text-2xl sm:text-4xl font-black text-[#4F2396]">
        {t("How to Host with QafNest", "طريقة الاستضافة في قاف نست")}
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-base sm:text-lg font-medium text-[#686868]">
        {t(
          "Four simple steps to list your property for free and start receiving verified guests.",
          "أربع خطوات بسيطة لتسجيل عقارك مجاناً والبدء في استقبال الضيوف وتحقيق عوائد شهرية."
        )}
      </p>

      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((item) => (
          <div
            key={item.step}
            className="relative rounded-3xl border border-violet-200/80 bg-violet-50/35 p-6 text-right dir-rtl flex flex-col justify-between"
          >
            <div>
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#4F2396] text-sm font-black text-white">
                {item.step}
              </span>
              <h3 className="mt-5 text-lg font-black text-slate-900">
                {lang === "ar" ? item.titleAr : item.titleEn}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {lang === "ar" ? item.descAr : item.descEn}
              </p>
            </div>
            <div className="mt-5 border-t border-violet-200/60 pt-3">
              <Link
                href={`/${lang}/properties/new?mode=new`}
                className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#4F2396] hover:text-[#FF9750]"
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
