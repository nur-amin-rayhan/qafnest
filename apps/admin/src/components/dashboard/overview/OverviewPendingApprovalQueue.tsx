"use client";

import React from "react";
import { PropertyItem } from "../types";

interface OverviewPendingApprovalQueueProps {
  properties: PropertyItem[];
  updatePropertyStatus: (
    id: string,
    status: "approved" | "rejected" | "pending",
    feedback?: string
  ) => void | Promise<void>;
  onSelectProperty?: (property: PropertyItem) => void;
  onRequestReject?: (property: PropertyItem) => void;
  t: (en: string, ar: string) => string;
}

export function OverviewPendingApprovalQueue({
  properties,
  updatePropertyStatus,
  onSelectProperty,
  onRequestReject,
  t,
}: OverviewPendingApprovalQueueProps) {
  const pendingProperties = properties.filter(
    (p) => p.status === "pending" || !p.is_approved
  );

  return (
    <div className="xl:col-span-5 flex flex-col rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-space-md">
        <div>
          <span className="font-label-sm text-primary uppercase font-bold tracking-wider">
            {t("Approval Queue", "قائمة المراجعة والاعتماد")}
          </span>
          <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
            {t("Pending Host Properties", "عقارات المضيفين المعلقة")}
          </h2>
        </div>
        <span className="px-2.5 py-1 rounded bg-surface-container-low font-label-sm text-on-surface-variant font-bold shrink-0">
          {t("Action Required", "يتطلب إجراء")}
        </span>
      </div>

      <div className="flex flex-col gap-space-md overflow-y-auto max-h-[360px]">
        {pendingProperties.length === 0 ? (
          <div className="py-12 text-center text-xs font-bold text-status-emerald bg-status-emerald/5 rounded-xl border border-status-emerald/20">
            {t("✓ All properties reviewed & approved", "✓ تم مراجعة واعتماد جميع العقارات")}
          </div>
        ) : (
          pendingProperties.map((prop) => (
            <div
              key={prop.id}
              className="rounded-xl border border-surface-container p-3.5 bg-surface-container-lowest hover:bg-surface-desert-sand/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs group"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-status-sand/20 text-status-sand uppercase">
                    {t("Pending", "معلق")}
                  </span>
                  <span className="text-[11px] text-outline truncate">
                    {t("Lic", "ترخيص")}: {prop.tourism_license_number || t("MOT-Pending", "قيد الترخيص")}
                  </span>
                </div>
                <h4 className="font-title-sm text-title-sm font-bold text-on-surface truncate mt-1 group-hover:text-primary transition-colors">
                  {prop.title}
                </h4>
                <p className="text-[11px] text-on-surface-variant flex items-center gap-1.5 flex-wrap">
                  {prop.host_name || prop.host_id ? (
                    <span className="font-semibold text-primary inline-flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[13px]">person</span>
                      <span>{prop.host_name || prop.host_id}</span>
                      <span>·</span>
                    </span>
                  ) : null}
                  <span>
                    {prop.city_name || prop.city || "—"} · {prop.category_name || prop.category || "—"} · {Number(prop.base_price ?? 0).toLocaleString()} {t("SAR/night", "ر.س/ليلة")}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap shrink-0">
                <button
                  type="button"
                  onClick={() => onSelectProperty?.(prop)}
                  className="h-8 px-3 rounded-lg border border-surface-container bg-surface-container-low hover:bg-surface-container text-primary font-bold text-xs cursor-pointer flex items-center gap-1 transition-colors"
                  title={t("View Full Details", "عرض التفاصيل الكاملة")}
                >
                  <span className="material-symbols-outlined text-[16px]">visibility</span>
                  <span>{t("Details", "التفاصيل")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => updatePropertyStatus(prop.id, "approved")}
                  className="h-8 px-3 rounded-lg bg-status-emerald hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center"
                >
                  {t("Approve", "اعتماد")}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onRequestReject
                      ? onRequestReject(prop)
                      : updatePropertyStatus(prop.id, "rejected")
                  }
                  className="h-8 px-3 rounded-lg border border-error/30 bg-error/10 hover:bg-error/20 text-error font-bold text-xs transition-colors cursor-pointer flex items-center justify-center"
                >
                  {t("Reject", "رفض")}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
