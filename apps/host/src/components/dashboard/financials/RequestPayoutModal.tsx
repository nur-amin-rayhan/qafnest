"use client";

import React, { useState, useEffect } from "react";
import { X, Send, ShieldCheck, AlertCircle } from "lucide-react";
import type { HostPayoutIban } from "@/lib/services/hostFinancialsService";

interface RequestPayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: string;
  escrowedBalance?: string;
  ibanData: HostPayoutIban;
  onRequestPayout: (amount: number) => Promise<void>;
  lang: "ar" | "en";
  t: (en: string, ar: string) => string;
}

export function RequestPayoutModal({
  isOpen,
  onClose,
  availableBalance,
  escrowedBalance = "0.00",
  ibanData,
  onRequestPayout,
  lang,
  t,
}: RequestPayoutModalProps) {
  const numericAvailable = parseFloat(availableBalance.replace(/,/g, "")) || 0;
  const numericEscrowed = parseFloat(escrowedBalance.replace(/,/g, "")) || 0;
  const [amount, setAmount] = useState<string>(numericAvailable > 0 ? numericAvailable.toString() : "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasIban = Boolean(ibanData.iban);

  useEffect(() => {
    if (isOpen) {
      setAmount(numericAvailable > 0 ? numericAvailable.toString() : "");
      setError(null);
    }
  }, [isOpen, numericAvailable]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasIban) {
      setError(t("Please configure and verify your payout IBAN first.", "يرجى إضافة وتوثيق رقم الآيبان البنكي أولاً."));
      return;
    }
    const parsed = parseFloat(amount);
    if (!parsed || parsed < 100) {
      setError(t("Minimum payout is 100 SAR", "الحد الأدنى للتحويل هو 100 ر.س"));
      return;
    }
    if (parsed > numericAvailable) {
      setError(t("Amount exceeds available balance", "المبلغ المطلوب يتجاوز الرصيد القابل للتحويل"));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onRequestPayout(parsed);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Payout request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#12101a] p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-100 dark:bg-purple-950/60 text-[#4F2396] dark:text-purple-300">
              <Send size={18} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {t("Request Post-Checkout Payout", "طلب صرف مستحقات بعد المغادرة")}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {t(
                  "Admin approves your post-checkout request, Finance transfers to your IBAN & enters the official bank receipt number.",
                  "تراجع الإدارة طلبك بعد مغادرة الضيف ثم يحول قسم المالية لحسابك مع إرفاق رقم الإيصال الرسمي (أو يتم الصرف يدوياً خلال ٢٤ ساعة)."
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/50 p-3.5 text-xs font-bold text-rose-800 dark:text-rose-300">
            <AlertCircle size={16} className="shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-2xl border border-violet-100 dark:border-purple-900/50 bg-violet-50/70 dark:bg-purple-950/30 p-4 space-y-2">
            <div>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
                {t("Unlocked Balance Available (Post-Check-Out)", "الرصيد المحرر المتاح للسحب (بعد مغادرة الضيف)")}
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#4F2396] dark:text-purple-300">{availableBalance}</span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{t("SAR", "ر.س")}</span>
              </div>
            </div>
            {numericEscrowed > 0 && (
              <div className="border-t border-violet-200/70 dark:border-purple-800/50 pt-2 text-[11px] font-bold text-amber-800 dark:text-amber-400 flex items-center justify-between gap-2">
                <span>{t("Escrow-Locked Until Guest Check-Out:", "محتجز بالضمان حتى مغادرة الضيف:")}</span>
                <span className="font-mono">{escrowedBalance} {t("SAR", "ر.س")}</span>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {t("Transfer Amount (SAR)", "مبلغ التحويل (ر.س)")}
              </label>
              <button
                type="button"
                onClick={() => setAmount(numericAvailable.toString())}
                className="text-[11px] font-bold text-[#4F2396] dark:text-purple-400 hover:underline cursor-pointer"
              >
                {t("Transfer All", "تحويل كامل الرصيد")}
              </button>
            </div>
            <input
              type="number"
              step="any"
              min="100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 font-mono text-base font-black text-slate-900 dark:text-white outline-none focus:border-[#4F2396] focus:bg-white dark:focus:bg-slate-900"
            />
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4 space-y-1.5 text-xs">
            <span className="font-bold text-slate-400 dark:text-slate-500 block">{t("Destination Bank Account", "الحساب البنكي المستلم")}</span>
            <span className="font-black text-slate-900 dark:text-white block">
              {hasIban
                ? lang === "ar"
                  ? ibanData.bankNameAr || ibanData.bankNameEn
                  : ibanData.bankNameEn || ibanData.bankNameAr
                : t("Not Configured", "غير مضاف")}
            </span>
            <span className="font-mono text-slate-600 dark:text-slate-400 font-bold block" dir={hasIban ? "ltr" : undefined}>
              {ibanData.formattedIban || t("Please add your IBAN in the Payout Method tab first.", "يرجى إضافة الآيبان من تبويب الحساب البنكي أولاً.")}
            </span>
            {hasIban && ibanData.isVerified ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                <ShieldCheck size={13} />
                <span>{t("IBAN Checksum Validated (MOD-97)", "تم التحقق من صيغة الآيبان (MOD-97)")}</span>
              </span>
            ) : null}
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-200 dark:border-slate-700 px-5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              {t("Cancel", "إلغاء")}
            </button>
            <button
              type="submit"
              disabled={loading || !hasIban || numericAvailable < 100}
              className="rounded-2xl bg-[#4F2396] px-6 py-2.5 text-xs font-black text-white hover:bg-[#3d1979] shadow-md shadow-violet-950/20 disabled:opacity-50 cursor-pointer transition flex items-center gap-1.5"
            >
              <Send size={14} />
              <span>{loading ? t("Transferring...", "جارٍ التحويل...") : t("Confirm Transfer", "تأكيد التحويل الآن")}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

