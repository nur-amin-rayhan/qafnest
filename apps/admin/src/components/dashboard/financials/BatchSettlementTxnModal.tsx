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
        className="w-full max-w-md rounded-3xl bg-surface-container-lowest border border-surface-container-high p-5 sm:p-6 shadow-2xl space-y-4 text-on-surface"
      >
        <div className="flex items-start justify-between gap-2 pb-3 border-b border-surface-container">
          <div>
            <h3 className="text-sm sm:text-base font-black text-on-surface flex items-center gap-2">
              <ShieldCheck size={18} className="text-status-emerald shrink-0" />
              <span>{t(titleEn, titleAr)}</span>
            </h3>
            <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
              {t(subtitleEn, subtitleAr)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1 text-outline hover:bg-surface-container cursor-pointer"
            aria-label={t("Close", "إغلاق")}
          >
            <X size={18} />
          </button>
        </div>

        <div className="rounded-2xl bg-amber-50/80 border border-amber-200 p-3 text-[11px] text-amber-900 flex items-start gap-2">
          <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
          <span>
            {t(
              "Only post-checkout eligible payouts with configured IBANs will be settled. Stays still before guest check-out remain locked in escrow.",
              "سيتم تسوية الدفعات المؤهلة بعد مغادرة الضيف فقط والتي تملك رقم آيبان مكتمل. الحجوزات قبل موعد المغادرة ستبقى محمية في الضمان."
            )}
          </span>
        </div>

        <div className="space-y-1.5 text-xs">
          <label className="font-bold text-on-surface block">
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
            className="w-full rounded-xl border border-surface-container-high bg-surface-container-low p-2.5 font-mono text-xs text-on-surface outline-none focus:border-primary"
          />
          {touched && !validation.valid && (
            <p className="text-[11px] font-bold text-rose-600">
              {t(
                validation.errorEn || "Valid legal bank transaction number is required.",
                validation.errorAr || "رقم العملية البنكية الرسمي مطلوب."
              )}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-container">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-3.5 py-2 rounded-xl border border-surface-container-high text-xs font-bold text-on-surface-variant hover:bg-surface-container cursor-pointer"
          >
            {t("Cancel", "إلغاء")}
          </button>
          <button
            type="submit"
            disabled={submitting || !validation.valid}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-status-emerald text-white hover:bg-emerald-700 text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
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
