"use client";

import React from "react";
import { ShieldCheck } from "lucide-react";

interface HostComplianceBannerProps {
  t: (en: string, ar: string) => string;
}

export function HostComplianceBanner({ t }: HostComplianceBannerProps) {
  return (
    <div className="rounded-2xl border border-violet-100 dark:border-slate-800 bg-gradient-to-r from-violet-50 via-white to-amber-50/40 dark:from-purple-950/40 dark:via-[#12101a] dark:to-[#12101a] p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#4F2396] text-white">
          <ShieldCheck size={24} className="text-[#FF9750]" />
        </div>
        <div>
          <h4 className="text-sm font-black text-slate-900 dark:text-white">
            {t(
              "Saudi Ministry of Tourism Licensed Portal",
              "منصة معتمدة ومربوطة بوزارة السياحة السعودية"
            )}
          </h4>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
            {t(
              "All earnings and guest identity verifications comply with Saudi National Tourism Registry standards.",
              "تتوافق جميع الحجوزات والتحويلات المالية وعمليات التحقق من هوية النزلاء مع معايير وزارة السياحة."
            )}
          </p>
        </div>
      </div>
      <span className="rounded-full bg-violet-100 dark:bg-purple-950/60 px-3 py-1 text-xs font-black text-[#4F2396] dark:text-purple-300">
        {t("License Verified", "مرخص نظامياً")}
      </span>
    </div>
  );
}

