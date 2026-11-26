"use client";

import React from "react";
import {
  Building2,
  Clock,
  User,
  Phone,
  Users,
  KeyRound,
  CheckCircle2,
  Copy,
  Lock,
} from "lucide-react";
import type { HostBookingItem } from "./types";

interface BookingCardItemProps {
  item: HostBookingItem;
  actionLoadingId: string | null;
  copiedPinId: string | null;
  lang: "ar" | "en";
  t: (en: string, ar: string) => string;
  onSelectBooking: (item: HostBookingItem) => void;
  onCopyPin: (pin: string, id: string) => void;
  onUpdateStatus: (id: string, status: "confirmed" | "cancelled") => void;
}

export function BookingCardItem({
  item,
  actionLoadingId,
  copiedPinId,
  lang,
  t,
  onSelectBooking,
  onCopyPin,
  onUpdateStatus,
}: BookingCardItemProps) {
  const isToday = item.stayStatus === "today" || item.stayStatus === "in_house";
  const isPending = item.status === "pending";

  return (
    <div
      className={`relative rounded-2xl border bg-white p-5 sm:p-6 transition shadow-xs hover:shadow-md ${
        isToday
          ? "border-emerald-300 ring-1 ring-emerald-200 bg-emerald-50/20"
          : isPending
          ? "border-amber-200 bg-amber-50/20"
          : "border-slate-200/90"
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        {/* Left: Thumbnail & Property/Guest Info */}
        <div className="flex items-start gap-4">
          {item.propertyImage ? (
            <div className="relative h-18 w-22 sm:h-20 sm:w-26 shrink-0 overflow-hidden rounded-xl bg-slate-100 border border-slate-200/80">
              <img
                src={item.propertyImage}
                alt={item.propertyTitle}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex h-18 w-22 sm:h-20 sm:w-26 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-[#4F2396]">
              <Building2 size={24} />
            </div>
          )}

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs sm:text-sm font-black text-[#4F2396]">
                {item.booking_reference}
              </span>

              {/* Status Tag */}
              <span
                className={`rounded-md px-2 py-0.5 text-[10px] font-black ${
                  item.status === "confirmed"
                    ? "bg-emerald-100 text-emerald-800"
                    : item.status === "pending"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-rose-100 text-rose-800"
                }`}
              >
                {item.status === "confirmed"
                  ? t("Confirmed & Paid", "مؤكد ومدفوع")
                  : item.status === "pending"
                  ? t("Pending Approval", "قيد الانتظار")
                  : t("Cancelled", "ملغي")}
              </span>

              {/* Timing Tag */}
              {isToday && (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500 text-white px-2 py-0.5 text-[10px] font-black animate-pulse">
                  <Clock size={10} />
                  <span>{t("In House / Staying Today", "نزيل حالي · اليوم")}</span>
                </span>
              )}
            </div>

            {/* Property Title */}
            <h3 className="text-sm sm:text-base font-black text-slate-900 leading-snug">
              {lang === "ar" ? item.propertyTitleAr : item.propertyTitle}
            </h3>

            {/* Guest & Contact Info */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-500 pt-0.5">
              <span className="inline-flex items-center gap-1">
                <User size={13} className="text-slate-400" />
                <span>{item.guestName}</span>
              </span>
              {item.guestPhone && (
                <a
                  href={`tel:${item.guestPhone}`}
                  className="inline-flex items-center gap-1 text-[#4F2396] hover:underline"
                >
                  <Phone size={13} />
                  <span dir="ltr">{item.guestPhone}</span>
                </a>
              )}
              <span className="inline-flex items-center gap-1 text-slate-400">
                <Users size={13} />
                <span>{item.guests_count} {t("Guests", "ضيوف")}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Middle: Check-in / Out & Smart Lock PIN */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t lg:border-t-0 lg:border-l lg:border-r border-slate-100 pt-3 lg:pt-0 px-0 lg:px-6">
          {/* Dates */}
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              {t("Check-In", "الوصول")}
            </span>
            <p className="text-xs sm:text-sm font-black text-slate-800 mt-0.5">
              {item.check_in}
            </p>
            <span className="text-[10px] font-bold text-slate-400">
              3:00 {t("PM", "مساءً")}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              {t("Check-Out", "المغادرة")}
            </span>
            <p className="text-xs sm:text-sm font-black text-slate-800 mt-0.5">
              {item.check_out}
            </p>
            <span className="text-[10px] font-bold text-slate-400">
              {item.total_nights} {t("Nights", "ليالٍ")}
            </span>
          </div>

          {/* Smart Lock PIN Box */}
          <div className="col-span-2 sm:col-span-1 flex flex-col justify-center">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 inline-flex items-center gap-1">
              <KeyRound size={11} className="text-[#FF9750]" />
              <span>{t("Lock PIN", "رمز القفل")}</span>
            </span>

            {item.smart_lock_pin ? (
              <div className="mt-1 flex items-center gap-1.5">
                <span className="rounded-lg bg-violet-100/80 px-2.5 py-1 font-mono text-sm font-black text-[#4F2396] tracking-wider">
                  {item.smart_lock_pin}
                </span>
                <button
                  type="button"
                  onClick={() => onCopyPin(item.smart_lock_pin!, item.id)}
                  title={t("Copy PIN", "نسخ الرمز")}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
                >
                  {copiedPinId === item.id ? (
                    <CheckCircle2 size={14} className="text-emerald-600" />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
                {item.status !== "cancelled" && (
                  <button
                    type="button"
                    onClick={() => onSelectBooking(item)}
                    title={t("Set Manual PIN", "تعيين رمز القفل يدوياً")}
                    className="rounded-lg px-2 py-1 text-[11px] font-bold text-[#4F2396] hover:bg-violet-50 transition cursor-pointer"
                  >
                    {t("Edit", "تعديل")}
                  </button>
                )}
              </div>
            ) : item.status === "cancelled" ? (
              <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-slate-400">
                <Lock size={11} />
                <span>{t("PIN Disabled (Cancelled)", "معطل (حجز ملغي)")}</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onSelectBooking(item)}
                className="mt-1 inline-flex items-center gap-1 text-xs font-black text-[#4F2396] hover:underline cursor-pointer"
              >
                <KeyRound size={12} />
                <span>{t("Set Manual PIN", "تعيين رمز يدوياً")}</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Total Price & Actions */}
        <div className="flex flex-wrap lg:flex-col items-center lg:items-end justify-between gap-3 shrink-0">
          <div className="text-left rtl:text-right">
            <span className="text-[10px] font-black text-slate-400 block">
              {t("Booking Total", "إجمالي الحجز")}
            </span>
            <span className="text-base sm:text-lg font-black text-slate-900">
              {item.total_price} {t("SAR", "ر.س")}
            </span>
            <span className="block text-[10px] font-bold text-slate-400 uppercase">
              {item.payment_method || "Online"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isPending && (
              <>
                <button
                  type="button"
                  onClick={() => onUpdateStatus(item.id, "confirmed")}
                  disabled={actionLoadingId === item.id}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-black shadow-xs transition cursor-pointer"
                >
                  {t("Approve", "قبول")}
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateStatus(item.id, "cancelled")}
                  disabled={actionLoadingId === item.id}
                  className="rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 px-3 py-1.5 text-xs font-black shadow-xs transition cursor-pointer"
                >
                  {t("Decline", "رفض")}
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => onSelectBooking(item)}
              className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-1.5 text-xs font-black shadow-xs transition cursor-pointer"
            >
              {t("Details", "التفاصيل")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

