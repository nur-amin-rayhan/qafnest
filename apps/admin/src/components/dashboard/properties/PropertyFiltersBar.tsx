"use client";

import React from "react";
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

  return (
    <div dir={dir} className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md mb-space-lg flex flex-col gap-space-md">
      {/* Status Segment Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b-0 gap-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-surface-container-low rounded-xl">
          <button
            type="button"
            onClick={() => setPropertyStatusFilter("all")}
            className={`px-4 py-2 rounded-lg font-title-sm text-title-sm shadow-sm font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              propertyStatusFilter === "all"
                ? "bg-surface-container-lowest text-primary"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span>{t("All Listings", "جميع العقارات")}</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] bg-primary/10 text-primary">
              {properties.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setPropertyStatusFilter("approved")}
            className={`px-4 py-2 rounded-lg font-title-sm text-title-sm transition-all flex items-center gap-2 cursor-pointer ${
              propertyStatusFilter === "approved"
                ? "bg-surface-container-lowest text-status-emerald font-semibold"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span>{t("Active & Published", "النشطة والمنشورة")}</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] bg-status-emerald/15 text-status-emerald font-semibold">
              {properties.filter((p) => p.status === "approved" || p.is_approved).length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setPropertyStatusFilter("pending")}
            className={`px-4 py-2 rounded-lg font-title-sm text-title-sm transition-all flex items-center gap-2 cursor-pointer ${
              propertyStatusFilter === "pending"
                ? "bg-surface-container-lowest text-status-sand font-semibold"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span>{t("Under Review", "قيد المراجعة")}</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] bg-status-sand/20 text-status-sand font-semibold">
              {properties.filter((p) => p.status === "pending" || !p.is_approved).length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setPropertyStatusFilter("rejected")}
            className={`px-4 py-2 rounded-lg font-title-sm text-title-sm transition-all flex items-center gap-2 cursor-pointer ${
              propertyStatusFilter === "rejected"
                ? "bg-surface-container-lowest text-status-terracotta font-semibold"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span>{t("Suspended / Rejected", "موقوفة / مرفوضة")}</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] bg-status-terracotta/15 text-status-terracotta font-semibold">
              {properties.filter((p) => p.status === "rejected").length}
            </span>
          </button>
        </div>

        <div className="hidden xl:flex items-center gap-2 text-outline font-body-sm text-body-sm pe-2 shrink-0">
          <span className="material-symbols-outlined text-[18px]">sync</span>
          <span>{t("Auto-sync enabled", "المزامنة التلقائية مفعّلة")}</span>
        </div>
      </div>

      {/* Filter Fields Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-12 gap-space-sm items-center pt-1">
        {/* Search Input (Flexbox - prevents RTL/LTR icon overlap) */}
        <div className="sm:col-span-2 xl:col-span-5 flex items-center h-10 px-3 gap-2 bg-surface-container-low focus-within:bg-surface-container-lowest rounded-lg focus-within:ring-2 focus-within:ring-violet-400 transition-all">
          <span className="material-symbols-outlined text-outline text-[20px] shrink-0">
            search
          </span>
          <input
            className="flex-1 min-w-0 bg-transparent font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 rounded-md px-1"
            placeholder={t(
              "Search by Unit # (e.g. 201001), listing name, ID, host, or neighborhood...",
              "ابحث برقم الوحدة (مثل 201001)، اسم العقار، المعرف، المضيف، أو الحي..."
            )}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-outline hover:text-on-surface shrink-0 cursor-pointer"
              title={t("Clear", "مسح")}
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        {/* City Filter */}
        <div className="xl:col-span-2">
          <div className="relative">
            <select
              value={propertyCityFilter}
              onChange={(e) => setPropertyCityFilter(e.target.value)}
              className="w-full h-10 ps-3 pe-8 bg-surface-container-low focus:bg-surface-container-lowest rounded-lg font-body-sm text-body-sm text-on-surface appearance-none focus:outline-none cursor-pointer"
              aria-label={t("City and region filter", "تصفية حسب المدينة والمنطقة")}
            >
              <option value="all">{t("All Cities & Regions", "كل المدن والمناطق")}</option>
              {SAUDI_ALL_CITIES.map((city) => (
                <option key={city.id} value={city.id}>
                  {t(city.en, city.ar)}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute end-2.5 top-2.5 text-outline pointer-events-none text-[18px]">
              expand_more
            </span>
          </div>
        </div>

        {/* Property Type Filter */}
        <div className="xl:col-span-2">
          <div className="relative">
            <select
              value={propertyTypeFilter}
              onChange={(e) => setPropertyTypeFilter(e.target.value)}
              className="w-full h-10 ps-3 pe-8 bg-surface-container-low focus:bg-surface-container-lowest rounded-lg font-body-sm text-body-sm text-on-surface appearance-none focus:outline-none cursor-pointer"
              aria-label={t("Property type filter", "تصفية حسب نوع العقار")}
            >
              <option value="all">{t("All Property Types", "جميع أنواع العقارات")}</option>
              <option value="chalet">{t("Chalet", "شاليه")}</option>
              <option value="villa">{t("Private Villa", "فيلا خاصة")}</option>
              <option value="resort">{t("Boutique Resort", "منتجع")}</option>
              <option value="farmhouse">{t("Oasis Farmhouse", "مزرعة")}</option>
              <option value="apartment">{t("Serviced Flat", "شقة مخدومة")}</option>
            </select>
            <span className="material-symbols-outlined absolute end-2.5 top-2.5 text-outline pointer-events-none text-[18px]">
              expand_more
            </span>
          </div>
        </div>

        {/* Pricing Tier Filter */}
        <div className="xl:col-span-2">
          <div className="relative">
            <select
              className="w-full h-10 ps-3 pe-8 bg-surface-container-low focus:bg-surface-container-lowest rounded-lg font-body-sm text-body-sm text-on-surface appearance-none focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 cursor-pointer"
              aria-label={t("Pricing tier filter", "تصفية حسب الفئة السعرية")}
            >
              <option value="all">{t("Pricing Tier: All", "الفئة السعرية: الكل")}</option>
              <option value="economy">{t("Economy (< 600 SAR)", "اقتصادي (< ٦٠٠ ر.س)")}</option>
              <option value="standard">{t("Standard (600 - 1,200 SAR)", "قياسي (٦٠٠ - ١,٢٠٠ ر.س)")}</option>
              <option value="luxury">{t("Luxury (1,200 - 2,500 SAR)", "فاخر (١,٢٠٠ - ٢,٥٠٠ ر.س)")}</option>
              <option value="ultra">{t("Ultra-Elite (2,500+ SAR)", "نخبة (+٢,٥٠٠ ر.س)")}</option>
            </select>
            <span className="material-symbols-outlined absolute end-2.5 top-2.5 text-outline pointer-events-none text-[18px]">
              expand_more
            </span>
          </div>
        </div>

        {/* Reset Button */}
        <div className="xl:col-span-1 flex justify-end">
          <button
            type="button"
            onClick={() => {
              setPropertyStatusFilter("all");
              setPropertyCityFilter("all");
              setPropertyTypeFilter("all");
              setSearchQuery("");
            }}
            className="w-full h-10 px-3 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            title={t("Reset applied filters", "إعادة ضبط الفلاتر")}
            aria-label={t("Reset applied filters", "إعادة ضبط الفلاتر")}
          >
            <span className="material-symbols-outlined text-[20px]">filter_alt_off</span>
          </button>
        </div>
      </div>
    </div>
  );
}
