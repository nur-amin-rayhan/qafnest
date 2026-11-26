"use client";

import React from "react";
import { Search, Building2, ExternalLink } from "lucide-react";
import { getNumericUnitCode } from "@qafnest/shared";
import type { PropertyItem } from "../types";

export function HelplinePropertyDirectory({
  filteredProperties,
  selectedProperty,
  selectedPropertyId,
  onSelectPropertyId,
  searchTerm,
  setSearchTerm,
  cityFilter,
  setCityFilter,
  cities,
  listingScope,
  setListingScope,
  onSelectProperty,
  guestSiteUrl,
  t,
}: {
  filteredProperties: PropertyItem[];
  selectedProperty: PropertyItem | null;
  selectedPropertyId: string;
  onSelectPropertyId: (id: string) => void;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  cityFilter: string;
  setCityFilter: (val: string) => void;
  cities: string[];
  listingScope: "all" | "approved";
  setListingScope: (scope: "all" | "approved") => void;
  onSelectProperty?: (prop: PropertyItem) => void;
  guestSiteUrl: string | null;
  t: (en: string, ar: string) => string;
}) {
  return (
    <div className="xl:col-span-5 flex flex-col gap-4">
      <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0E0D16] p-4 sm:p-5 shadow-xs space-y-4 text-slate-900 dark:text-slate-100">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>{t("All Listings Catalog", "كافة العقارات المتاحة للحجز")}</span>
          </h2>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {filteredProperties.length} {t("units", "عقار")}
          </span>
        </div>

        <div className="space-y-2.5">
          <div className="relative">
            <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              data-testid="helpline-property-search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t(
                "Search Unit # (e.g. 201001), listing name, city, district, host or phone...",
                "ابحث برقم الوحدة (مثل 201001)، اسم العقار، المدينة، الحي، المضيف..."
              )}
              className="w-full h-9 ps-9 pe-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#4F2396]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filter by city"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-slate-100"
            >
              <option value="all">{t("All Cities", "كل المدن")}</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800/80 p-0.5">
              {(["all", "approved"] as const).map((scope) => (
                <button
                  key={scope}
                  type="button"
                  onClick={() => setListingScope(scope)}
                  className={`px-3 py-1 rounded-md text-xs font-medium cursor-pointer transition ${
                    listingScope === scope ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-semibold" : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {scope === "all" ? t("All Listings", "الكل") : t("Live Approved", "المعتمد فقط")}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2.5 max-h-[470px] overflow-y-auto pe-1">
          {filteredProperties.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
              {t("No listings match your current search filter.", "لا توجد عقارات مطابقة للبحث.")}
            </div>
          ) : (
            filteredProperties.map((prop) => {
              const isSelected = prop.id === selectedPropertyId;
              const isApproved = prop.status === "approved" || prop.is_approved;
              const img = Array.isArray(prop.images) && prop.images[0] ? prop.images[0] : null;
              return (
                <button
                  key={prop.id}
                  type="button"
                  data-testid={`helpline-prop-${prop.id}`}
                  onClick={() => onSelectPropertyId(prop.id)}
                  className={`w-full text-start p-3 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                    isSelected
                      ? "border-[#4F2396] bg-purple-50/50 dark:bg-purple-950/20 ring-1 ring-[#4F2396]/40 shadow-xs"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  }`}
                >
                  <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0 overflow-hidden flex items-center justify-center border border-slate-200/70 dark:border-slate-700">
                    {img ? (
                      <img src={img} alt={prop.title} className="w-full h-full object-cover" />
                    ) : (
                      <Building2 size={24} className="text-slate-400 dark:text-slate-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug truncate">{prop.title}</h3>
                      <span
                        className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          isApproved ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800" : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                        }`}
                      >
                        {isApproved ? t("Live", "معتمد") : String(prop.status || "Pending")}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      <p className="truncate">
                        {prop.city_name || prop.city || "Riyadh"}
                        {prop.district ? ` · ${prop.district}` : ""}
                      </p>
                      <span className="shrink-0 font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        #{getNumericUnitCode(prop.id)}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono">
                        SAR {Number(prop.base_price || 0).toFixed(0)}
                        <span className="text-[11px] font-normal text-slate-400 dark:text-slate-500"> /night</span>
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[160px]">
                        {prop.host_name ? `${t("Host:", "المضيف:")} ${prop.host_name}` : prop.category || "Chalet"}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {selectedProperty && (
        <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0E0D16] p-4 sm:p-5 shadow-xs space-y-3 text-slate-900 dark:text-slate-100">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#4F2396] dark:text-purple-300">
                  {t("Selected Listing Details", "تفاصيل العقار المختار")}
                </span>
                <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/50 text-[#4F2396] dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  {t("Unit", "وحدة")} #{getNumericUnitCode(selectedProperty.id)}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">{selectedProperty.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {selectedProperty.city_name || selectedProperty.city}
                {selectedProperty.district ? ` · ${selectedProperty.district}` : ""} ·{" "}
                {selectedProperty.category_name || selectedProperty.category || "Property"}
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {onSelectProperty && (
                <button
                  type="button"
                  onClick={() => onSelectProperty(selectedProperty)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer shadow-xs"
                >
                  {t("Full Specs", "عرض التفاصيل")}
                </button>
              )}
              {guestSiteUrl && (
                <a
                  href={guestSiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-xs font-semibold text-[#4F2396] dark:text-purple-300 shadow-xs"
                >
                  <ExternalLink size={12} />
                  <span>{t("Guest Page", "صفحة الضيف")}</span>
                </a>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{t("Base Night", "السعر الأساسي")}</div>
              <div className="font-bold text-slate-900 dark:text-slate-100 mt-0.5 font-mono">SAR {Number(selectedProperty.base_price || 0).toFixed(0)}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{t("Weekend Rate", "نهاية الأسبوع")}</div>
              <div className="font-bold text-slate-900 dark:text-slate-100 mt-0.5 font-mono">
                SAR {Number(selectedProperty.weekend_price || selectedProperty.base_price || 0).toFixed(0)}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{t("Rooms / Area", "الغرف / المساحة")}</div>
              <div className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                {selectedProperty.bedrooms_count ?? "—"} BD · {selectedProperty.area_sqm ?? "—"} m²
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{t("Host Contact", "تواصل المضيف")}</div>
              <div className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5 truncate" title={selectedProperty.host_phone || ""}>
                {selectedProperty.host_name || "QafNest Host"}
              </div>
            </div>
          </div>

          {selectedProperty.host_phone && (
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 text-xs">
              <span className="text-slate-600 dark:text-slate-400 font-medium">{t("Host Phone:", "جوال المضيف:")}</span>
              <span className="font-mono font-semibold text-[#4F2396] dark:text-purple-300">{selectedProperty.host_phone}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
