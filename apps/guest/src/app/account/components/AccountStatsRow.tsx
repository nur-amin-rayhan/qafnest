"use client";

import React from "react";
import Link from "next/link";
import { CalendarDays, ChevronRight, Wallet } from "lucide-react";
import type { TabId } from "./types";

interface AccountStatsRowProps {
  bookingsCount: number;
  walletBalance: number;
  setActiveTab: (tab: TabId) => void;
  t: (en: string, ar: string) => string;
}

export default function AccountStatsRow({
  bookingsCount,
  walletBalance,
  setActiveTab,
  t,
}: AccountStatsRowProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
      <Link
        href="/my-bookings"
        className="group rounded-2xl p-5 bg-white dark:bg-[#0E0E1A] border border-[#E4DFF0] dark:border-white/[0.08] shadow-xs hover:border-[#4F2396]/50 transition-colors"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
            {t("Bookings", "الحجوزات")}
          </span>
          <div className="w-8 h-8 rounded-lg bg-[#F4EEFF] dark:bg-white/[0.06] text-[#4F2396] dark:text-purple-300 flex items-center justify-center">
            <CalendarDays size={16} strokeWidth={1.75} />
          </div>
        </div>
        <div className="text-2xl font-semibold text-slate-900 dark:text-white tabular-nums">
          {bookingsCount}
        </div>
        <div className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#4F2396] dark:text-purple-300 group-hover:underline">
          <span>{t("Reservations & check-in codes", "الحجوزات ورموز الدخول")}</span>
          <ChevronRight size={14} className="rtl:rotate-180" />
        </div>
      </Link>

      <button
        type="button"
        onClick={() => setActiveTab("wallet")}
        className="group text-start rounded-2xl p-5 bg-white dark:bg-[#0E0E1A] border border-[#E4DFF0] dark:border-white/[0.08] shadow-xs hover:border-[#4F2396]/50 transition-colors cursor-pointer"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
            {t("Wallet balance", "رصيد المحفظة")}
          </span>
          <div className="w-8 h-8 rounded-lg bg-[#F4EEFF] dark:bg-white/[0.06] text-[#4F2396] dark:text-purple-300 flex items-center justify-center">
            <Wallet size={16} strokeWidth={1.75} />
          </div>
        </div>
        <div className="text-2xl font-semibold text-slate-900 dark:text-white tabular-nums">
          <bdi dir="ltr">{walletBalance.toFixed(2)} SAR</bdi>
        </div>
        <div className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#4F2396] dark:text-purple-300 group-hover:underline">
          <span>{t("Top up & records", "الشحن والسجل")}</span>
          <ChevronRight size={14} className="rtl:rotate-180" />
        </div>
      </button>
    </div>
  );
}
