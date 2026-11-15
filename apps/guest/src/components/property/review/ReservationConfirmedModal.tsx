"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, KeyRound, Copy, ExternalLink } from "lucide-react";
import { resolvePropertyGoogleMapsUrl } from "@qafnest/shared";
import type { ConfirmedBooking } from "./types";
import { getLocalizedPropertyTitle } from "@/lib/localization/localeHelper";

interface ReservationConfirmedModalProps {
  confirmedBooking: ConfirmedBooking | null;
  label: (en: string, ar: string) => string;
}

export default function ReservationConfirmedModal({
  confirmedBooking,
  label,
}: ReservationConfirmedModalProps) {
  const [pinCopied, setPinCopied] = useState(false);

  if (!confirmedBooking) return null;

  const activeLocale = label("en", "ar") === "en" ? "en" : "ar";
  const localizedPropertyTitle = getLocalizedPropertyTitle(confirmedBooking.property, activeLocale);
  const propAny = confirmedBooking.property as Record<string, any> | undefined;
  const mapsUrl = confirmedBooking.property
    ? resolvePropertyGoogleMapsUrl({
        title: confirmedBooking.property.title,
        titleAr: propAny?.titleAr ?? propAny?.title_ar ?? null,
        city: propAny?.city_name ?? propAny?.city ?? null,
        state: propAny?.state ?? null,
        stateAr: propAny?.stateAr ?? propAny?.state_ar ?? null,
        district: propAny?.district ?? null,
        districtAr: propAny?.districtAr ?? propAny?.district_ar ?? null,
        street: propAny?.street ?? null,
        streetAr: propAny?.streetAr ?? propAny?.street_ar ?? null,
        address: propAny?.address ?? null,
        addressAr: propAny?.addressAr ?? propAny?.address_ar ?? null,
        postalCode: propAny?.postalCode ?? propAny?.postal_code ?? null,
        lat: propAny?.lat ?? null,
        lng: propAny?.lng ?? null,
        googleMapsUrl: propAny?.googleMapsUrl ?? propAny?.google_maps_url ?? null,
      })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
    >
      <motion.section
        initial={{ scale: 0.95, y: 15 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 15 }}
        className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-emerald-300/40 bg-white p-6 shadow-2xl dark:border-emerald-500/30 dark:bg-[#12101a] sm:p-8"
      >
        <div className="text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 shadow-sm dark:bg-emerald-400/10 dark:text-emerald-300">
            <Check className="h-7 w-7" />
          </span>
          <span className="mt-4 inline-block text-[11px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-300">
            {label("Booking Confirmed", "تم تأكيد الحجز")} · #{confirmedBooking.bookingRef}
          </span>
          <h2 className="mt-1.5 font-display text-2xl font-extrabold text-gray-950 dark:text-white">
            {localizedPropertyTitle}
          </h2>
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3.5 py-1 text-xs font-extrabold text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
            <span>{label("Total Paid:", "المبلغ المدفوع:")}</span>
            <span>{confirmedBooking.amount.toLocaleString()} {label("SAR", "ر.س")}</span>
          </p>
        </div>

        {/* Smart Lock & Open Map */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 dark:border-emerald-400/20 dark:bg-emerald-400/10">
          {confirmedBooking.smartLockPin ? (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-200">
                <KeyRound className="h-4 w-4" />
                <span>{label("Smart Lock PIN", "رمز القفل الذكي")}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-2xl font-black tracking-[0.2em] text-emerald-950 dark:text-white">
                  {confirmedBooking.smartLockPin}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard.writeText(confirmedBooking.smartLockPin!);
                    setPinCopied(true);
                    setTimeout(() => setPinCopied(false), 2000);
                  }}
                  className="rounded-lg bg-emerald-200/70 px-2.5 py-1.5 text-[11px] font-bold text-emerald-900 hover:bg-emerald-200 dark:bg-emerald-400/20 dark:text-emerald-200 inline-flex items-center gap-1 cursor-pointer transition"
                  title={label("Copy PIN", "نسخ الرمز")}
                >
                  {pinCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{pinCopied ? label("Copied", "تم النسخ") : label("Copy", "نسخ")}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-200">
              <KeyRound className="h-4 w-4 shrink-0" />
              <span>{label("Access code will be shared before check-in.", "سيصلك رمز الدخول قبل تسجيل الوصول.")}</span>
            </div>
          )}

          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-white px-3.5 py-2 text-xs font-bold text-violet-700 shadow-xs hover:bg-violet-50 dark:border-violet-500/30 dark:bg-white/10 dark:text-violet-200 transition shrink-0"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>{label("Open Map", "فتح الخريطة")}</span>
            </a>
          )}
        </div>

        {/* Compact Stay Summary */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-xs dark:border-white/5 dark:bg-white/[0.02]">
          <span className="font-semibold text-gray-700 dark:text-gray-200" dir="ltr">
            {confirmedBooking.checkIn} → {confirmedBooking.checkOut} ({confirmedBooking.nights} {label("nights", "ليالٍ")})
          </span>
          <span className="font-bold text-violet-700 dark:text-violet-400">
            {confirmedBooking.amount.toLocaleString()} {label("SAR", "ر.س")}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
          <Link
            href={`/${activeLocale}/my-bookings`}
            className="flex-1 rounded-xl bg-violet-700 py-3 text-center text-xs font-bold text-white shadow-md hover:bg-violet-800 transition"
          >
            {label("View in My Bookings", "عرض في حجوزاتي")}
          </Link>
          <Link
            href={`/${activeLocale}`}
            className="rounded-xl border border-gray-200 bg-white py-3 px-4 text-center text-xs font-bold text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-200"
          >
            {label("Back to Home", "الرئيسية")}
          </Link>
        </div>
      </motion.section>
    </motion.div>
  );
}

