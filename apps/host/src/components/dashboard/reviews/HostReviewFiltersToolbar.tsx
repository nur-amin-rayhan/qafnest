"use client";

import React from "react";
import type { HostReviewsStats } from "./types";

interface HostReviewFiltersToolbarProps {
  replyFilter: "all" | "unreplied" | "replied";
  setReplyFilter: (filter: "all" | "unreplied" | "replied") => void;
  selectedPropertyId: string;
  setSelectedPropertyId: (id: string) => void;
  propertyOptions: [string, string][];
  stats: HostReviewsStats | null;
  lang: "ar" | "en";
  t: (en: string, ar: string) => string;
}

export function HostReviewFiltersToolbar({
  replyFilter,
  setReplyFilter,
  selectedPropertyId,
  setSelectedPropertyId,
  propertyOptions,
  stats,
  lang,
  t,
}: HostReviewFiltersToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-3">
      {/* Reply Filter Tabs */}
      <div className="flex items-center gap-2">
        {[
          {
            key: "all",
            labelEn: "All Reviews",
            labelAr: "كل التقييمات",
            count: stats?.totalCount || 0,
          },
          {
            key: "unreplied",
            labelEn: "Needs Reply",
            labelAr: "بانتظار الرد",
            count: stats?.needsReplyCount || 0,
            highlight: (stats?.needsReplyCount || 0) > 0,
          },
          {
            key: "replied",
            labelEn: "Replied",
            labelAr: "تم الرد عليها",
            count: stats?.withReplyCount || 0,
          },
        ].map((tab) => {
          const isSelected = replyFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setReplyFilter(tab.key as typeof replyFilter)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition cursor-pointer ${
                isSelected
                  ? "bg-[#4F2396] text-white shadow-xs"
                  : "bg-slate-100/80 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800"
              }`}
            >
              <span>{lang === "ar" ? tab.labelAr : tab.labelEn}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                  isSelected ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Property Selector */}
      <div className="w-full sm:w-64">
        <select
          value={selectedPropertyId}
          onChange={(e) => setSelectedPropertyId(e.target.value)}
          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 px-3 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-[#4F2396]"
        >
          <option value="all">{t("All Properties", "كل الوحدات والعقارات")}</option>
          {propertyOptions.map(([id, title]) => (
            <option key={id} value={id}>
              {title}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

