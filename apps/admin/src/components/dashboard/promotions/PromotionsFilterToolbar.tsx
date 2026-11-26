"use client";

import React from "react";
import { Search } from "lucide-react";
import type { AdminCoupon } from "../PromotionsTab";

interface PromotionsFilterToolbarProps {
  filterStatus: "all" | "active" | "paused" | "expired";
  setFilterStatus: (status: "all" | "active" | "paused" | "expired") => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  coupons: AdminCoupon[];
  t: (en: string, ar: string) => string;
}

export function PromotionsFilterToolbar({
  filterStatus,
  setFilterStatus,
  searchQuery,
  setSearchQuery,
  coupons,
  t,
}: PromotionsFilterToolbarProps) {
  const activeCount = coupons.filter((c) => c.is_active).length;
  const pausedCount = coupons.filter((c) => !c.is_active).length;
  const expiredCount = coupons.filter((c) =>
    c.expires_at ? new Date(c.expires_at).getTime() < Date.now() : false
  ).length;

  return (
    <div className="bg-white dark:bg-[#0E0D16] rounded-xl border border-slate-200/90 dark:border-slate-800 p-3 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      {/* Status Tabs */}
      <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg overflow-x-auto max-w-full">
        <button
          type="button"
          onClick={() => setFilterStatus("all")}
          className={`px-3 py-1.5 rounded-md text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap ${
            filterStatus === "all"
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-semibold"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium"
          }`}
        >
          {t("All Codes", "كافة الأكواد")} ({coupons.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterStatus("active")}
          className={`px-3 py-1.5 rounded-md text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap ${
            filterStatus === "active"
              ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-xs font-semibold"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium"
          }`}
        >
          {t("Active", "نشطة")} ({activeCount})
        </button>
        <button
          type="button"
          onClick={() => setFilterStatus("paused")}
          className={`px-3 py-1.5 rounded-md text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap ${
            filterStatus === "paused"
              ? "bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 shadow-xs font-semibold"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium"
          }`}
        >
          {t("Paused", "موقوفة")} ({pausedCount})
        </button>
        <button
          type="button"
          onClick={() => setFilterStatus("expired")}
          className={`px-3 py-1.5 rounded-md text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap ${
            filterStatus === "expired"
              ? "bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 shadow-xs font-semibold"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium"
          }`}
        >
          {t("Expired", "منتهية")} ({expiredCount})
        </button>
      </div>

      {/* Search */}
      <div className="relative min-w-[240px]">
        <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("Search by coupon code or title...", "ابحث بكود الخصم أو العنوان...")}
          className="w-full h-10 ps-9 pe-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#4F2396]"
        />
      </div>
    </div>
  );
}

