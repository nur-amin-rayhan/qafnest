"use client";

import React from "react";
import { CalendarDays, Star, KeyRound, ArrowRight } from "lucide-react";
import type { HostBookingSummary, HostReviewSummary, OverviewNavigateTab } from "./types";

interface OverviewRecentActivityProps {
  bookings?: HostBookingSummary[];
  reviews?: HostReviewSummary[];
  lang: "ar" | "en";
  t: (en: string, ar: string) => string;
  onNavigateTab: (tab: OverviewNavigateTab) => void;
}

export function OverviewRecentActivity({
  bookings = [],
  reviews = [],
  lang,
  t,
  onNavigateTab,
}: OverviewRecentActivityProps) {
  const displayBookings = bookings.slice(0, 4).map((b) => ({
    id: b.booking_reference || b.id,
    guest: b.guestName || t("Guest", "ضيف"),
    property: b.propertyTitle || "",
    dates: `${b.check_in} - ${b.check_out}`,
    amount: Number(b.total_price || 0).toLocaleString(),
    pin: b.smart_lock_pin || "-",
    status: b.status,
  }));

  const displayReviews = reviews.slice(0, 3);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Panel 1: Latest Bookings */}
      <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#121324] p-5 sm:p-7 shadow-xs flex flex-col justify-between transition-colors">
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300">
                <CalendarDays size={18} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {t("Recent Guest Bookings", "أحدث حجوزات الضيوف")}
                </h3>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                  {t("Live reservations from guest app", "الحجوزات المباشرة القادمة والجارية")}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab("reservations")}
              className="text-xs font-bold text-slate-900 dark:text-white hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer whitespace-nowrap shrink-0 px-2 py-1"
            >
              {t("View All", "عرض الكل")}
            </button>
          </div>

          {/* Bookings List */}
          <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800/80 space-y-2">
            {displayBookings.length === 0 ? (
              <div className="py-10 text-center text-xs font-bold text-slate-400 dark:text-slate-500">
                {t("No guest bookings received yet.", "لا توجد حجوزات ضيوف مسجلة حتى الآن.")}
              </div>
            ) : (
              displayBookings.map((booking) => (
                <div key={booking.id} className="pt-3 flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-xs">
                      {booking.guest[0] || "G"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                          {booking.guest}
                        </span>
                        <span className="rounded bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 text-[10px] font-black text-emerald-800 dark:text-emerald-300">
                          {booking.status === "confirmed"
                            ? t("Confirmed", "مؤكد")
                            : booking.status === "cancelled"
                            ? t("Cancelled", "ملغي")
                            : t("Pending", "قيد الانتظار")}
                        </span>
                      </div>
                      {booking.property && (
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                          {booking.property}
                        </p>
                      )}
                      <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                        {booking.dates}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                      {booking.amount} {t("SAR", "ر.س")}
                    </span>
                    <div className="mt-1 flex items-center justify-end gap-1 text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400">
                      <KeyRound size={12} className="text-[#FF9750]" />
                      <span>{booking.pin}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80">
          <button
            type="button"
            onClick={() => onNavigateTab("reservations")}
            className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>{t("Open Reservations Center", "فتح مركز إدارة الحجوزات الكامل")}</span>
            <ArrowRight size={14} className={lang === "ar" ? "rotate-180" : ""} />
          </button>
        </div>
      </div>

      {/* Panel 2: Guest Reviews */}
      <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#121324] p-5 sm:p-7 shadow-xs flex flex-col justify-between transition-colors">
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                <Star size={18} className="fill-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {t("Guest Reviews & Feedback", "تقييمات وآراء النزلاء")}
                </h3>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                  {t("Verified guest experiences", "آراء حقيقية من نزلاء أتموا إقامتهم")}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab("reviews")}
              className="text-xs font-bold text-slate-900 dark:text-white hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer whitespace-nowrap shrink-0 px-2 py-1"
            >
              {t("View All", "عرض الكل")}
            </button>
          </div>

          {/* Reviews List */}
          <div className="mt-4 space-y-3.5">
            {displayReviews.length === 0 ? (
              <div className="py-10 text-center text-xs font-bold text-slate-400 dark:text-slate-500">
                {t("No guest reviews submitted yet.", "لا توجد تقييمات من النزلاء حتى الآن.")}
              </div>
            ) : (
              displayReviews.map((rev) => {
                const stars = Math.min(5, Math.max(1, Math.round((Number(rev.rating) || 0) / 2)));
                const commentText =
                  lang === "ar"
                    ? rev.comment_ar || rev.comment || ""
                    : rev.comment || rev.comment_ar || "";
                const dateFormatted = rev.created_at
                  ? new Date(rev.created_at).toLocaleDateString(
                      lang === "ar" ? "ar-SA" : "en-US",
                      { day: "numeric", month: "short", year: "numeric" }
                    )
                  : "";
                return (
                  <div key={rev.id} className="rounded-2xl bg-slate-50/70 dark:bg-slate-900/40 p-4 border border-slate-100 dark:border-slate-800/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          {rev.guest_display_name || t("Verified Guest", "ضيف موثق")}
                        </span>
                        <span className="inline-flex text-amber-400">
                          {"★".repeat(stars)}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">{dateFormatted}</span>
                    </div>
                    {commentText && (
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                        &quot;{commentText}&quot;
                      </p>
                    )}
                    <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400 dark:text-slate-500 font-bold">
                      <span>{rev.propertyTitle || ""}</span>
                      <button
                        type="button"
                        onClick={() => onNavigateTab("reviews")}
                        className="text-violet-600 dark:text-violet-400 hover:underline font-extrabold cursor-pointer"
                      >
                        {t("Reply to guest", "الرد على النزيل")}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80">
          <button
            type="button"
            onClick={() => onNavigateTab("reviews")}
            className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>{t("Open Reviews & Ratings Hub", "فتح مركز التقييمات والردود الكامل")}</span>
            <ArrowRight size={14} className={lang === "ar" ? "rotate-180" : ""} />
          </button>
        </div>
      </div>
    </div>
  );
}

