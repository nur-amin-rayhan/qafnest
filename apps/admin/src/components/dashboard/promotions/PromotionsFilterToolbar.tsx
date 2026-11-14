"use client";

import React from "react";
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
    <div className="bg-surface-container-lowest rounded-xl shadow-sm p-3 border border-surface-container/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      {/* Status Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-surface-container-low rounded-xl">
        <button
          type="button"
          onClick={() => setFilterStatus("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            filterStatus === "all"
              ? "bg-surface-container-lowest text-primary shadow-xs"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          {t("All Codes", "كافة الأكواد")} ({coupons.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterStatus("active")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            filterStatus === "active"
              ? "bg-surface-container-lowest text-status-emerald shadow-xs"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          {t("Active", "نشطة")} ({activeCount})
        </button>
        <button
          type="button"
          onClick={() => setFilterStatus("paused")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            filterStatus === "paused"
              ? "bg-surface-container-lowest text-status-sand shadow-xs"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          {t("Paused", "موقوفة")} ({pausedCount})
        </button>
        <button
          type="button"
          onClick={() => setFilterStatus("expired")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            filterStatus === "expired"
              ? "bg-surface-container-lowest text-status-terracotta shadow-xs"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          {t("Expired", "منتهية")} ({expiredCount})
        </button>
      </div>

      {/* Search */}
      <div className="relative min-w-[240px]">
        <span className="material-symbols-outlined absolute start-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
          search
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("Search by coupon code or title...", "ابحث بكود الخصم أو العنوان...")}
          className="w-full h-9 ps-9 pe-3 rounded-xl border border-surface-container bg-surface-container-low text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
    </div>
  );
}

