"use client";

import React from "react";
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
      <div className="rounded-2xl border border-surface-container bg-surface-container-lowest p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-black text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-primary">villa</span>
            <span>{t("All Listings Catalog", "كافة العقارات المتاحة للحجز")}</span>
          </h2>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
            {filteredProperties.length} {t("units", "عقار")}
          </span>
        </div>

        <div className="space-y-2.5">
          <div className="relative">
            <span className="material-symbols-outlined absolute start-3 top-1/2 -translate-y-1/2 text-[18px] text-outline">
              search
            </span>
            <input
              type="text"
              data-testid="helpline-property-search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t(
                "Search Unit # (e.g. 201001), listing name, city, district, host or phone...",
                "ابحث برقم الوحدة (مثل 201001)، اسم العقار، المدينة، الحي، المضيف..."
              )}
              className="w-full h-10 ps-9 pe-3 rounded-xl border border-surface-container bg-surface-container-low text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filter by city"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="h-9 px-3 rounded-xl border border-surface-container bg-surface-container-low text-xs font-bold text-on-surface"
            >
              <option value="all">{t("All Cities", "كل المدن")}</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <div className="inline-flex rounded-xl bg-surface-container-low p-0.5 border border-surface-container">
              {(["all", "approved"] as const).map((scope) => (
                <button
                  key={scope}
                  type="button"
                  onClick={() => setListingScope(scope)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition ${
                    listingScope === scope ? "bg-white text-primary shadow-2xs" : "text-on-surface-variant"
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
            <div className="p-8 text-center text-sm text-outline bg-surface-container-low rounded-xl">
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
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs"
                      : "border-surface-container bg-white hover:border-primary/40 hover:bg-surface-container-low/50"
                  }`}
                >
                  <div className="w-16 h-16 rounded-xl bg-surface-container shrink-0 overflow-hidden flex items-center justify-center">
                    {img ? (
                      <img src={img} alt={prop.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-outline text-[24px]">home_work</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-black text-on-surface leading-snug truncate">{prop.title}</h3>
                      <span
                        className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          isApproved ? "bg-status-emerald/15 text-status-emerald" : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {isApproved ? t("Live", "معتمد") : String(prop.status || "Pending")}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 text-xs text-on-surface-variant mt-0.5">
                      <p className="truncate">
                        {prop.city_name || prop.city || "Riyadh"}
                        {prop.district ? ` · ${prop.district}` : ""}
                      </p>
                      <span className="shrink-0 font-mono text-[10px] font-black px-1.5 py-0.5 rounded bg-surface-container text-primary">
                        #{getNumericUnitCode(prop.id)}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-black text-primary">
                        SAR {Number(prop.base_price || 0).toFixed(0)}
                        <span className="text-[11px] font-normal text-outline"> /night</span>
                      </span>
                      <span className="text-[11px] text-on-surface-variant truncate max-w-[160px]">
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
        <div className="rounded-2xl border border-surface-container bg-surface-container-lowest p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  {t("Selected Listing Details", "تفاصيل العقار المختار")}
                </span>
                <span className="font-mono text-[11px] font-black px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {t("Unit", "وحدة")} #{getNumericUnitCode(selectedProperty.id)}
                </span>
              </div>
              <h3 className="text-base font-black text-on-surface mt-0.5">{selectedProperty.title}</h3>
              <p className="text-xs text-on-surface-variant">
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
                  className="px-2.5 py-1.5 rounded-lg border border-surface-container bg-surface-container-low hover:bg-surface-container text-xs font-bold text-on-surface cursor-pointer"
                >
                  {t("Full Specs", "عرض التفاصيل")}
                </button>
              )}
              {guestSiteUrl && (
                <a
                  href={guestSiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1.5 rounded-lg border border-primary/25 bg-primary/5 hover:bg-primary/10 text-xs font-bold text-primary"
                >
                  {t("Guest Page", "صفحة الضيف")}
                </a>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-surface-container-low">
              <div className="text-[11px] text-outline">{t("Base Night", "السعر الأساسي")}</div>
              <div className="font-black text-on-surface mt-0.5">SAR {Number(selectedProperty.base_price || 0).toFixed(0)}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-container-low">
              <div className="text-[11px] text-outline">{t("Weekend Rate", "نهاية الأسبوع")}</div>
              <div className="font-black text-on-surface mt-0.5">
                SAR {Number(selectedProperty.weekend_price || selectedProperty.base_price || 0).toFixed(0)}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-container-low">
              <div className="text-[11px] text-outline">{t("Rooms / Area", "الغرف / المساحة")}</div>
              <div className="font-bold text-on-surface mt-0.5">
                {selectedProperty.bedrooms_count ?? "—"} BD · {selectedProperty.area_sqm ?? "—"} m²
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-container-low">
              <div className="text-[11px] text-outline">{t("Host Contact", "تواصل المضيف")}</div>
              <div className="font-bold text-on-surface mt-0.5 truncate" title={selectedProperty.host_phone || ""}>
                {selectedProperty.host_name || "QafNest Host"}
              </div>
            </div>
          </div>

          {selectedProperty.host_phone && (
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-primary/5 border border-primary/15 text-xs">
              <span className="text-on-surface-variant font-semibold">{t("Host Phone:", "جوال المضيف:")}</span>
              <span className="font-mono font-bold text-primary">{selectedProperty.host_phone}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
