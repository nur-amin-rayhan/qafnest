"use client";

import React from "react";
import { Home, ShieldCheck } from "lucide-react";

interface TabTermsProps {
  t: (ar: string, en: string) => string;
}

export function TabTerms({ t }: TabTermsProps) {
  return (
    <section className="py-8 border-b border-gray-100 dark:border-white/10 space-y-6 scroll-mt-28">
      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">
        {t("الشروط والسياسات", "Terms & Conditions")}
      </span>
      <h2 className="text-2xl font-extrabold tracking-tight text-gray-950 dark:text-white">
        {t("قواعد الإقامة وسياسة الإلغاء", "House Rules & Cancellation Policy")}
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50/60 via-white to-fuchsia-50/40 p-5 shadow-sm dark:border-violet-500/25 dark:from-violet-950/35 dark:via-[#141022] dark:to-fuchsia-950/20">
          <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
            <Home className="h-4 w-4 text-violet-600 dark:text-violet-300" />
            <span>{t("شروط وقواعد الإقامة", "House Rules")}</span>
          </h3>
          <ul className="mt-3 list-disc space-y-1.5 ps-6 text-xs text-gray-600 dark:text-gray-300">
            <li>{t("وقت الدخول: من الساعة 03:00 مساءً", "Check-in: from 03:00 PM")}</li>
            <li>{t("وقت الخروج: حتى الساعة 12:00 ظهراً", "Check-out: by 12:00 PM")}</li>
            <li>
              {t(
                "ممنوع التدخين داخل الغرف والمجالس المغلقة",
                "No smoking inside bedrooms & closed majlis"
              )}
            </li>
            <li>
              {t(
                "الحفاظ على الهدوء بعد الساعة 12 منتصف الليل",
                "Quiet hours observed after 12:00 AM"
              )}
            </li>
            <li>
              {t("إيداع تأمين مسترد بقيمة 500 ريال", "Refundable security deposit SAR 500")}
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50/60 via-white to-fuchsia-50/40 p-5 shadow-sm dark:border-violet-500/25 dark:from-violet-950/35 dark:via-[#141022] dark:to-fuchsia-950/20">
          <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
            <ShieldCheck className="h-4 w-4 text-violet-600 dark:text-violet-300" />
            <span>{t("سياسة الإلغاء والاسترداد", "Cancellation & Refund Policy")}</span>
          </h3>
          <p className="mt-3 text-xs leading-relaxed text-gray-600 dark:text-gray-300">
            {t(
              "لا يمكن إلغاء الحجز أو تأجيله.",
              "The reservation cannot be cancelled or postponed."
            )}
          </p>
        </div>
      </div>
    </section>
  );
}

