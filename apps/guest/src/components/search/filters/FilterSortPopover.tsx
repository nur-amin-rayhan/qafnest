"use client";

import React from "react";
import { Check } from "lucide-react";

type SortOption = "recommended" | "price-low" | "price-high" | "rating" | "reviews";

interface FilterSortPopoverProps {
  language: string;
  sortBy: SortOption;
  setSortBy: (sort: SortOption) => void;
  onClose: () => void;
}

export function FilterSortPopover({
  language,
  sortBy,
  setSortBy,
  onClose,
}: FilterSortPopoverProps) {
  return (
    <div
      data-lenis-prevent="true"
      onWheel={(e) => e.stopPropagation()}
      className="absolute right-0 rtl:right-auto rtl:left-0 top-full z-[80] mt-2 w-56 rounded-3xl border border-violet-200/90 bg-white p-2.5 shadow-[0_20px_50px_rgba(109,40,217,0.18)] dark:border-violet-500/30 dark:bg-[#141122]"
    >
      <div className="px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-violet-700 dark:text-violet-300">
        {language === "ar" ? "ترتيب النتائج" : "Sort results"}
      </div>
      {[
        { id: "recommended", en: "Recommended", ar: "موصى به" },
        { id: "price-low", en: "Price: low to high", ar: "السعر: الأقل أولاً" },
        { id: "price-high", en: "Price: high to low", ar: "السعر: الأعلى أولاً" },
        { id: "rating", en: "Top rated", ar: "الأعلى تقييماً" },
        { id: "reviews", en: "Most reviewed", ar: "الأكثر تقييماً" },
      ].map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => {
            setSortBy(option.id as SortOption);
            onClose();
          }}
          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold rtl:text-right cursor-pointer ${
            sortBy === option.id
              ? "bg-violet-100/80 font-bold text-violet-800 dark:bg-violet-950/60 dark:text-violet-200"
              : "text-gray-700 hover:bg-violet-50/60 dark:text-gray-200 dark:hover:bg-white/5"
          }`}
        >
          <span>{language === "ar" ? option.ar : option.en}</span>
          {sortBy === option.id && <Check className="h-3.5 w-3.5 text-violet-600" />}
        </button>
      ))}
    </div>
  );
}

