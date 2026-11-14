"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  MessageSquare,
  LoaderCircle,
  CheckCircle2,
  RefreshCw,
  X,
} from "lucide-react";
import type { HostReviewItem, HostReviewsStats } from "./reviews/types";
import { HostReviewStatsOverview } from "./reviews/HostReviewStatsOverview";
import { HostReviewFiltersToolbar } from "./reviews/HostReviewFiltersToolbar";
import { HostReviewCard } from "./reviews/HostReviewCard";

export type { HostReviewItem, HostReviewsStats };

interface HostReviewsManagementProps {
  lang: "ar" | "en";
  t: (en: string, ar: string) => string;
}

export default function HostReviewsManagement({ lang, t }: HostReviewsManagementProps) {
  const [reviews, setReviews] = useState<HostReviewItem[]>([]);
  const [stats, setStats] = useState<HostReviewsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);

  // Filters
  const [replyFilter, setReplyFilter] = useState<"all" | "unreplied" | "replied">("all");
  const [selectedPropertyId, setSelectedPropertyId] = useState("all");

  // Inline Reply state
  const [activeReplyReviewId, setActiveReplyReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [replySuccessMsg, setReplySuccessMsg] = useState<string | null>(null);

  // Fetch reviews from API
  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch("/api/host/reviews", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load reviews");
      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews || []);
        setStats(data.stats || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching reviews");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Unique properties for dropdown filter
  const propertyOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of reviews) {
      if (r.property_id && !map.has(r.property_id)) {
        map.set(r.property_id, lang === "ar" ? r.propertyTitleAr : r.propertyTitle);
      }
    }
    return Array.from(map.entries());
  }, [reviews, lang]);

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      if (replyFilter === "replied" && !r.admin_reply) return false;
      if (replyFilter === "unreplied" && Boolean(r.admin_reply)) return false;
      if (selectedPropertyId !== "all" && r.property_id !== selectedPropertyId) return false;
      return true;
    });
  }, [reviews, replyFilter, selectedPropertyId]);

  // Submit Host Reply
  const handleSendReply = async (reviewId: string) => {
    if (!replyText.trim()) return;
    setReplySubmitting(true);
    setReplySuccessMsg(null);
    try {
      const res = await fetch(`/api/host/reviews/${reviewId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reply: replyText.trim(),
          replyAr: replyText.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to post reply");

      const updatedReview = data.review;
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? {
                ...r,
                admin_reply: updatedReview.admin_reply,
                admin_reply_ar: updatedReview.admin_reply_ar,
                admin_reply_by: "host",
                admin_reply_at: updatedReview.admin_reply_at,
              }
            : r
        )
      );

      setActiveReplyReviewId(null);
      setReplyText("");
      setReplySuccessMsg(
        t("Your response has been published!", "تم نشر ردك الرسمي على التقييم بنجاح!")
      );
      setTimeout(() => setReplySuccessMsg(null), 4000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error posting reply");
    } finally {
      setReplySubmitting(false);
    }
  };

  const quickTemplates = [
    t(
      "Thank you for your visit, it was our honor to host you!",
      "شكراً جزيلاً لزيارتكم الكريمة وتشرفنا باستضافتكم!"
    ),
    t(
      "We appreciate your feedback and look forward to welcoming you again.",
      "نسعد دائماً برضاكم ونتطلع لاستقبالكم في مناسباتكم القادمة."
    ),
    t(
      "Thank you! Cleanliness and guest comfort are always our top priorities.",
      "شكراً لك، نحرص دائماً على النظافة وراحة ضيوفنا الكرام."
    ),
  ];

  return (
    <div className="mx-auto w-full max-w-[1440px] flex-1 p-4 sm:p-7 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            {t("Guest Reviews & Ratings", "تقييمات وآراء الضيوف")}
          </h1>
          <p className="mt-1 text-xs sm:text-sm font-medium text-slate-500">
            {t(
              "Monitor guest satisfaction ratings, analyze category performance scores, and publish official host replies.",
              "متابعة تقييمات الضيوف وتحليل جودة النظافة والخدمة ونشر ردود المضيف الرسمية على التقييمات."
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setLoading(true);
            fetchReviews();
          }}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-black text-slate-700 hover:bg-slate-50 shadow-xs transition cursor-pointer"
        >
          <RefreshCw
            size={13}
            className={loading ? "animate-spin text-[#4F2396]" : "text-slate-400"}
          />
          <span>{t("Refresh", "تحديث")}</span>
        </button>
      </div>

      {/* Success Alert Toast */}
      {replySuccessMsg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-black text-emerald-800 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>{replySuccessMsg}</span>
          </div>
          <button type="button" onClick={() => setReplySuccessMsg(null)}>
            <X size={14} className="text-emerald-600" />
          </button>
        </div>
      )}

      {/* Rating Score Banner & Category Cards */}
      {stats && <HostReviewStatsOverview stats={stats} lang={lang} t={t} />}

      {/* Filter Tabs & Property Dropdown */}
      <HostReviewFiltersToolbar
        replyFilter={replyFilter}
        setReplyFilter={setReplyFilter}
        selectedPropertyId={selectedPropertyId}
        setSelectedPropertyId={setSelectedPropertyId}
        propertyOptions={propertyOptions}
        stats={stats}
        lang={lang}
        t={t}
      />

      {/* Reviews List */}
      {loading ? (
        <div className="py-20 text-center">
          <LoaderCircle size={36} className="mx-auto mb-3 animate-spin text-[#4F2396]" />
          <p className="text-sm font-extrabold text-slate-600">
            {t("Loading guest reviews...", "جارٍ تحميل التقييمات...")}
          </p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400 space-y-3">
          <MessageSquare size={42} className="mx-auto text-slate-300" />
          <p className="text-base font-black text-slate-700">
            {t("No reviews match your selected filter", "لا توجد تقييمات مطابقة لهذا الفلتر")}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((rev) => (
            <HostReviewCard
              key={rev.id}
              rev={rev}
              isReplyingThis={activeReplyReviewId === rev.id}
              replyText={replyText}
              setReplyText={setReplyText}
              replySubmitting={replySubmitting}
              onOpenReply={(id, initialText) => {
                setActiveReplyReviewId(id);
                setReplyText(initialText || "");
              }}
              onCloseReply={() => setActiveReplyReviewId(null)}
              onSendReply={handleSendReply}
              quickTemplates={quickTemplates}
              lang={lang}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
}
