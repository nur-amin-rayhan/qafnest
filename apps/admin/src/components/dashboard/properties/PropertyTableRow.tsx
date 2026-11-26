"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
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

interface PropertyTableRowProps {
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

export function PropertyTableRow({
  prop,
  selectedPropertyIds,
  togglePropSelection,
  hostPropertyCounts,
  updatePropertyStatus,
  onSelectProperty,
  onRequestReject,
  onReviewDeletionRequest,
  t,
}: PropertyTableRowProps) {
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
    <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group border-b border-slate-100 dark:border-slate-800">
      {/* 1. Property Details */}
      <td className="py-3 px-4 align-middle">
        <div className="flex items-center gap-3 min-w-0">
          <input
            type="checkbox"
            checked={selectedPropertyIds.includes(prop.id)}
            onChange={() => togglePropSelection(prop.id)}
            className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-[#4F2396] focus:ring-[#4F2396] accent-[#4F2396] cursor-pointer shrink-0"
            onClick={(e) => e.stopPropagation()}
            aria-label={`Select ${displayTitle}`}
          />

          <div className="relative w-12 h-11 rounded-md overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700">
            {prop.images && prop.images[0] ? (
              <img
                src={prop.images[0]}
                alt={displayTitle}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <Building2 size={18} strokeWidth={1.5} />
              </div>
            )}
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                {displayTitle}
              </span>
              <span className="text-[10px] font-mono tabular-nums text-slate-400 dark:text-slate-500 shrink-0">
                #{unitCode}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              <MapPin size={11} strokeWidth={1.5} className="text-slate-400 shrink-0" />
              <span className="truncate">{locationLabel}</span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="capitalize">{prop.category || "Chalet"}</span>
            </div>

            {prop.tourism_license_number && (
              <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                {t("Lic", "ترخيص")}: {prop.tourism_license_number}
              </div>
            )}
          </div>
        </div>
      </td>

      {/* 2. Host & Portfolio */}
      <td className="py-3 px-4 align-middle">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 text-xs font-medium uppercase shrink-0">
            {(prop.host_name || prop.host_id || "H").slice(0, 2)}
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">{hostLabel}</span>
              {isApproved && prop.tourism_license_number && (
                <span
                  title={t("Tourism license verified", "الترخيص السياحي موثق")}
                  className="inline-flex shrink-0"
                >
                  <CheckCircle2
                    size={12}
                    strokeWidth={2}
                    className="text-emerald-600 dark:text-emerald-400"
                  />
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono truncate">
              {prop.host_phone || prop.host_email || "—"}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono tabular-nums">
              {hostCount} {hostCount === 1 ? t("unit", "عقار") : t("units", "عقارات")}
            </span>
          </div>
        </div>
      </td>

      {/* 3. Nightly Rate & Booking Mode */}
      <td className="py-3 px-4 align-middle">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-baseline gap-1">
            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
              {Number(prop.base_price ?? 0).toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">{t("SAR / night", "ر.س / ليلة")}</span>
          </div>
          <span
            className={`inline-flex items-center w-fit text-[10px] font-medium px-1.5 py-0.2 rounded ${
              isApproved
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
            }`}
          >
            {isApproved ? t("Instant", "حجز فوري") : t("Request", "بالموافقة")}
          </span>
        </div>
      </td>

      {/* 4. Status Badge */}
      <td className="py-3 px-4 align-middle text-center">
        <div className="flex flex-col items-center gap-1">
          {isApproved ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>{t("Published", "منشور")}</span>
            </span>
          ) : isPending ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>{t("In review", "قيد المراجعة")}</span>
            </span>
          ) : (
            <div className="flex flex-col items-center gap-0.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span>{t("Suspended", "موقوف")}</span>
              </span>
              {prop.admin_feedback && (
                <span
                  className="text-[10px] text-rose-600 dark:text-rose-400 font-medium truncate max-w-[110px]"
                  title={prop.admin_feedback}
                >
                  {prop.admin_feedback}
                </span>
              )}
            </div>
          )}

          {prop.pending_deletion_request?.status === "pending" && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              {t("Removal req.", "طلب حذف")}
            </span>
          )}
        </div>
      </td>

      {/* 5. Actions */}
      <td className="py-3 px-4 align-middle text-end" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-1 flex-nowrap">
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
              className="h-7 px-2 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title={
                prop.pending_deletion_request.eligibleToDelete
                  ? t("Approve deletion", "الموافقة على الحذف")
                  : t("Active bookings block deletion", "توجد حجوزات تمنع الحذف")
              }
            >
              <Trash2 size={12} strokeWidth={1.5} />
              <span>{deletingReq ? t("Deleting...", "جاري الحذف...") : t("Delete", "حذف")}</span>
            </button>
          )}

          {/* View Details button */}
          <button
            type="button"
            onClick={() => onSelectProperty?.(prop)}
            className="h-7 px-2.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
            title={t("View details", "عرض التفاصيل")}
          >
            <Eye size={13} strokeWidth={1.5} />
            <span>{t("View", "عرض")}</span>
          </button>

          {/* Status action toggle */}
          {isPending ? (
            <button
              type="button"
              onClick={() => updatePropertyStatus(prop.id, "approved")}
              className="w-7 h-7 rounded-md border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center transition-colors cursor-pointer"
              title={t("Approve", "اعتماد")}
              aria-label="Approve property"
            >
              <Check size={14} strokeWidth={2} />
            </button>
          ) : isApproved ? (
            <button
              type="button"
              onClick={() =>
                onRequestReject
                  ? onRequestReject(prop)
                  : updatePropertyStatus(prop.id, "rejected")
              }
              className="w-7 h-7 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-amber-700 dark:hover:text-amber-300 flex items-center justify-center transition-colors cursor-pointer"
              title={t("Suspend", "إيقاف")}
              aria-label="Suspend property"
            >
              <Pause size={13} strokeWidth={1.5} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => updatePropertyStatus(prop.id, "approved")}
              className="w-7 h-7 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-[#4F2396] dark:hover:text-purple-300 flex items-center justify-center transition-colors cursor-pointer"
              title={t("Reactivate", "إعادة تفعيل")}
              aria-label="Reactivate property"
            >
              <RotateCcw size={13} strokeWidth={1.5} />
            </button>
          )}

          {/* External link */}
          <a
            href={`/properties/${prop.id}`}
            target="_blank"
            rel="noreferrer"
            className="w-7 h-7 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
            title={t("Open preview in new tab", "فتح المعاينة في صفحة مستقلة")}
          >
            <ExternalLink size={13} strokeWidth={1.5} />
          </a>
        </div>
      </td>
    </tr>
  );
}
