"use client";

import type { Session } from "@supabase/supabase-js";
import { getReviewAuthorizationHeaders } from "@/lib/reviews/client";
import { type GuestReview, type ReviewSummary } from "@/lib/reviews/types";
import type { Property } from "@/data/properties";
import type { CategoryKey, EligibleBooking } from "./reviewHelpers";

type ReviewResponse = {
  reviews: GuestReview[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: ReviewSummary;
  isDemo: boolean;
};

export async function fetchPropertyReviews({
  property,
  page,
  label,
}: {
  property: Property;
  page: number;
  label: (en: string, ar: string) => string;
}): Promise<{
  reviews: GuestReview[];
  total: number;
  totalPages: number;
  summary: ReviewSummary;
  isDemo: boolean;
}> {
  const params = new URLSearchParams({ propertyId: property.id, page: String(page) });
  const response = await fetch(`/api/reviews?${params.toString()}`, { cache: "no-store" });
  const result = (await response.json()) as ReviewResponse & {
    code?: string;
    message?: string;
  };

  if (!response.ok) {
    if (result.code === "review_schema_not_ready") {
      throw new Error(
        label(
          "Apply the verified reviews migration to load live reviews.",
          "طبّق تحديث قاعدة بيانات التقييمات الموثقة لعرض التقييمات الحية."
        )
      );
    }
    throw new Error(
      result.message || label("Reviews could not be loaded.", "تعذر تحميل التقييمات.")
    );
  }

  return {
    reviews: result.reviews || [],
    total: result.total || 0,
    totalPages: result.totalPages || 1,
    summary: result.summary || {
      total: 0,
      average: 0,
      categoryAverages: {
        accuracy: null,
        cleanliness: null,
        services: null,
        propertyState: null,
      },
    },
    isDemo: Boolean(result.isDemo),
  };
}

export type UserExistingReview = {
  id: string;
  booking_id: string | null;
  property_id?: string;
  title: string;
  comment: string;
  rating: number;
  cleanliness_rating: number;
  accuracy_rating: number;
  services_rating: number | null;
  property_state_rating: number | null;
  created_at: string;
};

export async function fetchReviewEligibility({
  propertyId,
  session,
  label,
}: {
  propertyId: string;
  session: Session | null;
  label: (en: string, ar: string) => string;
}): Promise<{
  eligibleBookings: EligibleBooking[];
  upcomingCount: number;
  reviewedCount: number;
  userReviews: UserExistingReview[];
}> {
  const headers = await getReviewAuthorizationHeaders(session);
  if (!headers.Authorization) {
    throw new Error(
      label(
        "Your sign-in session could not be verified. Please sign in again.",
        "تعذر التحقق من جلسة الدخول. يرجى تسجيل الدخول مجدداً."
      )
    );
  }

  const response = await fetch(
    `/api/reviews/eligibility?propertyId=${encodeURIComponent(propertyId)}`,
    { headers, cache: "no-store" }
  );
  const result = (await response.json()) as {
    eligibleBookings?: EligibleBooking[];
    upcomingCount?: number;
    reviewedCount?: number;
    userReviews?: UserExistingReview[];
    code?: string;
  };

  if (!response.ok) {
    if (result.code === "sign_in_required") {
      throw new Error(
        label(
          "Please sign in with the account used for the booking.",
          "يرجى تسجيل الدخول بالحساب المستخدم للحجز."
        )
      );
    }
    if (result.code === "auth_provider_setup_required") {
      throw new Error(
        label(
          "Firebase review access needs to be enabled in the Supabase project.",
          "يحتاج وصول مراجعات Firebase إلى التفعيل في مشروع Supabase."
        )
      );
    }
    if (result.code === "review_schema_not_ready") {
      throw new Error(
        label(
          "Apply the verified reviews migration before checking completed stays.",
          "طبّق تحديث قاعدة بيانات التقييمات الموثقة قبل التحقق من الإقامات المكتملة."
        )
      );
    }
    throw new Error(
      label("We could not check your completed stays right now.", "تعذر التحقق من الإقامات المكتملة حالياً.")
    );
  }

  return {
    eligibleBookings: result.eligibleBookings || [],
    upcomingCount: result.upcomingCount || 0,
    reviewedCount: result.reviewedCount || 0,
    userReviews: result.userReviews || [],
  };
}

export async function submitGuestReview({
  propertyId,
  bookingId,
  title,
  comment,
  rating,
  categoryRatings,
  session,
  label,
}: {
  propertyId: string;
  bookingId: string;
  title: string;
  comment: string;
  rating: number;
  categoryRatings: Record<CategoryKey, number>;
  session: Session | null;
  label: (en: string, ar: string) => string;
}): Promise<void> {
  const headers = await getReviewAuthorizationHeaders(session);
  if (!headers.Authorization) {
    throw new Error(
      label(
        "Your sign-in session could not be verified. Please sign in again.",
        "تعذر التحقق من جلسة الدخول. يرجى تسجيل الدخول مجدداً."
      )
    );
  }

  const response = await fetch("/api/reviews/submit", {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      propertyId,
      bookingId,
      title,
      comment,
      rating,
      cleanliness: categoryRatings.cleanliness,
      accuracy: categoryRatings.accuracy,
      services: categoryRatings.services,
      propertyState: categoryRatings.propertyState,
    }),
  });

  const result = (await response.json()) as { code?: string; message?: string };
  if (!response.ok) {
    const messages: Record<string, string> = {
      completed_stay_required: label(
        "A paid, verified stay is required before you can review.",
        "يمكنك التقييم بعد إكمال إقامة مدفوعة ومؤكدة فقط."
      ),
      review_already_submitted: label(
        "A review has already been submitted for this booking.",
        "تم إرسال تقييم لهذا الحجز من قبل."
      ),
      invalid_booking: label(
        "The selected booking could not be verified. Please check your reservation.",
        "تعذر التحقق من الحجز المحدد. يرجى مراجعة بيانات حجزك."
      ),
      invalid_review_text: label(
        "Please provide a title (at least 5 characters) and a comment (at least 20 characters).",
        "يرجى إدخال عنوان لا يقل عن 5 أحرف وتفاصيل لا تقل عن 20 حرفاً."
      ),
      invalid_rating: label(
        "Please rate the categories between 1 and 10.",
        "يرجى تحديد التقييمات بين 1 و 10."
      ),
      sign_in_required: label(
        "Please sign in with your account to submit a review.",
        "يرجى تسجيل الدخول بحسابك لإرسال التقييم."
      ),
      review_schema_not_ready: label(
        "The review database migration must be applied first.",
        "يجب تطبيق تحديث قاعدة بيانات التقييمات أولاً."
      ),
      auth_provider_setup_required: label(
        "Firebase review access needs to be enabled in the Supabase project.",
        "يحتاج وصول مراجعات Firebase إلى التفعيل في مشروع Supabase."
      ),
      review_submission_failed: label(
        "We could not save your review at this moment. Please try again.",
        "تعذر حفظ تقييمك في الوقت الحالي. يرجى المحاولة مرة أخرى."
      ),
    };
    throw new Error(
      messages[result.code || ""] ||
        result.message ||
        label("Your review could not be submitted. Please try again.", "تعذر إرسال التقييم. حاول مرة أخرى.")
    );
  }
}

export async function updateGuestReview({
  reviewId,
  title,
  comment,
  rating,
  categoryRatings,
  session,
  label,
}: {
  reviewId: string;
  title: string;
  comment: string;
  rating: number;
  categoryRatings: Record<CategoryKey, number>;
  session: Session | null;
  label: (en: string, ar: string) => string;
}): Promise<void> {
  const headers = await getReviewAuthorizationHeaders(session);
  if (!headers.Authorization) {
    throw new Error(
      label(
        "Your sign-in session could not be verified. Please sign in again.",
        "تعذر التحقق من جلسة الدخول. يرجى تسجيل الدخول مجدداً."
      )
    );
  }

  const response = await fetch("/api/reviews/submit", {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      reviewId,
      title,
      comment,
      rating,
      cleanliness: categoryRatings.cleanliness,
      accuracy: categoryRatings.accuracy,
      services: categoryRatings.services,
      propertyState: categoryRatings.propertyState,
    }),
  });

  const result = (await response.json()) as { code?: string; message?: string };
  if (!response.ok) {
    throw new Error(
      result.message ||
        label("Your review could not be updated. Please try again.", "تعذر تعديل التقييم. حاول مرة أخرى.")
    );
  }
}

