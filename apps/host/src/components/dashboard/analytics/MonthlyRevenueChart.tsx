"use client";

import React from "react";
import { MonthlyRevenueItem } from "./types";

interface MonthlyRevenueChartProps {
  monthlyRevenue: MonthlyRevenueItem[];
  maxMonthlyRevenue: number;
  lang: "ar" | "en";
  t: (en: string, ar: string) => string;
}

export function MonthlyRevenueChart({
  monthlyRevenue,
  maxMonthlyRevenue,
  lang,
  t,
}: MonthlyRevenueChartProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#12101a] p-6 sm:p-7 shadow-xs space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white">
            {t("Monthly Revenue Trend (SAR)", "مسار الإيرادات الشهرية (ر.س)")}
          </h3>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
            {t(
              "Historical performance over the past 6 months",
              "أداء المبيعات التاريخي لآخر 6 أشهر"
            )}
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-bold">
          <div className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-md bg-[#4F2396]" />
            <span className="text-slate-700 dark:text-slate-300">{t("Gross Revenue", "المبيعات")}</span>
          </div>
          <div className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-md bg-[#FF9750]" />
            <span className="text-slate-700 dark:text-slate-300">{t("Bookings", "عدد الحجوزات")}</span>
          </div>
        </div>
      </div>

      {/* SVG Visual Bars */}
      <div className="pt-4">
        {monthlyRevenue.length === 0 ? (
          <div className="py-14 text-center text-xs font-bold text-slate-400 dark:text-slate-500 border-b border-slate-200/80 dark:border-slate-800">
            {t("No monthly revenue data recorded yet.", "لا توجد بيانات إيرادات شهرية مسجلة حتى الآن.")}
          </div>
        ) : (
          <div className="grid grid-cols-6 gap-2 sm:gap-4 h-52 items-end border-b border-slate-200/80 dark:border-slate-800 pb-3">
            {monthlyRevenue.map((item) => {
              const barHeight =
                maxMonthlyRevenue > 0 && item.revenue > 0
                  ? Math.max(4, (item.revenue / maxMonthlyRevenue) * 100)
                  : 0;
              return (
                <div
                  key={item.monthKey}
                  className="group relative flex flex-col items-center justify-end h-full"
                >
                  {/* Tooltip on hover */}
                  <div className="pointer-events-none absolute -top-14 z-20 hidden rounded-xl bg-slate-900 px-3 py-1.5 text-[10px] font-bold text-white shadow-xl group-hover:block transition whitespace-nowrap">
                    <p>{lang === "ar" ? item.labelAr : item.labelEn}</p>
                    <p className="font-mono text-amber-300">
                      {item.revenue} SAR ({item.bookings} stays)
                    </p>
                  </div>

                  {/* Revenue Bar */}
                  <div className="w-full max-w-[48px] rounded-t-xl bg-violet-100/70 dark:bg-purple-950/40 overflow-hidden flex flex-col justify-end h-full">
                    <div
                      className={`w-full transition-all duration-500 rounded-t-xl ${
                        barHeight > 0 ? "bg-[#4F2396] hover:bg-[#3b1772] dark:bg-purple-600 dark:hover:bg-purple-500" : "bg-slate-200 dark:bg-slate-800"
                      }`}
                      style={{ height: barHeight > 0 ? `${barHeight}%` : "2px" }}
                    />
                  </div>

                  {/* Month Label */}
                  <span className="mt-3 text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 truncate max-w-full">
                    {lang === "ar" ? item.labelAr.split(" ")[0] : item.labelEn.split(" ")[0]}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

