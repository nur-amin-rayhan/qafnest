"use client";

import React from "react";
import { MessageSquare, RefreshCw, Star } from "lucide-react";
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
      className="rounded-xl bg-white dark:bg-[#0E0D16] p-5 shadow-xs border border-slate-200/90 dark:border-slate-800"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-[#4F2396] dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/50">
              <MessageSquare size={16} />
            </span>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              {t(
                "Guest Verified Reviews & Ratings Moderation",
                "إدارة تقييمات وآراء الضيوف الموثقة"
              )}
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed max-w-2xl">
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
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 h-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer shrink-0 shadow-xs"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          <span>{t("Refresh", "تحديث")}</span>
        </button>
      </div>

      {/* Live KPI Statistics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">
        <div className="rounded-xl bg-slate-50/50 dark:bg-slate-900/40 p-3.5 border border-slate-200/80 dark:border-slate-800">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t("Total Reviews", "إجمالي التقييمات")}
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {stats.totalReviews || totalCount}
            </span>
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              {t("Verified Stays", "إقامات موثقة")}
            </span>
          </div>
        </div>

        <div className="rounded-xl bg-slate-50/50 dark:bg-slate-900/40 p-3.5 border border-slate-200/80 dark:border-slate-800">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t("Average Score", "متوسط التقييم")}
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-[#4F2396] dark:text-purple-300">
              {stats.avgRating.toFixed(1)}
            </span>
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">/ 10</span>
            <div className="flex items-center text-amber-500">
              <Star size={14} className="fill-amber-500" />
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-slate-50/50 dark:bg-slate-900/40 p-3.5 border border-slate-200/80 dark:border-slate-800">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t("Awaiting Response", "بانتظار الرد")}
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
              {stats.pendingCount}
            </span>
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
              {t("Needs Admin Review", "يتطلب مراجعة الإدارة")}
            </span>
          </div>
        </div>

        <div className="rounded-xl bg-slate-50/50 dark:bg-slate-900/40 p-3.5 border border-slate-200/80 dark:border-slate-800">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t("Responded", "تم الرد عليها")}
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              {stats.repliedCount}
            </span>
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
              {t("Published Replies", "ردود منشورة")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
