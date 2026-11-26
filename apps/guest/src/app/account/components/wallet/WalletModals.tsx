"use client";

import React from "react";
import { AlertCircle, Gift, Loader2, PlusCircle, Sparkles, X } from "lucide-react";
import { OfficialPaymentIcon } from "@/components/common/OfficialPaymentIcon";

export type TopUpMethod = "card" | "apple" | "mada" | "google" | "stcpay";

const PRESET_AMOUNTS = [100, 250, 500, 1000];

const TOPUP_METHOD_OPTIONS: Array<{
  id: TopUpMethod;
  iconName: "mada" | "apple" | "google" | "stcpay" | "vm";
  labelEn: string;
  labelAr: string;
  spanFull?: boolean;
}> = [
  { id: "mada", iconName: "mada", labelEn: "Mada", labelAr: "مدى" },
  { id: "apple", iconName: "apple", labelEn: "Apple Pay", labelAr: "Apple Pay" },
  { id: "google", iconName: "google", labelEn: "Google Pay", labelAr: "Google Pay" },
  { id: "stcpay", iconName: "stcpay", labelEn: "STC Pay", labelAr: "STC Pay" },
  {
    id: "card",
    iconName: "vm",
    labelEn: "Credit Card (Visa / Mastercard)",
    labelAr: "بطاقة ائتمان (فيزا / ماستركارد)",
    spanFull: true,
  },
];

export function WalletTopUpModal({
  topUpAmount,
  setTopUpAmount,
  customAmount,
  setCustomAmount,
  topUpMethod,
  setTopUpMethod,
  effectiveAmount,
  isEligibleForTopupBonus,
  isSubmitting,
  actionErrorMsg,
  onClose,
  onSubmit,
  t,
}: {
  topUpAmount: number;
  setTopUpAmount: (v: number) => void;
  customAmount: string;
  setCustomAmount: (v: string) => void;
  topUpMethod: TopUpMethod;
  setTopUpMethod: (v: TopUpMethod) => void;
  effectiveAmount: number;
  isEligibleForTopupBonus: boolean;
  isSubmitting: boolean;
  actionErrorMsg: string | null;
  onClose: () => void;
  onSubmit: () => void;
  t: (en: string, ar: string) => string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55">
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#14141C] border border-slate-200 dark:border-slate-800 p-6 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 end-5 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-[#4F2396] dark:text-purple-300 flex items-center justify-center">
            <PlusCircle size={20} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {t("Top Up Wallet Balance", "شحن رصيد المحفظة")}
            </h3>
            <p className="text-xs text-slate-500">
              {t(
                "Top up via Mada, Apple Pay, Google Pay, STC Pay, or Card",
                "الشحن عبر مدى أو Apple Pay أو Google Pay أو STC Pay أو البطاقة"
              )}
            </p>
          </div>
        </div>

        {actionErrorMsg && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-bold border border-rose-200 dark:border-rose-500/20">
            <AlertCircle size={16} />
            <span>{actionErrorMsg}</span>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
            {t("Select Amount (SAR)", "اختر مبلغ الشحن (ر.س)")}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PRESET_AMOUNTS.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => {
                  setTopUpAmount(amt);
                  setCustomAmount("");
                }}
                className={`py-2.5 rounded-xl text-xs font-semibold tabular-nums transition-colors cursor-pointer ${
                  topUpAmount === amt && !customAmount
                    ? "bg-[#4F2396] text-white"
                    : "bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10"
                }`}
              >
                <bdi dir="ltr">{amt} SAR</bdi>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-xs font-medium text-slate-800 dark:text-slate-300 mb-1">
            {t("Or enter custom amount", "أو أدخل مبلغاً مخصصاً")}
          </label>
          <div className="relative">
            <input
              type="number"
              min="10"
              step="10"
              placeholder={t("e.g. 750", "مثال: 750")}
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#06060B] text-slate-900 dark:text-white placeholder:text-slate-500 font-mono text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F2396]/35 focus:border-[#4F2396]"
            />
            <span className="absolute end-3 top-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
              SAR
            </span>
          </div>
        </div>

        {isEligibleForTopupBonus && (
          <div className="mb-5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/20 flex items-center gap-2.5 text-xs text-amber-900 dark:text-amber-300 font-medium">
            <Sparkles size={16} className="text-amber-600 dark:text-[#FF9750] shrink-0" />
            <span>
              {t(
                "You will earn +250 Bonus Loyalty Points on this 500+ SAR top-up.",
                "ستحصل على +250 نقطة مكافأة إضافية عند شحن 500 ر.س فأكثر."
              )}
            </span>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-xs font-medium text-slate-800 dark:text-slate-300 mb-2">
            {t("Payment Method", "طريقة الدفع")}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {TOPUP_METHOD_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTopUpMethod(opt.id)}
                className={`${opt.spanFull ? "col-span-2 sm:col-span-2" : ""} py-3 px-2 rounded-xl text-xs font-semibold flex flex-col items-center gap-1.5 transition-colors cursor-pointer ${
                  topUpMethod === opt.id
                    ? "border-2 border-[#4F2396] bg-[#F4EEFF] dark:bg-purple-950/30 text-[#4F2396] dark:text-purple-300"
                    : "border border-slate-300 dark:border-white/15 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                }`}
              >
                <OfficialPaymentIcon name={opt.iconName} heightClass="h-7" />
                <span>{t(opt.labelEn, opt.labelAr)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-slate-300 dark:border-white/15 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer"
          >
            {t("Cancel", "إلغاء")}
          </button>

          <button
            type="button"
            disabled={isSubmitting || effectiveAmount < 10}
            onClick={onSubmit}
            className="flex-1 py-3 rounded-xl bg-[#4F2396] hover:bg-[#3d1979] text-white text-xs font-semibold disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>{t("Processing...", "جارٍ المعالجة...")}</span>
              </>
            ) : (
              <span>{t(`Pay ${effectiveAmount.toFixed(2)} SAR`, `دفع ${effectiveAmount.toFixed(2)} ر.س`)}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function WalletRedeemModal({
  loyaltyPoints,
  isSubmitting,
  onClose,
  onConfirm,
  t,
}: {
  loyaltyPoints: number;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
  t: (en: string, ar: string) => string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55">
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#0E0E1A] border border-slate-200 dark:border-white/10 p-6 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 end-5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
            <Gift size={20} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {t("Redeem Loyalty Points", "استبدال نقاط المكافآت")}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {t("Convert points into SAR wallet balance", "حوّل نقاطك إلى رصيد في محفظتك")}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#F9F8FD] dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 mb-5">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-600 dark:text-slate-400">{t("Available Points", "النقاط المتاحة")}:</span>
            <span className="font-semibold text-slate-900 dark:text-white tabular-nums">{loyaltyPoints} Pts</span>
          </div>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-600 dark:text-slate-400">{t("Conversion Rate", "معدل التحويل")}:</span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">100 Pts = 10.00 SAR</span>
          </div>
          <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-sm font-semibold">
            <span>{t("You will receive", "ستحصل على")}:</span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-400 font-mono tabular-nums" dir="ltr">
              +{(Math.floor(loyaltyPoints / 100) * 10).toFixed(2)} SAR
            </span>
          </div>
        </div>

        <p
          className={`text-xs mb-5 leading-relaxed ${
            loyaltyPoints < 100 ? "text-rose-700 dark:text-rose-400 font-medium" : "text-slate-600 dark:text-slate-400"
          }`}
        >
          {loyaltyPoints < 100
            ? t(
                "You need at least 100 points to make a redemption.",
                "تحتاج إلى ١٠٠ نقطة على الأقل لإجراء عملية الاستبدال."
              )
            : t(
                "The SAR credit will be added to your wallet balance for future stays.",
                "سيتم إضافة المبلغ إلى رصيد محفظتك لاستخدامه في حجوزاتك القادمة."
              )}
        </p>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-slate-300 dark:border-white/15 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer"
          >
            {t("Cancel", "إلغاء")}
          </button>

          <button
            type="button"
            disabled={isSubmitting || loyaltyPoints < 100}
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl bg-[#4F2396] hover:bg-[#3d1979] text-white text-xs font-semibold disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>{t("Redeeming...", "جارٍ الاستبدال...")}</span>
              </>
            ) : (
              <span>{t("Confirm & Add Credit", "تأكيد وإضافة الرصيد")}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
