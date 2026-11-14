"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import type { GuestReview, ReviewSummary } from "@/lib/reviews/types";
import type { Property } from "@/data/properties";
import { type CategoryKey, type EligibleBooking } from "./reviewHelpers";
import {
  fetchPropertyReviews,
  fetchReviewEligibility,
  submitGuestReview,
  updateGuestReview,
  type UserExistingReview,
} from "./reviewsApi";

export function useGuestReviews(property: Property, label: (en: string, ar: string) => string) {
  const { user, session } = useAuth();
  const search = typeof window === "undefined" ? "" : window.location.search;
  const requestedBooking = useMemo(
    () => new URLSearchParams(search).get("review_booking") || "",
    [search]
  );

  const [reviews, setReviews] = useState<GuestReview[]>([]);
  const [summary, setSummary] = useState<ReviewSummary>({
    total: 0,
    average: 0,
    categoryAverages: { accuracy: null, cleanliness: null, services: null, propertyState: null },
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isDemo, setIsDemo] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [reviewError, setReviewError] = useState("");
  const [eligibleBookings, setEligibleBookings] = useState<EligibleBooking[]>([]);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [userReviews, setUserReviews] = useState<UserExistingReview[]>([]);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const [eligibilityError, setEligibilityError] = useState("");
  const [selectedBookingId, setSelectedBookingId] = useState(requestedBooking);
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(10);
  const [categoryRatings, setCategoryRatings] = useState<Record<CategoryKey, number>>({
    accuracy: 10,
    cleanliness: 10,
    services: 10,
    propertyState: 10,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showOriginal, setShowOriginal] = useState<Record<string, boolean>>({});

  const loadReviews = useCallback(async () => {
    setLoadingReviews(true);
    setReviewError("");

    try {
      const result = await fetchPropertyReviews({ property, page, label });
      setReviews(result.reviews);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      setSummary(result.summary);
      setIsDemo(result.isDemo);
    } catch (error) {
      setReviews([]);
      setTotal(0);
      setTotalPages(1);
      setSummary({
        total: 0,
        average: 0,
        categoryAverages: {
          accuracy: null,
          cleanliness: null,
          services: null,
          propertyState: null,
        },
      });
      setReviewError(
        error instanceof Error ? error.message : label("Reviews could not be loaded.", "تعذر تحميل التقييمات.")
      );
    } finally {
      setLoadingReviews(false);
    }
  }, [property, page, label]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  const loadEligibility = useCallback(async () => {
    setEligibleBookings([]);
    setUpcomingCount(0);
    setReviewedCount(0);
    setEligibilityError("");
    if (!user) return;

    setEligibilityLoading(true);
    try {
      const result = await fetchReviewEligibility({ propertyId: property.id, session, label });
      setEligibleBookings(result.eligibleBookings);
      setUpcomingCount(result.upcomingCount);
      setReviewedCount(result.reviewedCount);
      setUserReviews(result.userReviews || []);
    } catch (error) {
      setEligibilityError(
        error instanceof Error
          ? error.message
          : label("We could not check review eligibility.", "تعذر التحقق من أهلية التقييم.")
      );
    } finally {
      setEligibilityLoading(false);
    }
  }, [property.id, user, session, label]);

  useEffect(() => {
    void loadEligibility();
  }, [loadEligibility]);

  useEffect(() => {
    if (requestedBooking && eligibleBookings.some((booking) => booking.id === requestedBooking)) {
      setSelectedBookingId(requestedBooking);
      setFormOpen(true);
    } else if (
      eligibleBookings.length &&
      !eligibleBookings.some((booking) => booking.id === selectedBookingId)
    ) {
      setSelectedBookingId(eligibleBookings[0].id);
    }
  }, [requestedBooking, eligibleBookings, selectedBookingId]);

  const handleStartEdit = (reviewToEdit?: UserExistingReview | GuestReview) => {
    const target = reviewToEdit || userReviews[0];
    if (!target) return;
    setEditingReviewId(target.id);
    setTitle(target.title || "");
    setComment(target.comment || "");
    setRating(target.rating || 10);
    setCategoryRatings({
      accuracy: target.accuracy_rating ?? 10,
      cleanliness: target.cleanliness_rating ?? 10,
      services: target.services_rating ?? 10,
      propertyState: target.property_state_rating ?? 10,
    });
    if (target.booking_id) {
      setSelectedBookingId(target.booking_id);
    }
    setFormOpen(true);
    setSubmitError("");
    setSuccessMessage("");
  };

  const handleCancelEdit = () => {
    setEditingReviewId(null);
    setFormOpen(false);
    setSubmitError("");
    setTitle("");
    setComment("");
    setRating(10);
    setCategoryRatings({ accuracy: 10, cleanliness: 10, services: 10, propertyState: 10 });
  };

  const submitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError("");
    setSuccessMessage("");
    if (!editingReviewId && !selectedBookingId) return;
    if (title.trim().length < 5 || comment.trim().length < 20) {
      setSubmitError(
        label(
          "Add a title and at least 20 characters about your stay.",
          "أضف عنواناً ووصفاً لا يقل عن 20 حرفاً عن إقامتك."
        )
      );
      return;
    }

    setSubmitting(true);
    try {
      if (editingReviewId) {
        await updateGuestReview({
          reviewId: editingReviewId,
          title,
          comment,
          rating,
          categoryRatings,
          session,
          label,
        });

        setSuccessMessage(
          label("Your review has been updated successfully.", "تم تحديث تقييمك بنجاح.")
        );
        setEditingReviewId(null);
      } else {
        await submitGuestReview({
          propertyId: property.id,
          bookingId: selectedBookingId,
          title,
          comment,
          rating,
          categoryRatings,
          session,
          label,
        });

        setSuccessMessage(
          label("Thanks — your verified review is now published.", "شكراً لك — تم نشر تقييمك الموثق.")
        );
      }

      setTitle("");
      setComment("");
      setRating(10);
      setCategoryRatings({ accuracy: 10, cleanliness: 10, services: 10, propertyState: 10 });
      setPage(1);
      await loadEligibility();
      await loadReviews();
      setFormOpen(false);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : label("Your review could not be submitted.", "تعذر إرسال التقييم.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  return {
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
    userReviews,
    editingReviewId,
    handleStartEdit,
    handleCancelEdit,
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
    currentUserId: user?.id,
  };
}
