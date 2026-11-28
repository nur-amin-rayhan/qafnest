"use client";

import React from "react";
import { Search, Building2 } from "lucide-react";
import type { BookingTabKey, BookingCounts } from "./types";

interface BookingFilterToolbarProps {
  activeTab: BookingTabKey;
  setActiveTab: (tab: BookingTabKey) => void;
  counts: BookingCounts;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedPropertyId: string;
  setSelectedPropertyId: (id: string) => void;
  propertyOptions: [string, string][];
  filteredCount: number;
  lang: "ar" | "en";
  t: (en: string, ar: string) => string;
}

export function BookingFilterToolbar({
  activeTab,
  setActiveTab,
  counts,
  searchQuery,
  setSearchQuery,
  selectedPropertyId,
  setSelectedPropertyId,
  propertyOptions,
  filteredCount,
  lang,
  t,
}: BookingFilterToolbarProps) {
  const tabs: { key: BookingTabKey; labelEn: string; labelAr: string; count: number; alert?: boolean }[] = [
    { key: "all", labelEn: "All Bookings", labelAr: "كل الحجوزات", count: counts.all },
    { key: "today", labelEn: "Staying Today", labelAr: "النزلاء المتواجدون", count: counts.today },
    { key: "upcoming", labelEn: "Upcoming", labelAr: "الحجوزات القادمة", count: counts.upcoming },
    { key: "pending", labelEn: "Pending Requests", labelAr: "طلبات قيد الانتظار", count: counts.pending, alert: counts.pending > 0 },
    { key: "past", labelEn: "Completed Stays", labelAr: "حجوزات سابقة", count: counts.past },
  ];

  return (
    <div className="space-y-4">
      {/* Navigation Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 dark:border-slate-800/80 pb-3">
        {tabs.map((tab) => {
          const isSelected = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`relative inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition cursor-pointer ${
                isSelected
                  ? "bg-[#4F2396] text-white shadow-xs"
                  : "bg-slate-100/80 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <span>{lang === "ar" ? tab.labelAr : tab.labelEn}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                  isSelected
                    ? "bg-white/20 text-white"
                    : tab.alert
                    ? "bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300"
                    : "bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Property Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Search Input */}
        <div className="relative">
          <Search size={15} className="absolute left-3.5 rtl:right-3.5 rtl:left-auto top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("Search by Booking #, Guest, Phone...", "بحث برقم الحجز، اسم الضيف، الجوال...")}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#12101a] py-2.5 pl-10 pr-3.5 rtl:pr-10 rtl:pl-3.5 text-xs font-bold text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-[#4F2396] focus:ring-1 focus:ring-[#4F2396]"
          />
        </div>

        {/* Property Selector Dropdown */}
        <div className="relative">
          <Building2 size={15} className="absolute left-3.5 rtl:right-3.5 rtl:left-auto top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <select
            value={selectedPropertyId}
            onChange={(e) => setSelectedPropertyId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#12101a] py-2.5 pl-10 pr-8 rtl:pr-10 rtl:pl-8 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-[#4F2396] cursor-pointer"
          >
            <option value="all">{t("All Properties", "كل الوحدات والعقارات")}</option>
            {propertyOptions.map(([id, title]) => (
              <option key={id} value={id}>
                {title}
              </option>
            ))}
          </select>
        </div>

        {/* Results Counter & Clear Filter */}
        <div className="flex items-center justify-between sm:justify-end gap-3 text-xs font-bold text-slate-500">
          <span>
            {t("Showing", "عرض")} {filteredCount} {t("bookings", "حجز")}
          </span>
          {(searchQuery || selectedPropertyId !== "all" || activeTab !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedPropertyId("all");
                setActiveTab("all");
              }}
              className="text-[#4F2396] hover:underline cursor-pointer"
            >
              {t("Reset filters", "إعادة ضبط")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

