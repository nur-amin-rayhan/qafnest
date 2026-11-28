"use client";

import React from "react";
import { Headphones, ShieldCheck, TrendingUp } from "lucide-react";

interface HostWhyUsProps {
  t: (en: string, ar: string) => string;
  lang: "ar" | "en";
}

export function HostWhyUs({ t, lang }: HostWhyUsProps) {
  const benefits = [
    {
      icon: ShieldCheck,
      titleAr: "حجوزات مضمونة ودفع آمن",
      titleEn: "Guaranteed Bookings & Secure Payouts",
      descAr:
        "ندير كافة عمليات الدفع الإلكتروني من الضيوف ونحول أرباحك مباشرة إلى حسابك البنكي (IBAN) خلال 48 ساعة من تسجيل دخول الضيف.",
      descEn:
        "We handle all digital payments from guests and transfer your earnings directly to your Saudi bank IBAN within 48 hours of check-in.",
    },
    {
      icon: TrendingUp,
      titleAr: "سجل عقارك مجاناً وحقق عوائد يومية",
      titleEn: "Free Registration & Daily Earning Potential",
      descAr:
        "التسجيل مجاني بالكامل بدون أي رسوم تأسيس. تحكم بأسعار الأيام، وسط الأسبوع، عطلة الأسبوع، والمواسم بكل مرونة.",
      descEn:
        "Listing is 100% free with zero setup fees. Maximize your daily occupancy with custom 7-day pricing and peak season rates.",
    },
    {
      icon: Headphones,
      titleAr: "خدمة عملاء ودعم للمضيف على مدار الساعة",
      titleEn: "24/7 Dedicated Host Support & Care",
      descAr:
        "فريق متخصص لخدمة المضيفين على مدار الساعة لمساعدتك في إدارة الحجوزات وتوثيق ترخيص وزارة السياحة وحماية ممتلكاتك.",
      descEn:
        "Our dedicated Saudi host support team is available 24/7 to help manage bookings, Ministry of Tourism permits, and property protection.",
    },
  ];

  return (
    <section className="mx-auto max-w-[1440px] px-5 py-14 sm:px-8 lg:py-20">
      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
        {t("Why Host Your Property with QafNest?", "مميزات تأجير عقارك في قاف نست")}
      </h2>

      <div className="mt-8 sm:mt-10 grid gap-6 md:grid-cols-3">
        {benefits.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.titleEn}
              className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#12101a] p-6 sm:p-7 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition"
            >
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-purple-50 dark:bg-purple-950/60 text-[#4F2396] dark:text-purple-300">
                <Icon size={24} />
              </div>
              <h3 className="mt-5 text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {lang === "ar" ? item.titleAr : item.titleEn}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400 font-normal">
                {lang === "ar" ? item.descAr : item.descEn}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
