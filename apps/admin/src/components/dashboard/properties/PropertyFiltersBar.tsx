"use client";

import React from "react";
import { Search, FilterX, X, ChevronDown } from "lucide-react";
import { SAUDI_ALL_CITIES } from "@qafnest/shared";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { PropertyItem } from "../types";

interface PropertyFiltersBarProps {
  properties: PropertyItem[];
  propertyStatusFilter: "all" | "approved" | "pending" | "rejected";
  setPropertyStatusFilter: (status: "all" | "approved" | "pending" | "rejected") => void;
  propertyCityFilter: string;
  setPropertyCityFilter: (city: string) => void;
  propertyTypeFilter: string;
  setPropertyTypeFilter: (type: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function PropertyFiltersBar({
  properties,
  propertyStatusFilter,
  setPropertyStatusFilter,
  propertyCityFilter,
  setPropertyCityFilter,
  propertyTypeFilter,
  setPropertyTypeFilter,
  searchQuery,
  setSearchQuery,
}: PropertyFiltersBarProps) {
  const { dir, t } = useAdminAuth();

  const totalCount = properties.length;
  const approvedCount = properties.filter((p) => p.status === "approved" || p.is_approved).length;
  const pendingCount = properties.filter(
    (p) => p.status === "pending" || (!p.is_approved && p.status !== "rejected")
  ).length;
  const rejectedCount = properties.filter((p) => p.status === "rejected").length;

  const hasActiveFilters =
    propertyStatusFilter !== "all" ||
    propertyCityFilter !== "all" ||
    propertyTypeFilter !== "all" ||
    searchQuery.trim().length > 0;

  return (
    <div
      dir={dir}
      className="bg-white dark:bg-[#0E0D16] rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-xs mb-6 space-y-3.5"
    >
      {/* 1. Status Segmented Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setPropertyStatusFilter("all")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              propertyStatusFilter === "all"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <span>{t("All listings", "جميع العقارات")}</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums ${
                propertyStatusFilter === "all"
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  : "bg-slate-200/70 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300"
              }`}
            >
              {totalCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setPropertyStatusFilter("approved")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              propertyStatusFilter === "approved"
                ? "bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 shadow-xs font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span>{t("Live & published", "النشطة والمنشورة")}</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums ${
                propertyStatusFilter === "approved"
                  ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                  : "bg-slate-200/70 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300"
              }`}
            >
              {approvedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setPropertyStatusFilter("pending")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              propertyStatusFilter === "pending"
                ? "bg-white dark:bg-slate-900 text-amber-800 dark:text-amber-300 shadow-xs font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
            <span>{t("Under review", "قيد المراجعة")}</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums ${
                propertyStatusFilter === "pending"
                  ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                  : "bg-slate-200/70 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300"
              }`}
            >
              {pendingCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setPropertyStatusFilter("rejected")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              propertyStatusFilter === "rejected"
                ? "bg-white dark:bg-slate-900 text-rose-800 dark:text-rose-300 shadow-xs font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
            <span>{t("Suspended & removed", "الموقوفة والملغاة")}</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums ${
                propertyStatusFilter === "rejected"
                  ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300"
                  : "bg-slate-200/70 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300"
              }`}
            >
              {rejectedCount}
            </span>
          </button>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => {
              setPropertyStatusFilter("all");
              setPropertyCityFilter("all");
              setPropertyTypeFilter("all");
              setSearchQuery("");
            }}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 self-end sm:self-auto transition-colors cursor-pointer"
          >
            <FilterX size={14} strokeWidth={1.5} />
            <span>{t("Reset filters", "إعادة ضبط الفلاتر")}</span>
          </button>
        )}
      </div>

      {/* 2. Search & Select Controls Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
        {/* Search input */}
        <div className="sm:col-span-2 lg:col-span-6 relative flex items-center">
          <Search
            size={15}
            strokeWidth={1.5}
            className="absolute start-3 text-slate-400 dark:text-slate-500 pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t(
              "Search unit #, listing name, host, or district...",
              "ابحث برقم الوحدة، اسم العقار، المضيف، أو الحي..."
            )}
            className="w-full h-9 ps-9 pe-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#4F2396] focus:ring-1 focus:ring-[#4F2396] transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute end-2.5 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded transition-colors cursor-pointer"
              title={t("Clear search", "مسح البحث")}
            >
              <X size={13} strokeWidth={1.5} />
            </button>
          )}
        </div>

        {/* City Filter */}
        <div className="lg:col-span-3 relative flex items-center">
          <select
            value={propertyCityFilter}
            onChange={(e) => setPropertyCityFilter(e.target.value)}
            className="w-full h-9 ps-3 pe-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#4F2396] focus:ring-1 focus:ring-[#4F2396] transition-colors cursor-pointer appearance-none"
            aria-label={t("Filter by city", "تصفية حسب المدينة")}
          >
            <option value="all">{t("All cities & regions", "كل المدن والمناطق")}</option>
            {SAUDI_ALL_CITIES.map((city) => (
              <option key={city.id} value={city.id}>
                {t(city.en, city.ar)}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            strokeWidth={1.5}
            className="absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none"
          />
        </div>

        {/* Property Type Filter */}
        <div className="lg:col-span-3 relative flex items-center">
          <select
            value={propertyTypeFilter}
            onChange={(e) => setPropertyTypeFilter(e.target.value)}
            className="w-full h-9 ps-3 pe-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#4F2396] focus:ring-1 focus:ring-[#4F2396] transition-colors cursor-pointer appearance-none"
            aria-label={t("Filter by property type", "تصفية حسب نوع العقار")}
          >
            <option value="all">{t("All property types", "جميع أنواع العقارات")}</option>
            <option value="chalet">{t("Chalet", "شاليه")}</option>
            <option value="villa">{t("Private villa", "فيلا خاصة")}</option>
            <option value="resort">{t("Boutique resort", "منتجع")}</option>
            <option value="farmhouse">{t("Oasis farmhouse", "مزرعة")}</option>
            <option value="apartment">{t("Serviced flat", "شقة مخدومة")}</option>
          </select>
          <ChevronDown
            size={14}
            strokeWidth={1.5}
            className="absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none"
          />
        </div>
      </div>
    </div>
  );
}
