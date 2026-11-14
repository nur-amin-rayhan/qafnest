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
    { id: "speed", labelEn: "App & Booking Speed", labelAr: "سرعة الحجز والتطبيق" },
    { id: "cleanliness", labelEn: "Cleanliness & Units", labelAr: "نظافة وجودة الوحدات" },
    { id: "concierge", labelEn: "Support & Check-in", labelAr: "خدمة الدخول والدعم" },
    { id: "pricing", labelEn: "Prices & Value", labelAr: "الأسعار والشفافية" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100 dark:border-white/10">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {t("Rate Your QafNest Experience", "قيّمنا وملاحظات الخدمة")}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t(
              "Your feedback drives our continuous refinement of luxury Saudi stays.",
              "رأيك وملاحظاتك تساهم مباشرة في تطوير معايير الضيافة الفاخرة."
            )}
          </p>
        </div>
      </div>

      {feedbackSubmitted ? (
        <div className="p-8 rounded-3xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center">
          <CheckCircle2 size={40} className="text-emerald-500 mx-auto mb-3" />
          <h3 className="text-lg font-black text-slate-900 dark:text-white">
            {t("Thank you for your valuable rating!", "شكراً جزيلاً لتقييمك الرائع!")}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            {t("Your feedback helps us maintain premium quality standards.", "ملاحظاتك تساعدنا دائماً في تقديم الأفضل.")}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSendFeedback} className="space-y-6">
          {/* Star Rating */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              {t("Select Overall Rating", "اختر التقييم العام")}
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRatingScore(star)}
                  className="p-2 transition transform hover:scale-110 cursor-pointer"
                >
                  <Star
                    size={32}
                    className={
                      star <= ratingScore
                        ? "text-amber-400 fill-amber-400"
                        : "text-slate-200 dark:text-slate-700"
                    }
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              {t("What aspect would you like to highlight?", "ما هو الجانب الذي ترغب في تقييمه؟")}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setFeedbackCategory(cat.id)}
                  className={`p-3 rounded-2xl border text-xs font-bold transition text-center cursor-pointer ${
                    feedbackCategory === cat.id
                      ? "border-[#4F2396] bg-purple-50 dark:bg-purple-950/40 text-[#4F2396] dark:text-purple-300 ring-1 ring-[#4F2396]"
                      : "border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5"
                  }`}
                >
                  {language === "ar" ? cat.labelAr : cat.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              {t("Your Comments & Suggestions", "ملاحظاتك ومقترحاتك")}
            </label>
            <textarea
              rows={4}
              required
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder={t(
                "Tell us how we can make your next stay even better...",
                "شاركنا تجربتك وكيف نجعل إقامتك القادمة أكثر تميزاً..."
              )}
              className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-4 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-[#4F2396] focus:bg-white dark:focus:bg-[#06060B] transition"
            />
          </div>

          <button
            type="submit"
            disabled={!feedbackText.trim()}
            className="rounded-2xl bg-[#4F2396] hover:bg-[#3f1c79] text-white font-bold px-8 py-3 text-sm shadow-md transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none min-h-[44px]"
          >
            {t("Submit Review", "إرسال التقييم")}
          </button>
        </form>
      )}
    </div>
  );
}

