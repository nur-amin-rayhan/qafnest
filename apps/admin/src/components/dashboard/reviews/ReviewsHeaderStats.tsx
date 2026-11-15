"use client";

import React from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";

interface ReviewsHeaderStatsProps {
  loading: boolean;
  onRefresh: () => void;
  stats: {
    totalReviews: number;
    avgRating: number;
    pendingCount: number;
    repliedCount: number;
  };
  totalCount: number;
}

export function ReviewsHeaderStats({
  loading,
  onRefresh,
  stats,
  totalCount,
}: ReviewsHeaderStatsProps) {
  const { t, dir } = useAdminAuth();

  return (
    <div
      dir={dir}
      className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm border border-surface-container-high/60"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <span className="material-symbols-outlined text-[20px]">rate_review</span>
            </span>
            <h2 className="font-display-md text-headline-sm font-extrabold text-on-surface">
              {t(
                "Guest Verified Reviews & Ratings Moderation",
                "إدارة تقييمات وآراء الضيوف الموثقة"
              )}
            </h2>
          </div>
          <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed max-w-2xl">
            {t(
              "Moderate verified reviews from completed stays, monitor 10-point satisfaction ratings across cleanliness and communication, and publish authoritative dispute resolutions.",
              "إدارة ومراجعة التقييمات الموثقة للإقامات المكتملة، ومتابعة مؤشرات الرضا من 10 نقاط للنظافة والتواصل، ونشر الردود الرسمية وحلول النزاعات."
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-surface-container-high bg-surface-container-low text-xs font-bold text-on-surface hover:bg-surface-container transition-colors disabled:opacity-50 cursor-pointer shrink-0"
        >
          <span className={`material-symbols-outlined text-[16px] ${loading ? "animate-spin" : ""}`}>
            sync
          </span>
          <span>{t("Refresh", "تحديث")}</span>
        </button>
      </div>

      {/* Live KPI Statistics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mt-6 pt-5 border-t border-surface-container">
        <div className="rounded-xl bg-surface-container-low p-3.5 border border-surface-container-high">
          <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
            {t("Total Reviews", "إجمالي التقييمات")}
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-on-surface">
              {stats.totalReviews || totalCount}
            </span>
            <span className="text-[11px] font-semibold text-status-emerald">
              {t("Verified Stays", "إقامات موثقة")}
            </span>
          </div>
        </div>

        <div className="rounded-xl bg-surface-container-low p-3.5 border border-surface-container-high">
          <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
            {t("Average Score", "متوسط التقييم")}
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-primary">
              {stats.avgRating.toFixed(1)}
            </span>
            <span className="text-[11px] font-bold text-outline">/ 10</span>
            <div className="flex items-center text-amber-500">
              <span className="material-symbols-outlined text-[16px]">star</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-surface-container-low p-3.5 border border-surface-container-high">
          <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
            {t("Awaiting Response", "بانتظار الرد")}
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-status-terracotta">
              {stats.pendingCount}
            </span>
            <span className="text-[11px] font-semibold text-outline">
              {t("Needs Admin Review", "يتطلب مراجعة الإدارة")}
            </span>
          </div>
        </div>

        <div className="rounded-xl bg-surface-container-low p-3.5 border border-surface-container-high">
          <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
            {t("Responded", "تم الرد عليها")}
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-status-emerald">
              {stats.repliedCount}
            </span>
            <span className="text-[11px] font-semibold text-outline">
              {t("Published Replies", "ردود منشورة")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
