"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { getLocalizedSaudiCity, normalizeSaudiCityId } from "@qafnest/shared";
import {
  Building2,
  Plus,
  Search,
  RefreshCw,
} from "lucide-react";
import { HostPropertySummary } from "./HostOverviewHub";
import { PropertiesKpiStrip } from "./properties/PropertiesKpiStrip";
import { PropertyCardItem } from "./properties/PropertyCardItem";
import type { DeletePropertyTarget } from "./properties/DeletePropertyModal";

interface HostPropertiesHubProps {
  properties: HostPropertySummary[];
  lang: "ar" | "en";
  t: (en: string, ar: string) => string;
  onNavigateTab: (tab: "overview" | "properties" | "reservations" | "analytics" | "reviews" | "calendar" | "finance") => void;
  onRefresh?: () => void;
  onDeleteProperty?: (prop: DeletePropertyTarget) => void;
}

export default function HostPropertiesHub({
  properties,
  lang,
  t,
  onRefresh,
  onDeleteProperty,
}: HostPropertiesHubProps) {
  const [statusFilter, setStatusFilter] = useState<"all" | "approved" | "pending" | "rejected">("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Unique cities from properties
  const availableCities = useMemo(() => {
    const set = new Set<string>();
    properties.forEach((p) => {
      if (p.city) set.add(normalizeSaudiCityId(p.city) || p.city);
    });
    return Array.from(set);
  }, [properties]);

  // Counts
  const counts = useMemo(() => {
    const total = properties.length;
    const approved = properties.filter((p) => p.isApproved || p.status === "approved").length;
    const pending = properties.filter((p) => p.status === "pending" || (!p.isApproved && p.status !== "rejected")).length;
    const rejected = properties.filter((p) => p.status === "rejected" || Boolean(p.adminFeedback)).length;
    return { total, approved, pending, rejected };
  }, [properties]);

  // Filtered properties
  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      if (statusFilter === "approved" && !(p.isApproved || p.status === "approved")) return false;
      if (statusFilter === "pending" && (p.status !== "pending" && (p.isApproved || p.status === "rejected"))) return false;
      if (statusFilter === "rejected" && (p.status !== "rejected" && !p.adminFeedback)) return false;

      if (cityFilter !== "all" && (normalizeSaudiCityId(p.city) || p.city) !== cityFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle =
          p.title.toLowerCase().includes(q) ||
          (p.titleAr || "").toLowerCase().includes(q);
        const matchesDistrict =
          p.district.toLowerCase().includes(q) ||
          (p.districtAr || "").toLowerCase().includes(q);
        const matchesCity =
          p.city.toLowerCase().includes(q) ||
          getLocalizedSaudiCity(p.city, "en").toLowerCase().includes(q) ||
          getLocalizedSaudiCity(p.city, "ar").toLowerCase().includes(q);
        const matchesCat = p.category.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDistrict && !matchesCity && !matchesCat) return false;
      }
      return true;
    });
  }, [properties, statusFilter, cityFilter, searchQuery]);

  return (
    <div className="mx-auto w-full max-w-[1640px] px-4 py-6 sm:px-8 sm:py-8 space-y-8 animate-in fade-in duration-300">
      {/* 1. HEADER & PRIMARY ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#4F2396] text-white shadow-xs">
              <Building2 size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {t("Properties & Real Estate Management", "إدارة العقارات والوحدات")}
              </h1>
              <p className="mt-0.5 text-xs sm:text-sm font-medium text-slate-500">
                {t(
                  "Manage your chalets, villas, and apartments. Update pricing, edit photos, and review approval status.",
                  "تحكم بجميع شاليهاتك وفيللك وشققك المسجلة، وتابع التراخيص والأسعار وحالة النشر للضيوف."
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-3 text-xs font-black text-slate-700 shadow-xs transition cursor-pointer"
              title={t("Refresh data", "تحديث البيانات")}
            >
              <RefreshCw size={14} className="text-slate-400" />
              <span>{t("Refresh", "تحديث")}</span>
            </button>
          )}

          <Link
            href={`/${lang}/properties/new?mode=new`}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#FF9750] px-5 py-3 text-xs sm:text-sm font-black text-slate-950 shadow-md hover:bg-[#ff8a38] transition-all transform active:scale-95 cursor-pointer"
          >
            <Plus size={16} className="stroke-[3]" />
            <span>{t("Add New Property", "إضافة عقار جديد")}</span>
          </Link>
        </div>
      </div>

      {/* 2. KPI SUMMARY STRIP */}
      <PropertiesKpiStrip
        counts={counts}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        t={t}
      />

      {/* 3. SEARCH & CITY FILTER CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search size={16} className="absolute inset-y-0 start-3 my-auto text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t(
              "Search property title, city, or district...",
              "ابحث باسم العقار، المدينة، أو الحي..."
            )}
            className="w-full rounded-xl bg-slate-50 py-2.5 ps-9 pe-4 text-xs sm:text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#4F2396]/20 transition"
          />
        </div>

        {availableCities.length > 0 && (
          <div className="flex items-center gap-2">
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none cursor-pointer hover:border-slate-300"
            >
              <option value="all">{t("All Cities", "جميع المدن")}</option>
              {availableCities.map((c) => (
                <option key={c} value={c}>
                  {getLocalizedSaudiCity(c, t("en", "ar") as "en" | "ar")}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 4. PROPERTY CARDS GRID */}
      {filteredProperties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((prop) => (
            <PropertyCardItem
              key={prop.id}
              prop={prop}
              t={t}
              onDelete={onDeleteProperty}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-4">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-violet-50 text-[#4F2396]">
            <Building2 size={32} />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-lg font-black text-slate-900">
              {t("No properties match your filter", "لم يتم العثور على عقارات مطابقة")}
            </h3>
            <p className="text-xs font-medium text-slate-500">
              {t(
                "Try clearing search filters or add a new chalet, villa, or apartment to start welcoming guests.",
                "جرب مسح معايير البحث أو ابدأ بإضافة عقار جديد لتبدأ باستقبال الحجوزات والأرباح."
              )}
            </p>
          </div>
          <Link
            href={`/${lang}/properties/new?mode=new`}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#4F2396] px-5 py-2.5 text-xs font-black text-white hover:bg-[#3D1A78] transition shadow-xs"
          >
            <Plus size={15} className="stroke-[3]" />
            <span>{t("Add New Property", "إضافة عقار جديد")}</span>
          </Link>
        </div>
      )}
    </div>
  );
}
