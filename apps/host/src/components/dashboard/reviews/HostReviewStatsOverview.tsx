"use client";

import React from "react";
import {
  Star,
  Sparkles,
  ShieldCheck,
  Building2,
  Calendar,
  ThumbsUp,
} from "lucide-react";
import type { HostReviewsStats } from "./types";

interface HostReviewStatsOverviewProps {
  stats: HostReviewsStats;
  lang: "ar" | "en";
  t: (en: string, ar: string) => string;
}

export function HostReviewStatsOverview({
  stats,
  lang,
  t,
}: HostReviewStatsOverviewProps) {
  return (
    <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
      {/* Big Overall Rating Card */}
      <div className="rounded-2xl border border-violet-100 dark:border-purple-800 bg-gradient-to-br from-violet-900 via-[#4F2396] to-[#3b1772] p-6 text-white shadow-md flex flex-col justify-between">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-violet-200">
            {t("Overall Host Rating", "التقييم العام للمضيف")}
          </span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-5xl font-black tracking-tight">{stats.averageRating}</span>
            <span className="text-xl font-bold text-violet-300">/ 10</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-amber-300">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={16}
                className={
                  stats.totalCount > 0 && star <= Math.round(stats.averageRating / 2)
                    ? "fill-amber-400 text-amber-400"
                    : "text-violet-300/50"
                }
              />
            ))}
            <span className="text-xs font-bold text-white ml-2 rtl:mr-2 rtl:ml-0">
              {stats.totalCount === 0
                ? t("No ratings yet", "لا توجد تقييمات بعد")
                : stats.averageRating >= 9
                ? t("Exceptional", "استثنائي")
                : t("Very Good", "جيد جداً")}
            </span>
          </div>
          <p className="mt-2 text-xs text-violet-200 font-medium">
            {t("Based on", "بناءً على")} {stats.totalCount}{" "}
            {t("verified guest stays", "تقييم من إقامات موثقة")}
          </p>
        </div>

        {/* Distribution Mini Bars */}
        <div className="mt-6 pt-5 border-t border-white/15 space-y-1.5 text-[11px] font-bold">
          {[
            { label: "9.0 - 10.0", count: stats.distribution.exceptional },
            { label: "8.0 - 8.9", count: stats.distribution.veryGood },
            { label: "7.0 - 7.9", count: stats.distribution.good },
            { label: "< 7.0", count: stats.distribution.belowSeven },
          ].map((d) => {
            const pct = stats.totalCount > 0 ? (d.count / stats.totalCount) * 100 : 0;
            return (
              <div key={d.label} className="flex items-center justify-between gap-3 text-white/90">
                <span className="w-16 shrink-0">{d.label}</span>
                <div className="h-1.5 flex-1 rounded-full bg-white/20 overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-5 text-right font-mono">{d.count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6 Subcategory Scores Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
        {[
          {
            key: "cleanliness",
            en: "Cleanliness",
            ar: "النظافة",
            score: stats.subScores.cleanliness,
            icon: Sparkles,
          },
          {
            key: "services",
            en: "Services",
            ar: "الخدمة والضيافة",
            score: stats.subScores.services,
            icon: ThumbsUp,
          },
          {
            key: "condition",
            en: "Condition",
            ar: "حالة العقار",
            score: stats.subScores.condition,
            icon: Building2,
          },
          {
            key: "accuracy",
            en: "Accuracy",
            ar: "دقة الصور والوصف",
            score: stats.subScores.accuracy,
            icon: ShieldCheck,
          },
          {
            key: "value",
            en: "Value for Money",
            ar: "القيمة مقابل السعر",
            score: stats.subScores.value,
            icon: Star,
          },
          {
            key: "checkin",
            en: "Smart Check-in",
            ar: "سهولة تسجيل الدخول",
            score: stats.subScores.checkin,
            icon: Calendar,
          },
        ].map((cat) => {
          const Icon = cat.icon;
          return (
            <div
              key={cat.key}
              className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#12101a] p-4 shadow-xs flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-slate-400 dark:text-slate-500">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {lang === "ar" ? cat.ar : cat.en}
                </span>
                <Icon size={16} className="text-[#4F2396] dark:text-purple-400" />
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-900 dark:text-white">{cat.score}</span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">/ 10</span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${(cat.score / 10) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

