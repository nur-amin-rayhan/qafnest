"use client";

import React, { useState } from "react";
import { Send, X } from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { PropertyItem } from "./types";

interface PropertyReviewModalProps {
  property: PropertyItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitFeedback: (propertyId: string, feedback: string) => Promise<void> | void;
  submitting?: boolean;
}

const PRESET_REASONS = [
  { en: "Missing MOT Tourism License", ar: "ترخيص وزارة السياحة مفقود أو غير صالح" },
  { en: "Low Resolution / Blurry Photos", ar: "جودة الصور ضعيفة أو غير واضحة" },
  { en: "Inaccurate Address / Pin Position", ar: "العنوان أو موقع الخريطة غير دقيق" },
  { en: "Missing Living Room / Pool Photos", ar: "صور غير كافية لمرافق العقار الرئيسية" },
  { en: "Pricing Inconsistency", ar: "عدم تطابق في تسعير أيام الأسبوع وعطلة الأسبوع" },
  { en: "Description Violates Guidelines", ar: "الوصف يخالف سياسات وقواعد المنصة" },
];

export function PropertyReviewModal({
  property,
  isOpen,
  onClose,
  onSubmitFeedback,
  submitting = false,
}: PropertyReviewModalProps) {
  const { lang, dir, t } = useAdminAuth();
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  if (!isOpen || !property) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError(t("Please provide specific feedback for the host.", "يرجى كتابة ملاحظات واضحة ومحددة للمضيف."));
      return;
    }
    setError("");
    await onSubmitFeedback(property.id, comment.trim());
    setComment("");
    onClose();
  };

  return (
    <div
      dir={dir}
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-white dark:bg-[#0E0D16] p-6 shadow-2xl border border-slate-200/90 dark:border-slate-800 space-y-4 text-slate-900 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              {t("Compliance & Quality Review", "مراجعة الجودة والامتثال النظامي")}
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {t("Reject / Request Revisions", "رفض / طلب تعديلات")}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
              {t("For:", "لـ:")} <span className="font-semibold text-slate-900 dark:text-slate-100">{property.title}</span> (#{property.id.slice(0, 8)})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {t("Quick Feedback Presets:", "ملاحظات سريعة جاهزة:")}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_REASONS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  const prefix = comment.trim() ? `${comment.trim()}\n• ` : "• ";
                  setComment(`${prefix}${p.en} (${p.ar})`);
                }}
                className="text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-[#4F2396] dark:hover:text-purple-300 text-slate-700 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer shadow-xs"
              >
                + {lang === "ar" ? p.ar : p.en}
              </button>
            ))}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              {t("Detailed Feedback for Host", "الملاحظات التفصيلية للمضيف")} <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t(
                "Explain clearly what the host needs to revise before this property can be approved and published...",
                "وضح للمضيف ما يجب تعديله قبل اعتماد ونشر هذا العقار (مثال: يرجى إرفاق رخصة وزارة السياحة وإضافة صور أوضح للمسبح)..."
              )}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-sm font-normal text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-[#4F2396] transition-colors resize-none"
            />
            {error && <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">{error}</p>}
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {t(
              "ℹ️ This feedback will be displayed prominently on the Host Dashboard. The host will be invited to edit their listing, address your notes, and resubmit for approval.",
              "ℹ️ ستظهر هذه الملاحظات بوضوح في لوحة تحكم المضيف ليتمكن من تعديل الوحدة وإعادة إرسالها للاعتماد."
            )}
          </p>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {t("Cancel", "إلغاء")}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {submitting ? (
                <>
                  <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>{t("Submitting...", "جاري الإرسال...")}</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>{t("Submit Feedback & Reject", "إرسال الملاحظات والرفض")}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
