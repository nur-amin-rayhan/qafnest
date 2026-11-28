"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

interface HostProtectionProps {
  t: (en: string, ar: string) => string;
}

export function HostProtection({ t }: HostProtectionProps) {
  return (
    <section id="protection" className="w-full bg-[#1b0d36] dark:bg-[#120824] py-16 px-5 sm:px-8 text-white border-y border-purple-900/30 transition-colors">
      <div className="mx-auto flex max-w-[1440px] flex-col-reverse items-center justify-between gap-10 md:flex-row">
        <div className="max-w-2xl space-y-4">
          <h2 className="text-2xl sm:text-4xl font-bold leading-snug text-[#FF9750]">
            {t("Host with peace of mind with", "استضف وأنت متطمن مع")}{" "}
            <span className="font-black text-white">
              {t("QafNest Host Protection Program", "برنامج حماية المضيف")}
            </span>
          </h2>

          <p className="text-base sm:text-lg font-medium text-purple-200">
            {t(
              "Comprehensive protection for your property against unexpected incidents:",
              "حماية شاملة لعقارك وممتلكاتك لتستثمر بثقة كاملة:"
            )}
          </p>

          <ul className="list-disc space-y-2.5 pr-5 pl-5 text-sm sm:text-base font-normal text-white/90">
            <li>
              {t(
                "Damage or theft to your property inside the unit caused by the guest or one of their visitors.",
                "الضرر أو السرقة التي تلحق بممتلكاتك داخل الوحدة بسبب الضيف أو أحد زواره"
              )}
            </li>
            <li>
              {t(
                "Extraordinary cleaning costs (such as deep cleaning to remove tough coffee or juice stains).",
                "تكاليف النظافة الغير اعتيادية (مثل التنظيف لإزالة البقع الصعبة بسبب القهوة/العصائر)"
              )}
            </li>
          </ul>

          <div className="pt-2">
            <Link
              href={`/${t("en", "ar")}/app`}
              className="inline-flex h-[44px] items-center justify-center rounded-xl bg-white hover:bg-purple-50 text-[#1b0d36] px-6 text-sm font-bold transition"
            >
              {t("Learn More in Host Portal", "اعرف المزيد")}
            </Link>
          </div>
        </div>

        <div className="flex h-[240px] w-[260px] sm:h-[260px] sm:w-[320px] flex-col items-center justify-center rounded-2xl border border-white/15 bg-white/10 dark:bg-white/5 p-6 text-center backdrop-blur-md">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-amber-400 text-[#1b0d36] shadow-md">
            <ShieldCheck size={36} />
          </div>
          <p className="mt-4 text-base sm:text-lg font-bold text-white">
            {t(
              "Comprehensive Incident Coverage",
              "تغطية شاملة لأضرار العقار والحوادث"
            )}
          </p>
          <p className="mt-1 text-xs text-purple-200 font-medium">
            {t("Included automatically for verified hosts", "مشمولة تلقائياً لجميع المضيفين الموثقين")}
          </p>
        </div>
      </div>
    </section>
  );
}
