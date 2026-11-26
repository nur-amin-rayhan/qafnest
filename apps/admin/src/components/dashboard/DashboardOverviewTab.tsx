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
  onInspectPayout?: (payoutId: string) => void;
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
  onInspectPayout,
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
      {/* Clean Page Title */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            {t("Dashboard", "لوحة التحكم")}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t(
              "Live overview of bookings, property approvals, and payouts.",
              "نظرة عامة مباشرة على الحجوزات واعتماد العقارات والمدفوعات."
            )}
          </p>
        </div>

        {metrics.pendingVerification > 0 && (
          <button
            type="button"
            onClick={() => setActiveTab("properties-management")}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-xs font-semibold transition cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>
              {t(
                `${metrics.pendingVerification} Pending Approvals`,
                `${metrics.pendingVerification} عقارات بانتظار الاعتماد`
              )}
            </span>
          </button>
        )}
      </div>

      {/* KPI Strip */}
      <OverviewMetricsStrip metrics={metrics} setActiveTab={setActiveTab} t={t} />

      {/* Actionable Payout SLA Banner (only when payouts require attention) */}
      {payoutReminders &&
        ((payoutReminders.overdueCount || 0) > 0 || (payoutReminders.dueWithin24hCount || 0) > 0) && (
          <Payout24hReminderBanner
            compact
            payouts={urgentPayoutQueue}
            reminders={payoutReminders}
            onOpenFinancials={() => setActiveTab("financials-and-payouts")}
            onInspectPayout={onInspectPayout}
            onDisburseNow={onInspectPayout ? undefined : onQuickDisbursePayout}
            onSendReminders={onSendPayoutReminders}
          />
        )}

      {/* Primary Operational Grid: Live Bookings & Approval Queue */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <OverviewRecentBookings
          bookings={bookings}
          setActiveTab={setActiveTab}
          setSelectedBooking={setSelectedBooking}
          t={t}
        />

        <OverviewPendingApprovalQueue
          properties={properties}
          updatePropertyStatus={updatePropertyStatus}
          onSelectProperty={onSelectProperty}
          onRequestReject={onRequestReject}
          t={t}
        />
      </div>

      {/* Analytical Charts */}
      <OverviewAnalyticalCharts metrics={metrics} bookings={bookings} />
    </div>
  );
}
