"use client";

import React, { useState } from "react";
import { X, CreditCard, ShieldCheck, AlertCircle, Building2 } from "lucide-react";
import { detectSaudiBank, validateSaudiIban, formatSaudiIban } from "@/lib/financials/saudiBanks";
import type { HostPayoutIban } from "@/lib/services/hostFinancialsService";

interface EditIbanModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentIban: HostPayoutIban;
  onSave: (iban: string, accountHolder: string) => Promise<void>;
  lang: "ar" | "en";
  t: (en: string, ar: string) => string;
}

export function EditIbanModal({
  isOpen,
  onClose,
  currentIban,
  onSave,
  lang,
  t,
}: EditIbanModalProps) {
  const [ibanInput, setIbanInput] = useState(currentIban.iban);
  const [holderInput, setHolderInput] = useState(currentIban.accountHolder);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const detectedBank = detectSaudiBank(ibanInput);
  const validation = validateSaudiIban(ibanInput);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validation.valid) {
      setError(lang === "ar" ? validation.errorAr || "آيبان غير صحيح" : validation.errorEn || "Invalid IBAN");
      return;
    }
    if (!holderInput.trim()) {
      setError(t("Please enter account holder name", "يرجى كتابة اسم المستفيد"));
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave(ibanInput, holderInput);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update IBAN");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-100 text-[#4F2396]">
              <CreditCard size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                {t("Edit Payout Bank Account", "تعديل الحساب البنكي للتحويل")}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {t("Must match the Saudi National ID of the registered host.", "يجب أن يطابق هوية المضيف المسجلة بنكياً لدى سماء.")}
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
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {t("Account Holder Full Name", "اسم صاحب الحساب (رباعي)")}
            </label>
            <input
              type="text"
              value={holderInput}
              onChange={(e) => setHolderInput(e.target.value)}
              placeholder={t("e.g. Account Holder Full Name", "مثال: الاسم الكامل لصاحب الحساب")}
              required
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-[#4F2396] focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {t("Saudi IBAN (24 characters)", "رقم الآيبان السعودي (24 خانة)")}
            </label>
            <div className="relative">
              <input
                type="text"
                value={ibanInput}
                onChange={(e) => setIbanInput(e.target.value.replace(/\s+/g, "").toUpperCase())}
                placeholder="SA00 0000 0000 0000 0000 0000"
                maxLength={24}
                required
                dir="ltr"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm font-black text-slate-900 outline-none focus:border-[#4F2396] focus:bg-white tracking-wider"
              />
            </div>
            <p className="mt-1 text-[11px] font-mono text-slate-400">
              {formatSaudiIban(ibanInput)}
            </p>
          </div>

          {/* Detected Bank Badge */}
          {ibanInput.replace(/\s+/g, "").length >= 6 && ibanInput.trim().toUpperCase().startsWith("SA") && detectedBank && (
            <div className="flex items-center justify-between rounded-2xl border border-violet-100 bg-violet-50/60 p-3.5 text-xs">
              <span className="flex items-center gap-2 font-bold text-violet-900">
                <Building2 size={16} className="text-[#4F2396]" />
                {lang === "ar" ? detectedBank.nameAr : detectedBank.nameEn}
              </span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                <ShieldCheck size={14} />
                {t("SAMA Licensed Bank", "بنك مرخص لدى سماء")}
              </span>
            </div>
          )}

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
              disabled={saving}
              className="rounded-2xl bg-[#4F2396] px-6 py-2.5 text-xs font-black text-white hover:bg-[#3d1979] shadow-md shadow-violet-950/20 disabled:opacity-50 cursor-pointer transition"
            >
              {saving ? t("Saving & Verifying...", "جارٍ التوثيق والحفظ...") : t("Save & Verify IBAN", "حفظ وتوثيق الآيبان")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

