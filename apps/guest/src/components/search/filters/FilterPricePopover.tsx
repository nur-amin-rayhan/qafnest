"use client";

import React from "react";
import { Check } from "lucide-react";

interface FilterPricePopoverProps {
  language: string;
  popoverOffsetLeft: number;
  priceRange: "all" | "under500" | "500to1000" | "above1000";
  setPriceRange: (p: "all" | "under500" | "500to1000" | "above1000") => void;
  onClose: () => void;
}

export function FilterPricePopover({
  language,
  popoverOffsetLeft,
  priceRange,
  setPriceRange,
  onClose,
}: FilterPricePopoverProps) {
  return (
    <div
      data-lenis-prevent="true"
      onWheel={(e) => e.stopPropagation()}
      style={{ left: language === "ar" ? undefined : popoverOffsetLeft }}
      className="absolute top-full start-0 mt-2 w-56 rounded-3xl bg-white dark:bg-[#141122] border border-violet-200/90 dark:border-violet-500/30 shadow-[0_20px_50px_rgba(109,40,217,0.18)] p-2.5 z-[80]"
    >
      <div className="text-[11px] font-extrabold text-violet-700 dark:text-violet-300 px-3 py-1.5 uppercase tracking-wider">
        {language === "ar" ? "نطاق السعر" : "Price Range"}
      </div>
      {[
        { id: "all", labelEn: "All Prices", labelAr: "جميع الأسعار" },
        { id: "under500", labelEn: "Under 500 SAR", labelAr: "أقل من 500 ر.س" },
        { id: "500to1000", labelEn: "500 - 1,000 SAR", labelAr: "500 - 1,000 ر.س" },
        { id: "above1000", labelEn: "Above 1,000 SAR", labelAr: "أكثر من 1,000 ر.س" },
      ].map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => {
            setPriceRange(p.id as "all" | "under500" | "500to1000" | "above1000");
            onClose();
          }}
          className={`w-full text-left rtl:text-right px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer ${
            priceRange === p.id
              ? "bg-violet-100/80 dark:bg-violet-950/60 text-violet-800 dark:text-violet-200 font-bold"
              : "text-gray-700 dark:text-gray-200 hover:bg-violet-50/60 dark:hover:bg-white/5"
          }`}
        >
          <span>{language === "ar" ? p.labelAr : p.labelEn}</span>
          {priceRange === p.id && <Check className="w-3.5 h-3.5 text-violet-600" />}
        </button>
      ))}
    </div>
  );
}

