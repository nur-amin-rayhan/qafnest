"use client";

import React from "react";
import Link from "next/link";
import { X, Headphones, PhoneCall, MessageCircle, Mail, ExternalLink } from "lucide-react";
import { QAFNEST_SUPPORT_CONTACT } from "@qafnest/shared";
import type { Booking } from "../types";

interface GuestCancelRefundModalProps {
  booking: Booking | null;
  onClose: () => void;
  onCancelled?: () => void;
  language: "en" | "ar";
  label: (en: string, ar: string) => string;
}

export function GuestCancelRefundModal({
  booking,
  onClose,
  language,
  label,
}: GuestCancelRefundModalProps) {
  if (!booking) return null;

  const bookingRef = booking.booking_reference || booking.id;
  const propertyTitle =
    (language === "ar"
      ? booking.property?.title_ar || booking.property?.titleAr || booking.property?.title
      : booking.property?.title) ||
    label("Your Reservation", "حجزك");

  const whatsappMessage =
    language === "ar"
      ? `مرحباً فريق خدمة عملاء قاف نست، أرغب في الاستفسار عن إلغاء الحجز رقم #${bookingRef} (${propertyTitle}).`
      : `Hello QafNest Customer Support, I would like assistance cancelling reservation #${bookingRef} (${propertyTitle}).`;
  const whatsappUrl = `${QAFNEST_SUPPORT_CONTACT.whatsappHref}?text=${encodeURIComponent(whatsappMessage)}`;

  const mailSubject =
    language === "ar"
      ? `طلب إلغاء حجز #${bookingRef}`
      : `Reservation Cancellation Request #${bookingRef}`;
  const mailHref = `mailto:${QAFNEST_SUPPORT_CONTACT.supportEmail}?subject=${encodeURIComponent(mailSubject)}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-support-modal-title"
    >
      <div
        dir={language === "ar" ? "rtl" : "ltr"}
        className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Headphones className="h-4 w-4" />
            </div>
            <h2 id="cancel-support-modal-title" className="text-base font-bold text-slate-900">
              {label("Cancel Reservation via Customer Support", "إلغاء الحجز عبر خدمة العملاء")}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={label("Close", "إغلاق")}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 space-y-2.5">
            <p className="text-sm font-bold text-slate-900">
              {label(
                "Please speak with QafNest Customer Support to cancel this reservation.",
                "يرجى التحدث مع خدمة عملاء قاف نست لإلغاء هذا الحجز."
              )}
            </p>
            <p className="text-xs text-slate-700 leading-relaxed">
              {label(
                `Online self-cancellation from the booking slip is disabled. Our support specialists are ready to review your booking #${bookingRef} and assist you directly.`,
                `الإلغاء الذاتي المباشر من إيصال الحجز غير متاح. فريق خدمة العملاء جاهز لمراجعة الحجز رقم #${bookingRef} ومساعدتك مباشرة.`
              )}
            </p>
            <div className="pt-2 border-t border-amber-200/70 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
              <span>
                {label("Booking Ref:", "رقم الحجز:")}{" "}
                <strong className="font-mono text-slate-900">#{bookingRef}</strong>
              </span>
              <span>
                {label("Total Paid:", "المبلغ المدفوع:")}{" "}
                <strong className="font-mono text-slate-900">{booking.total_price} SAR</strong>
              </span>
            </div>
          </div>

          {/* Direct Support Channels */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href={QAFNEST_SUPPORT_CONTACT.telHref}
              className="flex items-center gap-3 rounded-xl border border-violet-200 bg-violet-50/60 p-3.5 hover:bg-violet-100/70 transition"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white">
                <PhoneCall className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-violet-900">
                  {label("Call Customer Support", "الاتصال بخدمة العملاء")}
                </div>
                <div className="text-xs font-mono font-bold text-violet-700" dir="ltr">
                  {QAFNEST_SUPPORT_CONTACT.displayPhone}
                </div>
              </div>
            </a>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 hover:bg-emerald-100/70 transition"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
                <MessageCircle className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-emerald-900">
                  {label("WhatsApp Support", "دعم الواتساب")}
                </div>
                <div className="text-xs font-mono font-bold text-emerald-700" dir="ltr">
                  {QAFNEST_SUPPORT_CONTACT.displayPhone}
                </div>
              </div>
            </a>

            <a
              href={mailHref}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 hover:bg-slate-100 transition"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-700 text-white">
                <Mail className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-slate-900">
                  {label("Email Support", "البريد الإلكتروني")}
                </div>
                <div className="text-xs text-slate-600 truncate" dir="ltr">
                  {QAFNEST_SUPPORT_CONTACT.supportEmail}
                </div>
              </div>
            </a>

            <Link
              href={`/${language}/contact`}
              onClick={onClose}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 hover:bg-slate-100 transition"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white">
                <ExternalLink className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-slate-900">
                  {label("Contact Us Page", "صفحة تواصل معنا")}
                </div>
                <div className="text-xs text-slate-600 truncate">
                  {label("Send support inquiry", "إرسال طلب دعم")}
                </div>
              </div>
            </Link>
          </div>

          <div className="flex items-center justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition cursor-pointer"
            >
              {label("Keep Reservation", "الاحتفاظ بالحجز")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
