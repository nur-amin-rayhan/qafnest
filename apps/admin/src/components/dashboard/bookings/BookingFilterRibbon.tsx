"use client";

import React from "react";
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
  return (
    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-space-md bg-surface-container-lowest p-space-sm rounded-xl shadow-xs border border-surface-container/60">
      <div className="flex flex-wrap items-center gap-1">
        <button
          type="button"
          onClick={() => setBookingStatusFilter("all")}
          className={`px-3 py-1.5 rounded-lg font-title-sm text-xs sm:text-sm transition-all cursor-pointer ${
            bookingStatusFilter === "all"
              ? "bg-primary-container text-on-primary font-semibold"
              : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
          }`}
        >
          {t("All Stays", "الكل")} ({bookings.length})
        </button>
        <button
          type="button"
          onClick={() => setBookingStatusFilter("pending")}
          className={`px-3 py-1.5 rounded-lg font-title-sm text-xs sm:text-sm transition-all cursor-pointer ${
            bookingStatusFilter === "pending"
              ? "bg-amber-600 text-white font-semibold"
              : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
          }`}
        >
          {t("Pending SADAD", "بانتظار سداد")} ({bookings.filter((b) => b.status === "pending").length})
        </button>
        <button
          type="button"
          onClick={() => setBookingStatusFilter("confirmed")}
          className={`px-3 py-1.5 rounded-lg font-title-sm text-xs sm:text-sm transition-all cursor-pointer ${
            bookingStatusFilter === "confirmed"
              ? "bg-primary-container text-on-primary font-semibold"
              : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
          }`}
        >
          {t("Confirmed", "مؤكد")} ({bookings.filter((b) => b.status === "confirmed").length})
        </button>
        <button
          type="button"
          onClick={() => setBookingStatusFilter("in-stay")}
          className={`px-3 py-1.5 rounded-lg font-title-sm text-xs sm:text-sm transition-all cursor-pointer ${
            bookingStatusFilter === "in-stay"
              ? "bg-primary-container text-on-primary font-semibold"
              : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
          }`}
        >
          {t("In-Stay", "أثناء الإقامة")} ({bookings.filter((b) => b.status === "in-stay").length})
        </button>
        <button
          type="button"
          onClick={() => setBookingStatusFilter("completed")}
          className={`px-3 py-1.5 rounded-lg font-title-sm text-xs sm:text-sm transition-all cursor-pointer ${
            bookingStatusFilter === "completed"
              ? "bg-primary-container text-on-primary font-semibold"
              : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
          }`}
        >
          {t("Completed", "مكتمل")} ({bookings.filter((b) => b.status === "completed").length})
        </button>
        <button
          type="button"
          onClick={() => setBookingStatusFilter("cancelled")}
          className={`px-3 py-1.5 rounded-lg font-title-sm text-xs sm:text-sm transition-all cursor-pointer ${
            bookingStatusFilter === "cancelled"
              ? "bg-primary-container text-on-primary font-semibold"
              : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
          }`}
        >
          {t("Cancelled", "ملغي")} (
          {bookings.filter((b) => b.status === "cancelled" || b.status === "refund_requested").length})
        </button>
        <button
          type="button"
          onClick={() => setBookingStatusFilter("disputes")}
          className={`px-3 py-1.5 rounded-lg font-title-sm text-xs sm:text-sm transition-all flex items-center gap-1 cursor-pointer ${
            bookingStatusFilter === "disputes"
              ? "bg-primary-container text-on-primary font-semibold"
              : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
          }`}
        >
          <span>{t("Disputes", "النزاعات")}</span>
          <span className="h-4 w-4 rounded-full bg-brand-accent-coral text-white font-code-sm text-[10px] flex items-center justify-center">
            {bookings.filter((b) => b.status === "refund_requested").length}
          </span>
        </button>
      </div>

      {/* Search within Bookings */}
      <div className="relative w-full xl:w-72">
        <span className="material-symbols-outlined absolute start-3 top-2.5 text-outline text-[18px]">
          search
        </span>
        <input
          className="w-full ps-9 pe-3 py-1.5 bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus:bg-surface-container-lowest"
          placeholder={t("Filter current view...", "بحث في الحجوزات...")}
          type="text"
          value={bookingSearch}
          onChange={(e) => setBookingSearch(e.target.value)}
        />
      </div>
    </div>
  );
}

