"use client";

import React from "react";
import type { ReviewSummary } from "@/lib/reviews/types";
import {
  categoryKeys,
  ratingDescription,
  reviewSummaryLines,
  CATEGORY_LABELS,
} from "./reviewHelpers";

interface ReviewSummaryOverviewProps {
  summary: ReviewSummary;
  total: number;
  isArabic: boolean;
  label: (en: string, ar: string) => string;
}

export function ReviewSummaryOverview({
  summary,
  total,
  isArabic,
  label,
}: ReviewSummaryOverviewProps) {
  const summaryLines = reviewSummaryLines(summary, isArabic, CATEGORY_LABELS);
  const scoredCategories = categoryKeys.filter(
    (key) => summary.categoryAverages[key] !== null
  );

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <article className="flex min-h-24 items-center gap-4 rounded-3xl border border-violet-200/85 bg-violet-50/50 p-4 shadow-xs dark:border-violet-500/25 dark:bg-violet-950/30">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-violet-700 text-xl font-extrabold text-white shadow-md shadow-violet-700/25">
            {summary.average.toFixed(1)}
          </span>
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {label("General Rating", "التقييم العام")} ({total}{" "}
              {label("Reviews", "تقييمات")})
            </p>
            <p className="mt-1 text-sm font-bold text-gray-950 dark:text-white">
              {ratingDescription(summary.average, isArabic)}
            </p>
          </div>
        </article>

        {scoredCategories.map((key) => {
          const score = summary.categoryAverages[key];
          if (score === null) return null;
          return (
            <article
              key={key}
              className="flex min-h-24 items-center gap-3 rounded-3xl border border-violet-200/80 bg-white p-4 shadow-xs dark:border-violet-500/20 dark:bg-[#12101a]"
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-violet-200 bg-violet-50/50 text-lg font-bold text-violet-800 dark:border-violet-500/30 dark:bg-violet-950/30 dark:text-violet-200">
                {score.toFixed(1)}
              </span>
              <div className="min-w-0">
                <p className="text-xs leading-5 text-gray-600 dark:text-gray-400">
                  {label(...CATEGORY_LABELS[key])}
                </p>
                <p className="mt-1 text-sm font-bold text-gray-950 dark:text-white">
                  {ratingDescription(score, isArabic)}
                </p>
              </div>
            </article>
          );
        })}
      </div>

      {summaryLines.length > 0 && (
        <section
          className="mt-5 rounded-3xl border border-violet-200/80 bg-violet-50/35 p-5 dark:border-violet-500/20 dark:bg-[#12101a] sm:p-6"
          aria-labelledby="review-summary-heading"
        >
          <h3
            id="review-summary-heading"
            className="text-base font-bold text-gray-950 dark:text-white"
          >
            {label(
              `Reviews Summary (${total} reviews)`,
              `ملخص التقييمات (${total} تقييمات)`
            )}
          </h3>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-gray-700 dark:text-gray-300">
            {summaryLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

