"use client";

import React from "react";
import { AdminReviewItem } from "../types";
import { useAdminAuth } from "@/context/AdminAuthContext";

export interface AdminReplyTemplate {
  labelEn: string;
  labelAr: string;
  en: string;
  ar: string;
}

export const PRESET_ADMIN_TEMPLATES: AdminReplyTemplate[] = [
  {
    labelEn: "Thank You & Quality Acknowledgment",
    labelAr: "شكر وتقدير الجودة",
    en: "Thank you for sharing your experience with QafNest. We are delighted that you enjoyed your stay, and your feedback has been shared with the host and our quality operations team.",
    ar: "شكراً لمشاركتنا تجربتكم مع قاف نست. يسعدنا استمتاعكم بالإقامة، وقد تمت مشاركة ملاحظاتكم القيمة مع المضيف وفريق عمليات الجودة لدينا.",
  },
  {
    labelEn: "Maintenance & Cleanliness Resolution",
    labelAr: "معالجة الصيانة والنظافة",
    en: "We appreciate your feedback regarding the cleanliness and amenities. Our compliance inspectors have conducted a site inspection with the host to ensure all facilities strictly adhere to MOT hospitality standards.",
    ar: "نقدر ملاحظاتكم الكريمة بخصوص النظافة والمرافق. قام مفتشو الجودة بزيارة العقار والتنسيق مع المضيف لضمان التوافق التام مع معايير وزارة السياحة للضيافة.",
  },
  {
    labelEn: "Guest Dispute Resolution",
    labelAr: "تسوية نزاع الضيف",
    en: "Our operations team has reviewed your stay report and verified the reservation records. The matter has been resolved in accordance with QafNest Verified Stay Policies.",
    ar: "قام فريق العمليات بمراجعة تقرير إقامتكم والتحقق من سجلات الحجز. تمت تسوية الأمر وفقاً لسياسات حماية الضيوف المعتمدة لدى قاف نست.",
  },
];

interface ReviewReplyModalProps {
  selectedReviewForReply: AdminReviewItem | null;
  closeReplyModal: () => void;
  replyDraftEn: string;
  setReplyDraftEn: (v: string) => void;
  replyDraftAr: string;
  setReplyDraftAr: (v: string) => void;
  savingReply: boolean;
  handleSaveReply: (e: React.FormEvent) => void;
}

export function ReviewReplyModal({
  selectedReviewForReply,
  closeReplyModal,
  replyDraftEn,
  setReplyDraftEn,
  replyDraftAr,
  setReplyDraftAr,
  savingReply,
  handleSaveReply,
}: ReviewReplyModalProps) {
  const { t, dir } = useAdminAuth();

  if (!selectedReviewForReply) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      dir={dir}
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      onClick={closeReplyModal}
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-surface-container-lowest p-6 shadow-2xl border border-surface-container space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
              {t("Authoritative Operations Moderation", "الإشراف والرقابة التشغيلية المعتمدة")}
            </span>
            <h3 className="text-lg font-bold text-on-surface">
              {selectedReviewForReply.admin_reply || selectedReviewForReply.admin_reply_ar
                ? t("Update Official Response", "تحديث الرد الرسمي")
                : t("Publish Official Admin Response", "نشر الرد الرسمي للإدارة")}
            </h3>
            <p className="text-xs text-outline mt-0.5 line-clamp-1">
              {t("For stay at:", "للإقامة في:")}{" "}
              <strong className="text-on-surface">
                {selectedReviewForReply.property_title}
              </strong>{" "}
              ({t("Guest:", "الضيف:")} {selectedReviewForReply.guest_display_name})
            </p>
          </div>
          <button
            type="button"
            onClick={closeReplyModal}
            className="p-1 rounded-lg text-outline hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
            aria-label={t("Close dialog", "إغلاق النافذة")}
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Quick Templates */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold text-outline uppercase tracking-wider">
            {t("Quick Response Templates:", "قوالب الرد السريعة:")}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_ADMIN_TEMPLATES.map((tmpl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setReplyDraftEn(tmpl.en);
                  setReplyDraftAr(tmpl.ar);
                }}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-surface-container hover:bg-primary/10 hover:text-primary text-on-surface-variant transition-colors border border-surface-container-high cursor-pointer"
              >
                + {t(tmpl.labelEn, tmpl.labelAr)}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSaveReply} className="space-y-4">
          {/* English Response */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-on-surface">
              <span>{t("English Response:", "الرد باللغة الإنجليزية:")}</span>
              <span className="text-[10px] font-normal text-outline">
                {replyDraftEn.length} / 2000
              </span>
            </div>
            <textarea
              rows={3}
              maxLength={2000}
              value={replyDraftEn}
              onChange={(e) => setReplyDraftEn(e.target.value)}
              placeholder={t("Write the official English reply...", "اكتب الرد الرسمي باللغة الإنجليزية...")}
              dir="ltr"
              className="w-full rounded-xl border border-surface-container-high bg-surface-container-low p-3 text-xs sm:text-sm font-medium text-on-surface placeholder:text-outline outline-none focus:border-primary focus:bg-surface-container-lowest transition-colors resize-none"
            />
          </div>

          {/* Arabic Response */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-on-surface">
              <span>{t("Arabic Response (Optional / Recommended):", "الرد باللغة العربية (اختياري / موصى به):")}</span>
              <span className="text-[10px] font-normal text-outline">
                {replyDraftAr.length} / 2000
              </span>
            </div>
            <textarea
              rows={3}
              maxLength={2000}
              value={replyDraftAr}
              onChange={(e) => setReplyDraftAr(e.target.value)}
              placeholder="اكتب الرد الرسمي باللغة العربية..."
              dir="rtl"
              className="w-full rounded-xl border border-surface-container-high bg-surface-container-low p-3 text-xs sm:text-sm font-medium text-on-surface placeholder:text-outline outline-none focus:border-primary focus:bg-surface-container-lowest transition-colors resize-none font-arabic"
            />
          </div>

          <p className="text-[11px] text-outline leading-relaxed">
            {t(
              "ℹ️ This response will be publicly displayed on the listing's guest reviews section.",
              "ℹ️ سيتم عرض هذا الرد علناً في قسم تقييمات الضيوف الخاص بالعقار."
            )}
          </p>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-container">
            <button
              type="button"
              onClick={closeReplyModal}
              disabled={savingReply}
              className="px-4 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
            >
              {t("Cancel", "إلغاء")}
            </button>
            <button
              type="submit"
              disabled={savingReply}
              className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold shadow-md transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {savingReply ? (
                <>
                  <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>{t("Publishing...", "جارٍ النشر...")}</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">send</span>
                  <span>{t("Publish Response", "نشر الرد")}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
