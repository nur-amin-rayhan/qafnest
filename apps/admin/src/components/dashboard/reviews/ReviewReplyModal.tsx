"use client";

import React from "react";
import { X, Send, RefreshCw } from "lucide-react";
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
        className="w-full max-w-xl rounded-xl bg-white dark:bg-[#0E0D16] p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-[11px] font-semibold text-[#4F2396] dark:text-purple-300 uppercase tracking-wider">
              {t("Authoritative Operations Moderation", "الإشراف والرقابة التشغيلية المعتمدة")}
            </span>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
              {selectedReviewForReply.admin_reply || selectedReviewForReply.admin_reply_ar
                ? t("Update Official Response", "تحديث الرد الرسمي")
                : t("Publish Official Admin Response", "نشر الرد الرسمي للإدارة")}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
              {t("For stay at:", "للإقامة في:")}{" "}
              <strong className="text-slate-800 dark:text-slate-200">
                {selectedReviewForReply.property_title}
              </strong>{" "}
              ({t("Guest:", "الضيف:")} {selectedReviewForReply.guest_display_name})
            </p>
          </div>
          <button
            type="button"
            onClick={closeReplyModal}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
            aria-label={t("Close dialog", "إغلاق النافذة")}
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Templates */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
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
                className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-slate-50 dark:bg-slate-800/60 hover:bg-purple-50 dark:hover:bg-purple-950/50 hover:text-[#4F2396] dark:hover:text-purple-300 text-slate-600 dark:text-slate-300 transition-colors border border-slate-200/80 dark:border-slate-800 cursor-pointer shadow-2xs"
              >
                + {t(tmpl.labelEn, tmpl.labelAr)}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSaveReply} className="space-y-4">
          {/* English Response */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
              <span>{t("English Response:", "الرد باللغة الإنجليزية:")}</span>
              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
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
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xs sm:text-sm font-normal text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-[#4F2396] transition-colors resize-none"
            />
          </div>

          {/* Arabic Response */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
              <span>{t("Arabic Response (Optional / Recommended):", "الرد باللغة العربية (اختياري / موصى به):")}</span>
              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
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
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xs sm:text-sm font-normal text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-[#4F2396] transition-colors resize-none font-arabic"
            />
          </div>

          <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
            {t(
              "ℹ️ This response will be publicly displayed on the listing's guest reviews section.",
              "ℹ️ سيتم عرض هذا الرد علناً في قسم تقييمات الضيوف الخاص بالعقار."
            )}
          </p>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={closeReplyModal}
              disabled={savingReply}
              className="px-3 h-8 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {t("Cancel", "إلغاء")}
            </button>
            <button
              type="submit"
              disabled={savingReply}
              className="px-4 h-8 rounded-lg bg-[#4F2396] hover:bg-[#3d1a75] text-white text-xs font-medium shadow-xs transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {savingReply ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>{t("Publishing...", "جارٍ النشر...")}</span>
                </>
              ) : (
                <>
                  <Send size={13} />
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
