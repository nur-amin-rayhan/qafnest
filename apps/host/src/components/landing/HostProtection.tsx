"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

interface HostProtectionProps {
  t: (en: string, ar: string) => string;
}

export function HostProtection({ t }: HostProtectionProps) {
  return (
    <section id="protection" className="w-full bg-[#4F2396] py-16 px-5 sm:px-8 text-white">
      <div className="mx-auto flex max-w-[1440px] flex-col-reverse items-center justify-between gap-10 md:flex-row">
        <div className="max-w-2xl space-y-5">
          <h2 className="text-2xl sm:text-4xl font-bold leading-snug text-[#FF9750]">
            {t("Host with peace of mind with", "استضف وأنت متطمن مع")}{" "}
            <span className="font-black text-white">
              {t("QafNest Host Protection Program", "برنامج حماية المضيف")}
            </span>
          </h2>

          <p className="text-base sm:text-xl font-medium text-violet-100">
            {t(
              "Comprehensive protection for your property against unexpected incidents:",
              "حماية شاملة لعقارك وممتلكاتك لتستثمر بثقة كاملة:"
            )}
          </p>

          <ul className="list-disc space-y-3 pr-5 pl-5 text-base sm:text-lg font-medium text-white/95">
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

          <div className="pt-3">
            <Link
              href={`/${t("en", "ar")}/app`}
              className="inline-flex h-[46px] min-w-[190px] items-center justify-center rounded-full bg-[#F69554] px-7 text-sm font-black text-[#4F2396] transition hover:bg-white"
            >
              {t("Learn More in Host Portal", "اعرف المزيد")}
            </Link>
          </div>
        </div>

        <div className="flex h-[240px] w-[260px] sm:h-[260px] sm:w-[320px] flex-col items-center justify-center rounded-[32px] border border-white/20 bg-white/10 p-6 text-center backdrop-blur-md">
          <div className="grid h-20 w-20 place-items-center rounded-3xl bg-[#FF9750] text-[#2d1259] shadow-lg">
            <ShieldCheck size={44} />
          </div>
          <p className="mt-4 text-lg font-black text-white">
            {t(
              "Comprehensive Incident Coverage",
              "تغطية شاملة لأضرار العقار والحوادث"
            )}
          </p>
          <p className="mt-1 text-xs text-violet-200">
            {t("Included automatically for verified hosts", "مشمولة تلقائياً لجميع المضيفين الموثقين")}
          </p>
        </div>
      </div>
    </section>
  );
}
