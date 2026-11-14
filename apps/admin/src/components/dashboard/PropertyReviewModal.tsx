"use client";

import React, { useState } from "react";
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
        className="w-full max-w-lg rounded-2xl bg-surface-container-lowest p-6 shadow-2xl border border-surface-container space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold text-status-terracotta uppercase tracking-wider">
              {t("Compliance & Quality Review", "مراجعة الجودة والامتثال النظامي")}
            </span>
            <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
              {t("Reject / Request Revisions", "رفض / طلب تعديلات")}
            </h3>
            <p className="text-xs text-outline mt-0.5 line-clamp-1">
              {t("For:", "لـ:")} <span className="font-semibold text-on-surface">{property.title}</span> (#{property.id.slice(0, 8)})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-outline hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Quick Presets */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold text-outline uppercase tracking-wider">
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
                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-surface-container hover:bg-primary/10 hover:text-primary text-on-surface-variant transition-colors border border-surface-container-high cursor-pointer"
              >
                + {lang === "ar" ? p.ar : p.en}
              </button>
            ))}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-on-surface">
              {t("Detailed Feedback for Host", "الملاحظات التفصيلية للمضيف")} <span className="text-status-terracotta">*</span>
            </label>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t(
                "Explain clearly what the host needs to revise before this property can be approved and published...",
                "وضح للمضيف ما يجب تعديله قبل اعتماد ونشر هذا العقار (مثال: يرجى إرفاق رخصة وزارة السياحة وإضافة صور أوضح للمسبح)..."
              )}
              className="w-full rounded-xl border border-surface-container-high bg-surface-container-low p-3 text-xs sm:text-sm font-medium text-on-surface placeholder:text-outline outline-none focus:border-primary focus:bg-surface-container-lowest transition-colors resize-none"
            />
            {error && <p className="text-xs text-status-terracotta font-bold">{error}</p>}
          </div>

          <p className="text-[11px] text-outline leading-4">
            {t(
              "ℹ️ This feedback will be displayed prominently on the Host Dashboard. The host will be invited to edit their listing, address your notes, and resubmit for approval.",
              "ℹ️ ستظهر هذه الملاحظات بوضوح في لوحة تحكم المضيف ليتمكن من تعديل الوحدة وإعادة إرسالها للاعتماد."
            )}
          </p>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-container">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
            >
              {t("Cancel", "إلغاء")}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-status-terracotta hover:bg-rose-700 text-white text-xs font-bold shadow-md transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {submitting ? (
                <>
                  <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>{t("Submitting...", "جاري الإرسال...")}</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">send</span>
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
