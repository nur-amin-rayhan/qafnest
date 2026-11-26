"use client";

import React from "react";
import { MapPin, Users, Eye } from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
  BookingItem,
  SelectedBookingDetail,
  buildSelectedBookingDetail,
} from "../types";

interface BookingMobileCardProps {
  b: BookingItem;
  setSelectedBooking: (booking: SelectedBookingDetail | null) => void;
}

export function BookingMobileCard({
  b,
  setSelectedBooking,
}: BookingMobileCardProps) {
  const { dir, t } = useAdminAuth();
  const isRefund = b.status === "refund_requested";
  const isInStay = b.status === "in-stay";
  const isConfirmed = b.status === "confirmed";
  const isPending = b.status === "pending";
  const isCancelled = b.status === "cancelled";

  const guestName = b.guest_name || t("Guest", "ضيف");
  const propertyTitle = b.property_title || (b.property_id ? `#${b.property_id.slice(0, 8)}` : "—");
  const propertyLocation = [b.property_city, b.property_district].filter(Boolean).join(", ") || "—";
  const initials =
    guestName
      .split(" ")
      .filter(Boolean)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "G";

  const handleSelect = () => {
    setSelectedBooking(buildSelectedBookingDetail(b, t));
  };

  return (
    <div
      dir={dir}
      onClick={handleSelect}
      className="p-3.5 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer flex flex-col gap-2.5"
    >
      {/* Top: Guest + Status Badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center font-medium text-xs uppercase shrink-0">
            {initials}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
              {guestName}
            </span>
            <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
              {b.booking_reference || `#${b.id.slice(0, 8)}`}
            </span>
          </div>
        </div>

        <div className="shrink-0">
          {isInStay ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-purple-50 dark:bg-purple-950/40 text-[#4F2396] dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4F2396] dark:bg-purple-400" />
              <span>{t("In stay", "مقيم حالياً")}</span>
            </span>
          ) : isConfirmed ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>{t("Confirmed", "مؤكد")}</span>
            </span>
          ) : isRefund ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>{t("Refund req.", "طلب استرداد")}</span>
            </span>
          ) : isPending ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>{t("Pending", "معلق")}</span>
            </span>
          ) : isCancelled ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>{t("Cancelled", "ملغى")}</span>
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
              {b.status}
            </span>
          )}
        </div>
      </div>

      {/* Property Details */}
      <div className="flex flex-col min-w-0 text-xs">
        <span className="font-medium text-slate-900 dark:text-slate-200 truncate">
          {propertyTitle}
        </span>
        <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
          <MapPin size={11} strokeWidth={1.5} className="shrink-0" />
          <span className="truncate">{propertyLocation}</span>
        </div>
      </div>

      {/* Bottom Bar: Dates, Guests, Price, and Action */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
        <div className="flex flex-col">
          <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300 text-[11px]">
            {b.check_in} → {b.check_out}
          </span>
          <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
            <Users size={11} strokeWidth={1.5} className="shrink-0" />
            <span>{b.guests_count} {t("guests", "ضيوف")}</span>
            <span>•</span>
            <span>{b.total_nights ?? 1} {t("nights", "ليالي")}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono tabular-nums text-xs">
            {Number(b.total_price).toLocaleString()} {t("SAR", "ر.س")}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleSelect();
            }}
            className="h-7 w-7 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
            aria-label={t("View booking", "عرض الحجز")}
          >
            <Eye size={13} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
