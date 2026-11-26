"use client";

import React from "react";

interface ReservationSplitTriggerProps {
  language: string;
  onOpen: () => void;
}

export function ReservationSplitTrigger({
  language,
  onOpen,
}: ReservationSplitTriggerProps) {
  return (
    <div className="border-t border-slate-200/80 pt-3 dark:border-slate-800">
      <button
        type="button"
        onClick={onOpen}
        className="w-full rounded-2xl border border-slate-200/85 bg-slate-50/60 p-3.5 text-left rtl:text-right transition hover:border-slate-300 dark:border-slate-800 dark:bg-[#110F18] dark:hover:border-slate-700 cursor-pointer group"
      >
        <div className="flex items-baseline gap-1.5 text-xs sm:text-[13px]">
          <span className="font-bold text-slate-900 dark:text-white">
            {language === "ar" ? "ادفع بالتقسيط" : "Pay in Splits"}
          </span>
          <span className="text-slate-500 group-hover:text-[#4F2396] dark:text-slate-400 dark:group-hover:text-purple-300 transition-colors">
            {language === "ar" ? "(اضغط للتفاصيل)" : "(Click for details)"}
          </span>
        </div>

        <div className="mt-2.5 flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center justify-center rounded-lg bg-[#FCEFD7] border border-[#F2D7B3] px-3 py-1 text-xs font-black tracking-tight text-[#8A4A0B] shadow-2xs">
            tamara
          </span>
          <span className="inline-flex items-center justify-center rounded-lg bg-[#3EFEAB] px-3 py-1 text-xs font-black tracking-tight text-gray-950 shadow-2xs">
            tabby
          </span>
          <span className="inline-flex items-center justify-center rounded-lg bg-[#4F2396] px-3 py-1 text-xs font-black italic tracking-tight text-white shadow-2xs">
            MIS<sup className="ml-0.5 text-[7px] not-italic font-bold">pay</sup>
          </span>
        </div>
      </button>
    </div>
  );
}

