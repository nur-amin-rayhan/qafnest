"use client";

import React from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import type { BookingItem } from "../types";

interface BookingKpiStripProps {
  bookings?: BookingItem[];
  t?: (en: string, ar: string) => string;
}

export function BookingKpiStrip({ bookings = [], t }: BookingKpiStripProps) {
  const { dir, t: authT } = useAdminAuth();
  const tr = t || authT;
  const todayIso = new Date().toISOString().slice(0, 10);

  const arrivingToday = bookings.filter((b) => b.check_in === todayIso && b.status !== "cancelled");
  const confirmedTodayCount = arrivingToday.filter(
    (b) => b.status === "confirmed" || b.status === "in-stay"
  ).length;
  const arrivalPct =
    arrivingToday.length > 0 ? Math.round((confirmedTodayCount / arrivingToday.length) * 100) : 0;

  const activeStays = bookings.filter(
    (b) =>
      b.status === "in-stay" ||
      (b.status === "confirmed" && b.check_in <= todayIso && b.check_out > todayIso)
  );
  const inHouseGuests = activeStays.reduce((sum, b) => sum + Number(b.guests_count || 0), 0);
  const inHousePct =
    bookings.length > 0 ? Math.min(100, Math.round((activeStays.length / bookings.length) * 100)) : 0;

  const isPaidStatus = (paymentStatus?: string) =>
    paymentStatus === "success" || paymentStatus === "paid";

  const nonCancelledBookings = bookings.filter(
    (b) => b.status !== "cancelled" && !(b.status === "pending" && b.payment_status === "initiated")
  );
  const unsettledBookings = nonCancelledBookings.filter(
    (b) => !isPaidStatus(b.payment_status)
  );
  const unsettledAmount = unsettledBookings.reduce((sum, b) => sum + Number(b.total_price || 0), 0);
  const settledBookings = nonCancelledBookings.filter((b) => isPaidStatus(b.payment_status));
  const settledPct =
    nonCancelledBookings.length > 0
      ? Math.round((settledBookings.length / nonCancelledBookings.length) * 100)
      : 0;

  const refundCount = bookings.filter((b) => b.status === "refund_requested").length;
  const pendingApprovalCount = bookings.filter((b) => b.status === "pending").length;
  const attentionCount = refundCount + pendingApprovalCount;

  return (
    <div dir={dir} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md">
      {/* Metric 1: Check-ins Today */}
      <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-space-md shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">
            {tr("Upcoming Today", "وصول اليوم")}
          </span>
          <span className="p-1.5 rounded-lg bg-primary-fixed text-primary">
            <span className="material-symbols-outlined text-[18px]">key</span>
          </span>
        </div>
        <div className="mt-4 flex items-baseline justify-between">
          <div>
            <span className="font-display-md text-display-md text-on-surface leading-none">
              {arrivingToday.length}
            </span>
            <span className="font-label-md text-label-md text-outline ms-1">
              {tr("arrivals", "وصول")}
            </span>
          </div>
          <div className="flex items-center gap-0.5 text-status-emerald font-label-sm text-label-sm bg-status-emerald/10 px-2 py-0.5 rounded-full">
            <span>{arrivalPct}%</span>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
            <div className="h-full bg-primary-container rounded-full" style={{ width: `${arrivalPct}%` }} />
          </div>
          <span className="font-code-sm text-code-sm text-outline whitespace-nowrap">
            {confirmedTodayCount} / {arrivingToday.length} {tr("In", "دخول")}
          </span>
        </div>
      </div>

      {/* Metric 2: Live In-Stay Volume */}
      <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-space-md shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">
            {tr("Live In-House", "الضيوف المقيمون")}
          </span>
          <span className="p-1.5 rounded-lg bg-primary-fixed text-primary">
            <span className="material-symbols-outlined text-[18px]">home</span>
          </span>
        </div>
        <div className="mt-4 flex items-baseline justify-between">
          <div>
            <span className="font-display-md text-display-md text-on-surface leading-none">
              {inHouseGuests}
            </span>
            <span className="font-label-md text-label-md text-outline ms-1">
              {tr("guests", "ضيوف")}
            </span>
          </div>
          <span className="font-label-sm text-label-sm text-status-sand bg-status-sand/20 px-2 py-0.5 rounded-full">
            {inHousePct}% {tr("Active", "نشط")}
          </span>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
            <div className="h-full bg-status-sand rounded-full" style={{ width: `${inHousePct}%` }} />
          </div>
          <span className="font-code-sm text-code-sm text-outline whitespace-nowrap">
            {activeStays.length} {tr("stays", "إقامات")}
          </span>
        </div>
      </div>

      {/* Metric 3: Unsettled Reservations */}
      <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-space-md shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">
            {tr("Unsettled Escrow", "دفعات قيد التسوية")}
          </span>
          <span className="p-1.5 rounded-lg bg-primary-fixed text-primary">
            <span className="material-symbols-outlined text-[18px]">payments</span>
          </span>
        </div>
        <div className="mt-4 flex items-baseline justify-between">
          <div>
            <span className="font-display-md text-display-md text-on-surface leading-none">
              {unsettledAmount.toLocaleString()} {tr("SAR", "ر.س")}
            </span>
          </div>
          <span className="font-label-sm text-label-sm text-outline">
            {unsettledBookings.length} {tr("stays", "حجوزات")}
          </span>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
            <div className="h-full bg-primary-container rounded-full" style={{ width: `${settledPct}%` }} />
          </div>
          <span className="font-code-sm text-code-sm text-outline whitespace-nowrap">
            {settledPct}% {tr("Settled", "مدفوع")}
          </span>
        </div>
      </div>

      {/* Metric 4: Dispute / Escalation Alert */}
      <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-space-md shadow-sm flex flex-col justify-between border-s-4 border-s-brand-accent-coral">
        <div className="flex items-center justify-between">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">
            {tr("Open Escalations", "حالات تتطلب مراجعة")}
          </span>
          <span className="p-1.5 rounded-lg bg-error/10 text-brand-accent-coral">
            <span className="material-symbols-outlined text-[18px]">support_agent</span>
          </span>
        </div>
        <div className="mt-4 flex items-baseline justify-between">
          <div>
            <span className="font-display-md text-display-md text-on-surface leading-none">
              {attentionCount}
            </span>
            <span className="font-label-md text-label-md text-brand-accent-coral font-bold ms-1">
              {attentionCount > 0 ? tr("cases", "حالات") : tr("urgent cases", "حالات عاجلة")}
            </span>
          </div>
          <span className="font-label-sm text-label-sm text-brand-accent-coral bg-error/10 px-2 py-0.5 rounded-full">
            {attentionCount > 0 ? tr("Review Due", "بانتظار المراجعة") : tr("Clear", "لا يوجد")}
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between text-code-sm font-code-sm text-outline">
          <span>
            {refundCount} {tr("Refunds", "استرداد")} · {pendingApprovalCount} {tr("Pending", "معلق")}
          </span>
          <span className="text-primary font-bold">{bookings.length} {tr("total", "إجمالي")}</span>
        </div>
      </div>
    </div>
  );
}

