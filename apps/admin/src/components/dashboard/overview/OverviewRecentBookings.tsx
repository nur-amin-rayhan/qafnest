"use client";

import React from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
  BookingItem,
  NavTab,
  SelectedBookingDetail,
  buildSelectedBookingDetail,
} from "../types";

interface OverviewRecentBookingsProps {
  bookings: BookingItem[];
  setActiveTab: (tab: NavTab) => void;
  setSelectedBooking: (booking: SelectedBookingDetail | null) => void;
  t: (en: string, ar: string) => string;
}

export function OverviewRecentBookings({
  bookings,
  setActiveTab,
  setSelectedBooking,
  t,
}: OverviewRecentBookingsProps) {
  const { dir } = useAdminAuth();

  const getStatusLabel = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "confirmed") return t("Confirmed", "مؤكد");
    if (s === "in-stay" || s === "checked_in") return t("In-Stay", "مقيم حالياً");
    if (s === "completed") return t("Completed", "مكتمل");
    if (s === "pending") return t("Pending", "معلق");
    if (s === "cancelled") return t("Cancelled", "ملغى");
    if (s === "refund_requested") return t("Refund Req", "طلب استرداد");
    return status.replace("_", " ");
  };

  return (
    <div className="xl:col-span-7 flex flex-col rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-space-md">
        <div>
          <span className="font-label-sm text-primary uppercase font-bold tracking-wider">
            {t("Transactions", "المعاملات")}
          </span>
          <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
            {t("Recent Booking Activity", "أحدث نشاط الحجوزات")}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setActiveTab("bookings-and-reservations")}
          className="text-xs text-primary font-bold hover:underline cursor-pointer inline-flex items-center gap-1"
        >
          <span>{t(`View All (${bookings.length})`, `عرض الكل (${bookings.length})`)}</span>
          <span className="material-symbols-outlined text-[14px]">
            {dir === "rtl" ? "arrow_back" : "arrow_forward"}
          </span>
        </button>
      </div>

      <div className="w-full overflow-x-auto">
        <table className="min-w-[520px] table-fixed w-full text-start text-xs border-collapse">
          <colgroup>
            <col style={{ width: "34%" }} />
            <col style={{ width: "28%" }} />
            <col style={{ width: "20%" }} />
            <col style={{ width: "18%" }} />
          </colgroup>
          <thead>
            <tr className="bg-surface-container-low text-outline uppercase font-label-sm border-b border-surface-container/60">
              <th className="py-2.5 px-3 text-start font-semibold">
                {t("Booking Ref", "المرجع")}
              </th>
              <th className="py-2.5 px-3 text-start font-semibold">
                {t("Stay Dates", "تواريخ الإقامة")}
              </th>
              <th className="py-2.5 px-3 text-start font-semibold">
                {t("Status", "الحالة")}
              </th>
              <th className="py-2.5 px-3 text-end font-semibold">
                {t("Total", "الإجمالي")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-low font-body-sm">
            {bookings.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-10 px-4 text-center text-outline font-medium">
                  {t("No recent bookings recorded yet.", "لا توجد حجوزات حديثة بعد.")}
                </td>
              </tr>
            ) : (
              bookings.slice(0, 5).map((item) => {
                return (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedBooking(buildSelectedBookingDetail(item, t))}
                    className="hover:bg-surface-container-low/60 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-3">
                      <div className="font-mono font-bold text-primary truncate">
                        {item.booking_reference || `#${item.id.slice(0, 8)}`}
                      </div>
                      <div className="text-[10px] text-outline font-body-sm truncate">
                        {item.guests_count} {t("Guests", "ضيوف")}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-on-surface-variant font-medium truncate" dir="ltr">
                      {item.check_in} → {item.check_out}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full font-label-sm font-semibold text-[10.5px] truncate ${
                          item.status === "in-stay"
                            ? "bg-primary-fixed text-primary font-bold"
                            : item.status === "confirmed"
                            ? "bg-status-emerald/15 text-status-emerald font-bold"
                            : item.status === "refund_requested"
                            ? "bg-status-terracotta/15 text-status-terracotta font-bold"
                            : "bg-status-sand/20 text-tertiary-container"
                        }`}
                      >
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-end font-title-sm font-bold text-on-surface whitespace-nowrap">
                      {Number(item.total_price).toLocaleString()} {t("SAR", "ر.س")}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
