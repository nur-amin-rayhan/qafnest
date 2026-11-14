"use client";

import React from "react";
import { Star } from "lucide-react";

interface TabReviewsProps {
  t: (ar: string, en: string) => string;
}

export function TabReviews({ t }: TabReviewsProps) {
  return (
    <section className="py-8 border-b border-gray-100 dark:border-white/10 space-y-6 scroll-mt-28">
      <div>
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">
          {t("آراء وتجارب النزلاء", "Guest Feedback")}
        </span>
        <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-gray-950 dark:text-white">
          {t("التقييمات والمراجعات الموثقة", "Verified Guest Reviews")}
        </h2>
      </div>

      {/* Empty Reviews State */}
      <div className="rounded-3xl border border-dashed border-violet-200/80 bg-violet-50/20 p-8 text-center dark:border-violet-500/20 dark:bg-[#12101a]">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300">
          <Star className="h-5 w-5" />
        </div>
        <p className="mt-3 text-sm font-bold text-gray-900 dark:text-white">
          {t("لا توجد تقييمات نزلاء بعد", "No verified guest reviews yet")}
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {t(
            "ستظهر تقييمات الضيوف الموثقة هنا بعد إتمام أول إقامة لهذه الوحدة.",
            "Verified guest feedback will appear here after the first completed stay at this property."
          )}
        </p>
      </div>
    </section>
  );
}

