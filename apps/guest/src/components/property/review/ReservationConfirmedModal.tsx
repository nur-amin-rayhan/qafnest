"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, KeyRound, Copy } from "lucide-react";
import type { ConfirmedBooking } from "./types";
import GuestLocationShareBar from "@/components/bookings/GuestLocationShareBar";
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
          <span className="mt-4 inline-block text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-300">
            {label("Booking Confirmed · Verified", "تم تأكيد الحجز · مؤكد")}
          </span>
          <h2 className="mt-1 font-display text-2xl font-extrabold text-gray-950 dark:text-white">
            {label("Instant Reservation Confirmed!", "تم تأكيد حجزك الفوري بنجاح!")}
          </h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {label(
              `Reference: ${confirmedBooking.bookingRef} · ${getLocalizedPropertyTitle(confirmedBooking.property, "en")}`,
              `رقم الحجز: ${confirmedBooking.bookingRef} · ${getLocalizedPropertyTitle(confirmedBooking.property, "ar")}`
            )}
          </p>
        </div>

        {/* Smart lock PIN */}
        {confirmedBooking.smartLockPin ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 text-center dark:border-emerald-400/20 dark:bg-emerald-400/10">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-200">
              <KeyRound className="h-4 w-4" />
              <span>
                {label("Self Check-in Smart Lock PIN", "رمز القفل الذكي للدخول الذاتي")}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-center gap-3">
              <span className="font-mono text-3xl font-black tracking-[0.25em] text-emerald-950 dark:text-white">
                {confirmedBooking.smartLockPin}
              </span>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(confirmedBooking.smartLockPin!);
                  setPinCopied(true);
                  setTimeout(() => setPinCopied(false), 2000);
                }}
                className="rounded-lg bg-emerald-200/60 p-2 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-400/20 dark:text-emerald-200 cursor-pointer"
                title={label("Copy PIN", "نسخ الرمز")}
              >
                {pinCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-2 text-[11px] text-emerald-700/80 dark:text-emerald-300/80">
              {label(
                "Enter this code on the door lock keypad upon arrival.",
                "أدخل هذا الرمز في لوحة القفل الذكي عند وصولك للعقار."
              )}
            </p>
          </div>
        ) : (
          <p className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
            {label(
              "Your host will share access details before check-in.",
              "سيشاركك المضيف تفاصيل الدخول قبل تسجيل الوصول."
            )}
          </p>
        )}

        {/* Property Location & Directions Sharing */}
        <GuestLocationShareBar
          property={confirmedBooking.property}
          bookingRef={confirmedBooking.bookingRef}
          language={activeLocale}
          label={label}
          variant="card"
        />

        {/* Booking Summary */}
        <div className="mt-5 space-y-2 rounded-2xl border border-gray-100 bg-gray-50 p-4 text-xs dark:border-white/5 dark:bg-white/[0.02]">
          <div className="flex justify-between text-gray-600 dark:text-gray-300">
            <span>{label("Dates", "التواريخ")}</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {confirmedBooking.checkIn} → {confirmedBooking.checkOut} (
              {confirmedBooking.nights} {label("nights", "ليالٍ")})
            </span>
          </div>
          <div className="flex justify-between text-gray-600 dark:text-gray-300">
            <span>{label("Guests", "الضيوف")}</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {confirmedBooking.guests} {label("guests", "ضيوف")}
            </span>
          </div>
          <div className="flex justify-between border-t border-gray-200/60 pt-2 font-bold text-gray-900 dark:border-white/10 dark:text-white">
            <span>{label("Total Paid", "المبلغ المدفوع")}</span>
            <span className="text-violet-600 dark:text-violet-400">
              {confirmedBooking.amount.toLocaleString()} SAR
            </span>
          </div>
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

