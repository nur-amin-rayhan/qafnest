"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { LoaderCircle, RefreshCw } from "lucide-react";
import { useHostAuth } from "@/context/HostAuthContext";
import { getHostRequestHeaders } from "@/lib/hostPropertyActions";
import {
  AnalyticsMetrics,
  MonthlyRevenueItem,
  PropertyPerformanceItem,
} from "./analytics/types";
import { AnalyticsKpiStrip } from "./analytics/AnalyticsKpiStrip";
import { MonthlyRevenueChart } from "./analytics/MonthlyRevenueChart";
import { PropertyPerformanceTable } from "./analytics/PropertyPerformanceTable";
import { HostComplianceBanner } from "./analytics/HostComplianceBanner";

interface HostAnalyticsDashboardProps {
  lang: "ar" | "en";
  t: (en: string, ar: string) => string;
}

export default function HostAnalyticsDashboard({ lang, t }: HostAnalyticsDashboardProps) {
  const { user } = useHostAuth();
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenueItem[]>([]);
  const [propertyPerformance, setPropertyPerformance] = useState<PropertyPerformanceItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Timeframe and Property Filter
  const [timeframe, setTimeframe] = useState<"30d" | "90d" | "year" | "all">("all");
  const [selectedPropertyId, setSelectedPropertyId] = useState("all");

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const headers = await getHostRequestHeaders(user?.id);
      const url = `/api/host/analytics?timeframe=${timeframe}&propertyId=${selectedPropertyId}`;
      const res = await fetch(url, { headers, cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load analytics");
      const data = await res.json();
      if (data.success) {
        setMetrics(data.metrics || null);
        setMonthlyRevenue(data.monthlyRevenue || []);
        setPropertyPerformance(data.propertyPerformance || []);
      }
    } catch (err) {
      console.warn("Error fetching analytics:", err);
    } finally {
      setLoading(false);
    }
  }, [timeframe, selectedPropertyId, user?.id]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Max revenue in monthly series for SVG bar scaling
  const maxMonthlyRevenue = useMemo(() => {
    const max = Math.max(...monthlyRevenue.map((m) => m.revenue), 1000);
    return Math.ceil(max / 1000) * 1000;
  }, [monthlyRevenue]);

  return (
    <div className="mx-auto w-full max-w-[1440px] flex-1 p-4 sm:p-7 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            {t("Host Analytics & Performance", "تحليلات الأداء والتقارير المالية")}
          </h1>
          <p className="mt-1 text-xs sm:text-sm font-medium text-slate-500">
            {t(
              "Track your revenue growth, average daily rates (ADR), occupancy, and guest satisfaction metrics.",
              "متابعة نمو المبيعات الشهرية ومعدلات الإشغال ومتوسط الأسعار اليومية وأداء كل وحدة معروضة."
            )}
          </p>
        </div>

        {/* Filters: Timeframe & Refresh */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 text-xs font-bold text-slate-700 shadow-xs">
            {[
              { key: "30d", labelEn: "30 Days", labelAr: "30 يوماً" },
              { key: "90d", labelEn: "Quarter", labelAr: "3 أشهر" },
              { key: "year", labelEn: "Year", labelAr: "هذا العام" },
              { key: "all", labelEn: "All Time", labelAr: "كل الفترات" },
            ].map((tf) => (
              <button
                key={tf.key}
                type="button"
                onClick={() => setTimeframe(tf.key as typeof timeframe)}
                className={`rounded-lg px-3 py-1.5 transition cursor-pointer ${
                  timeframe === tf.key
                    ? "bg-[#4F2396] text-white font-black"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {lang === "ar" ? tf.labelAr : tf.labelEn}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={fetchAnalytics}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50 shadow-xs transition cursor-pointer"
          >
            <RefreshCw
              size={13}
              className={loading ? "animate-spin text-[#4F2396]" : "text-slate-400"}
            />
            <span>{t("Refresh", "تحديث")}</span>
          </button>
        </div>
      </div>

      {/* Property Filter Dropdown */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-black text-slate-500">
          {t("Filter by Property:", "تصفية حسب العقار:")}
        </span>
        <select
          value={selectedPropertyId}
          onChange={(e) => setSelectedPropertyId(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white py-1.5 px-3 text-xs font-bold text-slate-700 outline-none focus:border-[#4F2396]"
        >
          <option value="all">{t("All Properties (Combined)", "كل العقارات (مجمعة)")}</option>
          {propertyPerformance.map((p) => (
            <option key={p.propertyId} value={p.propertyId}>
              {lang === "ar" ? p.titleAr : p.title}
            </option>
          ))}
        </select>
      </div>

      {loading && !metrics ? (
        <div className="py-20 text-center">
          <LoaderCircle size={36} className="mx-auto mb-3 animate-spin text-[#4F2396]" />
          <p className="text-sm font-extrabold text-slate-600">
            {t("Calculating analytics data...", "جارٍ حساب المؤشرات والتقارير...")}
          </p>
        </div>
      ) : (
        <>
          {/* Top 4 KPI Cards */}
          <AnalyticsKpiStrip metrics={metrics} t={t} />

          {/* Interactive Monthly Revenue Chart */}
          <MonthlyRevenueChart
            monthlyRevenue={monthlyRevenue}
            maxMonthlyRevenue={maxMonthlyRevenue}
            lang={lang}
            t={t}
          />

          {/* Property Performance Table */}
          <PropertyPerformanceTable
            propertyPerformance={propertyPerformance}
            lang={lang}
            t={t}
          />

          {/* Ambassador & Ministry of Tourism Trust Banner */}
          <HostComplianceBanner t={t} />
        </>
      )}
    </div>
  );
}
