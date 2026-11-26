"use client";

import React from "react";
import { KeyRound, Users, Wallet, AlertCircle } from "lucide-react";
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
    <div dir={dir} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Metric 1: Check-ins Today */}
      <div className="bg-white dark:bg-[#0E0D16] rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {tr("Upcoming today", "وصول اليوم")}
          </span>
          <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 shrink-0">
            <KeyRound size={16} strokeWidth={1.5} />
          </div>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-semibold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
              {arrivingToday.length}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {tr("arrivals", "وصول")}
            </span>
          </div>
          <span className="text-[11px] font-mono tabular-nums font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/60">
            {arrivalPct}% {tr("checked in", "تم الدخول")}
          </span>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-slate-800 dark:bg-slate-300 rounded-full" style={{ width: `${arrivalPct}%` }} />
          </div>
          <span className="text-[11px] font-mono tabular-nums text-slate-400 dark:text-slate-500 whitespace-nowrap">
            {confirmedTodayCount}/{arrivingToday.length}
          </span>
        </div>
      </div>

      {/* Metric 2: Live In-Stay Volume */}
      <div className="bg-white dark:bg-[#0E0D16] rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {tr("Live in-house", "الضيوف المقيمون")}
          </span>
          <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 shrink-0">
            <Users size={16} strokeWidth={1.5} />
          </div>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-semibold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
              {inHouseGuests}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {tr("guests", "ضيوف")}
            </span>
          </div>
          <span className="text-[11px] font-mono tabular-nums font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
            {activeStays.length} {tr("stays", "إقامات")}
          </span>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${inHousePct}%` }} />
          </div>
          <span className="text-[11px] font-mono tabular-nums text-slate-400 dark:text-slate-500 whitespace-nowrap">
            {inHousePct}% {tr("portfolio", "المحفظة")}
          </span>
        </div>
      </div>

      {/* Metric 3: Unsettled Escrow */}
      <div className="bg-white dark:bg-[#0E0D16] rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {tr("Unsettled escrow", "دفعات قيد التسوية")}
          </span>
          <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 shrink-0">
            <Wallet size={16} strokeWidth={1.5} />
          </div>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <div className="flex items-baseline gap-1 font-mono tabular-nums">
            <span className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {unsettledAmount.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{tr("SAR", "ر.س")}</span>
          </div>
          <span className="text-[11px] font-mono tabular-nums text-slate-400 dark:text-slate-500">
            {unsettledBookings.length} {tr("pending", "معلق")}
          </span>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-[#4F2396] rounded-full" style={{ width: `${settledPct}%` }} />
          </div>
          <span className="text-[11px] font-mono tabular-nums text-slate-400 dark:text-slate-500 whitespace-nowrap">
            {settledPct}% {tr("settled", "مسوى")}
          </span>
        </div>
      </div>

      {/* Metric 4: Requires Attention */}
      <div
        className={`rounded-xl border p-5 shadow-xs flex flex-col justify-between ${
          attentionCount > 0
            ? "bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/80"
            : "bg-white dark:bg-[#0E0D16] border-slate-200/90 dark:border-slate-800"
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {tr("Action required", "يتطلب متابعة")}
          </span>
          <div
            className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${
              attentionCount > 0
                ? "bg-amber-100 dark:bg-amber-900/40 border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-300"
                : "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400"
            }`}
          >
            <AlertCircle size={16} strokeWidth={1.5} />
          </div>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-2xl font-semibold font-mono tabular-nums ${
                attentionCount > 0
                  ? "text-amber-800 dark:text-amber-300"
                  : "text-slate-900 dark:text-slate-100"
              }`}
            >
              {attentionCount}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {tr("cases", "حالات")}
            </span>
          </div>
          <span
            className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
              attentionCount > 0
                ? "bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 font-semibold"
                : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
            }`}
          >
            {attentionCount > 0 ? tr("Review needed", "مراجعة مطلوبة") : tr("All clear", "لا يوجد")}
          </span>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>{tr("Refunds & holds", "الاسترداد والمعلقات")}</span>
          <span className="font-mono tabular-nums text-slate-400 dark:text-slate-500">
            {refundCount} {tr("refunds", "استرداد")}
          </span>
        </div>
      </div>
    </div>
  );
}
