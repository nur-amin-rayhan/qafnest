"use client";

import React, { useState } from "react";
import {
  Building2,
  CheckCircle2,
  ShieldCheck,
  Calendar,
  Zap,
  Loader2,
  AlertCircle,
  CreditCard,
  Trash2,
} from "lucide-react";
import {
  detectSaudiBank,
  validateSaudiIban,
  formatSaudiIban,
} from "@/lib/financials/saudiBanks";
import type { HostPayoutSettings, BaseTabProps } from "./types";

interface PayoutMethodsTabProps extends BaseTabProps {
  payout: HostPayoutSettings;
  onSave: (data: {
    iban?: string;
    accountHolder?: string;
    payoutSchedule?: "instant" | "weekly" | "monthly";
    minimumPayoutThreshold?: number;
    autoDisburse?: boolean;
  }) => Promise<void>;
}

export function PayoutMethodsTab({
  payout,
  onSave,
  lang,
  t,
  isSaving,
}: PayoutMethodsTabProps) {
  const [ibanInput, setIbanInput] = useState(payout.iban || "");
  const [holderInput, setHolderInput] = useState(payout.accountHolder || "");
  const [schedule, setSchedule] = useState<"instant" | "weekly" | "monthly">(
    payout.payoutSchedule || "instant"
  );
  const [minThreshold, setMinThreshold] = useState(
    payout.minimumPayoutThreshold || 100
  );
  const autoDisburse = payout.autoDisburse ?? true;
  const [ibanError, setIbanError] = useState<string | null>(null);

  const detectedBank = detectSaudiBank(ibanInput);
  const validation = validateSaudiIban(ibanInput);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validation.valid) {
      setIbanError(
        lang === "ar"
          ? validation.errorAr || "رقم الآيبان غير صحيح"
          : validation.errorEn || "Invalid Saudi IBAN"
      );
      return;
    }
    setIbanError(null);
    await onSave({
      iban: ibanInput.trim().toUpperCase(),
      accountHolder: holderInput.trim(),
      payoutSchedule: schedule,
      minimumPayoutThreshold: minThreshold,
      autoDisburse,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. Verified Bank Account Summary Card */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                {t("Primary Payout Bank Account", "حساب التحويل البنكي الأساسي")}
              </h3>
              {payout.iban && payout.isVerified ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-700">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  <span>{t("IBAN Format Verified (MOD-97)", "صيغة الآيبان صحيحة (MOD-97)")}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-700">
                  <AlertCircle size={13} className="text-amber-600" />
                  <span>{t("Not Configured", "غير مضاف")}</span>
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500 font-medium">
              {t(
                "Earnings and remittances are automatically disbursed to this verified IBAN.",
                "يتم إيداع أرباح الحجوزات والمستحقات مباشرة في هذا الحساب البنكي المعتمد."
              )}
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-xs font-bold text-emerald-800">
            <ShieldCheck size={16} className="text-emerald-600" />
            <span>{t("Instant SARIE Clearing", "تسوية فورية بنظام سريع")}</span>
          </div>
        </div>

        {/* Bank Details View / Form */}
        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Account Beneficiary */}
          <div>
            <label className="block text-xs font-black text-slate-800 mb-1.5">
              {t("Beneficiary Account Holder Name", "اسم صاحب الحساب المستفيد (رباعي)")}
            </label>
            <input
              type="text"
              required
              value={holderInput}
              onChange={(e) => setHolderInput(e.target.value)}
              placeholder={t("e.g. Account Holder Name", "مثال: اسم صاحب الحساب")}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-xs sm:text-sm font-bold text-slate-900 transition focus:border-violet-500 focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2"
            />
          </div>

          {/* IBAN Input with real-time detection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-black text-slate-800">
                {t("Saudi Bank IBAN (SA...)", "رقم الآيبان البنكي (يبدأ بـ SA)")}
              </label>
              {ibanInput.replace(/\s+/g, "").length >= 6 && ibanInput.trim().toUpperCase().startsWith("SA") && detectedBank && (
                <span className="text-[11px] font-black text-[#4F2396] bg-violet-50 px-2 py-0.5 rounded-md border border-violet-100">
                  {lang === "ar" ? detectedBank.nameAr : detectedBank.nameEn}
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                required
                dir="ltr"
                value={ibanInput}
                onChange={(e) => {
                  setIbanInput(e.target.value);
                  setIbanError(null);
                }}
                placeholder="SA00 0000 0000 0000 0000 0000"
                className={`w-full rounded-2xl border px-4 py-3 text-xs sm:text-sm font-mono font-bold text-slate-900 transition focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 ${
                  ibanError
                    ? "border-rose-400 bg-rose-50/30"
                    : validation.valid
                    ? "border-emerald-300 bg-emerald-50/20"
                    : "border-slate-200 bg-slate-50/50 focus:border-violet-500"
                }`}
              />
              <CreditCard
                size={16}
                className="absolute top-3.5 rtl:left-3.5 ltr:right-3.5 text-slate-400"
              />
            </div>
            {ibanError ? (
              <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-bold text-rose-600">
                <AlertCircle size={13} />
                <span>{ibanError}</span>
              </p>
            ) : (
              <p className="mt-1 text-[11px] text-slate-500 font-mono">
                {formatSaudiIban(ibanInput)}
              </p>
            )}
          </div>
        </div>

        {/* Quick Actions: Clear / Delete Account */}
        {payout.iban && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              {t("Need to change or disconnect this account?", "هل ترغب في تغيير أو حذف هذا الحساب؟")}
            </span>
            <button
              type="button"
              onClick={async () => {
                setIbanInput("");
                setHolderInput("");
                await onSave({
                  iban: "",
                  accountHolder: "",
                  payoutSchedule: schedule,
                  minimumPayoutThreshold: minThreshold,
                  autoDisburse,
                });
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer transition"
            >
              <Trash2 size={13} />
              <span>{t("Delete Bank Account", "حذف الحساب البنكي")}</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Payout Schedule Preferences Card */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
        <h3 className="text-base sm:text-lg font-black text-slate-900 pb-2 border-b border-slate-100">
          {t("Automated Settlement Schedule", "جدولة استلام المستحقات والتحويلات")}
        </h3>
        <p className="mt-1 text-xs text-slate-500 font-medium">
          {t(
            "Choose when your earnings are released directly to your verified bank account.",
            "حدد دورة التحويل المفضلة لتحويل عوائد الإيجار إلى حسابك البنكي."
          )}
        </p>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            {
              id: "instant",
              titleEn: "Instant on Checkout",
              titleAr: "فوري عند المغادرة",
              descEn: "Disbursed right after guest departs",
              descAr: "تحويل فوري فور مغادرة الضيف بنجاح",
              icon: <Zap size={18} className="text-amber-500" />,
            },
            {
              id: "weekly",
              titleEn: "Weekly Settlement",
              titleAr: "أسبوعي كل أحد",
              descEn: "Consolidated every Sunday morning",
              descAr: "تجميع أسبوعي وإيداع صباح كل أحد",
              icon: <Calendar size={18} className="text-violet-600" />,
            },
            {
              id: "monthly",
              titleEn: "Monthly on 1st",
              titleAr: "شهري في اليوم الأول",
              descEn: "Full month batch disbursement",
              descAr: "تحويل شامل في أول كل شهر ميلادي",
              icon: <Building2 size={18} className="text-emerald-600" />,
            },
          ].map((option) => {
            const isSelected = schedule === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setSchedule(option.id as any)}
                className={`flex flex-col items-start rounded-2xl border p-4 text-left rtl:text-right transition cursor-pointer ${
                  isSelected
                    ? "border-violet-600 bg-violet-50/50 shadow-sm"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-white shadow-xs">
                    {option.icon}
                  </div>
                  <div
                    className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                      isSelected
                        ? "border-[#4F2396] bg-[#4F2396]"
                        : "border-slate-300"
                    }`}
                  >
                    {isSelected && (
                      <div className="h-1.5 w-1.5 rounded-full bg-white" />
                    )}
                  </div>
                </div>
                <span className="mt-3 block text-xs sm:text-sm font-black text-slate-900">
                  {lang === "ar" ? option.titleAr : option.titleEn}
                </span>
                <span className="mt-0.5 block text-[11px] text-slate-500 font-medium">
                  {lang === "ar" ? option.descAr : option.descEn}
                </span>
              </button>
            );
          })}
        </div>

        {/* Minimum Threshold & Auto Disburse */}
        <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4 border border-slate-200/80">
          <div>
            <span className="block text-xs font-black text-slate-900">
              {t("Minimum Payout Threshold", "الحد الأدنى للتحويل التلقائي")}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              {t(
                "Payouts trigger when balance exceeds this amount (Min: 100 SAR)",
                "يتم التحويل عندما يصل رصيد الأرباح إلى هذا المبلغ (الحد الأدنى 100 ر.س)"
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {[100, 500, 1000].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setMinThreshold(val)}
                className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  minThreshold === val
                    ? "border-violet-600 bg-[#4F2396] text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                {val} {t("SAR", "ر.س")}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 flex items-center justify-end border-t border-slate-100 pt-5">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#4F2396] hover:bg-[#3d1979] px-6 py-3.5 text-xs sm:text-sm font-black text-white shadow-md shadow-violet-950/20 transition cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>{t("Updating Bank Details...", "جارٍ التحديث...")}</span>
              </>
            ) : (
              <span>{t("Save Payout Preferences", "حفظ وتأكيد حساب الاستلام")}</span>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}

