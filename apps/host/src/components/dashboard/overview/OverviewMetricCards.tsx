"use client";

import React from "react";
import {
  Wallet,
  TrendingUp,
  CalendarCheck2,
  Percent,
  Star,
  Sparkles,
} from "lucide-react";
import type { OverviewNavigateTab } from "./types";

interface OverviewMetricCardsProps {
  totalRevenue: number;
  activeBookingsCount: number;
  upcomingCheckinsCount?: number;
  occupancyRate?: number;
  bookedNightsThisMonth?: number;
  averageRating?: number;
  reviewsCount?: number;
  lang: "ar" | "en";
  t: (en: string, ar: string) => string;
  onNavigateTab: (tab: OverviewNavigateTab) => void;
}

export function OverviewMetricCards({
  totalRevenue,
  activeBookingsCount,
  upcomingCheckinsCount = 0,
  occupancyRate = 0,
  bookedNightsThisMonth = 0,
  averageRating = 0,
  reviewsCount = 0,
  t,
  onNavigateTab,
}: OverviewMetricCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
      {/* Metric 1: Total Revenue */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              {t("Total Revenue", "إجمالي المبيعات والأرباح")}
            </span>
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
              <Wallet size={20} />
            </div>
          </div>

          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {totalRevenue.toLocaleString()}
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-500">
              {t("SAR", "ر.س")}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span
            className={`inline-flex items-center gap-1 font-bold ${
              totalRevenue > 0 ? "text-emerald-600" : "text-slate-400"
            }`}
          >
            <TrendingUp size={13} />
            <span>{totalRevenue > 0 ? t("Live confirmed sales", "مبيعات مؤكدة") : "0%"}</span>
          </span>
          <button
            type="button"
            onClick={() => onNavigateTab("finance")}
            className="text-slate-400 hover:text-[#4F2396] font-medium cursor-pointer"
          >
            {t("Financials", "المالية")}
          </button>
        </div>
      </div>

      {/* Metric 2: Active Bookings */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              {t("Active Bookings", "الحجوزات النشطة")}
            </span>
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-50 text-[#4F2396]">
              <CalendarCheck2 size={20} />
            </div>
          </div>

          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {activeBookingsCount}
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-500">
              {t("confirmed stays", "حجز مؤكد")}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className={`font-bold ${upcomingCheckinsCount > 0 ? "text-violet-700" : "text-slate-400"}`}>
            {upcomingCheckinsCount > 0
              ? t(`${upcomingCheckinsCount} upcoming check-ins`, `${upcomingCheckinsCount} وصول قادم`)
              : t("0 upcoming check-ins", "0 وصول قادم")}
          </span>
          <button
            type="button"
            onClick={() => onNavigateTab("reservations")}
            className="text-[#4F2396] font-extrabold hover:underline cursor-pointer"
          >
            {t("View all", "عرض الكل")}
          </button>
        </div>
      </div>

      {/* Metric 3: Occupancy Rate */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              {t("Occupancy Rate", "معدل الإشغال")}
            </span>
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-sky-50 text-sky-600">
              <Percent size={20} />
            </div>
          </div>

          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {occupancyRate}%
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-500">
              {t("booked nights", "من إجمالي الأيام")}
            </span>
          </div>

          {/* Visual progress bar */}
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 to-[#4F2396]"
              style={{ width: `${Math.min(100, Math.max(0, occupancyRate))}%` }}
            />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-bold">
            {t(`${bookedNightsThisMonth} nights booked`, `${bookedNightsThisMonth} ليلة محجوزة`)}
          </span>
          <span className={`font-black ${occupancyRate >= 70 ? "text-emerald-600" : "text-slate-400"}`}>
            {occupancyRate >= 70
              ? t("High demand", "طلب عالي")
              : occupancyRate > 0
              ? t("Active", "نشط")
              : t("No bookings yet", "لا توجد حجوزات")}
          </span>
        </div>
      </div>

      {/* Metric 4: Guest Rating */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              {t("Guest Rating", "متوسط تقييم الضيوف")}
            </span>
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-50 text-amber-500">
              <Star
                size={20}
                className={reviewsCount > 0 ? "fill-amber-400 text-amber-400" : "text-slate-300"}
              />
            </div>
          </div>

          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {reviewsCount > 0 ? averageRating.toFixed(1) : "0"}
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-500">
              / 10
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span
            className={`inline-flex items-center gap-1 font-extrabold ${
              reviewsCount > 0 ? "text-[#4F2396]" : "text-slate-400"
            }`}
          >
            <Sparkles size={13} className={reviewsCount > 0 ? "text-[#FF9750]" : "text-slate-300"} />
            <span>
              {reviewsCount > 0
                ? averageRating >= 9
                  ? t("Superhost Status", "مستوى التميز")
                  : t("Rated Host", "مضيف مقيم")
                : t("No ratings yet", "لا توجد تقييمات بعد")}
            </span>
          </span>
          <button
            type="button"
            onClick={() => onNavigateTab("reviews")}
            className="text-slate-500 font-extrabold hover:underline cursor-pointer"
          >
            {t(`${reviewsCount} reviews`, `${reviewsCount} تقييم`)}
          </button>
        </div>
      </div>
    </div>
  );
}

