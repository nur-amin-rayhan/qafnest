"use client";

import React from "react";
import { Search } from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";

interface ReviewsFilterBarProps {
  statusFilter: "all" | "pending" | "replied";
  setStatusFilter: (filter: "all" | "pending" | "replied") => void;
  setPage: (page: number) => void;
  pendingCount: number;
  repliedCount: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function ReviewsFilterBar({
  statusFilter,
  setStatusFilter,
  setPage,
  pendingCount,
  repliedCount,
  searchQuery,
  setSearchQuery,
}: ReviewsFilterBarProps) {
  const { t, dir } = useAdminAuth();

  return (
    <div dir={dir} className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      {/* Status Pills */}
      <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800/80 p-0.5">
        <button
          type="button"
          onClick={() => {
            setStatusFilter("all");
            setPage(1);
          }}
          className={`h-8 px-3 rounded-md text-xs font-medium transition cursor-pointer ${
            statusFilter === "all"
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-semibold"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          }`}
        >
          {t("All Reviews", "كل التقييمات")}
        </button>
        <button
          type="button"
          onClick={() => {
            setStatusFilter("pending");
            setPage(1);
          }}
          className={`h-8 px-3 rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
            statusFilter === "pending"
              ? "bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 shadow-xs font-semibold"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          }`}
        >
          <span>{t("Needs Reply", "بحاجة لرد")}</span>
          {pendingCount > 0 && (
            <span className="rounded-full bg-amber-500 text-white px-1.5 py-0.2 text-[10px] font-bold">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => {
            setStatusFilter("replied");
            setPage(1);
          }}
          className={`h-8 px-3 rounded-md text-xs font-medium transition cursor-pointer ${
            statusFilter === "replied"
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-semibold"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          }`}
        >
          {t(`Replied (${repliedCount})`, `تم الرد (${repliedCount})`)}
        </button>
      </div>

      {/* Live Search */}
      <div className="flex items-center gap-2 h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus-within:border-[#4F2396] transition-colors min-w-[240px]">
        <Search size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("Search reviews, properties, guests...", "ابحث في التقييمات، العقارات، الضيوف...")}
          className="flex-1 min-w-0 bg-transparent text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none"
        />
      </div>
    </div>
  );
}
