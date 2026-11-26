"use client";

import React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
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

  const getStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "in-stay" || s === "checked_in") {
      return "bg-purple-50 dark:bg-purple-950/50 text-[#4F2396] dark:text-purple-300 border border-purple-200 dark:border-purple-800/50";
    }
    if (s === "confirmed" || s === "completed") {
      return "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50";
    }
    if (s === "refund_requested" || s === "cancelled") {
      return "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50";
    }
    return "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50";
  };

  return (
    <div className="xl:col-span-7 flex flex-col rounded-xl bg-white dark:bg-[#0E0D16] border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <span className="text-xs font-semibold text-[#4F2396] dark:text-purple-300 uppercase tracking-wider">
            {t("Transactions", "المعاملات")}
          </span>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
            {t("Recent Booking Activity", "أحدث نشاط الحجوزات")}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setActiveTab("bookings-and-reservations")}
          className="text-xs sm:text-sm text-[#4F2396] dark:text-purple-300 font-semibold hover:underline cursor-pointer inline-flex items-center gap-1 transition-colors"
        >
          <span>{t(`View All (${bookings.length})`, `عرض الكل (${bookings.length})`)}</span>
          {dir === "rtl" ? <ArrowLeft size={15} /> : <ArrowRight size={15} />}
        </button>
      </div>

      <div className="w-full overflow-x-auto mt-3">
        <table className="min-w-[520px] table-fixed w-full text-start text-sm border-collapse">
          <colgroup>
            <col style={{ width: "34%" }} />
            <col style={{ width: "28%" }} />
            <col style={{ width: "20%" }} />
            <col style={{ width: "18%" }} />
          </colgroup>
          <thead>
            <tr className="bg-slate-50/75 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 text-xs font-semibold border-b border-slate-200/80 dark:border-slate-800 select-none">
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
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            {bookings.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-10 px-4 text-center text-slate-400 dark:text-slate-500 font-medium text-sm">
                  {t("No recent bookings recorded yet.", "لا توجد حجوزات حديثة بعد.")}
                </td>
              </tr>
            ) : (
              bookings.slice(0, 5).map((item) => {
                return (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedBooking(buildSelectedBookingDetail(item, t))}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-3">
                      <div className="font-mono font-semibold text-sm text-[#4F2396] dark:text-purple-300 truncate">
                        {item.booking_reference || `#${item.id.slice(0, 8)}`}
                      </div>
                      <div className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
                        {item.guests_count} {t("Guests", "ضيوف")}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-mono text-xs truncate" dir="ltr">
                      {item.check_in} → {item.check_out}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold truncate ${getStatusBadge(
                          item.status
                        )}`}
                      >
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-end font-mono font-bold text-sm text-slate-900 dark:text-slate-100 tabular-nums whitespace-nowrap">
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
