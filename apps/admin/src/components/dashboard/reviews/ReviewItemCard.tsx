"use client";

import React from "react";
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
      className="rounded-2xl bg-surface-container-lowest p-5 sm:p-6 shadow-sm border border-surface-container-high hover:border-primary/40 transition-colors"
    >
      {/* Header Row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black uppercase tracking-wider text-primary">
              {review.property_title || t("Listing Stay", "إقامة وحدة")}
            </span>
            {review.property_city && (
              <span className="text-[11px] font-semibold text-outline">
                • {review.property_city}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-sm text-on-surface">
              {review.guest_display_name || t("Verified Guest", "ضيف موثق")}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-[10px] font-bold text-status-emerald border border-status-emerald/20">
              <span className="material-symbols-outlined text-[12px]">verified</span>
              <span>{t("Verified Stay", "إقامة موثقة")}</span>
            </span>
            <span className="text-[11px] text-outline">
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
          <div className="flex items-center gap-1.5 rounded-xl bg-amber-500/10 px-3 py-1.5 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-black text-sm">
            <span className="material-symbols-outlined text-[16px]">star</span>
            <span>{score.toFixed(1)}</span>
            <span className="text-[11px] font-medium text-outline">/ 10</span>
          </div>

          {hasAdminReply ? (
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary border border-primary/20">
              {t("Replied", "تم الرد")}
            </span>
          ) : (
            <span className="rounded-full bg-status-terracotta/10 px-2.5 py-1 text-[10px] font-bold text-status-terracotta border border-status-terracotta/20">
              {t("Needs Reply", "بحاجة لرد")}
            </span>
          )}
        </div>
      </div>

      {/* Review Body */}
      <div className="mt-3.5 space-y-2">
        {review.title && (
          <h4 className="text-sm font-bold text-on-surface">{review.title}</h4>
        )}
        <p className="text-xs leading-relaxed text-on-surface-variant whitespace-pre-line">
          {review.comment}
        </p>
      </div>

      {/* Sub-ratings Pills if present */}
      {(review.cleanliness_rating ||
        review.accuracy_rating ||
        review.services_rating ||
        review.checkin_rating) && (
        <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
          {review.cleanliness_rating && (
            <span className="rounded-lg bg-surface-container px-2 py-0.5 text-on-surface-variant font-medium">
              {t("Cleanliness:", "النظافة:")}{" "}
              <strong>{Number(review.cleanliness_rating).toFixed(1)}</strong>
            </span>
          )}
          {review.accuracy_rating && (
            <span className="rounded-lg bg-surface-container px-2 py-0.5 text-on-surface-variant font-medium">
              {t("Accuracy:", "الدقة:")}{" "}
              <strong>{Number(review.accuracy_rating).toFixed(1)}</strong>
            </span>
          )}
          {review.services_rating && (
            <span className="rounded-lg bg-surface-container px-2 py-0.5 text-on-surface-variant font-medium">
              {t("Services:", "الخدمات:")}{" "}
              <strong>{Number(review.services_rating).toFixed(1)}</strong>
            </span>
          )}
          {review.checkin_rating && (
            <span className="rounded-lg bg-surface-container px-2 py-0.5 text-on-surface-variant font-medium">
              {t("Check-in:", "تسجيل الدخول:")}{" "}
              <strong>{Number(review.checkin_rating).toFixed(1)}</strong>
            </span>
          )}
        </div>
      )}

      {/* Admin Reply Box if present */}
      {hasAdminReply && (
        <div className="mt-4 rounded-xl bg-surface-container-low p-4 border border-primary/20 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-primary">
              <span className="material-symbols-outlined text-[16px]">verified_user</span>
              <span>{t("Official QafNest Response", "رد قاف نست الرسمي")}</span>
              <span className="text-outline font-normal">
                • {t("by", "بواسطة")} {review.admin_reply_by || t("Operations Admin", "مشرف العمليات")}
                {review.admin_reply_at &&
                  ` ${t("on", "بتاريخ")} ${new Date(review.admin_reply_at).toLocaleDateString(dateLocale)}`}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => openReplyModal(review)}
                className="px-2 py-1 text-[11px] font-bold text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
              >
                {t("Edit", "تعديل")}
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteReply(review.id)}
                disabled={deletingId === review.id}
                className="px-2 py-1 text-[11px] font-bold text-status-terracotta hover:bg-status-terracotta/10 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
              >
                {deletingId === review.id
                  ? t("Removing...", "جارٍ الحذف...")
                  : t("Remove", "حذف")}
              </button>
            </div>
          </div>

          {review.admin_reply && (
            <p className="text-xs text-on-surface leading-relaxed" dir="ltr">
              {review.admin_reply}
            </p>
          )}
          {review.admin_reply_ar && (
            <p
              className={`text-xs text-on-surface leading-relaxed font-arabic ${
                review.admin_reply ? "pt-1.5 border-t border-surface-container" : ""
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
        <div className="mt-4 flex items-center justify-end pt-3 border-t border-surface-container">
          <button
            type="button"
            onClick={() => openReplyModal(review)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">reply</span>
            <span>{t("Publish Official Admin Reply", "نشر رد الإدارة الرسمي")}</span>
          </button>
        </div>
      )}
    </div>
  );
}
