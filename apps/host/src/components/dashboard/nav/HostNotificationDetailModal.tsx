"use client";

import React from "react";
import { X, Bell, ArrowUpRight, CalendarDays, Wallet, Building2, Star } from "lucide-react";
import type { HostNotification, Module } from "../HostTopNav";

export interface NotificationDestination {
  module: Module;
  bookingId?: string | null;
  propertyId?: string | null;
  ctaEn: string;
  ctaAr: string;
}

export function resolveHostNotificationDestination(
  notif: HostNotification
): NotificationDestination {
  const haystack = `${notif.event_type || ""} ${notif.title || ""} ${notif.body || ""}`.toLowerCase();

  if (
    haystack.includes("payout") ||
    haystack.includes("remit") ||
    haystack.includes("settlement") ||
    haystack.includes("iban") ||
    haystack.includes("sarie") ||
    haystack.includes("مستحق") ||
    haystack.includes("حوالة") ||
    haystack.includes("سريع")
  ) {
    return {
      module: "finance",
      propertyId: notif.property_id,
      ctaEn: "Open Financials & Payouts",
      ctaAr: "فتح مركز المالية والحوالات",
    };
  }

  if (haystack.includes("review") || haystack.includes("rating") || haystack.includes("تقييم")) {
    return {
      module: "reviews",
      propertyId: notif.property_id,
      ctaEn: "View Guest Reviews",
      ctaAr: "عرض تقييمات الضيوف",
    };
  }

  if (
    notif.booking_id ||
    haystack.includes("booking") ||
    haystack.includes("reserv") ||
    haystack.includes("guest") ||
    haystack.includes("حجز") ||
    haystack.includes("ضيف")
  ) {
    return {
      module: "reservations",
      bookingId: notif.booking_id,
      propertyId: notif.property_id,
      ctaEn: "Open Reservation Details",
      ctaAr: "فتح تفاصيل الحجز",
    };
  }

  if (
    notif.property_id ||
    haystack.includes("property") ||
    haystack.includes("listing") ||
    haystack.includes("approved") ||
    haystack.includes("rejected") ||
    haystack.includes("عقار")
  ) {
    return {
      module: "properties",
      propertyId: notif.property_id,
      ctaEn: "Inspect Property Listing",
      ctaAr: "مراجعة ملف العقار",
    };
  }

  return {
    module: "overview",
    ctaEn: "Return to Overview",
    ctaAr: "العودة للرئيسية",
  };
}

interface HostNotificationDetailModalProps {
  notification: HostNotification | null;
  onClose: () => void;
  onNavigateDestination: (dest: NotificationDestination) => void;
  lang: "ar" | "en";
  t: (en: string, ar: string) => string;
}

export function HostNotificationDetailModal({
  notification,
  onClose,
  onNavigateDestination,
  lang,
  t,
}: HostNotificationDetailModalProps) {
  if (!notification) return null;

  const dest = resolveHostNotificationDestination(notification);
  const DestIcon =
    dest.module === "finance"
      ? Wallet
      : dest.module === "reservations"
      ? CalendarDays
      : dest.module === "reviews"
      ? Star
      : Building2;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/55 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-6 shadow-2xl space-y-5 text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-100 text-[#4F2396] shrink-0">
              <Bell size={18} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                {notification.event_type
                  ? notification.event_type.replace(/_/g, " ")
                  : t("Notification Update", "إشعار المنصة")}
              </span>
              <h3 className="text-base font-black text-slate-900 mt-0.5 leading-snug">
                {notification.title}
              </h3>
              <span className="text-[11px] font-medium text-slate-400 block mt-1">
                {new Date(notification.created_at).toLocaleString(
                  lang === "ar" ? "ar-SA" : "en-US"
                )}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
            aria-label={t("Close", "إغلاق")}
          >
            <X size={18} />
          </button>
        </div>

        <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
          {notification.body}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            {t("Close", "إغلاق")}
          </button>
          <button
            type="button"
            onClick={() => {
              onNavigateDestination(dest);
              onClose();
            }}
            className="inline-flex items-center gap-1.5 rounded-2xl bg-[#4F2396] hover:bg-[#3d1979] px-5 py-2 text-xs font-black text-white shadow-sm cursor-pointer transition"
          >
            <DestIcon size={14} />
            <span>{t(dest.ctaEn, dest.ctaAr)}</span>
            <ArrowUpRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
