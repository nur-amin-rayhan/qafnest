"use client";

import React from "react";
import {
  Star,
  MessageSquare,
  ShieldCheck,
  Send,
  LoaderCircle,
  Edit3,
  X,
} from "lucide-react";
import type { HostReviewItem } from "./types";

interface HostReviewCardProps {
  rev: HostReviewItem;
  isReplyingThis: boolean;
  replyText: string;
  setReplyText: (text: string) => void;
  replySubmitting: boolean;
  onOpenReply: (reviewId: string, initialText?: string) => void;
  onCloseReply: () => void;
  onSendReply: (reviewId: string) => void;
  quickTemplates: string[];
  lang: "ar" | "en";
  t: (en: string, ar: string) => string;
}

export function HostReviewCard({
  rev,
  isReplyingThis,
  replyText,
  setReplyText,
  replySubmitting,
  onOpenReply,
  onCloseReply,
  onSendReply,
  quickTemplates,
  lang,
  t,
}: HostReviewCardProps) {
  const existingReply = rev.host_reply || rev.admin_reply || "";
  const existingReplyAr = rev.host_reply_ar || rev.admin_reply_ar || existingReply;
  const existingReplyDate = rev.host_reply_at || rev.admin_reply_at || "";
  const hasReply = Boolean(existingReply);

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#12101a] p-6 shadow-xs space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition">
      {/* Review Card Top: Guest Info & Rating Score */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-violet-100 dark:bg-purple-950/60 text-[#4F2396] dark:text-purple-300 font-black flex items-center justify-center text-sm">
            {rev.guest_display_name ? rev.guest_display_name.charAt(0).toUpperCase() : "G"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm text-slate-900 dark:text-white">
                {rev.guest_display_name || t("Guest", "نزيل قاف نست")}
              </span>
              {rev.is_verified_stay && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 text-[10px] font-black text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <ShieldCheck size={11} />
                  <span>{t("Verified Stay", "إقامة موثقة")}</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
              <span>{lang === "ar" ? rev.propertyTitleAr : rev.propertyTitle}</span>
              <span>·</span>
              <span>{new Date(rev.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Rating Tag */}
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-violet-50 dark:bg-purple-950/60 border border-violet-200 dark:border-purple-800 px-3 py-1 flex items-center gap-1.5 text-sm font-black text-[#4F2396] dark:text-purple-300">
            <Star size={14} className="fill-[#FF9750] text-[#FF9750]" />
            <span>{rev.rating}</span>
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">/ 10</span>
          </div>
        </div>
      </div>

      {/* Review Title & Comment */}
      <div className="space-y-1">
        {(rev.title || rev.title_ar) && (
          <h4 className="text-sm font-black text-slate-900 dark:text-white">
            {lang === "ar" ? rev.title_ar || rev.title : rev.title || rev.title_ar}
          </h4>
        )}
        <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
          {lang === "ar" ? rev.comment_ar || rev.comment : rev.comment || rev.comment_ar}
        </p>
      </div>

      {/* Subcategory Pills */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400">
        {rev.cleanliness_rating && (
          <span className="rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 px-2 py-0.5 text-slate-700 dark:text-slate-300">
            {t("Cleanliness", "النظافة")}: {rev.cleanliness_rating}/10
          </span>
        )}
        {rev.services_rating && (
          <span className="rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 px-2 py-0.5 text-slate-700 dark:text-slate-300">
            {t("Service", "الخدمة")}: {rev.services_rating}/10
          </span>
        )}
        {rev.checkin_rating && (
          <span className="rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 px-2 py-0.5 text-slate-700 dark:text-slate-300">
            {t("Check-in", "الدخول")}: {rev.checkin_rating}/10
          </span>
        )}
      </div>

      {/* Host Official Response Section */}
      {hasReply && !isReplyingThis ? (
        <div className="rounded-xl border border-violet-100 dark:border-purple-900/50 bg-violet-50/50 dark:bg-purple-950/30 p-4 space-y-2 text-xs">
          <div className="flex items-center justify-between text-[#4F2396] dark:text-purple-300 font-black">
            <div className="inline-flex items-center gap-1.5">
              <MessageSquare size={13} />
              <span>{t("Official Host Response", "رد المضيف الرسمي")}</span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
              {existingReplyDate ? new Date(existingReplyDate).toLocaleDateString() : ""}
            </span>
          </div>
          <p className="font-semibold text-slate-700 dark:text-slate-200 leading-relaxed">
            {lang === "ar" ? existingReplyAr : existingReply}
          </p>
          <button
            type="button"
            onClick={() => onOpenReply(rev.id, existingReply)}
            className="inline-flex items-center gap-1 text-[11px] font-black text-[#4F2396] dark:text-purple-400 hover:underline pt-1 cursor-pointer"
          >
            <Edit3 size={11} />
            <span>{t("Edit Response", "تعديل الرد")}</span>
          </button>
        </div>
      ) : (
        <div className="pt-2">
          {!isReplyingThis ? (
            <button
              type="button"
              onClick={() => onOpenReply(rev.id, "")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 dark:border-purple-800 bg-white dark:bg-slate-900 hover:bg-violet-50 dark:hover:bg-purple-950/40 text-[#4F2396] dark:text-purple-300 px-3.5 py-1.5 text-xs font-black shadow-xs transition cursor-pointer"
            >
              <MessageSquare size={13} />
              <span>{t("Reply to Review", "الرد على هذا التقييم")}</span>
            </button>
          ) : (
            <div className="rounded-2xl border border-violet-200 dark:border-purple-800 bg-violet-50/40 dark:bg-purple-950/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#4F2396] dark:text-purple-300">
                  {t("Write your public response to the guest", "كتابة ردك العام على الضيف")}
                </span>
                <button
                  type="button"
                  onClick={onCloseReply}
                  className="rounded-full p-1 text-slate-400 dark:text-slate-500 hover:bg-slate-200/60 dark:hover:bg-slate-800"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Quick Template Chips */}
              <div className="flex flex-wrap gap-1.5">
                {quickTemplates.map((tpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setReplyText(tpl)}
                    className="rounded-lg bg-white dark:bg-slate-900 border border-violet-200 dark:border-purple-800 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-violet-100/60 dark:hover:bg-purple-900/60 hover:text-[#4F2396] dark:hover:text-purple-300 transition cursor-pointer"
                  >
                    {tpl}
                  </button>
                ))}
              </div>

              <textarea
                rows={3}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={t(
                  "Thank the guest for their stay and mention any details...",
                  "اشكر الضيف على زيارته الكريمة واذكر أي تفاصيل تود مشاركتها..."
                )}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-[#4F2396]"
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onCloseReply}
                  className="rounded-xl px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {t("Cancel", "إلغاء")}
                </button>
                <button
                  type="button"
                  onClick={() => onSendReply(rev.id)}
                  disabled={replySubmitting || !replyText.trim()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#4F2396] hover:bg-[#3d1a75] disabled:opacity-50 text-white px-4 py-1.5 text-xs font-black shadow-xs transition cursor-pointer"
                >
                  {replySubmitting ? (
                    <LoaderCircle size={13} className="animate-spin" />
                  ) : (
                    <Send size={13} />
                  )}
                  <span>{t("Publish Response", "نشر الرد")}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

