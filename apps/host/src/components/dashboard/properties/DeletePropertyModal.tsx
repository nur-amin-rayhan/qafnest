"use client";

import React, { useEffect } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";

export interface DeletePropertyTarget {
  id: string;
  title: string;
  titleAr?: string;
  isApproved?: boolean;
  status?: string;
}

interface DeletePropertyModalProps {
  property: DeletePropertyTarget | null;
  busy: boolean;
  error: string | null;
  lang: "ar" | "en";
  t: (en: string, ar: string) => string;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}

export function DeletePropertyModal({
  property,
  busy,
  error,
  lang,
  t,
  onCancel,
  onConfirm,
}: DeletePropertyModalProps) {
  useEffect(() => {
    if (!property) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [property, busy, onCancel]);

  if (!property) return null;

  const displayTitle =
    (lang === "ar"
      ? property.titleAr || property.title
      : property.title || property.titleAr) || t("this property", "هذا العقار");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-property-title"
      dir={lang === "ar" ? "rtl" : "ltr"}
      onClick={() => {
        if (!busy) onCancel();
      }}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-rose-100 text-rose-600">
              <AlertTriangle size={22} />
            </div>
            <div>
              <h2
                id="delete-property-title"
                className="text-base sm:text-lg font-black text-slate-900"
              >
                {t("Delete Property Listing?", "هل تريد حذف العقار نهائياً؟")}
              </h2>
              <p className="text-xs font-mono text-slate-400">#{property.id.slice(0, 8)}</p>
            </div>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            aria-label={t("Close", "إغلاق")}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="rounded-2xl border border-rose-200/80 bg-rose-50/70 p-4 space-y-1.5 text-xs sm:text-sm text-rose-950">
          <p className="font-black text-slate-900">{displayTitle}</p>
          <p className="font-medium leading-relaxed text-rose-900/90">
            {t(
              "This action permanently deletes this property from QafNest, including its availability calendar and listing details. Properties with active upcoming confirmed bookings cannot be deleted.",
              "سيؤدي هذا الإجراء إلى حذف العقار نهائياً من منصة قاف نست مع جدول التوفر وتفاصيل الوحدة. لا يمكن حذف العقارات التي لديها حجوزات مؤكدة قادمة."
            )}
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700"
          >
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-1">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition cursor-pointer"
          >
            {t("Cancel", "إلغاء")}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-black text-white shadow-sm hover:bg-rose-700 disabled:opacity-60 transition cursor-pointer"
          >
            <Trash2 size={14} />
            <span>
              {busy
                ? t("Deleting...", "جارٍ الحذف...")
                : t("Delete Property", "حذف العقار نهائياً")}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
