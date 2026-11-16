"use client";

import React from "react";
import { Check } from "lucide-react";

interface FilterCategoryPopoverProps {
  language: string;
  popoverOffsetLeft: number;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  onClose: () => void;
}

export function FilterCategoryPopover({
  language,
  popoverOffsetLeft,
  selectedCategory,
  setSelectedCategory,
  onClose,
}: FilterCategoryPopoverProps) {
  return (
    <div
      data-lenis-prevent="true"
      onWheel={(e) => e.stopPropagation()}
      style={{ left: language === "ar" ? undefined : popoverOffsetLeft }}
      className="absolute top-full start-0 mt-2 w-60 rounded-3xl bg-white dark:bg-[#141122] border border-violet-200/90 dark:border-violet-500/30 shadow-[0_20px_50px_rgba(109,40,217,0.18)] p-2.5 z-[80]"
    >
      <div className="text-[11px] font-extrabold text-violet-700 dark:text-violet-300 px-3 py-1.5 uppercase tracking-wider">
        {language === "ar" ? "اختر نوع الإقامة" : "Choose Property Type"}
      </div>
      {[
        { id: "all", labelEn: "All Stays", labelAr: "جميع الوحدات" },
        { id: "villa", labelEn: "Villas & Apartments", labelAr: "شقق وفلل" },
        { id: "chalet", labelEn: "Chalets & Resorts", labelAr: "شاليهات ومنتجعات" },
        { id: "farm", labelEn: "Country Farms", labelAr: "مزارع ريفية" },
        { id: "camp", labelEn: "Desert Camps", labelAr: "مخيمات صحراوية" },
        { id: "penthouse", labelEn: "Serviced Apartments", labelAr: "شقق مخدومة" },
      ].map((cat) => (
        <button
          key={cat.id}
          type="button"
          onClick={() => {
            setSelectedCategory(cat.id);
            onClose();
          }}
          className={`w-full text-left rtl:text-right px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors ${
            selectedCategory === cat.id
              ? "bg-violet-100/80 dark:bg-violet-950/60 text-violet-800 dark:text-violet-200 font-bold"
              : "text-gray-700 dark:text-gray-200 hover:bg-violet-50/60 dark:hover:bg-white/5"
          }`}
        >
          <span>{language === "ar" ? cat.labelAr : cat.labelEn}</span>
          {selectedCategory === cat.id && <Check className="w-3.5 h-3.5 text-violet-600" />}
        </button>
      ))}
    </div>
  );
}

