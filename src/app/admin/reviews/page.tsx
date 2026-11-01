"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight, LoaderCircle, MessageSquareText, Send, ShieldCheck } from "lucide-react";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import AuthModal from "@/components/modals/AuthModal";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { getReviewAuthorizationHeaders } from "@/lib/reviews/client";

type AdminReview = {
  id: string;
  property_id: string;
  property_title: string;
  guest_display_name: string;
  title: string;
  comment: string;
  rating: number;
  created_at: string;
  admin_reply: string | null;
  admin_reply_ar: string | null;
  admin_reply_by: string | null;
  admin_reply_at: string | null;
};

type AdminReviewsResponse = {
  reviews: AdminReview[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  code?: string;
};

export default function AdminReviewsPage() {
  const { language } = useApp();
  const { user, session, loading: authLoading, openAuthModal } = useAuth();
  const label = useCallback((en: string, ar: string) => language === "ar" ? ar : en, [language]);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [arabicDrafts, setArabicDrafts] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState("");
  const [savingId, setSavingId] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeError, setNoticeError] = useState(false);

  const loadReviews = useCallback(async () => {
    if (authLoading) return;
    if (!user) {
      setReviews([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadingError("");
    try {
      const headers = await getReviewAuthorizationHeaders(session);
      if (!headers.Authorization) throw new Error(label("Sign in again to continue.", "سجّل الدخول مجدداً للمتابعة."));
      const response = await fetch(`/api/admin/reviews?page=${page}`, { headers, cache: "no-store" });
      const result = await response.json() as AdminReviewsResponse;
      if (!response.ok) {
        if (result.code === "admin_access_required") throw new Error(label("This account is not authorized to manage reviews.", "هذا الحساب غير مخوّل لإدارة التقييمات."));
        if (result.code === "review_admin_schema_not_ready") throw new Error(label("Apply the review response migration and add this admin account first.", "طبّق تحديث ردود التقييمات وأضف حساب المشرف أولاً."));
        if (result.code === "sign_in_required") throw new Error(label("Please sign in to manage reviews.", "يرجى تسجيل الدخول لإدارة التقييمات."));
        throw new Error(label("Reviews could not be loaded.", "تعذر تحميل التقييمات."));
      }
      setReviews(result.reviews || []);
      setDrafts(Object.fromEntries((result.reviews || []).map((review) => [review.id, review.admin_reply || ""])));
      setArabicDrafts(Object.fromEntries((result.reviews || []).map((review) => [review.id, review.admin_reply_ar || ""])));
      setTotal(result.total || 0);
      setTotalPages(result.totalPages || 1);
    } catch (error) {
      setReviews([]);
      setLoadingError(error instanceof Error ? error.message : label("Reviews could not be loaded.", "تعذر تحميل التقييمات."));
    } finally {
      setLoading(false);
    }
  }, [authLoading, user, session, page, label]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  const saveReply = async (review: AdminReview, remove = false) => {
    setSavingId(review.id);
    setNotice("");
    setNoticeError(false);
    try {
      const headers = await getReviewAuthorizationHeaders(session);
      if (!headers.Authorization) throw new Error(label("Your sign-in session could not be verified.", "تعذر التحقق من جلسة الدخول."));
      const reply = remove ? "" : (drafts[review.id] || "").trim();
      const replyAr = remove ? "" : (arabicDrafts[review.id] || "").trim();
      const response = await fetch("/api/admin/reviews/reply", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId: review.id, reply, replyAr }),
      });
      const result = await response.json() as { code?: string; review?: Pick<AdminReview, "admin_reply" | "admin_reply_ar" | "admin_reply_by" | "admin_reply_at"> };
      if (!response.ok) {
        if (result.code === "admin_access_required") throw new Error(label("This account is not authorized to reply to reviews.", "هذا الحساب غير مخوّل للرد على التقييمات."));
        if (result.code === "review_admin_schema_not_ready") throw new Error(label("Apply the review response migration first.", "طبّق تحديث ردود التقييمات أولاً."));
        throw new Error(label("The response could not be saved.", "تعذر حفظ الرد."));
      }
      if (!result.review) throw new Error(label("The response could not be saved.", "تعذر حفظ الرد."));
      setReviews((current) => current.map((item) => item.id === review.id ? { ...item, ...result.review } : item));
      setDrafts((current) => ({ ...current, [review.id]: result.review?.admin_reply || "" }));
      setArabicDrafts((current) => ({ ...current, [review.id]: result.review?.admin_reply_ar || "" }));
      setNotice(remove ? label("Response removed.", "تم حذف الرد.") : label("Response published.", "تم نشر الرد."));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : label("The response could not be saved.", "تعذر حفظ الرد."));
      setNoticeError(true);
    } finally {
      setSavingId("");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-[#08070D] dark:text-gray-100">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-32 sm:px-6">
        <div className="mb-7">
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-violet-800 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-200">
            <ShieldCheck className="h-3.5 w-3.5" />{label("Admin workspace", "مساحة المشرف")}
          </span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-950 dark:text-white">{label("Guest reviews", "تقييمات الضيوف")}</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{label("Reply publicly to reviews from verified guests. Your response appears beneath the review on its listing.", "رد علناً على تقييمات الضيوف الموثقة. سيظهر ردك أسفل التقييم في صفحة العقار.")}</p>
          {!loadingError && user && <p className="mt-2 text-xs font-semibold text-violet-700 dark:text-violet-300">{total} {label("published reviews", "تقييم منشور")}</p>}
        </div>

        {!authLoading && !user && <section className="rounded-3xl border border-gray-200 bg-white p-8 text-center dark:border-white/10 dark:bg-[#12101a]">
          <MessageSquareText className="mx-auto h-8 w-8 text-violet-700 dark:text-violet-300" />
          <h2 className="mt-3 text-lg font-bold">{label("Sign in to manage guest reviews", "سجّل الدخول لإدارة تقييمات الضيوف")}</h2>
          <button type="button" onClick={() => openAuthModal("signin")} className="mt-5 rounded-xl bg-violet-800 px-5 py-3 text-sm font-bold text-white">{label("Sign in", "تسجيل الدخول")}</button>
        </section>}

        {loading && <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500"><LoaderCircle className="h-5 w-5 animate-spin" />{label("Loading reviews…", "جارٍ تحميل التقييمات...")}</div>}
        {loadingError && <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">{loadingError}</div>}

        {!loading && !loadingError && user && reviews.length === 0 && <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-600 dark:border-white/15 dark:bg-[#12101a] dark:text-gray-300">{label("There are no published guest reviews yet.", "لا توجد تقييمات منشورة حتى الآن.")}</div>}

        {!loadingError && reviews.length > 0 && <div className="space-y-4">
          {reviews.map((review) => (
            <article key={review.id} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#12101a] sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300">{review.property_title}</p>
                  <h2 className="mt-1 text-base font-bold text-gray-950 dark:text-white">{review.title}</h2>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{review.guest_display_name} · {new Intl.DateTimeFormat(language === "ar" ? "ar-SA" : "en", { dateStyle: "medium" }).format(new Date(review.created_at))} · {review.rating.toFixed(1)} / 10</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-200">{label("Published", "منشور")}</span>
              </div>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-gray-700 dark:text-gray-300">{review.comment}</p>
              <label className="mt-5 block text-xs font-bold text-gray-800 dark:text-gray-200">
                {label("Public host response (English)", "رد المضيف العام (الإنجليزية)")}
                <textarea
                  rows={3}
                  maxLength={2000}
                  value={drafts[review.id] ?? ""}
                  onChange={(event) => setDrafts((current) => ({ ...current, [review.id]: event.target.value }))}
                  placeholder={label("Write a helpful public response…", "اكتب رداً عاماً ومفيداً...")}
                  className="mt-2 w-full resize-y rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-normal leading-6 outline-none focus:border-violet-400 dark:border-white/10 dark:bg-[#08070D] dark:text-white"
                />
                <span className="mt-1 block text-right text-[10px] font-normal text-gray-500">{(drafts[review.id] || "").length} / 2000</span>
              </label>
              <label className="mt-4 block text-xs font-bold text-gray-800 dark:text-gray-200">
                {label("Arabic original (optional)", "النص العربي الأصلي (اختياري)")}
                <textarea
                  rows={3}
                  maxLength={2000}
                  value={arabicDrafts[review.id] ?? ""}
                  onChange={(event) => setArabicDrafts((current) => ({ ...current, [review.id]: event.target.value }))}
                  placeholder={label("Add the Arabic version to enable the original-language toggle…", "أضف النسخة العربية لتفعيل زر عرض النص الأصلي...")}
                  className="mt-2 w-full resize-y rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-normal leading-6 outline-none focus:border-violet-400 dark:border-white/10 dark:bg-[#08070D] dark:text-white"
                  dir="auto"
                />
                <span className="mt-1 block text-right text-[10px] font-normal text-gray-500">{(arabicDrafts[review.id] || "").length} / 2000</span>
              </label>
              {review.admin_reply && <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">{label("Currently published by", "نُشر حالياً بواسطة")} {review.admin_reply_by} · {review.admin_reply_at ? new Intl.DateTimeFormat(language === "ar" ? "ar-SA" : "en", { dateStyle: "medium" }).format(new Date(review.admin_reply_at)) : ""}</p>}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => void saveReply(review)} disabled={savingId === review.id || Math.max((drafts[review.id] || "").trim().length, (arabicDrafts[review.id] || "").trim().length) < 5} className="inline-flex items-center gap-2 rounded-xl bg-violet-800 px-4 py-2.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
                  {savingId === review.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : review.admin_reply ? <Check className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                  {review.admin_reply ? label("Update response", "تحديث الرد") : label("Publish response", "نشر الرد")}
                </button>
                {review.admin_reply && <button type="button" onClick={() => void saveReply(review, true)} disabled={savingId === review.id} className="rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-semibold text-gray-700 disabled:opacity-50 dark:border-white/10 dark:text-gray-200">{label("Remove response", "حذف الرد")}</button>}
              </div>
            </article>
          ))}
        </div>}

        {!loadingError && totalPages > 1 && <nav aria-label={label("Review administration pages", "صفحات إدارة التقييمات")} className="mt-6 flex items-center justify-center gap-3">
          <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1 || loading} className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold disabled:opacity-40 dark:border-white/10 dark:bg-[#12101a]"><ChevronLeft className="h-4 w-4 rtl:rotate-180" />{label("Previous", "السابق")}</button>
          <span className="text-xs text-gray-500 dark:text-gray-400">{page} / {totalPages}</span>
          <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages || loading} className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold disabled:opacity-40 dark:border-white/10 dark:bg-[#12101a]">{label("Next", "التالي")}<ChevronRight className="h-4 w-4 rtl:rotate-180" /></button>
        </nav>}
        {notice && <p role="status" className={`mt-4 text-center text-sm ${noticeError ? "text-rose-700 dark:text-rose-300" : "text-emerald-700 dark:text-emerald-300"}`}>{notice}</p>}
      </main>
      <Footer />
      <AuthModal />
    </div>
  );
}
