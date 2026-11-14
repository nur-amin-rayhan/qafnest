"use client";

import React from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { AdminMetrics, PropertyItem, BookingItem, NavTab, SelectedBookingDetail } from "./types";
import type { PayoutReminderSummary, SharedHostPayoutRecord } from "@qafnest/shared";
import { OverviewMetricsStrip } from "./overview/OverviewMetricsStrip";
import { OverviewAnalyticalCharts } from "./overview/OverviewAnalyticalCharts";
import { OverviewRecentBookings } from "./overview/OverviewRecentBookings";
import { OverviewPendingApprovalQueue } from "./overview/OverviewPendingApprovalQueue";
import { Payout24hReminderBanner } from "./financials/Payout24hReminderBanner";

interface DashboardOverviewTabProps {
  metrics: AdminMetrics;
  properties: PropertyItem[];
  bookings: BookingItem[];
  payoutReminders?: PayoutReminderSummary | null;
  urgentPayoutQueue?: SharedHostPayoutRecord[];
  onQuickDisbursePayout?: (payoutId: string) => Promise<void>;
  onSendPayoutReminders?: (payoutIds?: string[]) => Promise<void>;
  updatePropertyStatus: (
    id: string,
    status: "approved" | "rejected" | "pending",
    feedback?: string
  ) => void | Promise<void>;
  setActiveTab: (tab: NavTab) => void;
  setSelectedBooking: (booking: SelectedBookingDetail | null) => void;
  onSelectProperty?: (property: PropertyItem) => void;
  onRequestReject?: (property: PropertyItem) => void;
}

export function DashboardOverviewTab({
  metrics,
  properties,
  bookings,
  payoutReminders,
  urgentPayoutQueue = [],
  onQuickDisbursePayout,
  onSendPayoutReminders,
  updatePropertyStatus,
  setActiveTab,
  setSelectedBooking,
  onSelectProperty,
  onRequestReject,
}: DashboardOverviewTabProps) {
  const { dir, t } = useAdminAuth();

  return (
    <div dir={dir} className="w-full space-y-6">
      {/* 5-KPI Cluster */}
      <OverviewMetricsStrip metrics={metrics} setActiveTab={setActiveTab} t={t} />

      {/* 24-Hour Host Payout SLA & Live Reminder Banner */}
      {payoutReminders && (
        <Payout24hReminderBanner
          compact
          payouts={urgentPayoutQueue}
          reminders={payoutReminders}
          onOpenFinancials={() => setActiveTab("financials-and-payouts")}
          onDisburseNow={onQuickDisbursePayout}
          onSendReminders={onSendPayoutReminders}
        />
      )}

      {/* Fluid Responsive Pending Approvals Banner */}
      {metrics.pendingVerification > 0 && (
        <div className="rounded-2xl border border-status-sand/40 bg-gradient-to-r from-status-sand/15 via-status-sand/5 to-surface-container-lowest p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-status-sand/20 text-status-sand flex items-center justify-center shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-[24px]">pending_actions</span>
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-title-sm text-sm sm:text-base font-bold text-on-surface">
                  {t(
                    `Action Required: ${metrics.pendingVerification} Listing Submission Awaiting Review`,
                    `إجراء مطلوب: ${metrics.pendingVerification} عقارات معلقة بانتظار الاعتماد`
                  )}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-status-sand/20 text-status-sand uppercase tracking-wider">
                  {t("Priority Queue", "أولوية المراجعة")}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                {t(
                  "New host chalet listings require Ministry of Tourism license audit and full layout inspection before being published.",
                  "تتطلب عقارات المضيفين الجديدة تدقيق ترخيص وزارة السياحة والتأكد من مطابقة الصور والمواصفات قبل النشر."
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab("properties-management")}
            className="h-10 px-5 rounded-xl bg-status-sand hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition-all flex items-center justify-center gap-2 self-start sm:self-auto shrink-0 cursor-pointer"
          >
            <span>{t("Inspect Submissions", "فحص طلبات العقارات")}</span>
            <span className="material-symbols-outlined text-[16px]">
              {dir === "rtl" ? "arrow_back" : "arrow_forward"}
            </span>
          </button>
        </div>
      )}

      {/* Analytical Charts Row */}
      <OverviewAnalyticalCharts metrics={metrics} bookings={bookings} />

      {/* Split Operational Section: Live Bookings & Approval Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
        {/* Left: Recent Bookings */}
        <OverviewRecentBookings
          bookings={bookings}
          setActiveTab={setActiveTab}
          setSelectedBooking={setSelectedBooking}
          t={t}
        />

        {/* Right: Approval Queue */}
        <OverviewPendingApprovalQueue
          properties={properties}
          updatePropertyStatus={updatePropertyStatus}
          onSelectProperty={onSelectProperty}
          onRequestReject={onRequestReject}
          t={t}
        />
      </div>
    </div>
  );
}
