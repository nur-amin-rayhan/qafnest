"use client";

import React from "react";
import { Check } from "lucide-react";

interface FilterRatingPopoverProps {
  language: string;
  popoverOffsetLeft: number;
  minRating: number;
  setMinRating: (r: number) => void;
  onClose: () => void;
}

export function FilterRatingPopover({
  language,
  popoverOffsetLeft,
  minRating,
  setMinRating,
  onClose,
}: FilterRatingPopoverProps) {
  return (
    <div
      data-lenis-prevent="true"
      onWheel={(e) => e.stopPropagation()}
      style={{ left: language === "ar" ? undefined : popoverOffsetLeft }}
      className="absolute top-full right-auto rtl:right-0 mt-2 w-52 rounded-3xl bg-white dark:bg-[#141122] border border-violet-200/90 dark:border-violet-500/30 shadow-[0_20px_50px_rgba(109,40,217,0.18)] p-2.5 z-[80]"
    >
      <div className="text-[11px] font-extrabold text-violet-700 dark:text-violet-300 px-3 py-1.5 uppercase tracking-wider">
        {language === "ar" ? "الحد الأدنى للتقييم" : "Minimum Rating"}
      </div>
      {[
        { val: 0, labelEn: "All Ratings", labelAr: "جميع التقييمات" },
        { val: 10, labelEn: "★ 10.0 Only", labelAr: "★ 10.0 فقط" },
        { val: 9.5, labelEn: "★ 9.5 and above", labelAr: "★ 9.5 وأعلى" },
        { val: 9.0, labelEn: "★ 9.0 and above", labelAr: "★ 9.0 وأعلى" },
      ].map((r) => (
        <button
          key={r.val}
          type="button"
          onClick={() => {
            setMinRating(r.val);
            onClose();
          }}
          className={`w-full text-left rtl:text-right px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer ${
            minRating === r.val
              ? "bg-violet-100/80 dark:bg-violet-950/60 text-violet-800 dark:text-violet-200 font-bold"
              : "text-gray-700 dark:text-gray-200 hover:bg-violet-50/60 dark:hover:bg-white/5"
          }`}
        >
          <span>{language === "ar" ? r.labelAr : r.labelEn}</span>
          {minRating === r.val && <Check className="w-3.5 h-3.5 text-violet-600" />}
        </button>
      ))}
    </div>
  );
}

