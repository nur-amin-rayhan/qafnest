"use client";

import React from "react";
import { Search, X } from "lucide-react";
import type { BookingItem } from "../types";

interface BookingFilterRibbonProps {
  bookings: BookingItem[];
  bookingStatusFilter: string;
  setBookingStatusFilter: (status: string) => void;
  bookingSearch: string;
  setBookingSearch: (search: string) => void;
  t: (en: string, ar: string) => string;
}

export function BookingFilterRibbon({
  bookings,
  bookingStatusFilter,
  setBookingStatusFilter,
  bookingSearch,
  setBookingSearch,
  t,
}: BookingFilterRibbonProps) {
  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const confirmedCount = bookings.filter((b) => b.status === "confirmed").length;
  const inStayCount = bookings.filter((b) => b.status === "in-stay").length;
  const completedCount = bookings.filter((b) => b.status === "completed").length;
  const cancelledCount = bookings.filter(
    (b) => b.status === "cancelled" || b.status === "refund_requested"
  ).length;
  const disputesCount = bookings.filter(
    (b) => b.status === "disputed" || b.status === "chargeback" || Boolean(b.transferClaim)
  ).length;

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-[#0E0D16] p-3 rounded-xl shadow-xs border border-slate-200/90 dark:border-slate-800 mb-6">
      {/* Segmented status filter tabs */}
      <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg overflow-x-auto max-w-full">
        <button
          type="button"
          onClick={() => setBookingStatusFilter("all")}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            bookingStatusFilter === "all"
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-semibold"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          }`}
        >
          <span>{t("All stays", "الكل")}</span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums ${
              bookingStatusFilter === "all"
                ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                : "bg-slate-200/70 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300"
            }`}
          >
            {bookings.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setBookingStatusFilter("confirmed")}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            bookingStatusFilter === "confirmed"
              ? "bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 shadow-xs font-semibold"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span>{t("Confirmed", "مؤكد")}</span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums ${
              bookingStatusFilter === "confirmed"
                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                : "bg-slate-200/70 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300"
            }`}
          >
            {confirmedCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setBookingStatusFilter("in-stay")}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            bookingStatusFilter === "in-stay"
              ? "bg-white dark:bg-slate-900 text-[#4F2396] dark:text-purple-300 shadow-xs font-semibold"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#4F2396] dark:bg-purple-400 shrink-0" />
          <span>{t("In-stay", "أثناء الإقامة")}</span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums ${
              bookingStatusFilter === "in-stay"
                ? "bg-purple-50 dark:bg-purple-950/60 text-[#4F2396] dark:text-purple-300"
                : "bg-slate-200/70 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300"
            }`}
          >
            {inStayCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setBookingStatusFilter("pending")}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            bookingStatusFilter === "pending"
              ? "bg-white dark:bg-slate-900 text-amber-800 dark:text-amber-300 shadow-xs font-semibold"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
          <span>{t("Pending payment", "بانتظار الدفع")}</span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums ${
              bookingStatusFilter === "pending"
                ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                : "bg-slate-200/70 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300"
            }`}
          >
            {pendingCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setBookingStatusFilter("completed")}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            bookingStatusFilter === "completed"
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-semibold"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          }`}
        >
          <span>{t("Completed", "مكتمل")}</span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums ${
              bookingStatusFilter === "completed"
                ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                : "bg-slate-200/70 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300"
            }`}
          >
            {completedCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setBookingStatusFilter("cancelled")}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            bookingStatusFilter === "cancelled"
              ? "bg-white dark:bg-slate-900 text-rose-800 dark:text-rose-300 shadow-xs font-semibold"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          }`}
        >
          <span>{t("Cancelled", "ملغي")}</span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums ${
              bookingStatusFilter === "cancelled"
                ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300"
                : "bg-slate-200/70 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300"
            }`}
          >
            {cancelledCount}
          </span>
        </button>

        {disputesCount > 0 && (
          <button
            type="button"
            onClick={() => setBookingStatusFilter("disputes")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              bookingStatusFilter === "disputes"
                ? "bg-white dark:bg-slate-900 text-rose-800 dark:text-rose-300 shadow-xs font-semibold"
                : "text-rose-600 dark:text-rose-400 hover:text-rose-900 dark:hover:text-rose-200"
            }`}
          >
            <span>{t("Disputes", "نزاعات")}</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
              {disputesCount}
            </span>
          </button>
        )}
      </div>

      {/* Booking Search input */}
      <div className="relative flex items-center w-full lg:w-72">
        <Search
          size={14}
          strokeWidth={1.5}
          className="absolute start-3 text-slate-400 dark:text-slate-500 pointer-events-none"
        />
        <input
          type="text"
          value={bookingSearch}
          onChange={(e) => setBookingSearch(e.target.value)}
          placeholder={t("Filter by reference, guest, phone...", "ابحث برقم الحجز، الضيف، الجوال...")}
          className="w-full h-8 ps-8 pe-7 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#4F2396] transition-colors"
        />
        {bookingSearch && (
          <button
            type="button"
            onClick={() => setBookingSearch("")}
            className="absolute end-2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded transition-colors cursor-pointer"
            title={t("Clear search", "مسح")}
          >
            <X size={12} strokeWidth={1.5} />
          </button>
        )}
      </div>
    </div>
  );
}
