"use client";

import React from "react";
import { Eye, Check, X, User } from "lucide-react";
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
    (p) =>
      p.status === "pending" ||
      (!p.is_approved && p.status !== "rejected" && (p.status as string) !== "suspended")
  );

  return (
    <div className="xl:col-span-5 flex flex-col rounded-xl bg-white dark:bg-[#0E0D16] border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <span className="text-xs font-semibold text-[#4F2396] dark:text-purple-300 uppercase tracking-wider">
            {t("Approval Queue", "قائمة المراجعة والاعتماد")}
          </span>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
            {t("Pending Host Properties", "عقارات المضيفين المعلقة")}
          </h2>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 text-xs font-semibold shrink-0">
          {t("Action Required", "يتطلب إجراء")}
        </span>
      </div>

      <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[360px] mt-4">
        {pendingProperties.length === 0 ? (
          <div className="py-10 text-center text-sm font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/50">
            {t("✓ All properties reviewed & approved", "✓ تم مراجعة واعتماد جميع العقارات")}
          </div>
        ) : (
          pendingProperties.map((prop) => (
            <div
              key={prop.id}
              className="rounded-xl border border-slate-200/90 dark:border-slate-800 p-3.5 bg-white dark:bg-slate-900/40 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs group"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 uppercase">
                    {t("Pending", "معلق")}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 truncate">
                    {t("Lic", "ترخيص")}: {prop.tourism_license_number || t("MOT-Pending", "قيد الترخيص")}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate mt-1 group-hover:text-[#4F2396] dark:group-hover:text-purple-300 transition-colors">
                  {prop.title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap mt-0.5">
                  {prop.host_name || prop.host_id ? (
                    <span className="font-semibold text-[#4F2396] dark:text-purple-300 inline-flex items-center gap-1">
                      <User size={13} />
                      <span>{prop.host_name || prop.host_id}</span>
                      <span>·</span>
                    </span>
                  ) : null}
                  <span>
                    {prop.city_name || prop.city || "—"} · {prop.category_name || prop.category || "—"} ·{" "}
                    <span className="font-mono font-semibold tabular-nums">{Number(prop.base_price ?? 0).toLocaleString()}</span>{" "}
                    {t("SAR/night", "ر.س/ليلة")}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                <button
                  type="button"
                  onClick={() => onSelectProperty?.(prop)}
                  className="h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors shadow-2xs"
                  title={t("View Full Details", "عرض التفاصيل الكاملة")}
                >
                  <Eye size={14} />
                  <span>{t("Details", "التفاصيل")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => updatePropertyStatus(prop.id, "approved")}
                  className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Check size={14} />
                  <span>{t("Approve", "اعتماد")}</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onRequestReject
                      ? onRequestReject(prop)
                      : updatePropertyStatus(prop.id, "rejected")
                  }
                  className="h-8 px-3 rounded-lg border border-rose-200 dark:border-rose-800/50 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <X size={14} />
                  <span>{t("Reject", "رفض")}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
