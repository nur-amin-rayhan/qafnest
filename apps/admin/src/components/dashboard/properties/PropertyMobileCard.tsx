"use client";

import React from "react";
import {
  getLocalizedSaudiCity,
  getNumericUnitCode,
  pickBilingualText,
} from "@qafnest/shared";
import { PropertyItem } from "../types";

interface PropertyMobileCardProps {
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

export function PropertyMobileCard({
  prop,
  selectedPropertyIds,
  togglePropSelection,
  hostPropertyCounts,
  updatePropertyStatus,
  onSelectProperty,
  onRequestReject,
  t,
}: PropertyMobileCardProps) {
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
    <div className="p-4 sm:p-5 hover:bg-surface-desert-sand/40 transition-colors flex flex-col gap-3.5">
      {/* Top Row: Thumbnail, Title, Category & Status */}
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={selectedPropertyIds.includes(prop.id)}
          onChange={() => togglePropSelection(prop.id)}
          className="w-4 h-4 mt-1 rounded accent-primary-container cursor-pointer shrink-0"
          onClick={(e) => e.stopPropagation()}
          aria-label={`Select ${displayTitle}`}
        />
        <div className="relative w-16 h-14 rounded-lg overflow-hidden shrink-0 shadow-xs bg-surface-container-high">
          {prop.images && prop.images[0] ? (
            <img
              src={prop.images[0]}
              alt={displayTitle}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-surface-container text-outline">
              <span className="material-symbols-outlined text-[20px]">villa</span>
            </div>
          )}
          <span className="absolute bottom-0.5 end-0.5 bg-surface/90 backdrop-blur-sm text-[9px] font-bold px-1 rounded text-primary">
            #{prop.id.slice(0, 5)}
          </span>
        </div>

        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="font-title-sm text-sm font-bold text-on-surface truncate">
              {displayTitle}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              {isApproved ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-status-emerald/15 text-status-emerald shrink-0">
                  ● {t("Published", "منشور")}
                </span>
              ) : isPending ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-status-sand/20 text-status-sand shrink-0">
                  ⏳ {t("Review", "مراجعة")}
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-status-terracotta/15 text-status-terracotta shrink-0">
                  ✕ {t("Rejected", "مرفوض")}
                </span>
              )}
              {prop.pending_deletion_request?.status === "pending" && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
                  {t("Removal Req", "طلب حذف")}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-on-surface-variant truncate mt-0.5">
            <span className="flex items-center gap-0.5 truncate">
              <span className="material-symbols-outlined text-[13px] text-outline shrink-0">location_on</span>
              <span className="truncate">{locationLabel}</span>
            </span>
            <span className="text-outline-variant">•</span>
            <span className="capitalize">{prop.category || "—"}</span>
          </div>

          <div className="flex items-center gap-2 mt-1 text-[11px] text-outline flex-wrap">
            <span className="font-mono font-black text-primary bg-primary/10 px-1.5 py-0.2 rounded">
              Unit #{getNumericUnitCode(prop.id)}
            </span>
            <span>•</span>
            <span className="font-mono">ID: {prop.id.slice(0, 8)}…</span>
            {prop.tourism_license_number && (
              <>
                <span>•</span>
                <span className="font-mono text-on-surface-variant">Lic: {prop.tourism_license_number}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Middle Row: Host Info Card */}
      <div className="p-2.5 rounded-lg bg-surface-container-low/70 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase shrink-0 border border-primary/20">
            {(prop.host_name || prop.host_id || "H").slice(0, 2)}
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-on-surface truncate">
                {hostLabel}
              </span>
              {isApproved && prop.tourism_license_number && (
                <span className="material-symbols-outlined text-[13px] text-status-emerald shrink-0">
                  verified
                </span>
              )}
            </div>
            <span className="text-[11px] text-outline font-mono truncate">
              {prop.host_phone || prop.host_email || "—"}
            </span>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-primary/10 text-primary border border-primary/15 shrink-0">
          <span className="material-symbols-outlined text-[12px]">apartment</span>
          <span>
            {hostCount}{" "}
            {hostCount === 1
              ? t("Property", "عقار واحد")
              : t("Properties", `${hostCount} عقارات`)}
          </span>
        </span>
      </div>

      {/* Bottom Row: Nightly Rate, Instant Book & Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
        <div className="flex items-center gap-3">
          <div>
            <span className="text-sm font-bold text-on-surface">
              SAR {Number(prop.base_price ?? 0).toLocaleString()}
            </span>
            <span className="text-[10px] text-outline uppercase ms-1">
              /{t("night", "ليلة")}
            </span>
          </div>
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => updatePropertyStatus(prop.id, isApproved ? "rejected" : "approved")}
              className={`relative inline-flex h-4 w-7 flex-shrink-0 cursor-pointer rounded-full p-0.5 transition-colors focus:outline-none ${
                isApproved ? "bg-status-emerald" : "bg-outline-variant"
              }`}
              aria-label="Toggle instant book"
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

        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onSelectProperty?.(prop)}
            className="h-8 px-3 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/15 text-primary font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
          >
            <span className="material-symbols-outlined text-[15px]">visibility</span>
            <span>{t("View", "عرض")}</span>
          </button>

          {isPending ? (
            <button
              type="button"
              onClick={() => updatePropertyStatus(prop.id, "approved")}
              className="h-8 px-2.5 rounded-lg text-status-emerald hover:bg-status-emerald/10 border border-status-emerald/20 flex items-center gap-1 text-xs font-bold transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">fact_check</span>
              <span>{t("Approve", "قبول")}</span>
            </button>
          ) : isApproved ? (
            <button
              type="button"
              onClick={() =>
                onRequestReject
                  ? onRequestReject(prop)
                  : updatePropertyStatus(prop.id, "rejected")
              }
              className="h-8 px-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-status-sand border border-outline/20 flex items-center gap-1 text-xs font-bold transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">pause</span>
              <span>{t("Pause", "إيقاف")}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => updatePropertyStatus(prop.id, "approved")}
              className="h-8 px-2.5 rounded-lg text-primary hover:bg-primary/10 border border-primary/20 flex items-center gap-1 text-xs font-bold transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">restart_alt</span>
              <span>{t("Reactivate", "تفعيل")}</span>
            </button>
          )}

          <a
            href={`/properties/${prop.id}`}
            target="_blank"
            rel="noreferrer"
            className="w-8 h-8 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-primary flex items-center justify-center transition-colors border border-outline/20 cursor-pointer"
            title="Open Full Page Preview"
          >
            <span className="material-symbols-outlined text-[16px]">open_in_new</span>
          </a>
        </div>
      </div>
    </div>
  );
}

