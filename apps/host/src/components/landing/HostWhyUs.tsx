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
    <section className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 lg:py-24">
      <h2 className="text-2xl sm:text-4xl font-black text-[#4F2396]">
        {t("Why Host Your Property with QafNest?", "مميزات تأجير عقارك في قاف نست")}
      </h2>

      <div className="mt-10 grid gap-8 md:grid-cols-3">
        {benefits.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.titleEn}
              className="rounded-3xl border border-violet-200/80 bg-gradient-to-b from-violet-50/45 to-white p-7 shadow-sm hover:shadow-md transition"
            >
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#4F2396] text-white shadow-md shadow-violet-900/20">
                <Icon size={26} />
              </div>
              <h3 className="mt-6 text-xl font-black text-[#010112]">
                {lang === "ar" ? item.titleAr : item.titleEn}
              </h3>
              <p className="mt-3 text-base leading-7 text-[#686868]">
                {lang === "ar" ? item.descAr : item.descEn}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
