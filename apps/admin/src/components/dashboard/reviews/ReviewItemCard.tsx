"use client";

import React from "react";
import { Star, CheckCircle2, Reply, ShieldCheck } from "lucide-react";
import { AdminReviewItem } from "../types";
import { useAdminAuth } from "@/context/AdminAuthContext";

interface ReviewItemCardProps {
  review: AdminReviewItem;
  deletingId: string;
  openReplyModal: (review: AdminReviewItem) => void;
  handleDeleteReply: (reviewId: string) => void;
}

export function ReviewItemCard({
  review,
  deletingId,
  openReplyModal,
  handleDeleteReply,
}: ReviewItemCardProps) {
  const { t, dir, lang } = useAdminAuth();
  const hasAdminReply = Boolean(review.admin_reply || review.admin_reply_ar);
  const score = Number(review.rating || 0);
  const dateLocale = lang === "ar" ? "ar-SA" : "en-US";

  return (
    <div
      dir={dir}
      className="rounded-xl bg-white dark:bg-[#0E0D16] p-5 shadow-xs border border-slate-200/90 dark:border-slate-800 hover:border-[#4F2396]/40 dark:hover:border-purple-800/40 transition-colors"
    >
      {/* Header Row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#4F2396] dark:text-purple-300">
              {review.property_title || t("Listing Stay", "إقامة وحدة")}
            </span>
            {review.property_city && (
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                • {review.property_city}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
              {review.guest_display_name || t("Verified Guest", "ضيف موثق")}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
              <CheckCircle2 size={11} />
              <span>{t("Verified Stay", "إقامة موثقة")}</span>
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              {new Date(review.created_at).toLocaleDateString(dateLocale, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Rating Badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 font-bold font-mono text-xs">
            <Star size={13} className="fill-amber-500 text-amber-500" />
            <span>{score.toFixed(1)}</span>
            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">/ 10</span>
          </div>

          {hasAdminReply ? (
            <span className="rounded-full bg-purple-50 dark:bg-purple-950/60 px-2.5 py-0.5 text-[10px] font-medium text-[#4F2396] dark:text-purple-300 border border-purple-200 dark:border-purple-800/50">
              {t("Replied", "تم الرد")}
            </span>
          ) : (
            <span className="rounded-full bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
              {t("Needs Reply", "بحاجة لرد")}
            </span>
          )}
        </div>
      </div>

      {/* Review Body */}
      <div className="mt-3 space-y-1.5">
        {review.title && (
          <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">{review.title}</h4>
        )}
        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400 whitespace-pre-line">
          {review.comment}
        </p>
      </div>

      {/* Sub-ratings Pills if present */}
      {(review.cleanliness_rating ||
        review.accuracy_rating ||
        review.services_rating ||
        review.checkin_rating) && (
        <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
          {review.cleanliness_rating && (
            <span className="rounded-md bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 px-2 py-0.5 text-slate-600 dark:text-slate-400 font-medium">
              {t("Cleanliness:", "النظافة:")}{" "}
              <strong className="text-slate-800 dark:text-slate-200 font-mono">{Number(review.cleanliness_rating).toFixed(1)}</strong>
            </span>
          )}
          {review.accuracy_rating && (
            <span className="rounded-md bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 px-2 py-0.5 text-slate-600 dark:text-slate-400 font-medium">
              {t("Accuracy:", "الدقة:")}{" "}
              <strong className="text-slate-800 dark:text-slate-200 font-mono">{Number(review.accuracy_rating).toFixed(1)}</strong>
            </span>
          )}
          {review.services_rating && (
            <span className="rounded-md bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 px-2 py-0.5 text-slate-600 dark:text-slate-400 font-medium">
              {t("Services:", "الخدمات:")}{" "}
              <strong className="text-slate-800 dark:text-slate-200 font-mono">{Number(review.services_rating).toFixed(1)}</strong>
            </span>
          )}
          {review.checkin_rating && (
            <span className="rounded-md bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 px-2 py-0.5 text-slate-600 dark:text-slate-400 font-medium">
              {t("Check-in:", "تسجيل الدخول:")}{" "}
              <strong className="text-slate-800 dark:text-slate-200 font-mono">{Number(review.checkin_rating).toFixed(1)}</strong>
            </span>
          )}
        </div>
      )}

      {/* Admin Reply Box if present */}
      {hasAdminReply && (
        <div className="mt-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/30 p-3.5 border border-purple-200/60 dark:border-purple-800/50 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-[#4F2396] dark:text-purple-300">
              <ShieldCheck size={14} />
              <span>{t("Official QafNest Response", "رد قاف نست الرسمي")}</span>
              <span className="text-slate-400 dark:text-slate-500 font-normal">
                • {t("by", "بواسطة")} {review.admin_reply_by || t("Operations Admin", "مشرف العمليات")}
                {review.admin_reply_at &&
                  ` ${t("on", "بتاريخ")} ${new Date(review.admin_reply_at).toLocaleDateString(dateLocale)}`}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => openReplyModal(review)}
                className="px-2 py-1 text-[11px] font-medium text-[#4F2396] dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-md transition-colors cursor-pointer"
              >
                {t("Edit", "تعديل")}
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteReply(review.id)}
                disabled={deletingId === review.id}
                className="px-2 py-1 text-[11px] font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
              >
                {deletingId === review.id
                  ? t("Removing...", "جارٍ الحذف...")
                  : t("Remove", "حذف")}
              </button>
            </div>
          </div>

          {review.admin_reply && (
            <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed" dir="ltr">
              {review.admin_reply}
            </p>
          )}
          {review.admin_reply_ar && (
            <p
              className={`text-xs text-slate-800 dark:text-slate-200 leading-relaxed ${
                review.admin_reply ? "pt-1.5 border-t border-purple-100 dark:border-purple-900/40" : ""
              }`}
              dir="rtl"
            >
              {review.admin_reply_ar}
            </p>
          )}
        </div>
      )}

      {/* Actions Row */}
      {!hasAdminReply && (
        <div className="mt-4 flex items-center justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => openReplyModal(review)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#4F2396] hover:bg-[#3d1a75] text-white text-xs font-medium transition-colors shadow-xs cursor-pointer"
          >
            <Reply size={13} />
            <span>{t("Publish Official Admin Reply", "نشر رد الإدارة الرسمي")}</span>
          </button>
        </div>
      )}
    </div>
  );
}
