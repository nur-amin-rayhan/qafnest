"use client";

import React from "react";
import { Check } from "lucide-react";

interface FilterDirectionPopoverProps {
  language: string;
  popoverOffsetLeft: number;
  selectedDirection: "all" | "north" | "south" | "east" | "west";
  setSelectedDirection: (d: "all" | "north" | "south" | "east" | "west") => void;
  onClose: () => void;
}

export function FilterDirectionPopover({
  language,
  popoverOffsetLeft,
  selectedDirection,
  setSelectedDirection,
  onClose,
}: FilterDirectionPopoverProps) {
  return (
    <div
      data-lenis-prevent="true"
      onWheel={(e) => e.stopPropagation()}
      style={{ left: language === "ar" ? undefined : popoverOffsetLeft }}
      className="absolute top-full start-0 mt-2 w-52 rounded-3xl bg-white dark:bg-[#141122] border border-violet-200/90 dark:border-violet-500/30 shadow-[0_20px_50px_rgba(109,40,217,0.18)] p-2.5 z-[80]"
    >
      <div className="text-[11px] font-extrabold text-violet-700 dark:text-violet-300 px-3 py-1.5 uppercase tracking-wider">
        {language === "ar" ? "اتجاه المدينة" : "City Direction"}
      </div>
      {[
        { id: "all", labelEn: "All Directions", labelAr: "جميع الاتجاهات" },
        { id: "north", labelEn: "North", labelAr: "الشمال" },
        { id: "east", labelEn: "East", labelAr: "الشرق" },
        { id: "west", labelEn: "West", labelAr: "الغرب" },
        { id: "south", labelEn: "South", labelAr: "الجنوب" },
      ].map((d) => (
        <button
          key={d.id}
          type="button"
          onClick={() => {
            setSelectedDirection(d.id as "all" | "north" | "south" | "east" | "west");
            onClose();
          }}
          className={`w-full text-left rtl:text-right px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer ${
            selectedDirection === d.id
              ? "bg-violet-100/80 dark:bg-violet-950/60 text-violet-800 dark:text-violet-200 font-bold"
              : "text-gray-700 dark:text-gray-200 hover:bg-violet-50/60 dark:hover:bg-white/5"
          }`}
        >
          <span>{language === "ar" ? d.labelAr : d.labelEn}</span>
          {selectedDirection === d.id && <Check className="w-3.5 h-3.5 text-violet-600" />}
        </button>
      ))}
    </div>
  );
}

