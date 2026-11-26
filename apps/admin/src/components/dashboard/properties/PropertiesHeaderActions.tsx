"use client";

import React from "react";
import { CheckSquare, ChevronDown, Download, Plus, CheckCircle, PauseCircle, X } from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { ECOSYSTEM_URLS } from "@qafnest/shared";
import { sanitizeCsvCell } from "@qafnest/shared/escapeHtml";
import type { PropertyItem } from "../types";

interface PropertiesHeaderActionsProps {
  properties?: PropertyItem[];
  selectedPropertyIds: string[];
  showBatchMenu: boolean;
  setShowBatchMenu: (show: boolean) => void;
  handleBulkPublish: () => void;
  handleBulkSuspend: () => void;
  setSelectedPropertyIds: (ids: string[]) => void;
  triggerToast: (msg: string) => void;
}

export function PropertiesHeaderActions({
  properties = [],
  selectedPropertyIds,
  showBatchMenu,
  setShowBatchMenu,
  handleBulkPublish,
  handleBulkSuspend,
  setSelectedPropertyIds,
  triggerToast,
}: PropertiesHeaderActionsProps) {
  const { dir, t } = useAdminAuth();
  const selectedCount = selectedPropertyIds.length;

  const handleExportCsv = () => {
    const sourceRows =
      selectedPropertyIds.length > 0
        ? properties.filter((p) => selectedPropertyIds.includes(p.id))
        : properties;
    if (sourceRows.length === 0) {
      triggerToast(t("No matching properties to export.", "لا توجد عقارات مطابقة للتصدير."));
      return;
    }
    const headers = [
      "ID",
      "Title",
      "City",
      "Category",
      "Status",
      "Approved",
      "Base_Price_SAR",
      "Weekend_Price_SAR",
      "Host_Name",
      "Tourism_License",
      "Host_ID",
    ];
    const rows = sourceRows.map((p) => [
      sanitizeCsvCell(p.id),
      sanitizeCsvCell(p.title),
      sanitizeCsvCell(p.city_name || p.city),
      sanitizeCsvCell(p.category),
      sanitizeCsvCell(p.status),
      sanitizeCsvCell(String(Boolean(p.is_approved))),
      Number(p.base_price || 0).toFixed(2),
      Number(p.weekend_price || p.base_price || 0).toFixed(2),
      sanitizeCsvCell(p.host_name || ""),
      sanitizeCsvCell(p.tourism_license_number || ""),
      sanitizeCsvCell(p.host_id || ""),
    ]);
    const csv = [headers.map(sanitizeCsvCell).join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `qafnest-properties-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    triggerToast(
      t(
        `Exported ${sourceRows.length} properties to CSV.`,
        `تم تصدير ${sourceRows.length} عقار إلى ملف CSV.`
      )
    );
  };

  return (
    <div
      dir={dir}
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
    >
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
          {t("Properties & units", "العقارات والوحدات")}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {t(
            "Manage licensed chalets, private villas, and serviced estates across Saudi Arabia.",
            "إدارة الشاليهات والفلل الخاصة والشقق المخدومة المعتمدة في المملكة."
          )}
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2.5 flex-wrap">
        {/* Batch actions dropdown */}
        <div className="relative inline-block text-start">
          <button
            type="button"
            onClick={() => setShowBatchMenu(!showBatchMenu)}
            disabled={selectedCount === 0}
            className={`h-9 px-3 rounded-lg border text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer ${
              selectedCount > 0
                ? "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs"
                : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed"
            }`}
          >
            <CheckSquare size={15} strokeWidth={1.5} className="shrink-0" />
            <span>
              {t("Batch actions", "إجراءات جماعية")}
              {selectedCount > 0 && ` (${selectedCount})`}
            </span>
            <ChevronDown size={14} strokeWidth={1.5} className="shrink-0 text-slate-400 dark:text-slate-500" />
          </button>

          {showBatchMenu && selectedCount > 0 && (
            <div className="absolute end-0 mt-1.5 w-52 rounded-xl bg-white dark:bg-slate-900 shadow-lg border border-slate-200 dark:border-slate-800 py-1.5 z-30">
              <div className="px-3 py-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                {t(`Selected (${selectedCount})`, `المحدد (${selectedCount})`)}
              </div>
              <button
                type="button"
                onClick={handleBulkPublish}
                className="w-full text-start px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <CheckCircle size={15} strokeWidth={1.5} className="text-emerald-600 dark:text-emerald-400" />
                <span>{t("Publish & approve", "نشر واعتماد")}</span>
              </button>
              <button
                type="button"
                onClick={handleBulkSuspend}
                className="w-full text-start px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <PauseCircle size={15} strokeWidth={1.5} className="text-amber-600 dark:text-amber-400" />
                <span>{t("Suspend selected", "إيقاف المحدد")}</span>
              </button>
              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
              <button
                type="button"
                onClick={() => {
                  setSelectedPropertyIds([]);
                  setShowBatchMenu(false);
                }}
                className="w-full text-start px-3 py-1.5 text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <X size={14} strokeWidth={1.5} />
                <span>{t("Clear selection", "إلغاء التحديد")}</span>
              </button>
            </div>
          )}
        </div>

        {/* Export CSV */}
        <button
          type="button"
          onClick={handleExportCsv}
          className="h-9 px-3 rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
        >
          <Download size={15} strokeWidth={1.5} className="text-slate-500 dark:text-slate-400" />
          <span>{t("Export", "تصدير")}</span>
        </button>

        {/* Add listing button */}
        <a
          href={`${ECOSYSTEM_URLS.host}/properties/new`}
          target="_blank"
          rel="noreferrer"
          className="h-9 px-3.5 rounded-lg bg-[#4F2396] hover:bg-[#3d1a75] text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
        >
          <Plus size={16} strokeWidth={1.75} />
          <span>{t("Add listing", "إضافة عقار")}</span>
        </a>
      </div>
    </div>
  );
}
