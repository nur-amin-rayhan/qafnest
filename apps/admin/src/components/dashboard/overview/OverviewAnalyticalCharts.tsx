"use client";

import React from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import type { AdminMetrics, BookingItem } from "../types";

interface OverviewAnalyticalChartsProps {
  metrics?: AdminMetrics;
  bookings?: BookingItem[];
}

export function OverviewAnalyticalCharts({ metrics, bookings = [] }: OverviewAnalyticalChartsProps) {
  const { lang, dir, t } = useAdminAuth();

  const paidBookings = bookings.filter(
    (b) =>
      (b.status === "confirmed" || b.status === "completed") &&
      (!b.payment_status || b.payment_status === "success" || b.payment_status === "paid")
  );
  const totalYield = metrics?.grossRevenue || 0;
  const hasData = totalYield > 0 || paidBookings.length > 0;

  const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const MONTHS_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
  const MONTHS = lang === "ar" ? MONTHS_AR : MONTHS_EN;
  const activeMonthIdx = new Date().getMonth();

  const monthlyTotals = Array.from({ length: 12 }, () => ({ rev: 0, count: 0 }));
  for (const b of paidBookings) {
    const dt = b.check_in || b.created_at;
    if (!dt) continue;
    const d = new Date(dt);
    if (!Number.isNaN(d.getTime())) {
      const m = d.getMonth();
      monthlyTotals[m].rev += Number(b.total_price || 0);
      monthlyTotals[m].count += 1;
    }
  }
  const maxRev = Math.max(...monthlyTotals.map((m) => m.rev), 1);
  const maxCount = Math.max(...monthlyTotals.map((m) => m.count), 1);
  const points = monthlyTotals.map((m, idx) => {
    const x = 30 + idx * 58;
    const y = m.rev > 0 ? 225 - Math.round((m.rev / maxRev) * 185) : 230;
    const barH = m.count > 0 ? Math.max(8, Math.round((m.count / maxCount) * 140)) : 0;
    return { x, y, barH, rev: m.rev, count: m.count, idx };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} 230 L ${points[0].x} 230 Z`;

  let weekendPct = 0;
  let midweekPct = 0;
  if (paidBookings.length > 0) {
    let weekendCount = 0;
    for (const b of paidBookings) {
      if (b.check_in) {
        const day = new Date(b.check_in).getDay();
        if (day === 4 || day === 5 || day === 6) weekendCount++;
      }
    }
    weekendPct = Math.round((weekendCount / paidBookings.length) * 100);
    midweekPct = 100 - weekendPct;
  }

  return (
    <div dir={dir} className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg mb-space-lg">
      {/* Revenue Velocity Vector Chart */}
      <div className="lg:col-span-8 flex flex-col rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-space-md">
          <div>
            <span className="font-label-sm text-primary uppercase font-bold tracking-wider">
              {t("Financial Overview", "نظرة مالية عامة")}
            </span>
            <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
              {t("Revenue Velocity & Reservation Volume", "مؤشر الإيرادات وحجم الحجوزات")}
            </h2>
          </div>
          <div className="flex items-center gap-space-xs bg-surface-container-low p-1 rounded-lg">
            <button type="button" className="px-3 py-1 text-label-md rounded bg-surface-container-lowest shadow-sm text-primary font-bold">
              {t("Monthly", "شهري")}
            </button>
          </div>
        </div>

        {/* Vector Chart Visual */}
        <div className="w-full h-64 relative flex items-end" dir="ltr">
          <svg className="w-full h-full overflow-visible" fill="none" preserveAspectRatio="none" viewBox="0 0 700 240">
            <defs>
              <linearGradient id="primaryRevGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#4F2396" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#4F2396" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="emeraldBarGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#1B8A5A" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#1B8A5A" stopOpacity="0.4" />
              </linearGradient>
            </defs>
            <line stroke="#EDEDF8" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="700" y1="20" y2="20" />
            <line stroke="#EDEDF8" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="700" y1="75" y2="75" />
            <line stroke="#EDEDF8" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="700" y1="130" y2="130" />
            <line stroke="#EDEDF8" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="700" y1="185" y2="185" />
            <line stroke="#EDEDF8" strokeWidth="1" x1="0" x2="700" y1="230" y2="230" />

            {hasData ? (
              <>
                {points.map(
                  (pt) =>
                    pt.barH > 0 && (
                      <rect
                        key={pt.idx}
                        fill={pt.idx === activeMonthIdx ? "url(#emeraldBarGradient)" : "#EDEDF8"}
                        height={pt.barH}
                        rx="3"
                        width="16"
                        x={pt.x - 8}
                        y={230 - pt.barH}
                      />
                    )
                )}
                <path d={areaPath} fill="url(#primaryRevGradient)" />
                <path d={linePath} fill="none" stroke="#4F2396" strokeLinecap="round" strokeWidth="3" />
                {points.map(
                  (pt) =>
                    pt.rev > 0 && (
                      <circle
                        key={`pt-${pt.idx}`}
                        cx={pt.x}
                        cy={pt.y}
                        fill="#4F2396"
                        r="5"
                        stroke="#FFFFFF"
                        strokeWidth="2"
                      />
                    )
                )}
              </>
            ) : (
              <path
                d="M 30 230 L 668 230"
                fill="none"
                stroke="#CBD5E1"
                strokeDasharray="4 4"
                strokeWidth="2"
              />
            )}
          </svg>
        </div>

        <div className="grid grid-cols-12 text-center font-code-sm text-[10px] sm:text-code-sm text-outline mt-2 pt-space-xs" dir="ltr">
          {MONTHS.map((m, idx) => (
            <span key={m} className={`truncate ${hasData && idx === activeMonthIdx ? "text-primary font-bold" : ""}`}>
              {m}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-space-md mt-space-md bg-surface-container-low p-space-sm rounded-lg">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-primary shrink-0"></span>
              <span className="font-body-sm text-xs sm:text-sm text-on-surface">
                {t("Revenue Velocity (SAR)", "مؤشر الإيرادات (ر.س)")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-status-emerald shrink-0"></span>
              <span className="font-body-sm text-xs sm:text-sm text-on-surface">
                {t("Bookings Volume", "حجم الحجوزات")}
              </span>
            </div>
          </div>
          <span className="font-code-sm text-code-sm text-outline font-bold">
            {totalYield.toLocaleString("en-US")} {t("SAR Total Yield", "ر.س إجمالي العوائد")}
          </span>
        </div>
      </div>

      {/* Demand Analytics (Donut) */}
      <div className="lg:col-span-4 flex flex-col justify-between rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
        <div>
          <span className="font-label-sm text-primary uppercase font-bold tracking-wider">
            {t("Demand Analytics", "تحليلات الطلب")}
          </span>
          <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface mt-1">
            {t("Weekday vs. Weekend", "أيام الأسبوع مقابل عطلة النهاية")}
          </h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            {t("Saudi staycation and private pool demand distribution.", "توزيع الطلب على الشاليهات والمنتجعات الخاصة.")}
          </p>

          <div className="relative w-44 h-44 mx-auto my-6 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" fill="transparent" r="40" stroke="#EDEDF8" strokeWidth="14" />
              {bookings.length > 0 && (
                <>
                  <circle
                    cx="50"
                    cy="50"
                    fill="transparent"
                    r="40"
                    stroke="#1B8A5A"
                    strokeDasharray={`${(251.2 * midweekPct) / 100} 251.2`}
                    strokeDashoffset={-((251.2 * weekendPct) / 100)}
                    strokeWidth="14"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    fill="transparent"
                    r="40"
                    stroke="#4F2396"
                    strokeDasharray={`${(251.2 * weekendPct) / 100} 251.2`}
                    strokeDashoffset={0}
                    strokeWidth="14"
                  />
                </>
              )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-display-md text-display-md text-on-surface font-extrabold leading-none">
                {weekendPct}%
              </span>
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider mt-1">
                {t("Weekend", "نهاية الأسبوع")}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2 border-t border-surface-container pt-4">
          <div className="flex justify-between text-body-sm">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0"></span>
              <span>{t("Thu - Sat Peak Stays", "الخميس - السبت (الذروة)")}</span>
            </span>
            <span className="font-bold font-mono">{weekendPct}%</span>
          </div>
          <div className="flex justify-between text-body-sm">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-status-emerald shrink-0"></span>
              <span>{t("Sun - Wed Midweek Leisure", "الأحد - الأربعاء (وسط الأسبوع)")}</span>
            </span>
            <span className="font-bold font-mono">{midweekPct}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
