"use client";

import React from "react";
import { Check } from "lucide-react";
import { getLocalizedDistrictName } from "@/lib/localization/localeHelper";

interface FilterDistrictPopoverProps {
  language: string;
  popoverOffsetLeft: number;
  selectedDistrict: string;
  setSelectedDistrict: (dist: string) => void;
  availableDistricts: string[];
  onClose: () => void;
}

export function FilterDistrictPopover({
  language,
  popoverOffsetLeft,
  selectedDistrict,
  setSelectedDistrict,
  availableDistricts,
  onClose,
}: FilterDistrictPopoverProps) {
  return (
    <div
      data-lenis-prevent="true"
      onWheel={(e) => e.stopPropagation()}
      style={{ left: language === "ar" ? undefined : popoverOffsetLeft }}
      className="absolute top-full right-auto rtl:right-0 mt-2 w-60 rounded-3xl bg-white dark:bg-[#141122] border border-violet-200/90 dark:border-violet-500/30 shadow-[0_20px_50px_rgba(109,40,217,0.18)] p-2.5 z-[80]"
    >
      <div className="text-[11px] font-extrabold text-violet-700 dark:text-violet-300 px-3 py-1.5 uppercase tracking-wider">
        {language === "ar" ? "اختر الحي" : "Choose District"}
      </div>
      <div
        data-lenis-prevent="true"
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        className="dropdown-scroll max-h-56 overflow-y-auto space-y-0.5 pr-1"
        style={{ overscrollBehavior: "contain" }}
      >
        <button
          type="button"
          onClick={() => {
            setSelectedDistrict("all");
            onClose();
          }}
          className={`w-full text-left rtl:text-right px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer ${
            selectedDistrict === "all"
              ? "bg-violet-100/80 dark:bg-violet-950/60 text-violet-800 dark:text-violet-200 font-bold"
              : "text-gray-700 dark:text-gray-200 hover:bg-violet-50/60 dark:hover:bg-white/5"
          }`}
        >
          <span>{language === "ar" ? "جميع الأحياء" : "All Districts"}</span>
          {selectedDistrict === "all" && <Check className="w-3.5 h-3.5 text-violet-600" />}
        </button>
        {availableDistricts.map((dist) => (
          <button
            key={dist}
            type="button"
            onClick={() => {
              setSelectedDistrict(dist);
              onClose();
            }}
            className={`w-full text-left rtl:text-right px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer ${
              selectedDistrict === dist
                ? "bg-violet-100/80 dark:bg-violet-950/60 text-violet-800 dark:text-violet-200 font-bold"
                : "text-gray-700 dark:text-gray-200 hover:bg-violet-50/60 dark:hover:bg-white/5"
            }`}
          >
            <span>{getLocalizedDistrictName(dist, language === "ar" ? "ar" : "en") || dist}</span>
            {selectedDistrict === dist && <Check className="w-3.5 h-3.5 text-violet-600" />}
          </button>
        ))}
      </div>
    </div>
  );
}

