"use client";

import React from "react";
import { Users } from "lucide-react";

interface ReservationGuestsSelectorProps {
  language: string;
  guestsCount: number;
  maxGuests: number;
  onGuestsChange: (value: number) => void;
}

export function ReservationGuestsSelector({
  language,
  guestsCount,
  maxGuests,
  onGuestsChange,
}: ReservationGuestsSelectorProps) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200/90 bg-slate-50/60 px-4 py-3 dark:border-violet-500/25 dark:bg-white/5">
      <div>
        <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-500 dark:text-violet-300/80">
          <Users className="h-3.5 w-3.5 text-[#4F2396] dark:text-violet-400" />
          {language === "ar" ? "عدد الضيوف" : "Guests"}
        </span>
        <span className="mt-0.5 block text-sm font-extrabold text-gray-950 dark:text-white">
          {guestsCount} {language === "ar" ? "ضيوف" : guestsCount === 1 ? "guest" : "guests"}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onGuestsChange(Math.max(1, guestsCount - 1))}
          disabled={guestsCount <= 1}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white text-gray-700 shadow-xs transition hover:border-[#4F2396] hover:text-[#4F2396] disabled:opacity-40 dark:border-white/20 dark:bg-white/10 dark:text-white cursor-pointer"
        >
          −
        </button>
        <span className="min-w-4 text-center text-sm font-black text-gray-950 dark:text-white">
          {guestsCount}
        </span>
        <button
          type="button"
          onClick={() => onGuestsChange(Math.min(maxGuests, guestsCount + 1))}
          disabled={guestsCount >= maxGuests}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white text-gray-700 shadow-xs transition hover:border-[#4F2396] hover:text-[#4F2396] disabled:opacity-40 dark:border-white/20 dark:bg-white/10 dark:text-white cursor-pointer"
        >
          +
        </button>
      </div>
    </div>
  );
}

