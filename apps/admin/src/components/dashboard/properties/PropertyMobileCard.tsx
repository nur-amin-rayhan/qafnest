"use client";

import React, { useState } from "react";
import {
  MapPin,
  Building2,
  Eye,
  Check,
  Pause,
  RotateCcw,
  ExternalLink,
  Trash2,
} from "lucide-react";
import {
  getNumericUnitCode,
  pickBilingualText,
  getLocalizedSaudiCity,
} from "@qafnest/shared";
import type { PropertyItem } from "../types";

interface PropertyMobileCardProps {
  prop: PropertyItem;
  selectedPropertyIds: string[];
  togglePropSelection: (id: string) => void;
  hostPropertyCounts: Record<string, number>;
  updatePropertyStatus: (
    id: string,
    status: "approved" | "pending" | "rejected"
  ) => void;
  onSelectProperty?: (prop: PropertyItem) => void;
  onRequestReject?: (prop: PropertyItem) => void;
  onReviewDeletionRequest?: (params: {
    requestId: string;
    action: "approve" | "reject";
    adminNotes?: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  t: (en: string, ar: string) => string;
}

export function PropertyMobileCard({
  prop,
  selectedPropertyIds,
  togglePropSelection,
  hostPropertyCounts,
  updatePropertyStatus,
  onSelectProperty,
  onRequestReject,
  onReviewDeletionRequest,
  t,
}: PropertyMobileCardProps) {
  const [deletingReq, setDeletingReq] = useState(false);
  const isApproved = prop.status === "approved" || prop.is_approved;
  const isPending = prop.status === "pending" || (!prop.is_approved && prop.status !== "rejected");
  const hostKey = (prop.host_id || prop.host_name || "unknown").trim();
  const hostCount = hostPropertyCounts[hostKey] || 1;
  const hostLabel =
    prop.host_name || (prop.host_id ? `Host #${prop.host_id.slice(0, 8)}` : t("Host", "مضيف"));
  const locale = t("en", "ar") as "en" | "ar";
  const displayTitle = pickBilingualText(locale, prop.title, prop.title_ar, prop.title);
  const displayDistrict = pickBilingualText(locale, prop.district, prop.district_ar);
  const displayCity =
    prop.city || prop.city_name ? getLocalizedSaudiCity(prop.city || prop.city_name, locale) : "";
  const locationLabel =
    displayDistrict && displayCity && displayDistrict.toLowerCase() !== displayCity.toLowerCase()
      ? `${displayDistrict} · ${displayCity}`
      : displayDistrict || displayCity || "—";
  const unitCode = getNumericUnitCode(prop.id);

  return (
    <div className="p-4 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors flex flex-col gap-3">
      {/* Top Header: Checkbox, thumbnail, title, status */}
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={selectedPropertyIds.includes(prop.id)}
          onChange={() => togglePropSelection(prop.id)}
          className="w-4 h-4 mt-0.5 rounded border-slate-300 dark:border-slate-600 text-[#4F2396] focus:ring-[#4F2396] accent-[#4F2396] cursor-pointer shrink-0"
          onClick={(e) => e.stopPropagation()}
          aria-label={`Select ${displayTitle}`}
        />

        <div className="relative w-14 h-12 rounded-md overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700">
          {prop.images && prop.images[0] ? (
            <img src={prop.images[0]} alt={displayTitle} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              <Building2 size={18} strokeWidth={1.5} />
            </div>
          )}
        </div>

        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
              {displayTitle}
            </span>
            <div className="shrink-0">
              {isApproved ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>{t("Published", "منشور")}</span>
                </span>
              ) : isPending ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>{t("In review", "قيد المراجعة")}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span>{t("Suspended", "موقوف")}</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            <MapPin size={11} strokeWidth={1.5} className="text-slate-400 shrink-0" />
            <span className="truncate">{locationLabel}</span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="capitalize">{prop.category || "Chalet"}</span>
          </div>

          <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 dark:text-slate-500 font-mono">
            <span>#{unitCode}</span>
            {prop.tourism_license_number && (
              <>
                <span>•</span>
                <span className="truncate">Lic: {prop.tourism_license_number}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Middle row: Host info & pricing */}
      <div className="bg-slate-50 dark:bg-slate-850 rounded-lg p-2.5 flex items-center justify-between text-xs border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 text-[10px] font-medium uppercase shrink-0">
            {(prop.host_name || prop.host_id || "H").slice(0, 2)}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">{hostLabel}</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
              {hostCount} {hostCount === 1 ? t("unit", "عقار") : t("units", "عقارات")}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end shrink-0">
          <div className="flex items-baseline gap-1 font-mono tabular-nums">
            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              {Number(prop.base_price ?? 0).toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">{t("SAR", "ر.س")}</span>
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">{t("/ night", "/ ليلة")}</span>
        </div>
      </div>

      {/* Bottom row: Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        {prop.pending_deletion_request?.status === "pending" && onReviewDeletionRequest && (
          <button
            type="button"
            disabled={deletingReq || !prop.pending_deletion_request.eligibleToDelete}
            onClick={async () => {
              const req = prop.pending_deletion_request;
              if (!req) return;
              if (
                !window.confirm(
                  t(
                    `Approve removal request and delete "${displayTitle}"?`,
                    `هل تريد الموافقة على طلب الحذف وحذف العقار "${displayTitle}"؟`
                  )
                )
              ) {
                return;
              }
              setDeletingReq(true);
              try {
                await onReviewDeletionRequest({
                  requestId: req.id,
                  action: "approve",
                });
              } finally {
                setDeletingReq(false);
              }
            }}
            className="h-8 px-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 size={13} strokeWidth={1.5} />
            <span>{deletingReq ? t("Deleting...", "جاري الحذف...") : t("Delete", "حذف")}</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => onSelectProperty?.(prop)}
          className="flex-1 h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
        >
          <Eye size={13} strokeWidth={1.5} />
          <span>{t("View details", "عرض التفاصيل")}</span>
        </button>

        {isPending ? (
          <button
            type="button"
            onClick={() => updatePropertyStatus(prop.id, "approved")}
            className="h-8 px-3 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Check size={14} strokeWidth={2} />
            <span>{t("Approve", "اعتماد")}</span>
          </button>
        ) : isApproved ? (
          <button
            type="button"
            onClick={() =>
              onRequestReject
                ? onRequestReject(prop)
                : updatePropertyStatus(prop.id, "rejected")
            }
            className="h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-amber-700 dark:hover:text-amber-300 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Pause size={13} strokeWidth={1.5} />
            <span>{t("Suspend", "إيقاف")}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => updatePropertyStatus(prop.id, "approved")}
            className="h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-[#4F2396] dark:hover:text-purple-300 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RotateCcw size={13} strokeWidth={1.5} />
            <span>{t("Reactivate", "تفعيل")}</span>
          </button>
        )}

        <a
          href={`/properties/${prop.id}`}
          target="_blank"
          rel="noreferrer"
          className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          title={t("Open preview in new tab", "فتح في صفحة مستقلة")}
        >
          <ExternalLink size={13} strokeWidth={1.5} />
        </a>
      </div>
    </div>
  );
}
