"use client";

import React from "react";
import { getLocalizedSaudiCity, pickBilingualText } from "@qafnest/shared";
import { PropertyItem } from "../types";

interface PropertyTableRowProps {
  prop: PropertyItem;
  selectedPropertyIds: string[];
  togglePropSelection: (id: string) => void;
  hostPropertyCounts: Record<string, number>;
  updatePropertyStatus: (
    id: string,
    status: "approved" | "rejected" | "pending",
    feedback?: string
  ) => void | Promise<void>;
  onSelectProperty?: (property: PropertyItem) => void;
  onRequestReject?: (property: PropertyItem) => void;
  t: (ar: string, en: string) => string;
}

export function PropertyTableRow({
  prop,
  selectedPropertyIds,
  togglePropSelection,
  hostPropertyCounts,
  updatePropertyStatus,
  onSelectProperty,
  onRequestReject,
  t,
}: PropertyTableRowProps) {
  const isApproved = prop.status === "approved" || prop.is_approved;
  const isPending = prop.status === "pending" || (!prop.is_approved && prop.status !== "rejected");
  const hostKey = (prop.host_id || prop.host_name || "unknown").trim();
  const hostCount = hostPropertyCounts[hostKey] || 1;
  const hostLabel = prop.host_name || (prop.host_id ? `Host #${prop.host_id.slice(0, 8)}` : t("Host", "مضيف"));
  const locale = t("en", "ar") as "en" | "ar";
  const displayTitle = pickBilingualText(locale, prop.title, prop.title_ar, prop.title);
  const displayDistrict = pickBilingualText(locale, prop.district, prop.district_ar);
  const displayCity = prop.city || prop.city_name ? getLocalizedSaudiCity(prop.city || prop.city_name, locale) : "";
  const locationLabel =
    displayDistrict && displayCity && displayDistrict.toLowerCase() !== displayCity.toLowerCase()
      ? `${displayDistrict} · ${displayCity}`
      : displayDistrict || displayCity || "—";

  return (
    <tr className="hover:bg-surface-desert-sand/50 transition-colors group">
      {/* Column 1: Property & Neighborhood */}
      <td className="py-3.5 px-4 align-middle">
        <div className="flex items-center gap-3 min-w-0">
          <input
            type="checkbox"
            checked={selectedPropertyIds.includes(prop.id)}
            onChange={() => togglePropSelection(prop.id)}
            className="w-4 h-4 rounded accent-primary-container cursor-pointer shrink-0"
            onClick={(e) => e.stopPropagation()}
            aria-label={`Select ${displayTitle}`}
          />
          <div className="relative w-14 h-12 rounded-lg overflow-hidden shrink-0 shadow-xs bg-surface-container-high">
            {prop.images && prop.images[0] ? (
              <img
                src={prop.images[0]}
                alt={displayTitle}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-surface-container text-outline">
                <span className="material-symbols-outlined text-[18px]">villa</span>
              </div>
            )}
            <span className="absolute bottom-0.5 end-0.5 bg-surface/90 backdrop-blur-sm text-[9px] font-bold px-1 rounded text-primary">
              #{prop.id.slice(0, 5)}
            </span>
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-title-sm text-title-sm text-on-surface font-bold truncate">
                {displayTitle}
              </span>
              {isApproved && (
                <span className="material-symbols-outlined text-[14px] text-status-sand shrink-0" title="Featured Chalet">
                  star
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-on-surface-variant truncate mt-0.5">
              <span className="flex items-center gap-0.5 truncate">
                <span className="material-symbols-outlined text-[13px] text-outline shrink-0">
                  location_on
                </span>
                <span className="truncate">{locationLabel}</span>
              </span>
              <span className="text-outline-variant">•</span>
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-surface-container text-[11px] font-medium capitalize shrink-0">
                {prop.category || "—"}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-outline">
              <span className="font-mono">ID: {prop.id}</span>
              {prop.tourism_license_number && (
                <>
                  <span>•</span>
                  <span className="font-mono text-on-surface-variant">
                    Lic: {prop.tourism_license_number}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </td>

      {/* Column 2: Host Details & Tracked Portfolio */}
      <td className="py-3.5 px-4 align-middle">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase shrink-0 border border-primary/20">
            {(prop.host_name || prop.host_id || "H").slice(0, 2)}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1 min-w-0">
              <span className="font-title-sm text-xs font-bold text-on-surface truncate">
                {hostLabel}
              </span>
              {isApproved && prop.tourism_license_number && (
                <span
                  className="material-symbols-outlined text-[14px] text-status-emerald shrink-0"
                  title={t("Tourism License Provided", "الترخيص السياحي مرفق")}
                >
                  verified
                </span>
              )}
            </div>
            <span className="text-xs text-outline font-mono truncate">
              {prop.host_phone || prop.host_email || "—"}
            </span>
            <div className="mt-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-primary/10 text-primary border border-primary/15">
                <span className="material-symbols-outlined text-[11px]">apartment</span>
                <span>
                  {hostCount}{" "}
                  {hostCount === 1
                    ? t("Property", "عقار واحد")
                    : t("Properties", `${hostCount} عقارات`)}
                </span>
              </span>
            </div>
          </div>
        </div>
      </td>

      {/* Column 3: Rate & Instant Book */}
      <td className="py-3.5 px-4 align-middle">
        <div className="flex flex-col gap-1">
          <div className="flex items-baseline gap-1">
            <span className="font-title-sm text-sm font-bold text-on-surface">
              SAR {Number(prop.base_price ?? 0).toLocaleString()}
            </span>
            <span className="text-[10px] text-outline uppercase">
              /{t("nt", "ليلة")}
            </span>
          </div>
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => updatePropertyStatus(prop.id, isApproved ? "rejected" : "approved")}
              className={`relative inline-flex h-4 w-7 flex-shrink-0 cursor-pointer rounded-full p-0.5 transition-colors focus:outline-none ${
                isApproved ? "bg-status-emerald" : "bg-outline-variant"
              }`}
              title={t("Toggle Instant Bookable", "تبديل الحجز الفوري")}
              aria-label="Toggle instant bookable"
            >
              <span
                className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-surface-container-lowest shadow ring-0 transition duration-200 ${
                  isApproved ? "translate-x-3 rtl:-translate-x-3" : "translate-x-0"
                }`}
              />
            </button>
            <span className="text-[10.5px] font-medium text-outline">
              {isApproved ? t("Instant", "فوري") : t("Manual", "يدوي")}
            </span>
          </div>
        </div>
      </td>

      {/* Column 4: Status */}
      <td className="py-3.5 px-4 align-middle text-center">
        {isApproved ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide bg-status-emerald/15 text-status-emerald">
            ● {t("Published", "منشور")}
          </span>
        ) : isPending ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide bg-status-sand/20 text-status-sand">
            ⏳ {t("Review", "مراجعة")}
          </span>
        ) : (
          <div className="flex flex-col items-center gap-0.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide bg-status-terracotta/15 text-status-terracotta">
              ✕ {t("Rejected", "مرفوض")}
            </span>
            {prop.admin_feedback && (
              <span
                className="text-[10px] text-status-terracotta font-medium truncate max-w-[100px]"
                title={prop.admin_feedback}
              >
                {prop.admin_feedback}
              </span>
            )}
          </div>
        )}
      </td>

      {/* Column 5: Dedicated View Button & Quick Actions */}
      <td
        className="py-3.5 px-4 align-middle text-end"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => onSelectProperty?.(prop)}
            className="h-7 px-2.5 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/15 text-primary font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-2xs shrink-0"
            title={t("View & Inspect Full Listing Details", "معاينة تفاصيل العقار")}
          >
            <span className="material-symbols-outlined text-[15px]">visibility</span>
            <span>{t("View", "عرض")}</span>
          </button>

          {isPending ? (
            <button
              type="button"
              onClick={() => updatePropertyStatus(prop.id, "approved")}
              className="w-7 h-7 rounded-lg text-status-emerald hover:bg-status-emerald/10 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title={t("Review & Approve", "اعتماد العقار")}
              aria-label="Approve property"
            >
              <span className="material-symbols-outlined text-[16px]">fact_check</span>
            </button>
          ) : isApproved ? (
            <button
              type="button"
              onClick={() =>
                onRequestReject
                  ? onRequestReject(prop)
                  : updatePropertyStatus(prop.id, "rejected")
              }
              className="w-7 h-7 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-status-sand flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title={t("Pause / Suspend", "إيقاف مؤقت")}
              aria-label="Pause property"
            >
              <span className="material-symbols-outlined text-[16px]">pause</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => updatePropertyStatus(prop.id, "approved")}
              className="w-7 h-7 rounded-lg text-primary hover:bg-surface-container flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title={t("Reactivate Listing", "إعادة التفعيل")}
              aria-label="Reactivate property"
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
            </button>
          )}
          <a
            href={`/properties/${prop.id}`}
            target="_blank"
            rel="noreferrer"
            className="w-7 h-7 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-primary flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Open Full Page Preview in New Tab"
          >
            <span className="material-symbols-outlined text-[16px]">open_in_new</span>
          </a>
        </div>
      </td>
    </tr>
  );
}

