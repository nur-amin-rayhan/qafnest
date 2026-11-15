"use client";

import React from "react";
import {
  BookingItem,
  SelectedBookingDetail,
  buildSelectedBookingDetail,
} from "../types";

interface BookingLedgerRowProps {
  b: BookingItem;
  setSelectedBooking: (booking: SelectedBookingDetail | null) => void;
  t: (en: string, ar: string) => string;
}

export function BookingLedgerRow({
  b,
  setSelectedBooking,
  t,
}: BookingLedgerRowProps) {
  const isRefund = b.status === "refund_requested";
  const isInStay = b.status === "in-stay";
  const isConfirmed = b.status === "confirmed";
  const isPending = b.status === "pending";

  const guestName = b.guest_name || t("Guest", "ضيف");
  const guestPhone = b.guest_phone || "—";
  const propertyTitle = b.property_title || (b.property_id ? `#${b.property_id.slice(0, 8)}` : "—");
  const propertyLocation = [b.property_city, b.property_district].filter(Boolean).join(", ") || "—";
  const initials = guestName
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
    <tr
      onClick={handleSelect}
      className="hover:bg-surface-container-low/60 transition-colors group cursor-pointer"
    >
      {/* Booking ID & Guest Details */}
      <td className="py-3.5 px-4 align-middle">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-bold text-xs uppercase shadow-xs shrink-0">
            {initials}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="font-title-sm text-xs font-semibold text-on-surface truncate">
              {guestName}
            </span>
            <div className="flex items-center gap-1.5 text-[11px] text-outline font-mono truncate">
              <span className="font-bold text-primary">
                {b.booking_reference || `#${b.id.slice(0, 8)}`}
              </span>
              <span>•</span>
              <span>{guestPhone}</span>
            </div>
          </div>
        </div>
      </td>

      {/* Property & Chalet */}
      <td className="py-3.5 px-4 align-middle">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[18px] text-primary">villa</span>
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="font-title-sm text-xs text-on-surface leading-tight font-medium truncate">
              {propertyTitle}
            </span>
            <span className="text-outline text-[11px] flex items-center gap-0.5 truncate">
              <span className="material-symbols-outlined text-[12px] text-status-sand shrink-0">
                location_on
              </span>
              <span className="truncate">{propertyLocation}</span>
            </span>
          </div>
        </div>
      </td>

      {/* Stay Window & Guests */}
      <td className="py-3.5 px-4 align-middle">
        <div className="flex flex-col min-w-0">
          <span className="font-title-sm text-xs text-on-surface font-semibold truncate">
            {b.check_in} → {b.check_out}
          </span>
          <div className="flex items-center gap-1 text-[11px] text-outline mt-0.5">
            <span className="material-symbols-outlined text-[13px]">groups</span>
            <span>
              {b.guests_count} {t("Guests", "ضيوف")}
            </span>
          </div>
        </div>
      </td>

      {/* Amount Paid & Status */}
      <td className="py-3.5 px-4 align-middle">
        <div className="flex flex-col gap-1">
          <span className="font-code-sm text-xs font-bold text-on-surface">
            {Number(b.total_price).toLocaleString()} {t("SAR", "ر.س")}
          </span>
          <div>
            {isInStay ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-primary font-label-sm text-[10px] bg-primary-fixed font-bold tracking-wide">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                {t("IN-STAY", "مقيم حالياً")}
              </span>
            ) : isConfirmed ? (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-status-emerald font-label-sm text-[10px] bg-status-emerald/10 font-bold">
                <span className="material-symbols-outlined text-[12px]">check</span>
                {t("CONFIRMED", "مؤكد")}
              </span>
            ) : isRefund ? (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-status-terracotta font-label-sm text-[10px] bg-status-terracotta/15 font-bold">
                <span className="material-symbols-outlined text-[12px]">undo</span>
                {t("REFUND", "طلب استرداد")}
              </span>
            ) : isPending ? (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-amber-800 font-label-sm text-[10px] bg-amber-100 font-bold uppercase">
                <span className="material-symbols-outlined text-[12px]">schedule</span>
                {String(b.auth_subject || "").includes("SADAD_HOLD") || b.payment_status === "initiated"
                  ? t("PENDING SADAD", "بانتظار سداد")
                  : t("PENDING", "معلق")}
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-on-surface-variant font-label-sm text-[10px] bg-surface-container font-semibold uppercase">
                {b.status === "cancelled" ? t("CANCELLED", "ملغى") : b.status === "completed" ? t("COMPLETED", "مكتمل") : b.status}
              </span>
            )}
          </div>
        </div>
      </td>

      {/* Actions */}
      <td className="py-3.5 px-3 align-middle text-end">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleSelect();
          }}
          className="h-7 px-2 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/15 text-primary text-xs font-bold inline-flex items-center gap-1 whitespace-nowrap cursor-pointer"
          title={t("View Booking", "عرض الحجز")}
        >
          <span className="material-symbols-outlined text-[14px]">visibility</span>
          <span>{t("View", "عرض")}</span>
        </button>
      </td>
    </tr>
  );
}

