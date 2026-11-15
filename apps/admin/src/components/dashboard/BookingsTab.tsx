"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAdminAuth } from "@/context/AdminAuthContext";
import type { BookingItem, PropertyItem, SelectedBookingDetail } from "./types";
import { BookingLedgerRow } from "./bookings/BookingLedgerRow";
import { BookingMobileCard } from "./bookings/BookingMobileCard";
import { BookingKpiStrip } from "./bookings/BookingKpiStrip";
import { BookingFilterRibbon } from "./bookings/BookingFilterRibbon";
import { AdminCalendarControlPanel } from "./bookings/AdminCalendarControlPanel";

interface BookingsTabProps {
  bookings: BookingItem[];
  filteredBookings: BookingItem[];
  properties: PropertyItem[];
  bookingStatusFilter: string;
  setBookingStatusFilter: (status: string) => void;
  bookingSearch: string;
  setBookingSearch: (search: string) => void;
  setSelectedBooking: (booking: SelectedBookingDetail | null) => void;
  onRefresh?: () => Promise<void> | void;
  triggerToast: (msg: string) => void;
}

export function BookingsTab({
  bookings,
  filteredBookings,
  properties,
  bookingStatusFilter,
  setBookingStatusFilter,
  bookingSearch,
  setBookingSearch,
  setSelectedBooking,
  triggerToast,
}: BookingsTabProps) {
  const { dir, lang, t } = useAdminAuth();
  const [viewMode, setViewMode] = useState<"ledger" | "calendar">("ledger");

  return (
    <div dir={dir} className="flex flex-col w-full gap-space-lg">
      {/* Top Control Bar & Breadcrumb Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        <div className="flex flex-col">
          <div className="flex items-center gap-space-xs text-outline font-label-sm text-label-sm uppercase tracking-wider mb-1">
            <span>{t("Portfolio Ops", "عمليات الحجوزات")}</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-bold">{t("Reservations & Stays", "الحجوزات والإقامات")}</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
            {t("Reservations & Stays", "الحجوزات والإقامات")}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {t(
              "Live booking ledger, real-time guest flows, and settlement compliance across all centralized regional properties.",
              "سجل الحجوزات المباشر، متابعة الضيوف الفورية، ومطابقة التسويات المالية لجميع العقارات."
            )}
          </p>
        </div>

        {/* Actions & Calendar View Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-xl bg-surface-container-lowest border border-surface-container p-1 shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode("ledger")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === "ledger"
                  ? "bg-primary-container text-on-primary shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {t("Bookings Ledger", "سجل الحجوزات")}
            </button>
            <button
              type="button"
              onClick={() => setViewMode("calendar")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === "calendar"
                  ? "bg-primary-container text-on-primary shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">calendar_month</span>
              {t("Calendar & Slot Controls", "التقويم والتحكم بالفترات")}
            </button>
          </div>
          <Link
            href="/helpline"
            data-testid="open-manual-booking-btn"
            className="h-10 flex items-center gap-2 px-4 rounded-xl bg-status-emerald text-white font-title-sm text-xs font-bold shadow-xs hover:bg-emerald-700 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">support_agent</span>
            <span>{t("+ Helpline Booking", "+ حجز هاتفي يدوي")}</span>
          </Link>
          <button
            type="button"
            onClick={() =>
              triggerToast("Generating Ledger CSV. Download starting in 3 seconds...")
            }
            className="h-10 flex items-center gap-2 px-4 rounded-xl bg-primary-container text-on-primary font-title-sm text-xs font-bold shadow-xs hover:bg-primary transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>{t("Export CSV", "تصدير CSV")}</span>
          </button>
        </div>
      </div>

      {/* Key Metrics Row (4 Asymmetric KPI Bento) */}
      <BookingKpiStrip bookings={bookings} t={t} />

      {viewMode === "calendar" ? (
        <AdminCalendarControlPanel
          properties={properties}
          triggerToast={triggerToast}
          lang={lang}
          t={t}
        />
      ) : (
        <>
          {/* Filter and View Selection Ribbon */}
          <BookingFilterRibbon
            bookings={bookings}
            bookingStatusFilter={bookingStatusFilter}
            setBookingStatusFilter={setBookingStatusFilter}
            bookingSearch={bookingSearch}
            setBookingSearch={setBookingSearch}
            t={t}
          />

          {/* Primary Interactive Reservations Container */}
          <div className="w-full overflow-hidden bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container/60">
        {/* Desktop Table View (xl+) */}
        <div className="hidden xl:block w-full overflow-x-auto">
          <table className="table-fixed w-full min-w-[860px] border-collapse text-start">
            <colgroup>
              <col style={{ width: "27%" }} />
              <col style={{ width: "25%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "12%" }} />
            </colgroup>
            <thead>
              <tr className="bg-surface-container-low text-outline font-label-sm text-label-sm uppercase tracking-wider border-b border-surface-container/60">
                <th className="py-3 px-4 text-start font-semibold">
                  {t("Booking & Guest", "الحجز والضيف")}
                </th>
                <th className="py-3 px-4 text-start font-semibold">
                  {t("Property & Chalet", "العقار والشاليه")}
                </th>
                <th className="py-3 px-4 text-start font-semibold">
                  {t("Stay Window", "فترة الإقامة")}
                </th>
                <th className="py-3 px-4 text-start font-semibold">
                  {t("Amount & State", "المبلغ والحالة")}
                </th>
                <th className="py-3 px-3 text-end font-semibold">{t("Actions", "الإجراءات")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container/60 text-body-sm font-body-sm">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-outline">
                    {t("No reservations found in this view.", "لا توجد حجوزات في هذا العرض.")}
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <BookingLedgerRow
                    key={b.id}
                    b={b}
                    setSelectedBooking={setSelectedBooking}
                    t={t}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile & Tablet Card Layout (< xl) */}
        <div className="block xl:hidden w-full divide-y divide-surface-container/60">
          {filteredBookings.length === 0 ? (
            <div className="py-12 text-center text-outline">
              {t("No reservations found in this view.", "لا توجد حجوزات في هذا العرض.")}
            </div>
          ) : (
            filteredBookings.map((b) => (
              <BookingMobileCard key={b.id} b={b} setSelectedBooking={setSelectedBooking} />
            ))
          )}
        </div>

        {/* Table Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 bg-surface-container-low font-body-sm text-body-sm text-on-surface-variant border-t border-surface-container/60 gap-2">
          <div className="flex items-center gap-2">
            <span>
              {t(
                `Showing ${filteredBookings.length === 0 ? 0 : 1} to ${filteredBookings.length} of ${bookings.length} stays`,
                `عرض ${filteredBookings.length === 0 ? 0 : 1} إلى ${filteredBookings.length} من أصل ${bookings.length} إقامات`
              )}
            </span>
            <span className="text-outline">•</span>
            <span className="text-outline">{t("Synced with database", "متزامن مع قاعدة البيانات")}</span>
          </div>
          <div className="flex items-center gap-1">
            <button className="px-2.5 py-1 rounded bg-primary-container text-on-primary font-semibold text-xs">
              1
            </button>
            {filteredBookings.length > 10 && (
              <button className="px-2.5 py-1 rounded text-on-surface hover:bg-surface-container text-xs">
                2
              </button>
            )}
          </div>
        </div>
          </div>
        </>
      )}
    </div>
  );
}
