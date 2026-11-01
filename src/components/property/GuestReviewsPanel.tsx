"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Languages, LoaderCircle, MessageSquareText, ShieldCheck, Star } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { getReviewAuthorizationHeaders } from "@/lib/reviews/client";
import { getSampleReviews, isDemoProperty, summarizeReviews } from "@/lib/reviews/sampleReviews";
import { REVIEW_PAGE_SIZE, type GuestReview, type ReviewSummary } from "@/lib/reviews/types";
import type { Property } from "@/data/properties";

type EligibleBooking = {
  id: string;
  check_in: string;
  check_out: string;
};

type ReviewResponse = {
  reviews: GuestReview[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: ReviewSummary;
  isDemo: boolean;
};

const categoryKeys = ["accuracy", "cleanliness", "services", "propertyState"] as const;
type CategoryKey = (typeof categoryKeys)[number];

function RatingScale({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  label: string;
}) {
  return (
    <div className="mt-2 grid grid-cols-5 gap-1.5 sm:grid-cols-10" role="group" aria-label={`${label}, 1 to 10`}>
      {Array.from({ length: 10 }, (_, index) => index + 1).map((score) => (
        <button
          key={score}
          type="button"
          onClick={() => onChange(score)}
          aria-label={`${score} / 10`}
          aria-pressed={value === score}
          className={`h-9 rounded-lg border text-xs font-bold transition hover:border-violet-500 hover:text-violet-800 dark:hover:text-violet-200 ${value === score ? "border-violet-800 bg-violet-800 text-white" : "border-gray-200 bg-white text-gray-700 dark:border-white/10 dark:bg-[#08070D] dark:text-gray-200"}`}
        >
          {score}
        </button>
      ))}
      <span className="col-span-5 text-right text-[11px] font-semibold text-gray-500 dark:text-gray-400 sm:col-span-10">{value} / 10</span>
    </div>
  );
}

function CategoryRatingSelect({ value, onChange, label }: { value: number; onChange: (value: number) => void; label: string }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      aria-label={`${label}, 1 to 10`}
      className="mt-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-800 outline-none focus:border-violet-400 dark:border-white/10 dark:bg-[#08070D] dark:text-white"
    >
      {Array.from({ length: 10 }, (_, index) => 10 - index).map((score) => <option key={score} value={score}>{score} / 10</option>)}
    </select>
  );
}

function ratingDescription(value: number, isArabic: boolean) {
  if (isArabic) {
    if (value >= 9) return "ممتاز";
    if (value >= 7) return "جيد جداً";
    if (value >= 5) return "جيد";
    return "يحتاج إلى تحسين";
  }
  if (value >= 9) return "Amazing";
  if (value >= 7) return "Very good";
  if (value >= 5) return "Good";
  return "Needs improvement";
}

function reviewDate(date: string, isArabic: boolean) {
  return new Intl.DateTimeFormat(isArabic ? "ar-SA" : "en", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(date));
}

function reviewSummaryLines(summary: ReviewSummary, isArabic: boolean, categoryLabels: Record<CategoryKey, [string, string]>) {
  if (!summary.total) return [];
  const availableScores = categoryKeys
    .map((key) => ({ key, score: summary.categoryAverages[key] }))
    .filter((entry): entry is { key: CategoryKey; score: number } => entry.score !== null && Number.isFinite(entry.score));
  const strongest = availableScores.sort((a, b) => b.score - a.score)[0];
  const strongestName = strongest ? categoryLabels[strongest.key][isArabic ? 1 : 0] : "";
  return isArabic
    ? [
        `بلغ متوسط التقييم العام ${summary.average.toFixed(1)} من 10 بناءً على ${summary.total} تقييمات.`,
        strongest ? `أعلى الجوانب تقييماً: ${strongestName} (${strongest.score.toFixed(1)} من 10).` : "تقييمات الضيوف الموثقة معروضة أدناه.",
        "تشمل التقييمات دقة المعلومات والنظافة والخدمات وحالة العقار.",
      ]
    : [
        `Guests gave this stay an average rating of ${summary.average.toFixed(1)} out of 10 across ${summary.total} reviews.`,
        strongest ? `Highest-rated category: ${strongestName} (${strongest.score.toFixed(1)} out of 10).` : "Verified guest feedback is shown below.",
        "Ratings cover listing accuracy, cleanliness, services, and property condition.",
      ];
}

export default function GuestReviewsPanel({ property }: { property: Property }) {
  const { language } = useApp();
  const { user, session, openAuthModal } = useAuth();
  const isArabic = language === "ar";
  const label = useCallback((en: string, ar: string) => isArabic ? ar : en, [isArabic]);
  const search = typeof window === "undefined" ? "" : window.location.search;
  const requestedBooking = useMemo(() => new URLSearchParams(search).get("review_booking") || "", [search]);

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

  const categoryLabels: Record<CategoryKey, [string, string]> = {
    accuracy: ["Accuracy of listing information", "دقة معلومات الإعلان"],
    cleanliness: ["Cleanliness", "النظافة"],
    services: ["Services", "الخدمات"],
    propertyState: ["Property condition", "حالة العقار"],
  };

  const loadReviews = useCallback(async () => {
    setLoadingReviews(true);
    setReviewError("");

    // Keep preview listings useful without depending on a database/API round trip.
    // Live UUID-backed properties still load their published reviews from Supabase.
    if (isDemoProperty(property.id)) {
      const allReviews = getSampleReviews(property.id, property);
      const start = (page - 1) * REVIEW_PAGE_SIZE;
      setReviews(allReviews.slice(start, start + REVIEW_PAGE_SIZE));
      setTotal(allReviews.length);
      setTotalPages(Math.max(1, Math.ceil(allReviews.length / REVIEW_PAGE_SIZE)));
      setSummary(summarizeReviews(allReviews));
      setIsDemo(true);
      setLoadingReviews(false);
      return;
    }

    const params = new URLSearchParams({ propertyId: property.id, page: String(page) });

    try {
      const response = await fetch(`/api/reviews?${params.toString()}`, { cache: "no-store" });
      const result = await response.json() as ReviewResponse & { code?: string; message?: string };
      if (!response.ok) {
        if (result.code === "review_schema_not_ready") throw new Error(label("Apply the verified reviews migration to load live reviews.", "طبّق تحديث قاعدة بيانات التقييمات الموثقة لعرض التقييمات الحية."));
        throw new Error(result.message || label("Reviews could not be loaded.", "تعذر تحميل التقييمات."));
      }
      setReviews(result.reviews || []);
      setTotal(result.total || 0);
      setTotalPages(result.totalPages || 1);
      setSummary(result.summary || { total: 0, average: 0, categoryAverages: { accuracy: null, cleanliness: null, services: null, propertyState: null } });
      setIsDemo(Boolean(result.isDemo));
    } catch (error) {
      setReviews([]);
      setTotal(0);
      setTotalPages(1);
      setSummary({ total: 0, average: 0, categoryAverages: { accuracy: null, cleanliness: null, services: null, propertyState: null } });
      setReviewError(error instanceof Error ? error.message : label("Reviews could not be loaded.", "تعذر تحميل التقييمات."));
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
    if (!user || isDemoProperty(property.id)) return;

    setEligibilityLoading(true);
    try {
      const headers = await getReviewAuthorizationHeaders(session);
      if (!headers.Authorization) throw new Error(label("Your sign-in session could not be verified. Please sign in again.", "تعذر التحقق من جلسة الدخول. يرجى تسجيل الدخول مجدداً."));
      const response = await fetch(`/api/reviews/eligibility?propertyId=${encodeURIComponent(property.id)}`, { headers, cache: "no-store" });
      const result = await response.json() as { eligibleBookings?: EligibleBooking[]; upcomingCount?: number; reviewedCount?: number; code?: string };
      if (!response.ok) {
        if (result.code === "sign_in_required") throw new Error(label("Please sign in with the account used for the booking.", "يرجى تسجيل الدخول بالحساب المستخدم للحجز."));
        if (result.code === "auth_provider_setup_required") throw new Error(label("Firebase review access needs to be enabled in the Supabase project.", "يحتاج وصول مراجعات Firebase إلى التفعيل في مشروع Supabase."));
        if (result.code === "review_schema_not_ready") throw new Error(label("Apply the verified reviews migration before checking completed stays.", "طبّق تحديث قاعدة بيانات التقييمات الموثقة قبل التحقق من الإقامات المكتملة."));
        throw new Error(label("We could not check your completed stays right now.", "تعذر التحقق من الإقامات المكتملة حالياً."));
      }
      setEligibleBookings(result.eligibleBookings || []);
      setUpcomingCount(result.upcomingCount || 0);
      setReviewedCount(result.reviewedCount || 0);
    } catch (error) {
      setEligibilityError(error instanceof Error ? error.message : label("We could not check review eligibility.", "تعذر التحقق من أهلية التقييم."));
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
    } else if (eligibleBookings.length && !eligibleBookings.some((booking) => booking.id === selectedBookingId)) {
      setSelectedBookingId(eligibleBookings[0].id);
    }
  }, [requestedBooking, eligibleBookings, selectedBookingId]);

  const submitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError("");
    setSuccessMessage("");
    if (!selectedBookingId) return;
    if (title.trim().length < 5 || comment.trim().length < 20) {
      setSubmitError(label("Add a title and at least 20 characters about your stay.", "أضف عنواناً ووصفاً لا يقل عن 20 حرفاً عن إقامتك."));
      return;
    }

    setSubmitting(true);
    try {
      const headers = await getReviewAuthorizationHeaders(session);
      if (!headers.Authorization) throw new Error(label("Your sign-in session could not be verified. Please sign in again.", "تعذر التحقق من جلسة الدخول. يرجى تسجيل الدخول مجدداً."));
      const response = await fetch("/api/reviews/submit", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: property.id,
          bookingId: selectedBookingId,
          title,
          comment,
          rating,
          cleanliness: categoryRatings.cleanliness,
          accuracy: categoryRatings.accuracy,
          services: categoryRatings.services,
          propertyState: categoryRatings.propertyState,
        }),
      });
      const result = await response.json() as { code?: string };
      if (!response.ok) {
        const messages: Record<string, string> = {
          completed_stay_required: label("A paid, completed stay is required before you can review.", "يمكنك التقييم بعد إكمال إقامة مدفوعة فقط."),
          review_already_submitted: label("A review has already been submitted for this booking.", "تم إرسال تقييم لهذا الحجز من قبل."),
          review_schema_not_ready: label("The review database migration must be applied first.", "يجب تطبيق تحديث قاعدة بيانات التقييمات أولاً."),
          auth_provider_setup_required: label("Firebase review access needs to be enabled in the Supabase project.", "يحتاج وصول مراجعات Firebase إلى التفعيل في مشروع Supabase."),
        };
        throw new Error(messages[result.code || ""] || label("Your review could not be submitted. Please try again.", "تعذر إرسال التقييم. حاول مرة أخرى."));
      }

      setSuccessMessage(label("Thanks — your verified review is now published.", "شكراً لك — تم نشر تقييمك الموثق."));
      setTitle("");
      setComment("");
      setRating(10);
      setCategoryRatings({ accuracy: 10, cleanliness: 10, services: 10, propertyState: 10 });
      setPage(1);
      await loadEligibility();
      await loadReviews();
      setFormOpen(false);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : label("Your review could not be submitted.", "تعذر إرسال التقييم."));
    } finally {
      setSubmitting(false);
    }
  };

  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);
  const summaryLines = reviewSummaryLines(summary, isArabic, categoryLabels);
  const scoredCategories = categoryKeys.filter((key) => summary.categoryAverages[key] !== null);

  return (
    <section id="reviews" className="scroll-mt-32 border-b border-gray-100 py-8 dark:border-white/10">
      <div className="mb-6">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">{label("Verified guest feedback", "آراء الضيوف الموثقة")}</span>
        <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-gray-950 dark:text-white">{label("Guest Reviews", "تقييمات الضيوف")}</h2>
      </div>

      {isDemo && <div className="mb-6 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
        <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0" />
        <p>{label("Sample reviews are for preview only; they are not real or verified customer feedback.", "التقييمات المعروضة عينات للمعاينة فقط، وليست آراء حقيقية أو موثقة من عملاء.")}</p>
      </div>}

      {reviewError && <div role="alert" className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">{reviewError}</div>}

      {loadingReviews ? (
        <div className="flex items-center gap-2 py-12 text-sm text-gray-500"><LoaderCircle className="h-4 w-4 animate-spin" />{label("Loading reviews…", "جارٍ تحميل التقييمات...")}</div>
      ) : total > 0 ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <article className="flex min-h-24 items-center gap-4 rounded-2xl border border-violet-100 bg-violet-50/50 p-4 dark:border-violet-400/15 dark:bg-violet-400/[0.06]">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-amber-300 text-xl font-extrabold text-gray-950">{summary.average.toFixed(1)}</span>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">{label("General Rating", "التقييم العام")} ({total} {label("Reviews", "تقييمات")})</p>
                <p className="mt-1 text-sm font-bold text-gray-950 dark:text-white">{ratingDescription(summary.average, isArabic)}</p>
              </div>
            </article>
            {scoredCategories.map((key) => {
              const score = summary.categoryAverages[key];
              if (score === null) return null;
              return <article key={key} className="flex min-h-24 items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-[#12101a]">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-violet-100 text-lg font-bold text-gray-950 dark:border-violet-400/15 dark:text-white">{score.toFixed(1)}</span>
                <div className="min-w-0">
                  <p className="text-xs leading-5 text-gray-600 dark:text-gray-400">{label(...categoryLabels[key])}</p>
                  <p className="mt-1 text-sm font-bold text-gray-950 dark:text-white">{ratingDescription(score, isArabic)}</p>
                </div>
              </article>;
            })}
          </div>

          {summaryLines.length > 0 && <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-[#12101a] sm:p-6" aria-labelledby="review-summary-heading">
            <h3 id="review-summary-heading" className="text-base font-bold text-gray-950 dark:text-white">{label(`Reviews Summary (${total} reviews)`, `ملخص التقييمات (${total} تقييمات)`)}</h3>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-gray-700 dark:text-gray-300">
              {summaryLines.map((line) => <li key={line}>{line}</li>)}
            </ul>
          </section>}

          {reviews.length > 0 && <div className="mt-6 columns-1 gap-4 md:columns-2">
            {reviews.map((review) => {
              const alternateComment = isArabic ? review.comment : review.comment_ar;
              const alternateReply = isArabic ? review.admin_reply : review.admin_reply_ar;
              const hasAlternateLanguage = Boolean(alternateComment && alternateComment !== (isArabic ? review.comment_ar : review.comment));
              const hasAlternateReply = Boolean(alternateReply && alternateReply !== (isArabic ? review.admin_reply_ar : review.admin_reply));
              const showThisOriginal = Boolean(showOriginal[review.id]);
              const showReplyOriginal = Boolean(showOriginal[`${review.id}-reply`]);
              const displayComment = showThisOriginal && alternateComment
                ? alternateComment
                : isArabic && review.comment_ar ? review.comment_ar : review.comment;
              const displayReply = showReplyOriginal && alternateReply
                ? alternateReply
                : isArabic && review.admin_reply_ar ? review.admin_reply_ar : review.admin_reply;

              return <article key={review.id} className="mb-4 break-inside-avoid overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#12101a]">
                <div className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold text-gray-950 dark:text-white">{review.guest_display_name}</h3>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{reviewDate(review.created_at, isArabic)}</p>
                    </div>
                    <p className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-gray-900 dark:text-gray-100">
                      <span>{review.rating.toFixed(1)}</span>
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span>{ratingDescription(review.rating, isArabic)}</span>
                    </p>
                  </div>
                  {review.is_verified_stay && !review.is_sample && <p className="mt-3 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300"><ShieldCheck className="h-3.5 w-3.5" />{label("Verified stay", "إقامة موثقة")}</p>}
                  <p className="mt-3 whitespace-pre-line text-sm leading-6 text-gray-800 dark:text-gray-200">{displayComment}</p>
                  {hasAlternateLanguage && <button type="button" onClick={() => setShowOriginal((current) => ({ ...current, [review.id]: !current[review.id] }))} className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 transition hover:text-violet-700 dark:text-gray-400 dark:hover:text-violet-300">
                    <Languages className="h-3.5 w-3.5" />{showThisOriginal ? label("Translate to English", "عرض الترجمة الإنجليزية") : label("Show original", "عرض النص الأصلي")}
                  </button>}
                </div>
                {review.admin_reply && <div className="border-t border-gray-100 bg-gray-50 px-4 py-4 dark:border-white/10 dark:bg-white/[0.035] sm:px-5">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white">{review.admin_reply_by || label("Host", "المضيف")} <span className="font-normal text-gray-500 dark:text-gray-400">({label("Host", "المضيف")})</span></h4>
                    {review.admin_reply_at && <time className="text-[11px] text-gray-500 dark:text-gray-400">{reviewDate(review.admin_reply_at, isArabic)}</time>}
                  </div>
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-700 dark:text-gray-300">{displayReply}</p>
                  {hasAlternateReply && <button type="button" onClick={() => setShowOriginal((current) => ({ ...current, [`${review.id}-reply`]: !current[`${review.id}-reply`] }))} className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 transition hover:text-violet-700 dark:text-gray-400 dark:hover:text-violet-300">
                    <Languages className="h-3.5 w-3.5" />{showReplyOriginal ? label("Translate to English", "عرض الترجمة الإنجليزية") : label("Show original", "عرض النص الأصلي")}
                  </button>}
                </div>}
              </article>;
            })}
          </div>}

          {!loadingReviews && totalPages > 1 && <nav aria-label={label("Review pages", "صفحات التقييمات")} className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {page > 1 && <button type="button" aria-label={label("Previous page", "الصفحة السابقة")} onClick={() => setPage((value) => Math.max(1, value - 1))} className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-700 transition hover:border-violet-400 dark:border-white/10 dark:text-gray-200"><ChevronLeft className="h-4 w-4 rtl:rotate-180" /></button>}
            {pageNumbers.map((pageNumber) => <button key={pageNumber} type="button" aria-label={`${label("Go to page", "انتقل إلى الصفحة")} ${pageNumber}`} aria-current={pageNumber === page ? "page" : undefined} onClick={() => setPage(pageNumber)} className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition ${pageNumber === page ? "bg-violet-800 text-white" : "bg-gray-100 text-gray-700 hover:bg-violet-50 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-violet-400/10"}`}>{pageNumber}</button>)}
            {page < totalPages && <button type="button" aria-label={label("Next page", "الصفحة التالية")} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-700 transition hover:border-violet-400 dark:border-white/10 dark:text-gray-200"><ChevronRight className="h-4 w-4 rtl:rotate-180" /></button>}
          </nav>}
        </>
      ) : !reviewError ? (
        <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center dark:border-white/15">
          <MessageSquareText className="mx-auto h-7 w-7 text-gray-400" />
          <p className="mt-3 text-sm font-semibold text-gray-800 dark:text-gray-200">{label("No guest reviews yet.", "لا توجد تقييمات للضيوف حتى الآن.")}</p>
        </div>
      ) : null}

      <section className="mt-8 border-t border-gray-100 pt-6 dark:border-white/10" aria-labelledby="write-review-heading">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 id="write-review-heading" className="text-base font-bold text-gray-950 dark:text-white">{label("Share your stay", "شارك تجربتك")}</h3>
            <p className="mt-1 text-xs leading-5 text-gray-600 dark:text-gray-400">{label("Only guests with a paid booking marked completed after checkout can submit a review.", "يمكن للضيوف الذين أكملوا إقامة مدفوعة بعد تسجيل المغادرة فقط إرسال تقييم.")}</p>
          </div>
          {!isDemo && !formOpen && user && eligibleBookings.length > 0 && <button type="button" onClick={() => setFormOpen(true)} className="rounded-xl bg-violet-800 px-4 py-2.5 text-xs font-bold text-white">{label("Write a review", "اكتب تقييماً")}</button>}
          {!isDemo && !user && <button type="button" onClick={() => openAuthModal("signin")} className="rounded-xl bg-violet-800 px-4 py-2.5 text-xs font-bold text-white">{label("Sign in", "تسجيل الدخول")}</button>}
        </div>

        {isDemo ? <p className="mt-3 text-xs leading-5 text-gray-600 dark:text-gray-400">{label("Review submission is available on live listings after a paid stay is completed.", "يمكن إرسال التقييمات للعقارات الفعلية بعد إكمال إقامة مدفوعة.")}</p> : <>
          {eligibilityLoading && <div className="mt-4 flex items-center gap-2 text-xs text-gray-500"><LoaderCircle className="h-4 w-4 animate-spin" />{label("Checking completed stays…", "جارٍ التحقق من الإقامات المكتملة...")}</div>}
          {eligibilityError && <p role="status" className="mt-3 text-xs leading-5 text-amber-800 dark:text-amber-200">{eligibilityError}</p>}
          {!eligibilityLoading && !eligibilityError && user && !eligibleBookings.length && <p className="mt-3 text-xs leading-5 text-gray-600 dark:text-gray-400">{upcomingCount
            ? label("Your review unlocks after checkout and when the stay is marked completed.", "سيُتاح التقييم بعد تسجيل المغادرة ووضع الإقامة كمكتملة.")
            : reviewedCount
              ? label("You have already reviewed your completed stay.", "لقد قيّمت إقامتك المكتملة من قبل.")
              : label("No eligible completed stay was found for this listing. A reservation alone is not enough to review.", "لم نعثر على إقامة مكتملة مؤهلة لهذا العقار. الحجز وحده لا يكفي لإضافة تقييم.")}</p>}
        </>}
        {successMessage && <p role="status" className="mt-3 flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-xs leading-5 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-200"><Check className="mt-0.5 h-4 w-4 shrink-0" />{successMessage}</p>}

        {formOpen && eligibleBookings.length > 0 && <form onSubmit={submitReview} className="mt-5 rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-[#12101a] sm:p-5">
          {eligibleBookings.length > 1 && <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
            {label("Choose completed stay", "اختر الإقامة المكتملة")}
            <select value={selectedBookingId} onChange={(event) => setSelectedBookingId(event.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs dark:border-white/10 dark:bg-[#08070D] dark:text-white">
              {eligibleBookings.map((booking) => <option key={booking.id} value={booking.id}>{booking.check_in} → {booking.check_out}</option>)}
            </select>
          </label>}
          <div className="mt-4">
            <label className="text-xs font-semibold text-gray-800 dark:text-gray-200">{label("Overall rating", "التقييم العام")}</label>
            <RatingScale value={rating} onChange={setRating} label={label("Overall rating", "التقييم العام")} />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {categoryKeys.map((key) => <label key={key} className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
              {label(...categoryLabels[key])}
              <CategoryRatingSelect value={categoryRatings[key]} onChange={(next) => setCategoryRatings((current) => ({ ...current, [key]: next }))} label={label(...categoryLabels[key])} />
            </label>)}
          </div>
          <label className="mt-4 block text-xs font-semibold text-gray-800 dark:text-gray-200">
            {label("Review title", "عنوان التقييم")}
            <input required minLength={5} maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-400 dark:border-white/10 dark:bg-[#08070D] dark:text-white" placeholder={label("What stood out?", "ما الذي أعجبك؟")} />
          </label>
          <label className="mt-4 block text-xs font-semibold text-gray-800 dark:text-gray-200">
            {label("Your stay", "تفاصيل الإقامة")}
            <textarea required minLength={20} maxLength={3000} rows={5} value={comment} onChange={(event) => setComment(event.target.value)} className="mt-1 w-full resize-y rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm leading-6 outline-none focus:border-violet-400 dark:border-white/10 dark:bg-[#08070D] dark:text-white" placeholder={label("Share what future guests should know…", "شارك ما ينبغي للضيوف معرفته...")} />
            <span className="mt-1 block text-right text-[10px] font-normal text-gray-500">{comment.length} / 3000</span>
          </label>
          {submitError && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-400/10 dark:text-rose-200">{submitError}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="submit" disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-800 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60">{submitting && <LoaderCircle className="h-4 w-4 animate-spin" />}{label("Submit verified review", "إرسال التقييم الموثق")}</button>
            <button type="button" onClick={() => { setFormOpen(false); setSubmitError(""); }} className="rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-semibold text-gray-700 dark:border-white/10 dark:text-gray-200">{label("Cancel", "إلغاء")}</button>
          </div>
        </form>}
      </section>
    </section>
  );
}
