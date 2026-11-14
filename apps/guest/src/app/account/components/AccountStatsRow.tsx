"use client";

import React from "react";
import Link from "next/link";
import {
  CalendarDays,
  ChevronRight,
  Wallet,
  Sparkles,
  Star,
  ShieldCheck,
  CheckCheck,
} from "lucide-react";
import type { TabId } from "./types";

interface AccountStatsRowProps {
  bookingsCount: number;
  walletBalance: number;
  guestRating?: number;
  setActiveTab: (tab: TabId) => void;
  t: (en: string, ar: string) => string;
}

export default function AccountStatsRow({
  bookingsCount,
  walletBalance,
  guestRating = 0,
  setActiveTab,
  t,
}: AccountStatsRowProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
      {/* Stat 1: Bookings */}
      <Link
        href="/my-bookings"
        className="group relative overflow-hidden rounded-3xl p-5 sm:p-6 bg-white dark:bg-[#0E0E1A] border border-slate-200/80 dark:border-white/10 shadow-xs hover:shadow-md hover:border-[#4F2396]/40 dark:hover:border-purple-500/30 transition-all duration-300"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400">
            {t("Bookings", "الحجوزات")}
          </span>
          <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-[#4F2396] dark:text-purple-300 flex items-center justify-center">
            <CalendarDays size={18} />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          {bookingsCount}
        </div>
        <div className="mt-2 flex items-center text-xs font-bold text-[#4F2396] dark:text-purple-400 group-hover:underline">
          <span>{t("View reservations & PIN", "عرض الحجوزات ورموز الدخول")}</span>
          <ChevronRight
            size={14}
            className="rtl:rotate-180 transition transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1"
          />
        </div>
      </Link>

      {/* Stat 2: Wallet */}
      <button
        type="button"
        onClick={() => setActiveTab("wallet")}
        className="group text-start relative overflow-hidden rounded-3xl p-5 sm:p-6 bg-white dark:bg-[#0E0E1A] border border-slate-200/80 dark:border-white/10 shadow-xs hover:shadow-md hover:border-[#4F2396]/40 dark:hover:border-purple-500/30 transition-all duration-300 cursor-pointer"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400">
            {t("Wallet Balance", "رصيد المحفظة")}
          </span>
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Wallet size={18} />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono" dir="ltr">
          {walletBalance.toFixed(2)} <span className="text-xs font-sans text-slate-500">SAR</span>
        </div>
        <div className="mt-2 flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400">
          <Sparkles size={12} className="inline me-1" />
          <span>{t("Instant deposit refund", "استرداد التأمين الفوري")}</span>
        </div>
      </button>

      {/* Stat 3: Ratings (from hosts) */}
      <button
        type="button"
        onClick={() => setActiveTab("rate")}
        className="group text-start relative overflow-hidden rounded-3xl p-5 sm:p-6 bg-white dark:bg-[#0E0E1A] border border-slate-200/80 dark:border-white/10 shadow-xs hover:shadow-md hover:border-[#4F2396]/40 dark:hover:border-purple-500/30 transition-all duration-300 cursor-pointer"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400">
            {t("Ratings (from hosts)", "التقييمات من المضيفين")}
          </span>
          <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center">
            <Star size={18} className="fill-amber-400" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono" dir="ltr">
          {guestRating.toFixed(1)} <span className="text-xs font-sans text-slate-400">/ 10</span>
        </div>
        <div className="mt-2 text-xs font-bold text-amber-600 dark:text-amber-400">
          {guestRating > 0
            ? t("Based on host feedback", "بناءً على تقييمات المضيفين")
            : t("No host ratings yet", "لا توجد تقييمات من المضيفين بعد")}
        </div>
      </button>

      {/* Stat 4: Hosts who banned you */}
      <div className="relative overflow-hidden rounded-3xl p-5 sm:p-6 bg-white dark:bg-[#0E0E1A] border border-slate-200/80 dark:border-white/10 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400">
            {t("Hosts who banned you", "المضيفين الذين حظروك")}
          </span>
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ShieldCheck size={18} />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
          0
        </div>
        <div className="mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
          <CheckCheck size={14} />
          <span>{t("Clean Record · 100% Trust", "سجل نظيف · موثوق ١٠٠٪")}</span>
        </div>
      </div>
    </div>
  );
}

