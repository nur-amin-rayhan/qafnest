"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AdminReviewItem } from "./types";
import { ReviewReplyModal } from "./reviews/ReviewReplyModal";
import { ReviewItemCard } from "./reviews/ReviewItemCard";
import { ReviewsHeaderStats } from "./reviews/ReviewsHeaderStats";
import { ReviewsFilterBar } from "./reviews/ReviewsFilterBar";
import { useAdminAuth } from "@/context/AdminAuthContext";

import { adminPath } from "@/lib/adminUrl";
interface GuestReviewsTabProps {
  triggerToast?: (message: string) => void;
}

export function GuestReviewsTab({ triggerToast }: GuestReviewsTabProps) {
  const { t, dir } = useAdminAuth();
  const [reviews, setReviews] = useState<AdminReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "replied">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [stats, setStats] = useState({
    totalReviews: 0,
    avgRating: 0,
    pendingCount: 0,
    repliedCount: 0,
  });

  // Modal State for Drafting/Editing Replies
  const [selectedReviewForReply, setSelectedReviewForReply] = useState<AdminReviewItem | null>(null);
  const [replyDraftEn, setReplyDraftEn] = useState("");
  const [replyDraftAr, setReplyDraftAr] = useState("");
  const [savingReply, setSavingReply] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const showToast = useCallback(
    (msg: string) => {
      if (triggerToast) {
        triggerToast(msg);
      }
    },
    [triggerToast]
  );

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: "15",
        status: statusFilter,
      });

      const res = await fetch(adminPath(`/api/admin/reviews?${params.toString()}`), {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Could not load reviews");
      }

      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.total || 0);
        if (data.stats) {
          setStats(data.stats);
        }
      } else {
        throw new Error(data.message || "Failed to load reviews");
      }
    } catch (err: unknown) {
      console.error("Reviews load error:", err);
      setErrorMsg(t("Failed to load verified guest reviews.", "تعذر تحميل تقييمات الضيوف الموثقة."));
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, t]);

  useEffect(() => {
    void fetchReviews();
  }, [fetchReviews]);

  // Client-side search filter
  const filteredReviews = useMemo(() => {
    if (!searchQuery.trim()) return reviews;
    const q = searchQuery.toLowerCase().trim();
    return reviews.filter(
      (r) =>
        (r.guest_display_name || "").toLowerCase().includes(q) ||
        (r.property_title || "").toLowerCase().includes(q) ||
        (r.title || "").toLowerCase().includes(q) ||
        (r.comment || "").toLowerCase().includes(q) ||
        (r.admin_reply || "").toLowerCase().includes(q) ||
        (r.admin_reply_ar || "").toLowerCase().includes(q)
    );
  }, [reviews, searchQuery]);

  const openReplyModal = (review: AdminReviewItem) => {
    setSelectedReviewForReply(review);
    setReplyDraftEn(review.admin_reply || "");
    setReplyDraftAr(review.admin_reply_ar || "");
  };

  const closeReplyModal = () => {
    setSelectedReviewForReply(null);
    setReplyDraftEn("");
    setReplyDraftAr("");
  };

  const handleSaveReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReviewForReply) return;

    if (replyDraftEn.trim().length < 3 && replyDraftAr.trim().length < 3) {
      showToast(t("Response must be at least 3 characters.", "يجب أن لا يقل الرد عن 3 أحرف."));
      return;
    }

    setSavingReply(true);
    try {
      const res = await fetch(adminPath("/api/admin/reviews"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewId: selectedReviewForReply.id,
          reply: replyDraftEn.trim(),
          replyAr: replyDraftAr.trim(),
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Could not publish reply");
      }

      setReviews((prev) =>
        prev.map((r) =>
          r.id === selectedReviewForReply.id
            ? {
                ...r,
                admin_reply: result.review.admin_reply,
                admin_reply_ar: result.review.admin_reply_ar,
                admin_reply_by: result.review.admin_reply_by,
                admin_reply_at: result.review.admin_reply_at,
              }
            : r
        )
      );

      showToast(t("Official admin response published successfully.", "تم نشر رد الإدارة الرسمي بنجاح."));
      closeReplyModal();
      void fetchReviews();
    } catch (err: unknown) {
      console.error(err);
      showToast(t("Error publishing admin reply.", "حدث خطأ أثناء نشر رد الإدارة."));
    } finally {
      setSavingReply(false);
    }
  };

  const handleDeleteReply = async (reviewId: string) => {
    if (
      !window.confirm(
        t(
          "Are you sure you want to remove this public admin response?",
          "هل أنت متأكد من رغبتك في حذف هذا الرد الإداري المنشور؟"
        )
      )
    ) {
      return;
    }

    setDeletingId(reviewId);
    try {
      const res = await fetch(adminPath(`/api/admin/reviews?reviewId=${reviewId}`), {
        method: "DELETE",
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Failed to remove response");
      }

      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? {
                ...r,
                admin_reply: null,
                admin_reply_ar: null,
                admin_reply_by: null,
                admin_reply_at: null,
              }
            : r
        )
      );
      showToast(t("Admin response removed.", "تم حذف رد الإدارة."));
      void fetchReviews();
    } catch (err: unknown) {
      console.error(err);
      showToast(t("Failed to remove reply.", "تعذر حذف الرد."));
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div dir={dir} className="space-y-6">
      {/* Top Header Card */}
      <ReviewsHeaderStats
        loading={loading}
        onRefresh={() => void fetchReviews()}
        stats={stats}
        totalCount={totalCount}
      />

      {/* Filter and Search Bar */}
      <ReviewsFilterBar
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        setPage={setPage}
        pendingCount={stats.pendingCount}
        repliedCount={stats.repliedCount}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {errorMsg && (
        <div className="rounded-xl border border-status-terracotta/30 bg-status-terracotta/10 p-4 text-xs font-semibold text-status-terracotta">
          {errorMsg}
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="rounded-2xl bg-surface-container-lowest p-12 text-center border border-surface-container shadow-sm">
          <span className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
          <p className="text-xs font-semibold text-outline mt-3">
            {t("Loading verified reviews...", "جارٍ تحميل التقييمات الموثقة...")}
          </p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="rounded-2xl bg-surface-container-lowest p-12 text-center border border-surface-container shadow-sm">
          <span className="material-symbols-outlined text-[42px] text-outline">chat_bubble_outline</span>
          <h3 className="mt-2 text-base font-bold text-on-surface">
            {t("No reviews found", "لم يتم العثور على تقييمات")}
          </h3>
          <p className="text-xs text-outline mt-1">
            {searchQuery
              ? t("No reviews match your current search query.", "لا توجد تقييمات تطابق بحثك الحالي.")
              : statusFilter === "pending"
              ? t(
                  "All guest reviews have been moderated and replied to!",
                  "تمت مراجعة جميع تقييمات الضيوف والرد عليها!"
                )
              : t("No reviews have been published yet.", "لم يتم نشر أي تقييمات حتى الآن.")}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <ReviewItemCard
              key={review.id}
              review={review}
              deletingId={deletingId}
              openReplyModal={openReplyModal}
              handleDeleteReply={handleDeleteReply}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-surface-container">
          <p className="text-xs text-outline font-medium">
            {t("Showing Page", "عرض الصفحة")} <strong className="text-on-surface">{page}</strong>{" "}
            {t("of", "من")} <strong className="text-on-surface">{totalPages}</strong> ({totalCount}{" "}
            {t("verified reviews", "تقييم موثق")})
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="px-3.5 py-1.5 rounded-xl border border-surface-container-high bg-surface-container-lowest text-xs font-bold text-on-surface hover:bg-surface-container disabled:opacity-40 transition-colors cursor-pointer"
            >
              {t("Previous", "السابق")}
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="px-3.5 py-1.5 rounded-xl border border-surface-container-high bg-surface-container-lowest text-xs font-bold text-on-surface hover:bg-surface-container disabled:opacity-40 transition-colors cursor-pointer"
            >
              {t("Next", "التالي")}
            </button>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      <ReviewReplyModal
        selectedReviewForReply={selectedReviewForReply}
        closeReplyModal={closeReplyModal}
        replyDraftEn={replyDraftEn}
        setReplyDraftEn={setReplyDraftEn}
        replyDraftAr={replyDraftAr}
        setReplyDraftAr={setReplyDraftAr}
        savingReply={savingReply}
        handleSaveReply={handleSaveReply}
      />
    </div>
  );
}
