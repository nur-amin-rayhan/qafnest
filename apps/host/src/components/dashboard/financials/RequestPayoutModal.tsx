"use client";

import React, { useState, useEffect } from "react";
import { X, Send, ShieldCheck, AlertCircle } from "lucide-react";
import type { HostPayoutIban } from "@/lib/services/hostFinancialsService";

interface RequestPayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: string;
  ibanData: HostPayoutIban;
  onRequestPayout: (amount: number) => Promise<void>;
  lang: "ar" | "en";
  t: (en: string, ar: string) => string;
}

export function RequestPayoutModal({
  isOpen,
  onClose,
  availableBalance,
  ibanData,
  onRequestPayout,
  lang,
  t,
}: RequestPayoutModalProps) {
  const numericAvailable = parseFloat(availableBalance.replace(/,/g, "")) || 0;
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
      <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-100 text-[#4F2396]">
              <Send size={18} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                {t("Request Instant Bank Transfer", "طلب تحويل فوري للحساب")}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {t("Direct SAMA Sarie transfer to your verified IBAN.", "إيداع فوري عبر نظام سريع إلى حسابك الموثق.")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-800">
            <AlertCircle size={16} className="shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-2xl border border-violet-100 bg-violet-50/70 p-4">
            <span className="text-xs font-bold text-slate-500 block">
              {t("Available Balance for Instant Transfer", "الرصيد المتاح للتحويل الفوري")}
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#4F2396]">{availableBalance}</span>
              <span className="text-xs font-bold text-slate-500">{t("SAR", "ر.س")}</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                {t("Transfer Amount (SAR)", "مبلغ التحويل (ر.س)")}
              </label>
              <button
                type="button"
                onClick={() => setAmount(numericAvailable.toString())}
                className="text-[11px] font-bold text-[#4F2396] hover:underline cursor-pointer"
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
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-base font-black text-slate-900 outline-none focus:border-[#4F2396] focus:bg-white"
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-1.5 text-xs">
            <span className="font-bold text-slate-400 block">{t("Destination Bank Account", "الحساب البنكي المستلم")}</span>
            <span className="font-black text-slate-900 block">
              {hasIban
                ? lang === "ar"
                  ? ibanData.bankNameAr || ibanData.bankNameEn
                  : ibanData.bankNameEn || ibanData.bankNameAr
                : t("Not Configured", "غير مضاف")}
            </span>
            <span className="font-mono text-slate-600 font-bold block" dir={hasIban ? "ltr" : undefined}>
              {ibanData.formattedIban || t("Please add your IBAN in the Payout Method tab first.", "يرجى إضافة الآيبان من تبويب الحساب البنكي أولاً.")}
            </span>
            {hasIban && ibanData.isVerified ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-bold mt-1">
                <ShieldCheck size={13} />
                <span>{t("Verified SAMA Account", "حساب بنكي موثق لدى ساما")}</span>
              </span>
            ) : null}
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
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

