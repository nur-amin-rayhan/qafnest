"use client";

import React, { useState } from "react";
import { Star, MessageSquareText, CheckCircle2 } from "lucide-react";
import type { HostReview } from "@/lib/services/hostService";

interface HostReviewsSectionProps {
  reviews: HostReview[];
  rating: number;
  reviewsCount: number;
  language: "en" | "ar";
}

export default function HostReviewsSection({
  reviews,
  rating,
  reviewsCount,
  language,
}: HostReviewsSectionProps) {
  const isAr = language === "ar";
  const label = (en: string, ar: string) => (isAr ? ar : en);
  const [showAll, setShowAll] = useState(false);

  const displayedReviews = showAll ? reviews : reviews.slice(0, 6);

  const avgCategory = (picker: (rev: HostReview) => number | undefined): number => {
    const vals = reviews.map(picker).filter((v): v is number => typeof v === "number" && Number.isFinite(v) && v > 0);
    if (vals.length === 0) return 0;
    return vals.reduce((acc, v) => acc + v, 0) / vals.length;
  };

  const cleanlinessScore = avgCategory((r) => r.cleanlinessRating);
  const accuracyScore = avgCategory((r) => r.accuracyRating);
  const checkinScore = avgCategory((r) => r.checkinRating);
  const servicesScore = avgCategory((r) => r.servicesRating ?? r.checkinRating);
  const toWidth = (score: number) => `${Math.min(100, Math.max(0, (score / 10) * 100)).toFixed(0)}%`;

  return (
    <section className="mt-14 border-t border-violet-100/80 pt-10 dark:border-violet-500/15">
      <div>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-400">
          <MessageSquareText className="h-3.5 w-3.5" />
          {label("Trust & Ratings", "التقييمات والموثوقية")}
        </span>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-gray-950 dark:text-white">
          {label("Guest Reviews & Experiences", "تقييمات وتجارب الضيوف")}
        </h2>
      </div>

      {/* Aggregate Score & Category Breakdown Card */}
      <div className="mt-6 rounded-3xl border border-violet-200/80 bg-gradient-to-br from-violet-50/40 via-white to-violet-50/20 p-6 shadow-xs dark:border-violet-500/25 dark:from-[#12101a] dark:via-[#161224] dark:to-[#12101a] sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-500 shadow-inner">
              <Star className="h-8 w-8 fill-amber-400 text-amber-400" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-gray-950 dark:text-white">
                  {rating.toFixed(1)}
                </span>
                <span className="text-sm font-semibold text-gray-500">/ 10</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {label(
                  `Based on ${reviewsCount} verified reviews across all properties`,
                  `بناءً على ${reviewsCount} تقييماً حقيقياً عبر جميع عقارات المضيف`
                )}
              </p>
            </div>
          </div>

          {/* Category Progress Bars */}
          <div className="grid flex-1 grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2 lg:max-w-xl">
            <div>
              <div className="flex justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
                <span>{label("Cleanliness & Hygiene", "مستوى النظافة والتعقيم")}</span>
                <span>{cleanlinessScore.toFixed(1)}</span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                <div className="h-full rounded-full bg-violet-600" style={{ width: toWidth(cleanlinessScore) }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
                <span>{label("Listing Accuracy", "دقة وصف العقار والصور")}</span>
                <span>{accuracyScore.toFixed(1)}</span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                <div className="h-full rounded-full bg-violet-600" style={{ width: toWidth(accuracyScore) }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
                <span>{label("Smart Lock & Check-in", "سهولة الدخول الذكي")}</span>
                <span>{checkinScore.toFixed(1)}</span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                <div className="h-full rounded-full bg-violet-600" style={{ width: toWidth(checkinScore) }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
                <span>{label("Host Communication", "سرعة تجاوب المضيف")}</span>
                <span>{servicesScore.toFixed(1)}</span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                <div className="h-full rounded-full bg-violet-600" style={{ width: toWidth(servicesScore) }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Review Cards Grid */}
      {displayedReviews.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayedReviews.map((rev) => (
            <article
              key={rev.id}
              className="flex flex-col justify-between rounded-2xl border border-violet-100/90 bg-white p-5 shadow-xs transition hover:border-violet-300 dark:border-violet-500/20 dark:bg-[#12101a] dark:hover:border-violet-500/40"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 font-bold text-violet-800 dark:bg-violet-900/40 dark:text-violet-300">
                      {rev.author.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-gray-900 dark:text-white">
                        {rev.author}
                      </h3>
                      <span className="block text-[11px] text-gray-400">{rev.date}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                    <Star className="h-3.5 w-3.5 fill-amber-400" />
                    <span>{rev.rating.toFixed(1)}</span>
                  </div>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-gray-600 dark:text-gray-300">
                  &ldquo;{rev.comment}&rdquo;
                </p>
              </div>

              {rev.propertyTitle && (
                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-[11px] text-gray-500 dark:border-white/5 dark:text-gray-400">
                  <span className="truncate">{rev.propertyTitle}</span>
                  <span className="inline-flex shrink-0 items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    {label("Verified Stay", "إقامة موثقة")}
                  </span>
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-violet-100 bg-white p-8 text-center dark:border-white/10 dark:bg-[#12101a]">
          <p className="text-sm text-gray-500">
            {label("No reviews have been submitted for this host yet.", "لم يتم إرسال أي تقييمات لهذا المضيف حتى الآن.")}
          </p>
        </div>
      )}

      {/* Show more reviews toggle */}
      {reviews.length > 6 && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setShowAll((prev) => !prev)}
            className="rounded-xl border border-violet-200 bg-white px-5 py-2.5 text-xs font-bold text-violet-700 shadow-xs hover:bg-violet-50 transition dark:border-violet-500/25 dark:bg-white/5 dark:text-violet-300 dark:hover:bg-white/10"
          >
            {showAll
              ? label("Show less", "عرض أقل")
              : label(`Show all ${reviews.length} reviews`, `عرض جميع التقييمات (${reviews.length})`)}
          </button>
        </div>
      )}
    </section>
  );
}

