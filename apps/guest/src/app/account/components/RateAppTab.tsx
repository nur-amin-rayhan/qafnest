"use client";

import React from "react";
import { Star, CheckCircle2 } from "lucide-react";

interface RateAppTabProps {
  feedbackSubmitted: boolean;
  ratingScore: number;
  setRatingScore: (score: number) => void;
  feedbackCategory: string;
  setFeedbackCategory: (cat: string) => void;
  feedbackText: string;
  setFeedbackText: (text: string) => void;
  handleSendFeedback: (e: React.FormEvent) => void;
  language: string;
  t: (en: string, ar: string) => string;
}

export default function RateAppTab({
  feedbackSubmitted,
  ratingScore,
  setRatingScore,
  feedbackCategory,
  setFeedbackCategory,
  feedbackText,
  setFeedbackText,
  handleSendFeedback,
  language,
  t,
}: RateAppTabProps) {
  const categories = [
    { id: "speed", labelEn: "Booking speed", labelAr: "سرعة الحجز" },
    { id: "cleanliness", labelEn: "Property accuracy", labelAr: "مطابقة الوحدة" },
    { id: "concierge", labelEn: "Check-in & access", labelAr: "الدخول الذكي" },
    { id: "pricing", labelEn: "Pricing & clarity", labelAr: "وضوح الأسعار" },
  ];

  return (
    <div className="space-y-6">
      <div className="pb-5 border-b border-slate-200 dark:border-white/[0.08]">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">
          {t("Rate your experience", "قيّم تجربتك")}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
          {t(
            "Share feedback to help us improve bookings and stays.",
            "شاركنا ملاحظاتك لتحسين تجربة الحجز والإقامة."
          )}
        </p>
      </div>

      {feedbackSubmitted ? (
        <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/15 dark:border-emerald-500/30 text-center">
          <CheckCircle2 size={32} className="text-emerald-700 dark:text-emerald-400 mx-auto mb-2.5" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            {t("Feedback submitted", "تم إرسال التقييم")}
          </h3>
          <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">
            {t("Thank you for sharing your rating.", "شكراً لمشاركتك رأيك معنا.")}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSendFeedback} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-slate-800 dark:text-slate-300 mb-2">
              {t("Overall rating", "التقييم العام")}
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRatingScore(star)}
                  className="p-1.5 transition-colors cursor-pointer"
                >
                  <Star
                    size={26}
                    className={
                      star <= ratingScore
                        ? "text-amber-500 fill-amber-400"
                        : "text-slate-300 dark:text-slate-700"
                    }
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-800 dark:text-slate-300 mb-2">
              {t("Focus area", "الجانب المختار")}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setFeedbackCategory(cat.id)}
                  className={`p-2.5 rounded-xl border text-xs font-medium transition-colors text-center cursor-pointer ${
                    feedbackCategory === cat.id
                      ? "border-[#4F2396] bg-[#F4EEFF] dark:bg-[#4F2396]/25 text-[#4F2396] dark:text-purple-200"
                      : "border-slate-300 dark:border-white/15 bg-white dark:bg-[#06060B] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.04]"
                  }`}
                >
                  {language === "ar" ? cat.labelAr : cat.labelEn}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-800 dark:text-slate-300 mb-2">
              {t("Comments", "الملاحظات")}
            </label>
            <textarea
              rows={4}
              required
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder={t("Write your feedback", "اكتب ملاحظاتك هنا")}
              className="w-full rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#06060B] p-3.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F2396]/35 focus:border-[#4F2396] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={!feedbackText.trim()}
            className="rounded-xl bg-[#4F2396] hover:bg-[#3f1c79] text-white font-medium px-6 py-2.5 text-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
          >
            {t("Submit rating", "إرسال التقييم")}
          </button>
        </form>
      )}
    </div>
  );
}
