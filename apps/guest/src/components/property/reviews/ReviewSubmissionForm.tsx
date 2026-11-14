"use client";

import React, { FormEvent } from "react";
import { Check, LoaderCircle, Edit3 } from "lucide-react";
import { RatingScale, CategoryRatingSelect } from "./RatingInputs";
import {
  categoryKeys,
  CATEGORY_LABELS,
  type CategoryKey,
  type EligibleBooking,
} from "./reviewHelpers";
import type { UserExistingReview } from "./reviewsApi";

interface ReviewSubmissionFormProps {
  isDemo: boolean;
  formOpen: boolean;
  setFormOpen: (open: boolean) => void;
  user: { id?: string } | null;
  eligibleBookings: EligibleBooking[];
  upcomingCount: number;
  reviewedCount: number;
  userReviews?: UserExistingReview[];
  editingReviewId?: string | null;
  onStartEdit?: (review?: UserExistingReview) => void;
  onCancelEdit?: () => void;
  eligibilityLoading: boolean;
  eligibilityError: string;
  selectedBookingId: string;
  setSelectedBookingId: (id: string) => void;
  title: string;
  setTitle: (t: string) => void;
  comment: string;
  setComment: (c: string) => void;
  rating: number;
  setRating: (r: number) => void;
  categoryRatings: Record<CategoryKey, number>;
  setCategoryRatings: React.Dispatch<
    React.SetStateAction<Record<CategoryKey, number>>
  >;
  submitting: boolean;
  submitError: string;
  setSubmitError: (e: string) => void;
  successMessage: string;
  onSubmitReview: (e: FormEvent<HTMLFormElement>) => Promise<void>;
  onOpenSignIn: () => void;
  label: (en: string, ar: string) => string;
}

export function ReviewSubmissionForm({
  isDemo,
  formOpen,
  setFormOpen,
  user,
  eligibleBookings,
  upcomingCount,
  reviewedCount,
  userReviews = [],
  editingReviewId,
  onStartEdit,
  onCancelEdit,
  eligibilityLoading,
  eligibilityError,
  selectedBookingId,
  setSelectedBookingId,
  title,
  setTitle,
  comment,
  setComment,
  rating,
  setRating,
  categoryRatings,
  setCategoryRatings,
  submitting,
  submitError,
  setSubmitError,
  successMessage,
  onSubmitReview,
  onOpenSignIn,
  label,
}: ReviewSubmissionFormProps) {
  return (
    <section
      className="mt-8 border-t border-gray-100 pt-6 dark:border-white/10"
      aria-labelledby="write-review-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3
            id="write-review-heading"
            className="text-base font-bold text-gray-950 dark:text-white"
          >
            {editingReviewId
              ? label("Edit your review", "تعديل تقييمك")
              : label("Share your stay", "شارك تجربتك")}
          </h3>
          <p className="mt-1 text-xs leading-5 text-gray-600 dark:text-gray-400">
            {editingReviewId
              ? label(
                  "You can update your rating, title, and comments below.",
                  "يمكنك تعديل تقييمك وعنوانه وتفاصيله أدناه."
                )
              : label(
                  "Only guests with a paid booking whose checkout date has passed can submit a review.",
                  "يمكن للضيوف الذين لديهم حجز مدفوع بعد انقضاء تاريخ تسجيل المغادرة فقط إرسال تقييم."
                )}
          </p>
        </div>
        {!isDemo && !formOpen && user && eligibleBookings.length > 0 && (
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="rounded-xl bg-violet-800 px-4 py-2.5 text-xs font-bold text-white cursor-pointer hover:bg-violet-900 transition"
          >
            {label("Write a review", "اكتب تقييماً")}
          </button>
        )}
        {!isDemo && !formOpen && user && (userReviews.length > 0 || reviewedCount > 0) && (
          <button
            type="button"
            onClick={() => onStartEdit && onStartEdit()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-violet-600 bg-violet-50 px-4 py-2.5 text-xs font-bold text-violet-800 hover:bg-violet-100 dark:border-violet-400 dark:bg-violet-950/40 dark:text-violet-200 cursor-pointer transition shadow-xs"
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>{label("Edit your review", "تعديل تقييمك")}</span>
          </button>
        )}
        {!isDemo && !user && (
          <button
            type="button"
            onClick={onOpenSignIn}
            className="rounded-xl bg-violet-800 px-4 py-2.5 text-xs font-bold text-white cursor-pointer hover:bg-violet-900 transition"
          >
            {label("Sign in", "تسجيل الدخول")}
          </button>
        )}
      </div>

      {isDemo ? (
        <p className="mt-3 text-xs leading-5 text-gray-600 dark:text-gray-400">
          {label(
            "Review submission is available on live listings after a paid stay is completed.",
            "يمكن إرسال التقييمات للعقارات الفعلية بعد إكمال إقامة مدفوعة."
          )}
        </p>
      ) : (
        <>
          {eligibilityLoading && (
            <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              {label(
                "Checking completed stays…",
                "جارٍ التحقق من الإقامات المكتملة..."
              )}
            </div>
          )}
          {eligibilityError && (
            <p
              role="status"
              className="mt-3 text-xs leading-5 text-amber-800 dark:text-amber-200"
            >
              {eligibilityError}
            </p>
          )}
          {!eligibilityLoading &&
            !eligibilityError &&
            user &&
            !eligibleBookings.length && (
              <div className="mt-3 text-xs leading-5 text-gray-600 dark:text-gray-400">
                {upcomingCount ? (
                  label(
                    "Your review unlocks after your stay's checkout date has passed.",
                    "سيُتاح التقييم بعد انتهاء تاريخ تسجيل المغادرة لإقامتك."
                  )
                ) : (reviewedCount || userReviews.length > 0) ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-violet-100 bg-violet-50/60 p-3.5 dark:border-white/10 dark:bg-white/[0.03]">
                    <span>
                      {label(
                        "You have already reviewed your stay for this listing.",
                        "لقد قمت بتقييم إقامتك لهذا العقار مسبقاً."
                      )}
                    </span>
                    {onStartEdit && !formOpen && (
                      <button
                        type="button"
                        onClick={() => onStartEdit()}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-700 hover:underline dark:text-violet-300 cursor-pointer"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>{label("Edit review", "تعديل التقييم")}</span>
                      </button>
                    )}
                  </div>
                ) : (
                  label(
                    "No eligible stay after checkout was found for this listing. A reservation alone is not enough to review.",
                    "لم نعثر على إقامة مؤهلة بعد تسجيل المغادرة لهذا العقار. الحجز قبل انتهاء الإقامة لا يتيح إضافة تقييم."
                  )
                )}
              </div>
            )}
        </>
      )}
      {successMessage && (
        <p
          role="status"
          className="mt-3 flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-xs leading-5 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-200"
        >
          <Check className="mt-0.5 h-4 w-4 shrink-0" />
          {successMessage}
        </p>
      )}

      {formOpen && (eligibleBookings.length > 0 || Boolean(editingReviewId)) && (
        <form
          onSubmit={onSubmitReview}
          className="mt-5 rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-[#12101a] sm:p-5"
        >
          {eligibleBookings.length > 1 && !editingReviewId && (
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
              {label("Choose completed stay", "اختر الإقامة المكتملة")}
              <select
                value={selectedBookingId}
                onChange={(event) => setSelectedBookingId(event.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs dark:border-white/10 dark:bg-[#08070D] dark:text-white cursor-pointer"
              >
                {eligibleBookings.map((booking) => (
                  <option key={booking.id} value={booking.id}>
                    {booking.check_in} → {booking.check_out}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="mt-4">
            <label className="text-xs font-semibold text-gray-800 dark:text-gray-200">
              {label("Overall rating", "التقييم العام")}
            </label>
            <RatingScale
              value={rating}
              onChange={setRating}
              label={label("Overall rating", "التقييم العام")}
            />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {categoryKeys.map((key) => (
              <label
                key={key}
                className="text-[11px] font-semibold text-gray-600 dark:text-gray-300"
              >
                {label(...CATEGORY_LABELS[key])}
                <CategoryRatingSelect
                  value={categoryRatings[key]}
                  onChange={(next) =>
                    setCategoryRatings((current) => ({
                      ...current,
                      [key]: next,
                    }))
                  }
                  label={label(...CATEGORY_LABELS[key])}
                />
              </label>
            ))}
          </div>
          <label className="mt-4 block text-xs font-semibold text-gray-800 dark:text-gray-200">
            {label("Review title", "عنوان التقييم")}
            <input
              required
              minLength={5}
              maxLength={120}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-400 dark:border-white/10 dark:bg-[#08070D] dark:text-white"
              placeholder={label("What stood out?", "ما الذي أعجبك؟")}
            />
          </label>
          <label className="mt-4 block text-xs font-semibold text-gray-800 dark:text-gray-200">
            {label("Your stay", "تفاصيل الإقامة")}
            <textarea
              required
              minLength={20}
              maxLength={3000}
              rows={5}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              className="mt-1 w-full resize-y rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm leading-6 outline-none focus:border-violet-400 dark:border-white/10 dark:bg-[#08070D] dark:text-white"
              placeholder={label(
                "Share what future guests should know…",
                "شارك ما ينبغي للضيوف معرفته..."
              )}
            />
            <span className="mt-1 block text-right text-[10px] font-normal text-gray-500">
              {comment.length} / 3000
            </span>
          </label>
          {submitError && (
            <p
              role="alert"
              className="mt-4 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-400/10 dark:text-rose-200"
            >
              {submitError}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-800 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60 cursor-pointer hover:bg-violet-900 transition shadow-xs"
            >
              {submitting && <LoaderCircle className="h-4 w-4 animate-spin" />}
              {editingReviewId
                ? label("Save changes", "حفظ التعديلات")
                : label("Submit verified review", "إرسال التقييم الموثق")}
            </button>
            <button
              type="button"
              onClick={() => {
                if (onCancelEdit) {
                  onCancelEdit();
                } else {
                  setFormOpen(false);
                  setSubmitError("");
                }
              }}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-semibold text-gray-700 dark:border-white/10 dark:text-gray-200 cursor-pointer hover:bg-gray-50 transition"
            >
              {label("Cancel", "إلغاء")}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

