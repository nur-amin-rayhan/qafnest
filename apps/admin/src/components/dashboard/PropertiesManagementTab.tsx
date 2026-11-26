"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowDown, Building2, ChevronLeft, ChevronRight } from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { PropertyItem, type AdminPropertyDeletionRequest } from "./types";
import { PropertyTableRow } from "./properties/PropertyTableRow";
import { PropertyMobileCard } from "./properties/PropertyMobileCard";
import { PropertyFiltersBar } from "./properties/PropertyFiltersBar";
import { PropertiesStatsStrip } from "./properties/PropertiesStatsStrip";
import { PropertiesHeaderActions } from "./properties/PropertiesHeaderActions";
import { PropertyDeletionRequestsPanel } from "./properties/PropertyDeletionRequestsPanel";

interface PropertiesManagementTabProps {
  properties: PropertyItem[];
  filteredProperties: PropertyItem[];
  propertyStatusFilter: "all" | "approved" | "pending" | "rejected";
  setPropertyStatusFilter: (status: "all" | "approved" | "pending" | "rejected") => void;
  propertyCityFilter: string;
  setPropertyCityFilter: (city: string) => void;
  propertyTypeFilter: string;
  setPropertyTypeFilter: (type: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedPropertyIds: string[];
  togglePropSelection: (id: string) => void;
  selectAllProps: () => void;
  showBatchMenu: boolean;
  setShowBatchMenu: (show: boolean) => void;
  handleBulkPublish: () => void;
  handleBulkSuspend: () => void;
  setSelectedPropertyIds: (ids: string[]) => void;
  updatePropertyStatus: (
    id: string,
    status: "approved" | "rejected" | "pending",
    feedback?: string
  ) => void | Promise<void>;
  triggerToast: (msg: string) => void;
  onSelectProperty?: (property: PropertyItem) => void;
  onRequestReject?: (property: PropertyItem) => void;
  deletionRequests?: AdminPropertyDeletionRequest[];
  onReviewDeletionRequest?: (params: {
    requestId: string;
    action: "approve" | "reject";
    adminNotes?: string;
  }) => Promise<{ ok: boolean; error?: string }>;
}

export function PropertiesManagementTab({
  properties,
  filteredProperties,
  propertyStatusFilter,
  setPropertyStatusFilter,
  propertyCityFilter,
  setPropertyCityFilter,
  propertyTypeFilter,
  setPropertyTypeFilter,
  searchQuery,
  setSearchQuery,
  selectedPropertyIds,
  togglePropSelection,
  selectAllProps,
  showBatchMenu,
  setShowBatchMenu,
  handleBulkPublish,
  handleBulkSuspend,
  setSelectedPropertyIds,
  updatePropertyStatus,
  triggerToast,
  onSelectProperty,
  onRequestReject,
  deletionRequests = [],
  onReviewDeletionRequest,
}: PropertiesManagementTabProps) {
  const { dir, t } = useAdminAuth();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalPages = Math.max(1, Math.ceil(filteredProperties.length / pageSize));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    setPage(1);
  }, [filteredProperties.length, pageSize]);

  const paginatedProperties = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredProperties.slice(start, start + pageSize);
  }, [filteredProperties, safePage, pageSize]);

  // Track total properties for each host across the portfolio
  const hostPropertyCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of properties) {
      const key = (p.host_id || p.host_name || "unknown").trim();
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }, [properties]);

  const isAllSelected =
    filteredProperties.length > 0 && selectedPropertyIds.length === filteredProperties.length;

  return (
    <div dir={dir} className="flex flex-col w-full">
      {onReviewDeletionRequest && (
        <PropertyDeletionRequestsPanel
          requests={deletionRequests}
          onReviewDeletionRequest={onReviewDeletionRequest}
          onInspectProperty={(propertyId) => {
            const match = properties.find((p) => p.id === propertyId);
            if (match) onSelectProperty?.(match);
          }}
        />
      )}

      {/* 1. Key Metrics Strip */}
      <PropertiesStatsStrip properties={properties} />

      {/* 2. Header with Operations & Batch Controls */}
      <PropertiesHeaderActions
        properties={filteredProperties}
        selectedPropertyIds={selectedPropertyIds}
        showBatchMenu={showBatchMenu}
        setShowBatchMenu={setShowBatchMenu}
        handleBulkPublish={handleBulkPublish}
        handleBulkSuspend={handleBulkSuspend}
        setSelectedPropertyIds={setSelectedPropertyIds}
        triggerToast={triggerToast}
      />

      {/* 3. Filter Controls & Search */}
      <PropertyFiltersBar
        properties={properties}
        propertyStatusFilter={propertyStatusFilter}
        setPropertyStatusFilter={setPropertyStatusFilter}
        propertyCityFilter={propertyCityFilter}
        setPropertyCityFilter={setPropertyCityFilter}
        propertyTypeFilter={propertyTypeFilter}
        setPropertyTypeFilter={setPropertyTypeFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* 4. Listings Table Card */}
      <div className="w-full overflow-hidden rounded-xl bg-white dark:bg-[#0E0D16] shadow-xs border border-slate-200/90 dark:border-slate-800 mb-6">
        {/* Table Toolbar */}
        <div className="px-4 py-2.5 bg-slate-50/75 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400">
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={selectAllProps}
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-[#4F2396] focus:ring-[#4F2396] accent-[#4F2396] cursor-pointer"
              />
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {t("Select all on page", "تحديد الكل في الصفحة")}
              </span>
            </label>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span className="text-slate-500 dark:text-slate-400">
              {t("Showing", "عرض")}{" "}
              <span className="font-medium text-slate-800 dark:text-slate-200 font-mono tabular-nums">
                {filteredProperties.length}
              </span>{" "}
              {t("of", "من")}{" "}
              <span className="font-mono tabular-nums">{properties.length}</span>{" "}
              {t("total units", "إجمالي الوحدات")}
            </span>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto text-xs text-slate-500 dark:text-slate-400">
            <span>{t("Sort by:", "ترتيب:")}</span>
            <button
              type="button"
              className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
            >
              <span>{t("Date added", "تاريخ الإضافة")}</span>
              <ArrowDown size={13} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Desktop Table View (lg+) */}
        <div className="hidden lg:block w-full overflow-x-auto">
          <table className="table-fixed w-full min-w-[880px] border-collapse text-start">
            <colgroup>
              <col style={{ width: "34%" }} />
              <col style={{ width: "23%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "15%" }} />
            </colgroup>
            <thead>
              <tr className="bg-slate-50/60 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-medium text-slate-500 dark:text-slate-400 select-none">
                <th className="py-2.5 px-4 text-start font-medium">
                  {t("Property & details", "العقار والتفاصيل")}
                </th>
                <th className="py-2.5 px-4 text-start font-medium">
                  {t("Host & portfolio", "المضيف والمحفظة")}
                </th>
                <th className="py-2.5 px-4 text-start font-medium">
                  {t("Rate & booking", "السعر ونوع الحجز")}
                </th>
                <th className="py-2.5 px-4 text-center font-medium">
                  {t("Status", "الحالة")}
                </th>
                <th className="py-2.5 px-4 text-end font-medium">
                  {t("Actions", "الإجراءات")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200 text-xs">
              {filteredProperties.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-14 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                      <Building2 size={28} strokeWidth={1.25} className="text-slate-300 dark:text-slate-600" />
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {t(
                          "No properties match your filter criteria.",
                          "لا توجد عقارات تطابق معايير التصفية المحددة."
                        )}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedProperties.map((prop) => (
                  <PropertyTableRow
                    key={prop.id}
                    prop={prop}
                    selectedPropertyIds={selectedPropertyIds}
                    togglePropSelection={togglePropSelection}
                    hostPropertyCounts={hostPropertyCounts}
                    updatePropertyStatus={updatePropertyStatus}
                    onSelectProperty={onSelectProperty}
                    onRequestReject={onRequestReject}
                    onReviewDeletionRequest={onReviewDeletionRequest}
                    t={t}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile & Tablet Card Layout (< lg) */}
        <div className="block lg:hidden w-full divide-y divide-slate-100">
          {filteredProperties.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              {t(
                "No properties match your filter criteria.",
                "لا توجد عقارات تطابق معايير التصفية المحددة."
              )}
            </div>
          ) : (
            paginatedProperties.map((prop) => (
              <PropertyMobileCard
                key={prop.id}
                prop={prop}
                selectedPropertyIds={selectedPropertyIds}
                togglePropSelection={togglePropSelection}
                hostPropertyCounts={hostPropertyCounts}
                updatePropertyStatus={updatePropertyStatus}
                onSelectProperty={onSelectProperty}
                onRequestReject={onRequestReject}
                onReviewDeletionRequest={onReviewDeletionRequest}
                t={t}
              />
            ))
          )}
        </div>

        {/* Table Footer / Pagination */}
        <div className="px-4 py-2.5 bg-slate-50/75 dark:bg-slate-900/60 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span>{t("Rows per page:", "عدد الصفوف:")}</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value) || 10);
                setPage(1);
              }}
              className="h-7 px-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#4F2396] cursor-pointer"
              aria-label="Rows per page"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span className="ms-1 text-slate-400 dark:text-slate-500 font-mono tabular-nums">
              ({paginatedProperties.length} {t("shown", "معروض")})
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-7 px-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 text-xs flex items-center justify-center transition-colors cursor-pointer"
            >
              {dir === "rtl" ? (
                <ChevronRight size={14} strokeWidth={1.5} />
              ) : (
                <ChevronLeft size={14} strokeWidth={1.5} />
              )}
              <span className="ms-1">{t("Prev", "السابق")}</span>
            </button>

            {Array.from({ length: totalPages }, (_, idx) => idx + 1)
              .slice(Math.max(0, safePage - 3), Math.max(5, safePage + 2))
              .map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setPage(pageNum)}
                  className={`h-7 w-7 rounded text-xs font-mono tabular-nums flex items-center justify-center transition-colors cursor-pointer ${
                    pageNum === safePage
                      ? "bg-[#4F2396] text-white font-medium shadow-2xs"
                      : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                  }`}
                >
                  {pageNum}
                </button>
              ))}

            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="h-7 px-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 text-xs flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="me-1">{t("Next", "التالي")}</span>
              {dir === "rtl" ? (
                <ChevronLeft size={14} strokeWidth={1.5} />
              ) : (
                <ChevronRight size={14} strokeWidth={1.5} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
