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
    <div className="border-t border-slate-100 pt-3 dark:border-white/10">
      <button
        type="button"
        onClick={onOpen}
        className="w-full rounded-2xl border-2 border-slate-200/90 bg-white p-3.5 text-left rtl:text-right transition hover:border-[#4F2396] dark:border-violet-500/25 dark:bg-violet-950/20 cursor-pointer group"
      >
        <div className="flex items-baseline gap-1.5 text-xs sm:text-[13px]">
          <span className="font-extrabold text-gray-950 dark:text-white">
            {language === "ar" ? "ادفع بالتقسيط" : "Pay in Splits"}
          </span>
          <span className="text-gray-500 group-hover:text-[#4F2396] dark:text-violet-300 transition-colors">
            {language === "ar" ? "(اضغط للتفاصيل)" : "(Click for details)"}
          </span>
        </div>

        <div className="mt-2.5 flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#FBD3A7] via-[#F5B5C8] to-[#D4B5FD] px-3.5 py-1 text-xs font-black tracking-tight text-gray-950 shadow-xs">
            tamara
          </span>
          <span className="inline-flex items-center justify-center rounded-lg bg-[#3EFEAB] px-3.5 py-1 text-xs font-black tracking-tight text-gray-950 shadow-xs">
            tabby
          </span>
          <span className="inline-flex items-center justify-center rounded-lg bg-[#5528B9] px-3.5 py-1 text-xs font-black italic tracking-tight text-white shadow-xs">
            MIS<sup className="ml-0.5 text-[7px] not-italic font-bold">pay</sup>
          </span>
        </div>
      </button>
    </div>
  );
}

