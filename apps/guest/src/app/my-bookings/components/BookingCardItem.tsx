"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  KeyRound,
  MessageSquareText,
  FileText,
  Copy,
  Check,
  ExternalLink,
  CalendarPlus,
  AlertTriangle,
  Building2,
  CheckCircle2,
  RotateCcw,
  ArrowRight,
} from "lucide-react";
import type { Booking } from "../types";
import { GuestInvoiceModal } from "./GuestInvoiceModal";
import { GuestCancelRefundModal } from "./GuestCancelRefundModal";
import { GuestTransferClaimModal } from "./GuestTransferClaimModal";
import GuestLocationShareBar from "@/components/bookings/GuestLocationShareBar";
import { formatPinDisplay } from "@/lib/services/smartLockPinService";
import {
  getLocalizedPropertyTitle,
  getLocalizedPropertyLocation,
} from "@/lib/localization/localeHelper";

interface BookingCardItemProps {
  booking: Booking;
  todayInSaudiArabia: string;
  language: "en" | "ar";
  label: (en: string, ar: string) => string;
  onRefresh?: () => void;
}

export default function BookingCardItem({
  booking,
  todayInSaudiArabia,
  language,
  label,
  onRefresh,
}: BookingCardItemProps) {
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);

  const currentPin = booking.smart_lock_pin || null;
  const [copiedPin, setCopiedPin] = useState(false);

  const title = booking.property
    ? getLocalizedPropertyTitle(booking.property, language)
    : "QafNest stay";
  const propertyLocation = booking.property
    ? getLocalizedPropertyLocation(booking.property, language).location
    : language === "ar"
    ? "المملكة العربية السعودية"
    : "Saudi Arabia";

  const isPaidAndConfirmed =
    (booking.status === "confirmed" || booking.status === "completed") &&
    booking.payment_status === "success";

  const isPendingSadad =
    booking.status === "pending" ||
    booking.isSadadHold ||
    Boolean(booking.sadadInfo);

  const isCancelled = booking.status === "cancelled";
  const refund = booking.refund;
  const transferClaim = booking.transferClaim;

  const canReview =
    isPaidAndConfirmed &&
    booking.check_out <= todayInSaudiArabia &&
    Boolean(booking.property?.id);

  const propertyId = booking.property?.id || (booking as unknown as { property_id?: string }).property_id;
  const propertyUrl = propertyId ? `/property/${encodeURIComponent(propertyId)}` : null;

  const handleCopyPin = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentPin) return;
    navigator.clipboard?.writeText(currentPin);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  return (
    <>
      <article className="overflow-hidden rounded-3xl border border-violet-200/85 bg-white shadow-[0_12px_35px_rgba(109,40,217,0.06)] dark:border-violet-500/20 dark:bg-[#12101a]">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-violet-100 p-5 dark:border-violet-500/15 sm:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              {label("Reservation", "رقم الحجز")} {booking.booking_reference || booking.id.slice(0, 10).toUpperCase()}
            </p>
            {propertyUrl ? (
              <Link
                href={propertyUrl}
                className="group mt-1 inline-flex items-center gap-2 hover:opacity-90"
                title={label("View property and re-book", "عرض العقار والحجز مجدداً")}
              >
                <h2 className="text-xl font-bold text-gray-950 group-hover:text-violet-700 dark:text-white dark:group-hover:text-violet-400 transition-colors">
                  {title}
                </h2>
                <ExternalLink className="h-4 w-4 text-gray-400 opacity-60 group-hover:text-violet-600 group-hover:opacity-100 transition-all shrink-0" />
              </Link>
            ) : (
              <h2 className="mt-1 text-xl font-bold text-gray-950 dark:text-white">{title}</h2>
            )}
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {propertyLocation}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
              booking.status === "confirmed"
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300"
                : booking.status === "cancelled"
                ? "bg-rose-100 text-rose-800 dark:bg-rose-400/10 dark:text-rose-300"
                : "bg-amber-100 text-amber-800 dark:bg-amber-400/10 dark:text-amber-300"
            }`}
          >
            {booking.status === "confirmed"
              ? label("Confirmed", "مؤكد")
              : booking.status === "cancelled"
              ? label("Cancelled", "ملغي")
              : label("Awaiting Payment (SADAD / Bank)", "بانتظار التحويل (سداد / بنكي)")}
          </span>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-4 sm:p-6">
          <div>
            <span className="block text-xs text-gray-500">{label("Check-in", "تسجيل الوصول")}</span>
            <strong className="mt-1 block text-sm">{booking.check_in}</strong>
          </div>
          <div>
            <span className="block text-xs text-gray-500">{label("Check-out", "تسجيل المغادرة")}</span>
            <strong className="mt-1 block text-sm">{booking.check_out}</strong>
          </div>
          <div>
            <span className="block text-xs text-gray-500">{label("Guests · Nights", "الضيوف · الليالي")}</span>
            <strong className="mt-1 block text-sm">
              {booking.guests_count} {label("guests", "ضيوف")} · {booking.total_nights} {label("nights", "ليالٍ")}
            </strong>
          </div>
          <div>
            <span className="block text-xs text-gray-500">
              {isPaidAndConfirmed ? label("Total Paid", "المبلغ المدفوع") : label("Total", "المبلغ الإجمالي")}
            </span>
            <strong className="mt-1 block text-sm text-violet-600 dark:text-violet-400">
              {Number(booking.total_price).toLocaleString()} SAR
            </strong>
          </div>
        </div>

        {/* Pending SADAD / Bank Transfer Reservation Notice */}
        {isPendingSadad && (
          <div className="border-t border-amber-200 bg-amber-50/80 px-5 py-4 dark:border-amber-500/20 dark:bg-amber-500/10 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-amber-700" />
                  <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                    {label("Helpline Reservation Held: Bank / SADAD Payment Required", "حجز مؤقت عبر الدعم: بانتظار إتمام التحويل البنكي أو سداد")}
                  </p>
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  {label(
                    "Transfer to SNB Account (IBAN: SA4410000001234567890123). After sending, click 'Notify Transfer' to submit reference.",
                    "يرجى التحويل لحساب البنك الأهلي (آيبان: SA4410000001234567890123). بعد التحويل اضغط على 'إشعار التحويل' لتأكيد الحجز."
                  )}
                </p>
                {transferClaim && (
                  <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800 mt-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{label("Transfer Claim Submitted", "تم إرسال إشعار التحويل")} (Ref #{transferClaim.transferReference})</span>
                  </div>
                )}
              </div>

              {!transferClaim && (
                <button
                  type="button"
                  onClick={() => setTransferModalOpen(true)}
                  className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3.5 py-2 shadow-xs transition cursor-pointer"
                >
                  {label("I Have Sent Transfer", "تم التحويل - إرسال الإشعار")}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Smart Lock Keyless Access Strip */}
        {isPaidAndConfirmed && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-emerald-200 bg-emerald-50/70 px-5 py-4 dark:border-emerald-500/20 dark:bg-emerald-500/5 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  {label("Smart Lock Keyless Entry", "رمز القفل الذكي (الدخول الذاتي)")}
                </p>
                {currentPin ? (
                  <p className="font-mono text-xl font-extrabold tracking-[0.25em] text-emerald-950 dark:text-white">
                    {formatPinDisplay(currentPin)}
                  </p>
                ) : (
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    {label("PIN will be provided by host prior to check-in.", "سيتم تزويدك برمز الدخول من قبل المضيف قبل موعد الدخول.")}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {currentPin && (
                <button
                  type="button"
                  onClick={handleCopyPin}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-white px-3 py-1.5 text-xs font-bold text-emerald-900 shadow-xs hover:bg-emerald-50 dark:border-emerald-500/30 dark:bg-white/5 dark:text-emerald-200 transition cursor-pointer"
                >
                  {copiedPin ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedPin ? label("Copied", "تم النسخ") : label("Copy", "نسخ")}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Confirmed Property Location & Sharing Bar */}
        {isPaidAndConfirmed && booking.property && (
          <GuestLocationShareBar
            property={booking.property}
            bookingRef={booking.booking_reference || booking.id}
            language={language}
            label={label}
            variant="strip"
          />
        )}

        {/* Cancelled Booking Status Strip */}
        {isCancelled && (
          <div className="border-t border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-900/50 sm:p-6 space-y-3">
            {refund && refund.refundAmount > 0 ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <RotateCcw className="h-4 w-4 text-emerald-600" />
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {label("Exceptional Refund Status", "حالة الاسترداد الاستثنائي")}
                    </h3>
                  </div>
                  <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[11px] font-bold">
                    {refund.status === "disbursed"
                      ? label("Refund Disbursed", "تم صرف الاسترداد")
                      : label("Refund Processing", "جاري معالجة الاسترداد")} · {refund.refundAmount} SAR
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div>
                      <span className="text-slate-500 block text-[10px]">{label("Refund ID", "رقم طلب الاسترداد")}</span>
                      <strong className="font-mono text-slate-800 dark:text-slate-200">{refund.id}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">{label("Type", "النوع")}</span>
                      <strong className="text-emerald-700">{label("Manual Exception", "استثناء إداري")} ({refund.refundPercentage}%)</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">{label("Refund Amount", "المبلغ المسترد")}</span>
                      <strong className="text-emerald-700 font-mono">{refund.refundAmount} SAR</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">{label("Remittance Rail", "قناة التحويل")}</span>
                      <strong className="text-slate-800 dark:text-slate-200 capitalize">{refund.refundMethod.replace("_", " ")}</strong>
                    </div>
                  </div>

                  {/* Timeline visual */}
                  <div className="flex flex-wrap items-center gap-2 text-[11px] pt-1">
                    {refund.timeline.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <span className="flex items-center gap-1 font-semibold text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          {step.title}
                        </span>
                        {idx < refund.timeline.length - 1 && (
                          <ArrowRight className="h-3 w-3 text-slate-300" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-500" />
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  {label(
                    "Reservation cancelled. Paid bookings are strictly non-refundable (0 SAR refunded).",
                    "تم إلغاء الحجز. المبالغ المدفوعة غير قابلة للاسترداد نهائياً (٠ ر.س)."
                  )}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Card Actions Strip: Review, Tax Invoice & Cancel Option */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-5 py-4 dark:border-white/10 sm:px-6">
          <div className="flex items-center gap-2">
            {isPaidAndConfirmed && (
              <button
                type="button"
                onClick={() => setInvoiceModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50/70 hover:bg-violet-100/70 px-3.5 py-2 text-xs font-bold text-[#4F2396] dark:border-violet-500/30 dark:bg-violet-950/30 dark:text-violet-300 transition cursor-pointer"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>{label("Tax Invoice", "الفاتورة الضريبية")}</span>
              </button>
            )}

            {booking.status === "confirmed" && (
              <button
                type="button"
                onClick={() => setCancelModalOpen(true)}
                data-testid={`cancel-booking-btn-${booking.booking_reference || booking.id}`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100/70 px-3.5 py-2 text-xs font-bold text-rose-700 dark:border-rose-500/30 dark:bg-rose-950/30 dark:text-rose-300 transition cursor-pointer"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>{label("Cancel Reservation", "إلغاء الحجز")}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {propertyUrl && (
              <Link
                href={propertyUrl}
                className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-white hover:bg-violet-50 px-3.5 py-2 text-xs font-bold text-violet-700 dark:border-violet-500/30 dark:bg-white/5 dark:text-violet-300 dark:hover:bg-violet-950/40 transition cursor-pointer"
              >
                <CalendarPlus className="h-3.5 w-3.5" />
                <span>{label("Book Again", "احجز مجدداً")}</span>
              </Link>
            )}

            {canReview && booking.property?.id && (
              <Link
                href={`/property/${encodeURIComponent(booking.property.id)}?tab=reviews&review_booking=${encodeURIComponent(
                  booking.id
                )}`}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-800 px-4 py-2 text-xs font-bold text-white transition hover:bg-violet-900 cursor-pointer"
              >
                <MessageSquareText className="h-3.5 w-3.5" />
                <span>{label("Write a verified review", "اكتب تقييماً موثقاً")}</span>
              </Link>
            )}
          </div>
        </div>
      </article>

      {/* Guest Tax Invoice Modal */}
      <GuestInvoiceModal
        booking={invoiceModalOpen ? booking : null}
        onClose={() => setInvoiceModalOpen(false)}
        language={language}
        label={label}
      />

      {/* Guest Cancel & Refund Modal */}
      <GuestCancelRefundModal
        booking={cancelModalOpen ? booking : null}
        onClose={() => setCancelModalOpen(false)}
        onCancelled={() => {
          if (onRefresh) onRefresh();
        }}
        language={language}
        label={label}
      />

      {/* Guest Transfer Claim Modal */}
      <GuestTransferClaimModal
        booking={transferModalOpen ? booking : null}
        onClose={() => setTransferModalOpen(false)}
        onSubmitted={() => {
          if (onRefresh) onRefresh();
        }}
        language={language}
        label={label}
      />
    </>
  );
}
