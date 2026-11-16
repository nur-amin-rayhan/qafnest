"use client";

import React, { useMemo } from "react";
import { OverviewHeroBanner } from "./overview/OverviewHeroBanner";
import { OverviewActionRequiredBanner } from "./overview/OverviewActionRequiredBanner";
import { OverviewMetricCards } from "./overview/OverviewMetricCards";
import { OverviewRevenueChart } from "./overview/OverviewRevenueChart";
import { OverviewRecentActivity } from "./overview/OverviewRecentActivity";
import { OverviewPropertiesGrid } from "./overview/OverviewPropertiesGrid";
import type { DeletePropertyTarget } from "./properties/DeletePropertyModal";
import type {
  HostPropertySummary,
  HostBookingSummary,
  HostReviewSummary,
  OverviewNavigateTab,
} from "./overview/types";

// Re-export types for backward-compatibility with external components
export type { HostPropertySummary, HostBookingSummary };

interface HostOverviewHubProps {
  properties: HostPropertySummary[];
  bookings: HostBookingSummary[];
  reviews?: HostReviewSummary[];
  reviewStats?: { averageRating: number; totalCount: number };
  hostName: string;
  hostPhone?: string;
  lang: "ar" | "en";
  t: (en: string, ar: string) => string;
  onNavigateTab: (tab: OverviewNavigateTab) => void;
  onDeleteProperty?: (prop: DeletePropertyTarget) => void;
}

export default function HostOverviewHub({
  properties,
  bookings,
  reviews = [],
  reviewStats = { averageRating: 0, totalCount: 0 },
  hostName,
  lang,
  t,
  onNavigateTab,
  onDeleteProperty,
}: HostOverviewHubProps) {
  // Filter properties needing attention (rejected or revisions requested)
  const propertiesNeedingAction = useMemo(() => {
    return properties.filter(
      (p) => p.status === "rejected" || Boolean(p.adminFeedback)
    );
  }, [properties]);

  const approvedPropertiesCount = useMemo(() => {
    return properties.filter((p) => p.isApproved || p.status === "approved").length;
  }, [properties]);

  // Aggregate live metrics strictly from bookings & properties (zero fallback)
  const { totalRevenue, activeBookingsCount, upcomingCheckinsCount, occupancyRate, bookedNightsThisMonth } =
    useMemo(() => {
      const todayIso = new Date().toISOString().slice(0, 10);
      const confirmed = bookings.filter(
        (b) =>
          (b.status === "confirmed" || b.status === "completed") &&
          (!b.payment_status || b.payment_status === "success" || b.payment_status === "paid")
      );
      const active = bookings.filter(
        (b) =>
          (b.status === "confirmed" || b.status === "completed") ||
          (b.status === "pending" && b.payment_status !== "initiated")
      );
      const revenue = confirmed.reduce((sum, b) => sum + (Number(b.total_price) || 0), 0);
      const upcoming = confirmed.filter((b) => b.check_in >= todayIso).length;

      const nowMs = Date.now();
      const windowEndMs = nowMs;
      const windowStartMs = nowMs - 30 * 86_400_000;
      let totalNightsInWindow = 0;
      for (const b of confirmed) {
        const startMs = Date.parse(`${String(b.check_in).slice(0, 10)}T00:00:00.000Z`);
        const endMsRaw = Date.parse(`${String(b.check_out).slice(0, 10)}T00:00:00.000Z`);
        const endMs =
          Number.isFinite(endMsRaw) && Number.isFinite(startMs) && endMsRaw > startMs
            ? endMsRaw
            : Number.isFinite(startMs)
            ? startMs + 86_400_000
            : NaN;
        if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) continue;
        const clampedStart = Math.max(startMs, windowStartMs);
        const clampedEnd = Math.min(endMs, windowEndMs);
        if (clampedEnd > clampedStart) {
          totalNightsInWindow += Math.round((clampedEnd - clampedStart) / 86_400_000);
        }
      }
      const potentialNights = Math.max(1, properties.length * 30);
      const occupancy =
        properties.length > 0 && totalNightsInWindow > 0
          ? Math.min(100, Math.round((totalNightsInWindow / potentialNights) * 100))
          : 0;

      return {
        totalRevenue: Math.round(revenue * 100) / 100,
        activeBookingsCount: active.length,
        upcomingCheckinsCount: upcoming,
        occupancyRate: occupancy,
        bookedNightsThisMonth: totalNightsInWindow,
      };
    }, [bookings, properties.length]);

  // Today's date formatted
  const todayFormatted = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, [lang]);

  return (
    <div className="mx-auto w-full max-w-[1640px] px-4 py-6 sm:px-8 sm:py-8 space-y-8 animate-in fade-in duration-300">
      {/* 1. Welcome Hero Banner */}
      <OverviewHeroBanner
        hostName={hostName}
        todayFormatted={todayFormatted}
        lang={lang}
        t={t}
        onNavigateTab={onNavigateTab}
      />

      {/* 2. Action Required Alert (if revisions requested) */}
      <OverviewActionRequiredBanner
        propertiesNeedingAction={propertiesNeedingAction}
        lang={lang}
        t={t}
      />

      {/* 3. Executive Metric Cards */}
      <OverviewMetricCards
        totalRevenue={totalRevenue}
        activeBookingsCount={activeBookingsCount}
        upcomingCheckinsCount={upcomingCheckinsCount}
        occupancyRate={occupancyRate}
        bookedNightsThisMonth={bookedNightsThisMonth}
        averageRating={reviewStats.averageRating}
        reviewsCount={reviewStats.totalCount}
        lang={lang}
        t={t}
        onNavigateTab={onNavigateTab}
      />

      {/* 4. Interactive Revenue & Performance Chart */}
      <OverviewRevenueChart bookings={bookings} lang={lang} t={t} />

      {/* 5. Recent Activity: Latest Bookings & Guest Reviews */}
      <OverviewRecentActivity
        bookings={bookings}
        reviews={reviews}
        lang={lang}
        t={t}
        onNavigateTab={onNavigateTab}
      />

      {/* 6. Quick Access Property Fleet Summary */}
      <OverviewPropertiesGrid
        properties={properties}
        approvedPropertiesCount={approvedPropertiesCount}
        lang={lang}
        t={t}
        onNavigateTab={onNavigateTab}
        onDeleteProperty={onDeleteProperty}
      />
    </div>
  );
}
