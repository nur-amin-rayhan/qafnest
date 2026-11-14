"use client";

import React from "react";
import { Wallet, CalendarCheck2, TrendingUp, Star } from "lucide-react";
import { AnalyticsMetrics } from "./types";

interface AnalyticsKpiStripProps {
  metrics: AnalyticsMetrics | null;
  t: (en: string, ar: string) => string;
}

export function AnalyticsKpiStrip({ metrics, t }: AnalyticsKpiStripProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Revenue */}
      <div className="rounded-3xl border border-violet-100 bg-white p-5 shadow-xs flex flex-col justify-between space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
            {t("Total Revenue", "إجمالي المبيعات")}
          </span>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 text-[#4F2396]">
            <Wallet size={18} />
          </div>
        </div>
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-slate-900">
              {(metrics?.totalRevenue || 0).toLocaleString()}
            </span>
            <span className="text-xs font-bold text-slate-400">{t("SAR", "ر.س")}</span>
          </div>
          <p
            className={`mt-1 text-[11px] font-semibold inline-flex items-center gap-1 ${
              (metrics?.totalRevenue || 0) > 0 ? "text-emerald-600" : "text-slate-400"
            }`}
          >
            <TrendingUp size={12} />
            <span>
              {(metrics?.totalRevenue || 0) > 0
                ? t("Verified payout ready", "جاهز للتحويل البنكي")
                : t("No revenue recorded yet", "لا توجد مبيعات مسجلة بعد")}
            </span>
          </p>
        </div>
      </div>

      {/* 2. Confirmed Stays & Nights */}
      <div className="rounded-3xl border border-violet-100 bg-white p-5 shadow-xs flex flex-col justify-between space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
            {t("Confirmed Bookings", "الحجوزات المؤكدة")}
          </span>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CalendarCheck2 size={18} />
          </div>
        </div>
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-slate-900">
              {metrics?.confirmedBookings || 0}
            </span>
            <span className="text-xs font-bold text-slate-400">{t("Bookings", "حجز")}</span>
          </div>
          <p className="mt-1 text-[11px] font-bold text-slate-500">
            {metrics?.totalNights || 0} {t("Total nights booked", "ليلة إقامة مسجلة")}
          </p>
        </div>
      </div>

      {/* 3. Average Daily Rate (ADR) */}
      <div className="rounded-3xl border border-violet-100 bg-white p-5 shadow-xs flex flex-col justify-between space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
            {t("Avg Daily Rate (ADR)", "متوسط السعر لليلة")}
          </span>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <TrendingUp size={18} />
          </div>
        </div>
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-slate-900">
              {(metrics?.averageDailyRate || 0).toLocaleString()}
            </span>
            <span className="text-xs font-bold text-slate-400">{t("SAR / night", "ر.س / ليلة")}</span>
          </div>
          <p className="mt-1 text-[11px] font-bold text-slate-500">
            {(metrics?.averageDailyRate || 0) > 0
              ? t("Dynamic pricing active", "التسعير الديناميكي مفعل")
              : t("No completed nights yet", "لا توجد ليالٍ مكتملة بعد")}
          </p>
        </div>
      </div>

      {/* 4. Occupancy & Quality Score */}
      <div className="rounded-3xl border border-violet-100 bg-white p-5 shadow-xs flex flex-col justify-between space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
            {t("Guest Rating Score", "معدل الرضا والتقييم")}
          </span>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 text-[#FF9750]">
            <Star
              size={18}
              className={(metrics?.totalReviews || 0) > 0 ? "fill-[#FF9750]" : "text-slate-300"}
            />
          </div>
        </div>
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-slate-900">
              {metrics?.averageRating ?? 0}
            </span>
            <span className="text-xs font-bold text-slate-400">/ 10</span>
          </div>
          <p
            className={`mt-1 text-[11px] font-bold ${
              (metrics?.totalReviews || 0) > 0 && (metrics?.averageRating || 0) >= 9
                ? "text-emerald-600"
                : "text-slate-400"
            }`}
          >
            {(metrics?.totalReviews || 0) > 0
              ? (metrics?.averageRating || 0) >= 9
                ? t("Exceptional Host Status", "مستوى مضيف استثنائي")
                : t(`${metrics?.totalReviews || 0} verified reviews`, `${metrics?.totalReviews || 0} تقييم موثق`)
              : t("No ratings submitted yet", "لا توجد تقييمات مسجلة بعد")}
          </p>
        </div>
      </div>
    </div>
  );
}

