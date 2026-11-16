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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#0E0E1A] border border-slate-200 dark:border-white/10 p-6 sm:p-7 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 rtl:right-auto rtl:left-5 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-[#4F2396] dark:text-purple-300 flex items-center justify-center">
            <PlusCircle size={20} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              {t("Top Up Wallet Balance", "شحن رصيد المحفظة")}
            </h3>
            <p className="text-xs text-slate-500">
              {t(
                "Instant top-up via Mada, Apple Pay, Google Pay, STC Pay, or Cards",
                "شحن فوري عبر مدى، Apple Pay، Google Pay، STC Pay، أو البطاقات"
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
                className={`py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  topUpAmount === amt && !customAmount
                    ? "bg-[#4F2396] text-white shadow-md shadow-purple-900/20"
                    : "bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                {amt} SAR
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
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
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white font-mono text-sm focus:outline-hidden focus:border-[#4F2396]"
            />
            <span className="absolute right-3 rtl:right-auto rtl:left-3 top-2.5 text-xs font-bold text-slate-400">
              SAR
            </span>
          </div>
        </div>

        {isEligibleForTopupBonus && (
          <div className="mb-5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/20 flex items-center gap-2.5 text-xs text-amber-800 dark:text-amber-300 font-bold">
            <Sparkles size={16} className="text-[#FF9750] shrink-0" />
            <span>
              {t(
                "You will earn +250 Bonus Loyalty Points on this 500+ SAR top-up!",
                "ستحصل على +250 نقطة مكافأة مجانية فورية مع شحن 500 ر.س فما فوق!"
              )}
            </span>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
            {t("Payment Method", "طريقة الدفع")}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {TOPUP_METHOD_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTopUpMethod(opt.id)}
                className={`${opt.spanFull ? "col-span-2 sm:col-span-2" : ""} py-3 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  topUpMethod === opt.id
                    ? "border-2 border-[#4F2396] bg-purple-50/50 dark:bg-purple-950/30 text-[#4F2396] dark:text-purple-300"
                    : "border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400"
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
            className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
          >
            {t("Cancel", "إلغاء")}
          </button>

          <button
            type="button"
            disabled={isSubmitting || effectiveAmount < 10}
            onClick={onSubmit}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#4F2396] to-[#7c3aed] text-white text-xs font-bold shadow-md shadow-purple-900/20 hover:opacity-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#0E0E1A] border border-slate-200 dark:border-white/10 p-6 sm:p-7 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 rtl:right-auto rtl:left-5 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center">
            <Gift size={20} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              {t("Redeem Loyalty Points", "استبدال نقاط المكافآت")}
            </h3>
            <p className="text-xs text-slate-500">
              {t("Convert points directly into SAR wallet balance", "حوّل نقاطك مباشرة إلى رصيد نقدي في محفظتك")}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 mb-5">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-500">{t("Available Points", "النقاط المتاحة")}:</span>
            <span className="font-black text-slate-900 dark:text-white">{loyaltyPoints} Pts</span>
          </div>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-500">{t("Conversion Rate", "معدل التحويل")}:</span>
            <span className="font-bold text-emerald-600">100 Pts = 10.00 SAR</span>
          </div>
          <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-sm font-bold">
            <span>{t("You will receive", "ستحصل على")}:</span>
            <span className="font-black text-emerald-600 font-mono" dir="ltr">
              +{(Math.floor(loyaltyPoints / 100) * 10).toFixed(2)} SAR
            </span>
          </div>
        </div>

        <p
          className={`text-xs mb-5 leading-relaxed ${
            loyaltyPoints < 100 ? "text-rose-500 font-bold" : "text-slate-500"
          }`}
        >
          {loyaltyPoints < 100
            ? t(
                "You need at least 100 points to make a redemption.",
                "تحتاج إلى ١٠٠ نقطة على الأقل لإجراء عملية الاستبدال."
              )
            : t(
                "The SAR credit will be added immediately to your wallet balance and can be used on your next reservation.",
                "سيتم إضافة المبلغ المالي فوراً إلى رصيد محفظتك ويمكنك استخدامه في حجزك القادم."
              )}
        </p>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
          >
            {t("Cancel", "إلغاء")}
          </button>

          <button
            type="button"
            disabled={isSubmitting || loyaltyPoints < 100}
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-xs font-black shadow-md shadow-amber-900/20 hover:opacity-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
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
