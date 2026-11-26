"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Download, Headphones, Calendar as CalendarIcon, ListOrdered, CalendarX } from "lucide-react";
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

  const handleExportCsv = () => {
    const esc = (v: unknown) => {
      const s = String(v ?? "");
      return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const headers = [
      "Booking_Ref",
      "Property",
      "Guest",
      "Phone",
      "Check_In",
      "Check_Out",
      "Nights",
      "Amount_SAR",
      "Status",
      "Payment_Status",
    ];
    const rows = filteredBookings.map((b) => [
      b.booking_reference || b.id,
      b.property_title || "",
      b.guest_name || "",
      b.guest_phone || "",
      b.check_in || "",
      b.check_out || "",
      b.total_nights ?? 1,
      Number(b.total_price ?? 0).toFixed(2),
      b.status || "",
      b.payment_status || "",
    ]);
    const csvContent =
      "\uFEFF" +
      [headers.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `qafnest-bookings-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerToast(
      t(
        `Exported ${filteredBookings.length} bookings to CSV.`,
        `تم تصدير ${filteredBookings.length} حجوزات إلى ملف CSV.`
      )
    );
  };

  return (
    <div dir={dir} className="flex flex-col w-full">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
            {t("Reservations & bookings", "الحجوزات والإقامات")}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t(
              "Live booking ledger, guest flows, and payment settlement across regional properties.",
              "سجل الحجوزات المباشر، متابعة الضيوف، ومطابقة التسويات المالية لجميع العقارات."
            )}
          </p>
        </div>

        {/* View Switcher & Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Mode Switcher */}
          <div className="inline-flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode("ledger")}
              className={`h-8 px-3 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === "ledger"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              <ListOrdered size={14} strokeWidth={1.5} />
              <span>{t("Ledger", "السجل")}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("calendar")}
              className={`h-8 px-3 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === "calendar"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              <CalendarIcon size={14} strokeWidth={1.5} />
              <span>{t("Calendar", "التقويم")}</span>
            </button>
          </div>

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCsv}
            className="h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Download size={14} strokeWidth={1.5} className="text-slate-500 dark:text-slate-400" />
            <span>{t("Export", "تصدير")}</span>
          </button>

          {/* Helpline Booking */}
          <Link
            href="/helpline"
            data-testid="open-manual-booking-btn"
            className="h-8 px-3.5 rounded-lg bg-[#4F2396] hover:bg-[#3d1a75] text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Headphones size={14} strokeWidth={1.5} />
            <span>{t("Helpline booking", "حجز هاتفي")}</span>
          </Link>
        </div>
      </div>

      {/* KPI Bento Strip */}
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
          {/* Filter ribbon */}
          <BookingFilterRibbon
            bookings={bookings}
            bookingStatusFilter={bookingStatusFilter}
            setBookingStatusFilter={setBookingStatusFilter}
            bookingSearch={bookingSearch}
            setBookingSearch={setBookingSearch}
            t={t}
          />

          {/* Ledger Table Container */}
          <div className="w-full overflow-hidden bg-white dark:bg-[#0E0D16] rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs mb-6">
            {/* Desktop Table */}
            <div className="hidden lg:block w-full overflow-x-auto">
              <table className="table-fixed w-full min-w-[860px] border-collapse text-start">
                <colgroup>
                  <col style={{ width: "27%" }} />
                  <col style={{ width: "26%" }} />
                  <col style={{ width: "20%" }} />
                  <col style={{ width: "15%" }} />
                  <col style={{ width: "12%" }} />
                </colgroup>
                <thead>
                  <tr className="bg-slate-50/75 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-medium text-slate-500 dark:text-slate-400 select-none">
                    <th className="py-2.5 px-4 text-start font-medium">
                      {t("Booking & guest", "الحجز والضيف")}
                    </th>
                    <th className="py-2.5 px-4 text-start font-medium">
                      {t("Property & unit", "العقار والوحدة")}
                    </th>
                    <th className="py-2.5 px-4 text-start font-medium">
                      {t("Stay dates", "فترة الإقامة")}
                    </th>
                    <th className="py-2.5 px-4 text-start font-medium">
                      {t("Amount & status", "المبلغ والحالة")}
                    </th>
                    <th className="py-2.5 px-4 text-end font-medium">
                      {t("Actions", "الإجراءات")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-800 dark:text-slate-200">
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-14 text-center">
                        <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                          <CalendarX size={28} strokeWidth={1.25} className="text-slate-300 dark:text-slate-600" />
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {t("No reservations found in this view.", "لا توجد حجوزات في هذا العرض.")}
                          </p>
                        </div>
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

            {/* Mobile & Tablet Card Layout (< lg) */}
            <div className="block lg:hidden w-full divide-y divide-slate-100 dark:divide-slate-800">
              {filteredBookings.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  {t("No reservations found in this view.", "لا توجد حجوزات في هذا العرض.")}
                </div>
              ) : (
                filteredBookings.map((b) => (
                  <BookingMobileCard key={b.id} b={b} setSelectedBooking={setSelectedBooking} />
                ))
              )}
            </div>

            {/* Table Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-2.5 bg-slate-50/75 dark:bg-slate-900/60 border-t border-slate-200/80 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 gap-2">
              <div className="flex items-center gap-2">
                <span>
                  {t("Showing", "عرض")}{" "}
                  <span className="font-mono tabular-nums font-medium text-slate-800 dark:text-slate-200">
                    {filteredBookings.length}
                  </span>{" "}
                  {t("of", "من")}{" "}
                  <span className="font-mono tabular-nums">{bookings.length}</span>{" "}
                  {t("total stays", "إجمالي الإقامات")}
                </span>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className="text-slate-400 dark:text-slate-500">
                  {t("Real-time ledger", "سجل فوري")}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-6 px-2 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[11px] flex items-center justify-center font-medium">
                  1
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
