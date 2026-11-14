"use client";

import React from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { ECOSYSTEM_URLS } from "@qafnest/shared";

interface PropertiesHeaderActionsProps {
  selectedPropertyIds: string[];
  showBatchMenu: boolean;
  setShowBatchMenu: (show: boolean) => void;
  handleBulkPublish: () => void;
  handleBulkSuspend: () => void;
  setSelectedPropertyIds: (ids: string[]) => void;
  triggerToast: (msg: string) => void;
}

export function PropertiesHeaderActions({
  selectedPropertyIds,
  showBatchMenu,
  setShowBatchMenu,
  handleBulkPublish,
  handleBulkSuspend,
  setSelectedPropertyIds,
  triggerToast,
}: PropertiesHeaderActionsProps) {
  const { dir, t } = useAdminAuth();

  return (
    <div dir={dir} className="flex flex-col md:flex-row md:items-center justify-between gap-space-md mb-space-lg">
      <div>
        <div className="flex items-center gap-space-xs mb-1">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-bold">
            {t("Inventory Management", "إدارة المخزون العقاري")}
          </span>
          <span className="text-outline">•</span>
          <span className="font-label-sm text-label-sm text-outline">
            {t("QafNest Kingdom Network", "شبكة قاف نست بالمملكة")}
          </span>
        </div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface">
          {t("Properties & Listings", "العقارات والوحدات المدرجة")}
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
          {t(
            "Manage all luxury chalets, private estates, desert retreats, and serviced apartments listed across Saudi Arabia.",
            "إدارة جميع الشاليهات الفاخرة والفلل الخاصة والمخيمات الصحراوية والشقق المخدومة في مختلف مدن المملكة."
          )}
        </p>
      </div>

      {/* Top Action Group */}
      <div className="flex items-center gap-space-sm flex-wrap">
        {/* Batch Actions Dropdown */}
        <div className="relative inline-block text-start">
          <button
            type="button"
            onClick={() => setShowBatchMenu(!showBatchMenu)}
            className="h-10 px-4 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface font-title-sm text-title-sm shadow-sm flex items-center gap-2 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] text-outline">check_box</span>
            <span>{t(`Batch Actions (${selectedPropertyIds.length})`, `إجراءات جماعية (${selectedPropertyIds.length})`)}</span>
            <span className="material-symbols-outlined text-[18px] text-outline">expand_more</span>
          </button>

          {showBatchMenu && (
            <div className="absolute end-0 mt-2 w-56 rounded-xl bg-surface-container-lowest shadow-xl z-30 py-2 border border-surface-container">
              <div className="px-3 py-1 font-label-sm text-label-sm uppercase text-outline">
                {t(`Selected Items (${selectedPropertyIds.length})`, `العناصر المحددة (${selectedPropertyIds.length})`)}
              </div>
              <button
                type="button"
                onClick={handleBulkPublish}
                className="w-full text-start px-4 py-2 font-body-sm text-body-sm text-on-surface hover:bg-surface-container flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] text-status-emerald">publish</span>
                <span>{t("Bulk Publish & Approve", "نشر واعتماد المحدد")}</span>
              </button>
              <button
                type="button"
                onClick={handleBulkSuspend}
                className="w-full text-start px-4 py-2 font-body-sm text-body-sm text-on-surface hover:bg-surface-container flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] text-status-sand">pause_circle</span>
                <span>{t("Suspend Listings", "إيقاف الوحدات المحددة")}</span>
              </button>
              <div className="my-1 h-px bg-surface-container-high" />
              <button
                type="button"
                onClick={() => {
                  setSelectedPropertyIds([]);
                  setShowBatchMenu(false);
                }}
                className="w-full text-start px-4 py-2 font-body-sm text-body-sm text-outline hover:bg-surface-container flex items-center gap-2 cursor-pointer"
              >
                {t("Clear Selection", "إلغاء التحديد")}
              </button>
            </div>
          )}
        </div>

        {/* Export CSV */}
        <button
          type="button"
          onClick={() => triggerToast(t("Generating Properties CSV...", "جاري تصدير ملف العقارات CSV..."))}
          className="h-10 px-3.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface font-title-sm text-title-sm shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px] text-outline">ios_share</span>
          <span>{t("Export", "تصدير")}</span>
        </button>

        {/* Add New Listing Button */}
        <a
          href={`${ECOSYSTEM_URLS.host}/properties/new`}
          target="_blank"
          rel="noreferrer"
          className="h-10 px-5 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-title-sm text-title-sm shadow-md flex items-center gap-2 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">add_circle</span>
          <span>{t("Add New Listing", "إضافة عقار جديد")}</span>
        </a>
      </div>
    </div>
  );
}
