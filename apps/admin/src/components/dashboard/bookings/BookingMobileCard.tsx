"use client";

import React from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { BookingItem, SelectedBookingDetail } from "../types";

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
  const guestPhone = b.guest_phone || "—";
  const propertyTitle = b.property_title || (b.property_id ? `#${b.property_id.slice(0, 8)}` : "—");
  const propertyLocation = [b.property_city, b.property_district].filter(Boolean).join(", ") || "—";
  const startMs = b.check_in ? new Date(b.check_in).getTime() : 0;
  const endMs = b.check_out ? new Date(b.check_out).getTime() : 0;
  const nightsCount = startMs && endMs && endMs > startMs ? Math.round((endMs - startMs) / 86400000) : 1;
  const initials = guestName
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "G";

  const handleSelect = () => {
    setSelectedBooking({
      id: b.booking_reference || b.id,
      dbId: b.id,
      guestName,
      phone: guestPhone,
      propertyTitle,
      dates: `${b.check_in} → ${b.check_out}`,
      nights: nightsCount,
      amount: Number(b.total_price || 0),
      status: b.status,
      payoutStatus: b.payment_status,
      guests: t(`${b.guests_count} Guests`, `${b.guests_count} ضيوف`),
      accommodations: propertyLocation,
      refund: b.refund || null,
      transferClaim: b.transferClaim || null,
      settlement: b.settlement || null,
    });
  };

  return (
    <div
      dir={dir}
      onClick={handleSelect}
      className="p-4 hover:bg-surface-container-low/60 transition-colors cursor-pointer flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-bold text-xs uppercase shadow-xs shrink-0">
            {initials}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-title-sm text-sm font-semibold text-on-surface truncate">
              {guestName}
            </span>
            <span className="font-mono text-xs text-primary font-bold">
              {b.booking_reference || `#${b.id.slice(0, 8)}`}
            </span>
          </div>
        </div>

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
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-amber-800 font-label-sm text-[10px] bg-amber-100 font-bold">
              {t("PENDING", "معلق")}
            </span>
          ) : isCancelled ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-rose-700 font-label-sm text-[10px] bg-rose-100 font-bold">
              {t("CANCELLED", "ملغى")}
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-on-surface-variant font-label-sm text-[10px] bg-surface-container font-semibold uppercase">
              {b.status}
            </span>
          )}
        </div>
      </div>

      <div className="text-xs text-on-surface-variant flex items-center justify-between gap-2">
        <span dir="ltr" className="truncate">
          {b.check_in} → {b.check_out}
        </span>
        <span className="font-bold text-on-surface shrink-0">
          {Number(b.total_price).toLocaleString()} {t("SAR", "ر.س")}
        </span>
      </div>
    </div>
  );
}
