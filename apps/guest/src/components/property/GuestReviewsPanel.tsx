"use client";

import { useCallback } from "react";
import { LoaderCircle, MessageSquareText } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import type { Property } from "@/data/properties";
import { ReviewSummaryOverview } from "./reviews/ReviewSummaryOverview";
import { ReviewItemCard } from "./reviews/ReviewItemCard";
import { ReviewPagination } from "./reviews/ReviewPagination";
import { ReviewSubmissionForm } from "./reviews/ReviewSubmissionForm";
import { useGuestReviews } from "./reviews/useGuestReviews";

export default function GuestReviewsPanel({ property }: { property: Property }) {
  const { language } = useApp();
  const { user, openAuthModal } = useAuth();
  const isArabic = language === "ar";
  const label = useCallback((en: string, ar: string) => (isArabic ? ar : en), [isArabic]);

  const {
    reviews,
    summary,
    page,
    setPage,
    totalPages,
    total,
    isDemo,
    loadingReviews,
    reviewError,
    eligibleBookings,
    upcomingCount,
    reviewedCount,
    eligibilityLoading,
    eligibilityError,
    selectedBookingId,
    setSelectedBookingId,
    formOpen,
    setFormOpen,
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
    showOriginal,
    setShowOriginal,
    submitReview,
    userReviews,
    editingReviewId,
    handleStartEdit,
    handleCancelEdit,
    currentUserId,
  } = useGuestReviews(property, label);

  return (
    <section
      id="reviews"
      className="scroll-mt-32 border-b border-violet-100/80 py-8 dark:border-violet-500/15"
    >
      <div className="mb-6">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">
          {label("Verified guest feedback", "آراء الضيوف الموثقة")}
        </span>
        <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-gray-950 dark:text-white">
          {label("Guest Reviews", "تقييمات الضيوف")}
        </h2>
      </div>

      {isDemo && (
        <div className="mb-6 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
          <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            {label(
              "Sample reviews are for preview only; they are not real or verified customer feedback.",
              "التقييمات المعروضة عينات للمعاينة فقط، وليست آراء حقيقية أو موثقة من عملاء."
            )}
          </p>
        </div>
      )}

      {reviewError && (
        <div
          role="alert"
          className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200"
        >
          {reviewError}
        </div>
      )}

      {loadingReviews ? (
        <div className="flex items-center gap-2 py-12 text-sm text-gray-500">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          {label("Loading reviews…", "جارٍ تحميل التقييمات...")}
        </div>
      ) : total > 0 ? (
        <>
          {/* Summary Overview */}
          <ReviewSummaryOverview
            summary={summary}
            total={total}
            isArabic={isArabic}
            label={label}
          />

          {/* Reviews List */}
          {reviews.length > 0 && (
            <div className="mt-6 columns-1 gap-4 md:columns-2">
              {reviews.map((review) => {
                const isAuthor = Boolean(
                  currentUserId &&
                    (review.guest_id === currentUserId ||
                      review.guest_subject === currentUserId)
                );
                return (
                  <ReviewItemCard
                    key={review.id}
                    review={review}
                    isArabic={isArabic}
                    showOriginal={showOriginal}
                    setShowOriginal={setShowOriginal}
                    label={label}
                    isAuthor={isAuthor}
                    onEdit={() => handleStartEdit(review)}
                  />
                );
              })}
            </div>
          )}

          {/* Pagination */}
          <ReviewPagination
            page={page}
            totalPages={totalPages}
            setPage={setPage}
            label={label}
          />
        </>
      ) : !reviewError ? (
        <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center dark:border-white/15">
          <MessageSquareText className="mx-auto h-7 w-7 text-gray-400" />
          <p className="mt-3 text-sm font-semibold text-gray-800 dark:text-gray-200">
            {label("No guest reviews yet.", "لا توجد تقييمات للضيوف حتى الآن.")}
          </p>
        </div>
      ) : null}

      {/* Review Submission Form Section */}
      <ReviewSubmissionForm
        isDemo={isDemo}
        formOpen={formOpen}
        setFormOpen={setFormOpen}
        user={user}
        eligibleBookings={eligibleBookings}
        upcomingCount={upcomingCount}
        reviewedCount={reviewedCount}
        userReviews={userReviews}
        editingReviewId={editingReviewId}
        onStartEdit={handleStartEdit}
        onCancelEdit={handleCancelEdit}
        eligibilityLoading={eligibilityLoading}
        eligibilityError={eligibilityError}
        selectedBookingId={selectedBookingId}
        setSelectedBookingId={setSelectedBookingId}
        title={title}
        setTitle={setTitle}
        comment={comment}
        setComment={setComment}
        rating={rating}
        setRating={setRating}
        categoryRatings={categoryRatings}
        setCategoryRatings={setCategoryRatings}
        submitting={submitting}
        submitError={submitError}
        setSubmitError={setSubmitError}
        successMessage={successMessage}
        onSubmitReview={submitReview}
        onOpenSignIn={() => openAuthModal("signin")}
        label={label}
      />
    </section>
  );
}
