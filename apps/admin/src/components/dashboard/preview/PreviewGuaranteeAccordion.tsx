"use client";

import React, { useState } from "react";
import { ChevronDown, ShieldCheck } from "lucide-react";

interface PreviewGuaranteeAccordionProps {
  tourismLicenseNumber?: string | null;
  t: (ar: string, en: string) => string;
}

export function PreviewGuaranteeAccordion({
  tourismLicenseNumber,
  t,
}: PreviewGuaranteeAccordionProps) {
  const [promiseExpanded, setPromiseExpanded] = useState(false);

  return (
    <section className="overflow-hidden rounded-3xl border border-violet-200/85 bg-white shadow-[0_10px_30px_rgba(109,40,217,0.06)] dark:border-violet-500/25 dark:bg-[#12101a]">
      <button
        type="button"
        onClick={() => setPromiseExpanded(!promiseExpanded)}
        className="flex w-full items-center gap-4 p-5 text-left rtl:text-right transition hover:bg-violet-50/50 dark:hover:bg-violet-500/10 sm:p-6 cursor-pointer"
      >
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-700 text-white shadow-lg shadow-violet-700/25">
          <ShieldCheck className="h-7 w-7" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold text-gray-950 dark:text-white">
            {t("ضمان وجودة إقامات قاف نست", "QafNest Quality & Guest Support")}
          </span>
          <span className="mt-1 block text-sm text-gray-600 dark:text-gray-300">
            {t("مواصفات مفحوصة بدقة واعتماد معايير وزارة السياحة", "Verified listing details & MOT inspection standard")}
          </span>
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-violet-600 dark:text-violet-400 transition-transform ${
            promiseExpanded ? "rotate-180" : ""
          }`}
        />
      </button>
      {promiseExpanded && (
        <div className="border-t border-violet-100 px-5 py-5 text-sm leading-7 text-gray-600 dark:border-violet-500/20 dark:text-gray-300 sm:px-6">
          <p>
            {t(
              "تم التحقق من مطابقة العقار لصور العرض وتراخيص وزارة السياحة السعودية ونظام بلدي. تشمل الإقامة حماية الحجز وسياسة استرداد واضحة.",
              "This stay conforms to certified Ministry of Tourism standards and verified Balady regulations. Stays include reservation protection and clear policies."
            )}
          </p>
          {tourismLicenseNumber && (
            <p className="mt-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
              {t("رقم ترخيص وزارة السياحة", "Tourism Ministry License")}: {tourismLicenseNumber}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

