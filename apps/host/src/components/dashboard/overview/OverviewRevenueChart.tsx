"use client";

import React, { useState, useMemo } from "react";
import type { HostBookingSummary } from "./types";

interface OverviewRevenueChartProps {
  bookings?: HostBookingSummary[];
  lang: "ar" | "en";
  t: (en: string, ar: string) => string;
}

const MONTH_NAMES_AR = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];
const MONTH_NAMES_EN = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function OverviewRevenueChart({ bookings = [], lang, t }: OverviewRevenueChartProps) {
  const [chartTimeframe, setChartTimeframe] = useState<"30d" | "90d" | "year">("year");
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  const confirmedBookings = useMemo(() => {
    return bookings.filter(
      (b) =>
        (b.status === "confirmed" || b.status === "completed") &&
        (!b.payment_status || b.payment_status === "success")
    );
  }, [bookings]);

  const chartData = useMemo(() => {
    const now = new Date();

    if (chartTimeframe === "30d") {
      const weeks = [
        { labelAr: "الأسبوع 1", labelEn: "Week 1", amount: 0, bookings: 0 },
        { labelAr: "الأسبوع 2", labelEn: "Week 2", amount: 0, bookings: 0 },
        { labelAr: "الأسبوع 3", labelEn: "Week 3", amount: 0, bookings: 0 },
        { labelAr: "الأسبوع 4", labelEn: "Week 4", amount: 0, bookings: 0 },
      ];
      const thirtyDaysAgo = now.getTime() - 28 * 86_400_000;
      for (const b of confirmedBookings) {
        const ts = Date.parse(b.created_at);
        if (!ts || ts < thirtyDaysAgo) continue;
        const weekIdx = Math.min(3, Math.max(0, Math.floor((ts - thirtyDaysAgo) / (7 * 86_400_000))));
        weeks[weekIdx].amount += Number(b.total_price) || 0;
        weeks[weekIdx].bookings += 1;
      }
      return weeks;
    }

    if (chartTimeframe === "90d") {
      const buckets: Array<{ key: string; labelAr: string; labelEn: string; amount: number; bookings: number }> = [];
      for (let i = 2; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        buckets.push({
          key,
          labelAr: MONTH_NAMES_AR[d.getMonth()],
          labelEn: MONTH_NAMES_EN[d.getMonth()],
          amount: 0,
          bookings: 0,
        });
      }
      for (const b of confirmedBookings) {
        const d = new Date(b.created_at);
        if (isNaN(d.getTime())) continue;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const hit = buckets.find((x) => x.key === key);
        if (hit) {
          hit.amount += Number(b.total_price) || 0;
          hit.bookings += 1;
        }
      }
      return buckets;
    }

    const currentYear = now.getFullYear();
    const months = MONTH_NAMES_EN.map((en, mIdx) => ({
      labelAr: MONTH_NAMES_AR[mIdx],
      labelEn: en,
      amount: 0,
      bookings: 0,
    }));
    for (const b of confirmedBookings) {
      const d = new Date(b.created_at);
      if (isNaN(d.getTime()) || d.getFullYear() !== currentYear) continue;
      const m = d.getMonth();
      months[m].amount += Number(b.total_price) || 0;
      months[m].bookings += 1;
    }
    return months;
  }, [chartTimeframe, confirmedBookings]);

  const maxChartAmount = useMemo(() => {
    const peak = Math.max(...chartData.map((d) => d.amount), 0);
    return peak > 0 ? peak : 0;
  }, [chartData]);

  const topBucket = useMemo(() => {
    let best = chartData[0] || { labelAr: "—", labelEn: "—", amount: 0, bookings: 0 };
    for (const item of chartData) {
      if (item.amount > best.amount) best = item;
    }
    return best;
  }, [chartData]);

  const averageDailyRate = useMemo(() => {
    let totalRev = 0;
    let totalNights = 0;
    for (const b of confirmedBookings) {
      totalRev += Number(b.total_price) || 0;
      const start = Date.parse(b.check_in);
      const end = Date.parse(b.check_out);
      const n = start && end && end > start ? Math.round((end - start) / 86_400_000) : 1;
      totalNights += Math.max(1, n);
    }
    return totalNights > 0 ? Math.round(totalRev / totalNights) : 0;
  }, [confirmedBookings]);

  return (
    <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-[#4F2396]" />
            <h2 className="text-lg sm:text-xl font-black text-slate-900">
              {t("Sales & Revenue Trends", "أداء المبيعات والإيرادات الشهرية")}
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-500 font-medium">
            {t(
              "Interactive visual breakdown of booking earnings and reservation performance.",
              "رسم بياني تفاعلي يوضح نمو العوائد المالية وعدد الحجوزات المكتملة."
            )}
          </p>
        </div>

        {/* Timeframe selector */}
        <div className="flex items-center gap-2 bg-slate-100/80 p-1 rounded-2xl">
          {[
            { id: "30d", labelAr: "30 يوماً", labelEn: "30 Days" },
            { id: "90d", labelAr: "3 أشهر", labelEn: "Quarter" },
            { id: "year", labelAr: "هذا العام", labelEn: "This Year" },
          ].map((tf) => (
            <button
              key={tf.id}
              type="button"
              onClick={() => setChartTimeframe(tf.id as typeof chartTimeframe)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-black transition cursor-pointer ${
                chartTimeframe === tf.id
                  ? "bg-white text-[#4F2396] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {lang === "ar" ? tf.labelAr : tf.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* SVG / Canvas Interactive Bar Graph */}
      <div className="mt-6 pt-4">
        <div className="relative h-64 sm:h-72 w-full flex items-end gap-2 sm:gap-4 px-2">
          {/* Background Grid Lines */}
          <div className="absolute inset-x-0 inset-y-0 flex flex-col justify-between pointer-events-none opacity-20">
            <div className="border-b border-slate-300 w-full" />
            <div className="border-b border-slate-300 w-full" />
            <div className="border-b border-slate-300 w-full" />
            <div className="border-b border-slate-300 w-full" />
          </div>

          {chartData.map((item, index) => {
            const heightPercent =
              maxChartAmount > 0 && item.amount > 0
                ? Math.max(4, Math.round((item.amount / maxChartAmount) * 100))
                : 0;
            const isHovered = hoveredBarIndex === index;

            return (
              <div
                key={index}
                className="relative flex-1 h-full flex flex-col justify-end items-center group cursor-pointer"
                onMouseEnter={() => setHoveredBarIndex(index)}
                onMouseLeave={() => setHoveredBarIndex(null)}
              >
                {/* Floating tooltip on hover */}
                {isHovered && (
                  <div className="absolute -top-12 z-20 rounded-xl bg-slate-900 px-3 py-1.5 text-[11px] font-bold text-white shadow-xl whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
                    <div>
                      {item.amount.toLocaleString()} {t("SAR", "ر.س")}
                    </div>
                    <div className="text-[9px] text-slate-300">
                      {item.bookings} {t("stays", "حجز")}
                    </div>
                  </div>
                )}

                {/* Visual Bar */}
                <div
                  className={`w-full max-w-[42px] rounded-t-xl transition-all duration-300 ${
                    heightPercent === 0
                      ? "bg-slate-200"
                      : isHovered
                      ? "bg-gradient-to-t from-[#3D1A78] to-[#FF9750] shadow-md scale-105"
                      : "bg-gradient-to-t from-[#4F2396] to-[#7C3AED] opacity-90 group-hover:opacity-100"
                  }`}
                  style={{ height: heightPercent > 0 ? `${heightPercent}%` : "2px" }}
                />

                {/* X-axis Label */}
                <span className="mt-2 text-[10px] sm:text-xs font-bold text-slate-500 truncate w-full text-center">
                  {lang === "ar" ? item.labelAr : item.labelEn}
                </span>
              </div>
            );
          })}
        </div>

        {/* Quick Insights Row */}
        <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="rounded-2xl bg-slate-50/70 p-3.5 border border-slate-100">
            <span className="text-[11px] font-bold text-slate-400">
              {t("Top Earning Period", "أعلى فترة مبيعاً")}
            </span>
            <p className="mt-1 text-sm font-black text-slate-900">
              {topBucket.amount > 0
                ? `${lang === "ar" ? topBucket.labelAr : topBucket.labelEn} (SAR ${topBucket.amount.toLocaleString()})`
                : t("No earnings yet (0 SAR)", "لا توجد مبيعات بعد (0 ر.س)")}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50/70 p-3.5 border border-slate-100">
            <span className="text-[11px] font-bold text-slate-400">
              {t("Average Daily Rate (ADR)", "متوسط سعر الليلة")}
            </span>
            <p className="mt-1 text-sm font-black text-[#4F2396]">
              {averageDailyRate.toLocaleString()} {t("SAR / night", "ر.س / ليلة")}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50/70 p-3.5 border border-slate-100">
            <span className="text-[11px] font-bold text-slate-400">
              {t("Net Payout Schedule", "دورة التحويلات البنكية")}
            </span>
            <p className="mt-1 text-sm font-black text-emerald-700">
              {t("Every Sunday & Wednesday", "الأحد والأربعاء أسبوعياً")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

