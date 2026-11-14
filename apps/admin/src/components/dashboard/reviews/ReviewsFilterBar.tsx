"use client";

import React from "react";
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
      <div className="inline-flex flex-wrap rounded-xl bg-surface-container-high p-1 border border-surface-container-highest">
        <button
          type="button"
          onClick={() => {
            setStatusFilter("all");
            setPage(1);
          }}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            statusFilter === "all"
              ? "bg-surface-container-lowest text-on-surface shadow-xs"
              : "text-on-surface-variant hover:text-on-surface"
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
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            statusFilter === "pending"
              ? "bg-surface-container-lowest text-status-terracotta shadow-xs"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <span>{t("Needs Reply", "بحاجة لرد")}</span>
          {pendingCount > 0 && (
            <span className="rounded-full bg-status-terracotta text-white px-1.5 py-0.2 text-[10px] font-bold">
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
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            statusFilter === "replied"
              ? "bg-surface-container-lowest text-on-surface shadow-xs"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          {t(`Replied (${repliedCount})`, `تم الرد (${repliedCount})`)}
        </button>
      </div>

      {/* Live Search */}
      <div className="flex items-center gap-2 h-9 px-3 rounded-xl border border-surface-container-high bg-surface-container-lowest focus-within:border-primary transition-colors min-w-[240px]">
        <span className="material-symbols-outlined text-outline text-[18px] shrink-0">
          search
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("Search reviews, properties, guests...", "ابحث في التقييمات، العقارات، الضيوف...")}
          className="flex-1 min-w-0 bg-transparent text-xs text-on-surface placeholder:text-outline outline-none"
        />
      </div>
    </div>
  );
}
