"use client";

import React, { useMemo } from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { PropertyItem, type AdminPropertyDeletionRequest } from "./types";
import { PropertyTableRow } from "./properties/PropertyTableRow";
import { PropertyMobileCard } from "./properties/PropertyMobileCard";
import { PropertyFiltersBar } from "./properties/PropertyFiltersBar";
import { PropertiesStatsStrip } from "./properties/PropertiesStatsStrip";
import { PropertiesHeaderActions } from "./properties/PropertiesHeaderActions";
import { PropertiesInsightsStrip } from "./properties/PropertiesInsightsStrip";
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

  // Track total properties for each host across the portfolio
  const hostPropertyCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of properties) {
      const key = (p.host_id || p.host_name || "unknown").trim();
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }, [properties]);

  return (
    <div dir={dir} className="flex flex-col w-full space-y-6">
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

      {/* 1. Top Stats & Performance Summary Strip */}
      <PropertiesStatsStrip properties={properties} />

      {/* 2. Header Section with Inventory Controls & Batch Actions */}
      <PropertiesHeaderActions
        selectedPropertyIds={selectedPropertyIds}
        showBatchMenu={showBatchMenu}
        setShowBatchMenu={setShowBatchMenu}
        handleBulkPublish={handleBulkPublish}
        handleBulkSuspend={handleBulkSuspend}
        setSelectedPropertyIds={setSelectedPropertyIds}
        triggerToast={triggerToast}
      />

      {/* 3. Primary Filter Tabs Bar & Search Canvas */}
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
      <div className="w-full overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm mb-space-lg border border-surface-container/60">
        {/* Table Toolbar */}
        <div className="px-4 sm:px-6 py-3 bg-surface-container-low flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-surface-container/60">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={
                  filteredProperties.length > 0 &&
                  selectedPropertyIds.length === filteredProperties.length
                }
                onChange={selectAllProps}
                className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary-container cursor-pointer"
              />
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
                {t("Select All On Page", "تحديد الكل في الصفحة")}
              </span>
            </label>
            <span className="text-outline-variant font-label-sm">|</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              {t("Showing", "عرض")}{" "}
              <span className="font-semibold text-on-surface">{filteredProperties.length}</span>{" "}
              {t("of", "من")} {properties.length} {t("total", "إجمالي")}
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="font-label-sm text-label-sm text-outline">{t("Sort by:", "ترتيب:")}</span>
            <button
              type="button"
              className="flex items-center gap-1 font-title-sm text-title-sm text-on-surface font-semibold hover:text-primary transition-colors cursor-pointer"
            >
              <span>{t("Date Added", "تاريخ الإضافة")}</span>
              <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
            </button>
          </div>
        </div>

        {/* Desktop Table View (xl+) */}
        <div className="hidden xl:block w-full overflow-x-auto">
          <table className="table-fixed w-full min-w-[920px] border-collapse text-start">
            <colgroup>
              <col style={{ width: "33%" }} />
              <col style={{ width: "24%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "16%" }} />
            </colgroup>
            <thead>
              <tr className="bg-surface-container-low font-label-sm text-label-sm uppercase tracking-wider text-outline select-none border-b border-surface-container/60">
                <th className="py-3 px-4 text-start font-semibold">
                  <div className="flex items-center gap-2">
                    <span>{t("Property & Details", "العقار والتفاصيل")}</span>
                  </div>
                </th>
                <th className="py-3 px-4 text-start font-semibold">
                  {t("Host & Portfolio", "المضيف والمحفظة")}
                </th>
                <th className="py-3 px-4 text-start font-semibold">
                  {t("Rate & Instant", "السعر والحجز الفوري")}
                </th>
                <th className="py-3 px-4 text-center font-semibold">
                  {t("Status", "الحالة")}
                </th>
                <th className="py-3 px-4 text-end font-semibold">
                  {t("Actions", "الإجراءات")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container/60 text-on-surface font-body-md text-body-md">
              {filteredProperties.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-outline">
                    {t("No properties match your filter criteria.", "لا توجد عقارات تطابق معايير التصفية المحددة.")}
                  </td>
                </tr>
              ) : (
                filteredProperties.map((prop) => (
                  <PropertyTableRow
                    key={prop.id}
                    prop={prop}
                    selectedPropertyIds={selectedPropertyIds}
                    togglePropSelection={togglePropSelection}
                    hostPropertyCounts={hostPropertyCounts}
                    updatePropertyStatus={updatePropertyStatus}
                    onSelectProperty={onSelectProperty}
                    onRequestReject={onRequestReject}
                    t={t}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile & Tablet Card Layout (< xl) */}
        <div className="block xl:hidden w-full divide-y divide-surface-container/60">
          {filteredProperties.length === 0 ? (
            <div className="py-12 text-center text-outline">
              {t("No properties match your filter criteria.", "لا توجد عقارات تطابق معايير التصفية المحددة.")}
            </div>
          ) : (
            filteredProperties.map((prop) => (
              <PropertyMobileCard
                key={prop.id}
                prop={prop}
                selectedPropertyIds={selectedPropertyIds}
                togglePropSelection={togglePropSelection}
                hostPropertyCounts={hostPropertyCounts}
                updatePropertyStatus={updatePropertyStatus}
                onSelectProperty={onSelectProperty}
                onRequestReject={onRequestReject}
                t={t}
              />
            ))
          )}
        </div>

        {/* Table Footer */}
        <div className="px-4 sm:px-6 py-3 bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-surface-container/60">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              {t("Rows per page:", "عدد الصفوف:")}
            </span>
            <select
              className="h-8 px-2 bg-surface-container-lowest rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 cursor-pointer"
              aria-label="Rows per page"
            >
              <option>10</option>
              <option>25</option>
              <option>50</option>
            </select>
            <span className="text-outline font-body-sm text-body-sm">
              {t("Showing", "عرض")} {filteredProperties.length} {t("of", "من")} {properties.length} {t("total properties", "عقار")}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              className="h-8 w-8 rounded-lg bg-primary-container text-on-primary font-title-sm text-title-sm font-semibold flex items-center justify-center shadow-sm cursor-pointer"
            >
              1
            </button>
            {filteredProperties.length > 10 && (
              <button
                type="button"
                className="h-8 w-8 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container font-title-sm text-title-sm flex items-center justify-center transition-colors cursor-pointer"
              >
                2
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5. Operational Insights & Region Distribution Strip */}
      <PropertiesInsightsStrip properties={properties} triggerToast={triggerToast} />
    </div>
  );
}
