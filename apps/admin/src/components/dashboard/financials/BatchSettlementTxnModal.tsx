"use client";

import React, { useState } from "react";
import { X, ShieldCheck, CheckCircle2, AlertTriangle } from "lucide-react";
import { validateLegalTransactionNumber } from "@qafnest/shared";
import { useAdminAuth } from "@/context/AdminAuthContext";

interface BatchSettlementTxnModalProps {
  isOpen: boolean;
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  confirmLabelEn?: string;
  confirmLabelAr?: string;
  submitting?: boolean;
  onClose: () => void;
  onConfirm: (legalTxnId: string) => Promise<void> | void;
}

export function BatchSettlementTxnModal({
  isOpen,
  titleEn,
  titleAr,
  subtitleEn,
  subtitleAr,
  confirmLabelEn = "Confirm Legal Settlement",
  confirmLabelAr = "تأكيد التسوية بالرقم المرجعي",
  submitting = false,
  onClose,
  onConfirm,
}: BatchSettlementTxnModalProps) {
  const { t, dir } = useAdminAuth();
  const [txnInput, setTxnInput] = useState("");
  const [touched, setTouched] = useState(false);

  if (!isOpen) return null;

  const validation = validateLegalTransactionNumber(txnInput);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!validation.valid) return;
    await onConfirm(validation.cleaned);
    setTxnInput("");
    setTouched(false);
  };

  return (
    <div
      dir={dir}
      className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl bg-white dark:bg-[#0E0D16] border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xl space-y-4 text-slate-900 dark:text-slate-100"
      >
        <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-500 shrink-0" />
              <span>{t(titleEn, titleAr)}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              {t(subtitleEn, subtitleAr)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            aria-label={t("Close", "إغلاق")}
          >
            <X size={18} />
          </button>
        </div>

        <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-3 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
          <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
          <span>
            {t(
              "Only post-checkout eligible payouts with configured IBANs will be settled. Stays still before guest check-out remain locked in escrow.",
              "سيتم تسوية الدفعات المؤهلة بعد مغادرة الضيف فقط والتي تملك رقم آيبان مكتمل. الحجوزات قبل موعد المغادرة ستبقى محمية في الضمان."
            )}
          </span>
        </div>

        <div className="space-y-1.5 text-xs">
          <label className="font-semibold text-slate-900 dark:text-slate-100 block">
            {t(
              "Legal Bank / SAMA SARIE Transaction Number *",
              "رقم العملية البنكية الرسمي / سريع (إلزامي) *"
            )}
          </label>
          <input
            type="text"
            value={txnInput}
            onChange={(e) => {
              setTxnInput(e.target.value);
              if (!touched) setTouched(true);
            }}
            dir="ltr"
            autoFocus
            placeholder={t(
              "e.g. SARIE-20261115-884120",
              "مثال: SARIE-20261115-884120"
            )}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 font-mono text-xs text-slate-900 dark:text-slate-100 outline-none focus:ring-1 focus:ring-[#4F2396] focus:border-[#4F2396]"
          />
          {touched && !validation.valid && (
            <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400">
              {t(
                validation.errorEn || "Valid legal bank transaction number is required.",
                validation.errorAr || "رقم العملية البنكية الرسمي مطلوب."
              )}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer shadow-xs"
          >
            {t("Cancel", "إلغاء")}
          </button>
          <button
            type="submit"
            disabled={submitting || !validation.valid}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 size={14} />
            <span>
              {submitting
                ? t("Settling...", "جارٍ التسوية...")
                : t(confirmLabelEn, confirmLabelAr)}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
