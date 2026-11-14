"use client";

import React, { useState, useEffect } from "react";
import { Star, ShieldCheck, Languages, Edit3, Loader2 } from "lucide-react";
import type { GuestReview } from "@/lib/reviews/types";
import { ratingDescription, reviewDate } from "./reviewHelpers";

interface ReviewItemCardProps {
  review: GuestReview;
  isArabic: boolean;
  showOriginal: Record<string, boolean>;
  setShowOriginal: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  label: (en: string, ar: string) => string;
  isAuthor?: boolean;
  onEdit?: () => void;
}

export function ReviewItemCard({
  review,
  isArabic,
  showOriginal,
  setShowOriginal,
  label,
  isAuthor,
  onEdit,
}: ReviewItemCardProps) {
  const [onDemandArTitle, setOnDemandArTitle] = useState<string | null>(null);
  const [onDemandArComment, setOnDemandArComment] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  // Auto on-demand translation if in Arabic mode and database record lacks Arabic
  useEffect(() => {
    let isMounted = true;
    if (isArabic && !review.comment_ar && review.comment && !onDemandArComment) {
      setIsTranslating(true);
      Promise.all([
        review.title
          ? fetch("/api/translate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: review.title, targetLang: "ar" }),
            })
              .then((res) => res.json())
              .then((d) => d.translatedText || review.title)
              .catch(() => review.title)
          : Promise.resolve(""),
        fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: review.comment, targetLang: "ar" }),
        })
          .then((res) => res.json())
          .then((d) => d.translatedText || review.comment)
          .catch(() => review.comment),
      ])
        .then(([trTitle, trComment]) => {
          if (isMounted) {
            if (trTitle) setOnDemandArTitle(trTitle);
            if (trComment) setOnDemandArComment(trComment);
            setIsTranslating(false);
          }
        })
        .catch(() => {
          if (isMounted) setIsTranslating(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [isArabic, review.comment, review.comment_ar, review.title, onDemandArComment]);

  const effectiveCommentAr = review.comment_ar || onDemandArComment;
  const effectiveTitleAr = review.title_ar || onDemandArTitle;

  const showThisOriginal = Boolean(showOriginal[review.id]);
  const showReplyOriginal = Boolean(showOriginal[`${review.id}-reply`]);

  // Compute displayed Title & Comment
  let displayTitle: string = "";
  let displayComment: string = "";

  if (isArabic) {
    if (showThisOriginal) {
      displayTitle = review.title || "";
      displayComment = review.comment || "";
    } else {
      displayTitle = effectiveTitleAr || review.title || "";
      displayComment = effectiveCommentAr || review.comment || "";
    }
  } else {
    // English mode
    if (showThisOriginal) {
      displayTitle = effectiveTitleAr || review.title || "";
      displayComment = effectiveCommentAr || review.comment || "";
    } else {
      displayTitle = review.title || "";
      displayComment = review.comment || "";
    }
  }

  // Check if alternate language toggle should be shown
  const hasAlternateComment = Boolean(
    effectiveCommentAr && review.comment && effectiveCommentAr !== review.comment
  );

  // Host Reply
  const alternateReply = isArabic ? review.admin_reply : review.admin_reply_ar;
  const hasAlternateReply = Boolean(
    alternateReply &&
      alternateReply !== (isArabic ? review.admin_reply_ar : review.admin_reply)
  );
  const displayReply =
    showReplyOriginal && alternateReply
      ? alternateReply
      : isArabic && review.admin_reply_ar
      ? review.admin_reply_ar
      : review.admin_reply;

  return (
    <article className="mb-4 break-inside-avoid overflow-hidden rounded-3xl border border-violet-200/80 bg-white shadow-xs transition hover:border-violet-300 dark:border-violet-500/20 dark:bg-[#12101a]">
      <div className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-gray-950 dark:text-white">
              {review.guest_display_name}
            </h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {reviewDate(review.created_at, isArabic)}
            </p>
            {isAuthor && onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="mt-1.5 inline-flex items-center gap-1 rounded-lg border border-violet-200 bg-violet-50/70 px-2 py-0.5 text-[10px] font-bold text-violet-800 hover:bg-violet-100 dark:border-violet-400/30 dark:bg-violet-950/40 dark:text-violet-200 transition cursor-pointer"
                title={label("Edit your review", "تعديل تقييمك")}
              >
                <Edit3 className="h-3 w-3" />
                <span>{label("Edit review", "تعديل التقييم")}</span>
              </button>
            )}
          </div>
          <p className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-violet-200/70 bg-violet-50/60 px-2.5 py-1 text-xs font-bold text-violet-900 dark:border-violet-500/25 dark:bg-violet-950/30 dark:text-violet-200">
            <span>{review.rating.toFixed(1)}</span>
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span>{ratingDescription(review.rating, isArabic)}</span>
          </p>
        </div>

        {review.is_verified_stay && !review.is_sample && (
          <p className="mt-3 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            {label("Verified stay", "إقامة موثقة")}
          </p>
        )}

        {isTranslating && (
          <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-violet-600 dark:text-violet-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>{label("Translating review...", "جارٍ ترجمة التقييم...")}</span>
          </div>
        )}

        {displayTitle && (
          <h4 className="mt-3 text-sm font-bold text-gray-950 dark:text-white">
            {displayTitle}
          </h4>
        )}

        <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-800 dark:text-gray-200">
          {displayComment}
        </p>

        {hasAlternateComment && (
          <button
            type="button"
            onClick={() =>
              setShowOriginal((current) => ({
                ...current,
                [review.id]: !current[review.id],
              }))
            }
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 transition hover:text-violet-700 dark:text-gray-400 dark:hover:text-violet-300 cursor-pointer"
          >
            <Languages className="h-3.5 w-3.5" />
            {isArabic
              ? showThisOriginal
                ? "عرض الترجمة العربية"
                : "عرض النص الأصلي"
              : showThisOriginal
              ? "Show translation"
              : "Show original"}
          </button>
        )}
      </div>

      {review.admin_reply && (
        <div className="border-t border-violet-100 bg-violet-50/40 px-5 py-4 dark:border-violet-500/20 dark:bg-violet-950/20">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <h4 className="text-xs font-bold text-gray-900 dark:text-white">
              {review.admin_reply_by || label("Host", "المضيف")}{" "}
              <span className="font-normal text-gray-500 dark:text-gray-400">
                ({label("Host", "المضيف")})
              </span>
            </h4>
            {review.admin_reply_at && (
              <time className="text-[11px] text-gray-500 dark:text-gray-400">
                {reviewDate(review.admin_reply_at, isArabic)}
              </time>
            )}
          </div>
          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-700 dark:text-gray-300">
            {displayReply}
          </p>
          {hasAlternateReply && (
            <button
              type="button"
              onClick={() =>
                setShowOriginal((current) => ({
                  ...current,
                  [`${review.id}-reply`]: !current[`${review.id}-reply`],
                }))
              }
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 transition hover:text-violet-700 dark:text-gray-400 dark:hover:text-violet-300 cursor-pointer"
            >
              <Languages className="h-3.5 w-3.5" />
              {isArabic
                ? showReplyOriginal
                  ? "عرض الترجمة العربية"
                  : "عرض النص الأصلي"
                : showReplyOriginal
                ? "Show translation"
                : "Show original"}
            </button>
          )}
        </div>
      )}
    </article>
  );
}
