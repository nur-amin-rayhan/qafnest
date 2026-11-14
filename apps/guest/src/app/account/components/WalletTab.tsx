"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  BadgePercent,
  PlusCircle,
  Gift,
  ArrowUpRight,
  CreditCard,
  Sparkles,
  Zap,
  Clock,
  Coins,
  ChevronRight,
  Loader2,
  X,
  AlertCircle,
  FileText,
} from "lucide-react";
import type { WalletTransaction, LoyaltyOffer } from "@/lib/services/walletService";
import { OfficialPaymentIcon } from "@/components/common/OfficialPaymentIcon";
import { WalletTransactionReceiptModal } from "./WalletTransactionReceiptModal";

interface WalletTabProps {
  walletBalance: number;
  loyaltyPoints?: number;
  loyaltyTier?: string;
  transactions?: WalletTransaction[];
  offers?: LoyaltyOffer[];
  displayName: string;
  onRefreshWallet?: () => void;
  t: (en: string, ar: string) => string;
}

const PRESET_AMOUNTS = [100, 250, 500, 1000];

export default function WalletTab({
  walletBalance,
  loyaltyPoints = 0,
  loyaltyTier = "Bronze",
  transactions = [],
  offers = [],
  displayName,
  onRefreshWallet,
  t,
}: WalletTabProps) {
  // Modal states
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);
  const [redeemModalOpen, setRedeemModalOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<number>(250);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [topUpMethod, setTopUpMethod] = useState<"card" | "apple" | "mada" | "google" | "stcpay">("mada");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  // Filter state
  const [activeFilter, setActiveFilter] = useState<"all" | "topup" | "booking" | "reward">("all");
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<WalletTransaction | null>(null);
  const language: "en" | "ar" = t("en", "ar") === "ar" ? "ar" : "en";

  const effectiveAmount = customAmount ? parseFloat(customAmount) || 0 : topUpAmount;
  const isEligibleForTopupBonus = effectiveAmount >= 500;

  // Handle Top-up Submission
  const handleExecuteTopUp = async () => {
    if (effectiveAmount < 10) {
      setActionErrorMsg(t("Minimum top-up amount is 10 SAR", "الحد الأدنى للشحن هو ١٠ ر.س"));
      return;
    }

    setIsSubmitting(true);
    setActionErrorMsg(null);
    setActionSuccessMsg(null);

    try {
      const res = await fetch("/api/wallet/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: effectiveAmount,
          method: topUpMethod,
          locale: language,
          instant: false,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Top-up failed");
      }

      if (data.redirectUrl) {
        // Redirect to payment gateway
        window.location.href = data.redirectUrl;
        return;
      }

      // Completed instantly (Sandbox / Simulation)
      setActionSuccessMsg(
        t(
          `Successfully topped up ${effectiveAmount.toFixed(2)} SAR to your wallet!`,
          `تم شحن ${effectiveAmount.toFixed(2)} ر.س بنجاح إلى محفظتك!`
        )
      );
      setTopUpModalOpen(false);
      setCustomAmount("");
      if (onRefreshWallet) onRefreshWallet();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Top-up error occurred";
      setActionErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Points Redemption
  const handleExecuteRedeem = async () => {
    if (loyaltyPoints < 100) {
      setActionErrorMsg(t("Minimum 100 points required to redeem", "الحد الأدنى للاستبدال هو ١٠٠ نقطة"));
      return;
    }

    setIsSubmitting(true);
    setActionErrorMsg(null);

    try {
      const pointsToRedeem = Math.floor(loyaltyPoints / 100) * 100;
      const res = await fetch("/api/wallet/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points: pointsToRedeem }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Redemption failed");
      }

      setActionSuccessMsg(
        t(
          `Redeemed ${pointsToRedeem} points for ${(pointsToRedeem / 10).toFixed(2)} SAR credit!`,
          `تم استبدال ${pointsToRedeem} نقطة بـ ${(pointsToRedeem / 10).toFixed(2)} ر.س رصيد محفظة!`
        )
      );
      setRedeemModalOpen(false);
      if (onRefreshWallet) onRefreshWallet();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Redemption error";
      setActionErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered transactions
  const filteredTransactions = transactions.filter((tx) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "topup") return tx.type === "topup";
    if (activeFilter === "booking") return tx.type === "booking_payment";
    if (activeFilter === "reward") return tx.type === "reward" || tx.type === "redemption";
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-white/10">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {t("Digital Wallet & Loyalty Points", "المحفظة الرقمية ونقاط المكافآت")}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t(
              "Top up your balance, manage instant bookings, and track rewards.",
              "اشحن رصيد محفظتك، وادفع لحجوزاتك فوراً، وتابع نقاط مكافآتك وعروضك."
            )}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setActionErrorMsg(null);
              setRedeemModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 font-bold text-xs hover:bg-amber-100/70 transition-all cursor-pointer"
          >
            <Gift size={16} />
            <span>{t("Redeem Points", "استبدال النقاط")}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActionErrorMsg(null);
              setTopUpModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#4F2396] to-[#7c3aed] text-white font-bold text-xs shadow-md shadow-purple-900/20 hover:opacity-95 transition-all cursor-pointer"
          >
            <PlusCircle size={16} />
            <span>{t("Top Up Wallet", "شحن المحفظة")}</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {actionSuccessMsg && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-sm font-semibold">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Dual Cards: Wallet Balance + Loyalty Rewards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Virtual Wallet */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-[#15042c] via-[#2d1159] to-[#5b1f99] p-6 sm:p-7 text-white shadow-xl shadow-purple-950/20 border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-[#FF9750] bg-white/10 px-2.5 py-1 rounded-full">
                QAFNEST GUEST WALLET
              </span>
              <p className="text-xs text-purple-200 mt-1">
                {t("Instant Booking & 0% Fees", "دفع فوري بدون رسوم بوابة")}
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center font-black text-sm">
              QN
            </div>
          </div>

          <div className="mb-6">
            <p className="text-xs text-purple-200/80 mb-1">{t("Available Balance", "الرصيد المتاح")}</p>
            <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight" dir="ltr">
              {walletBalance.toFixed(2)} <span className="text-base font-sans text-purple-200">SAR</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-purple-200/90 pt-4 border-t border-white/15">
            <span className="truncate max-w-[150px] font-bold">{displayName}</span>
            <button
              type="button"
              onClick={() => setTopUpModalOpen(true)}
              className="inline-flex items-center gap-1 font-bold text-[#FF9750] hover:underline cursor-pointer"
            >
              <span>{t("Quick Top-up", "+ شحن سريع")}</span>
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>

        {/* Card 2: Rewards & Loyalty Points */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-[#0b1329] via-[#10224d] to-[#1e3a8a] p-6 sm:p-7 text-white shadow-xl shadow-blue-950/20 border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-emerald-400 bg-white/10 px-2.5 py-1 rounded-full">
                {loyaltyTier} MEMBER
              </span>
              <p className="text-xs text-blue-200 mt-1">
                {t("Loyalty Rewards Program", "برنامج ولاء ومكافآت قاف")}
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 backdrop-blur-md text-amber-300 flex items-center justify-center">
              <Coins size={20} />
            </div>
          </div>

          <div className="mb-6">
            <p className="text-xs text-blue-200/80 mb-1">{t("Loyalty Points", "نقاط المكافآت المتاحة")}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight" dir="ltr">
                {loyaltyPoints}
              </span>
              <span className="text-xs font-bold text-emerald-400">
                ≈ {(loyaltyPoints / 10).toFixed(2)} SAR {t("Value", "قيمة")}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-blue-200/90 pt-4 border-t border-white/15">
            <span className="flex items-center gap-1">
              <Zap size={14} className="text-amber-400" />
              <span>{t("Earn 2X Points on Bookings", "اكسب نقطتين لكل ريال عند الحجز")}</span>
            </span>
            <button
              type="button"
              onClick={() => setRedeemModalOpen(true)}
              className="inline-flex items-center gap-1 font-bold text-amber-300 hover:underline cursor-pointer"
            >
              <span>{t("Redeem", "استبدال")}</span>
              <ChevronRight size={14} className="rtl:rotate-180" />
            </button>
          </div>
        </div>
      </div>

      {/* Active Promotional Offers Section */}
      {offers.length > 0 && (
        <div className="p-5 sm:p-6 rounded-3xl bg-purple-50/70 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#FF9750]" />
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                {t("Exclusive Loyalty Offers & Multipliers", "عروض مضاعفة النقاط والمكافآت النشطة")}
              </h3>
            </div>
            <span className="text-[11px] font-black uppercase text-[#4F2396] dark:text-purple-300">
              {t("Active Campaigns", "حملات جارية")}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className="p-4 rounded-2xl bg-white dark:bg-[#0E0E1A] border border-slate-200/70 dark:border-white/10 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-[#4F2396] dark:text-purple-300 text-[10px] font-black">
                      {t(offer.badgeEn, offer.badgeAr)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">QafNest</span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-1">
                    {t(offer.titleEn, offer.titleAr)}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {t(offer.descriptionEn, offer.descriptionAr)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ledger & Transactions Section */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {t("Wallet Activity & Transactions", "سجل العمليات وحركات الرصيد")}
          </h3>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setActiveFilter("all")}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activeFilter === "all"
                  ? "bg-white dark:bg-[#0E0E1A] text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {t("All", "الكل")}
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("topup")}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activeFilter === "topup"
                  ? "bg-white dark:bg-[#0E0E1A] text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {t("Top-ups", "الشحن")}
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("booking")}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activeFilter === "booking"
                  ? "bg-white dark:bg-[#0E0E1A] text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {t("Bookings", "الحجوزات")}
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("reward")}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activeFilter === "reward"
                  ? "bg-white dark:bg-[#0E0E1A] text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {t("Rewards", "المكافآت")}
            </button>
          </div>
        </div>

        {/* Transaction Rows */}
        {filteredTransactions.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
            <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
              {t("No wallet transactions found", "لا توجد عمليات مسجلة في هذا القسم")}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map((tx) => {
              const isPositive = tx.amount > 0;
              const isBooking = tx.type === "booking_payment";

              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                        isBooking
                          ? "bg-purple-100 dark:bg-purple-950/40 text-[#4F2396] dark:text-purple-300"
                          : isPositive
                          ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                          : "bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
                      }`}
                    >
                      {isBooking ? (
                        <CreditCard size={18} />
                      ) : isPositive ? (
                        <CheckCircle2 size={18} />
                      ) : (
                        <BadgePercent size={18} />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {t(tx.titleEn, tx.titleAr)}
                      </p>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        Ref: {tx.reference} · {new Date(tx.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      {tx.amount !== 0 && (
                        <div
                          className={`text-sm font-black font-mono ${
                            isPositive
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-slate-900 dark:text-white"
                          }`}
                          dir="ltr"
                        >
                          {isPositive ? `+${tx.amount.toFixed(2)}` : tx.amount.toFixed(2)} SAR
                        </div>
                      )}
                      {tx.points !== undefined && tx.points !== 0 && (
                        <div
                          className={`text-[11px] font-bold ${
                            tx.points > 0 ? "text-purple-600 dark:text-purple-400" : "text-amber-600"
                          }`}
                        >
                          {tx.points > 0 ? `+${tx.points} Pts` : `${tx.points} Pts`}
                        </div>
                      )}
                    </div>

                    {Math.abs(tx.amount) > 0 && (tx.type === "topup" || tx.type === "booking_payment" || tx.type === "refund") && (
                      <button
                        type="button"
                        onClick={() => setSelectedReceiptTx(tx)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-white hover:bg-violet-50 px-2.5 py-1.5 text-xs font-bold text-violet-700 dark:border-violet-500/30 dark:bg-white/5 dark:text-violet-300 dark:hover:bg-violet-950/40 transition cursor-pointer shadow-2xs shrink-0"
                        title={t("View official tax invoice & receipt", "عرض الفاتورة الضريبية والإيصال المالي")}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{t("Invoice", "الفاتورة")}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ===================== MODAL 1: TOP-UP WALLET ===================== */}
      {topUpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#0E0E1A] border border-slate-200 dark:border-white/10 p-6 sm:p-7 shadow-2xl">
            <button
              type="button"
              onClick={() => setTopUpModalOpen(false)}
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

            {/* Quick Amounts */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                {t("Select Amount (SAR)", "اختر مبلغ الشحن (ر.س)")}
              </label>
              <div className="grid grid-cols-4 gap-2">
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

            {/* Custom Amount Input */}
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

            {/* Bonus Points Callout */}
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

            {/* Payment Method Selector */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                {t("Payment Method", "طريقة الدفع")}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTopUpMethod("mada")}
                  className={`py-3 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    topUpMethod === "mada"
                      ? "border-2 border-[#4F2396] bg-purple-50/50 dark:bg-purple-950/30 text-[#4F2396] dark:text-purple-300"
                      : "border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <OfficialPaymentIcon name="mada" heightClass="h-7" />
                  <span>{t("Mada", "مدى")}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTopUpMethod("apple")}
                  className={`py-3 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    topUpMethod === "apple"
                      ? "border-2 border-[#4F2396] bg-purple-50/50 dark:bg-purple-950/30 text-[#4F2396] dark:text-purple-300"
                      : "border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <OfficialPaymentIcon name="apple" heightClass="h-7" />
                  <span>Apple Pay</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTopUpMethod("google")}
                  className={`py-3 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    topUpMethod === "google"
                      ? "border-2 border-[#4F2396] bg-purple-50/50 dark:bg-purple-950/30 text-[#4F2396] dark:text-purple-300"
                      : "border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <OfficialPaymentIcon name="google" heightClass="h-7" />
                  <span>Google Pay</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTopUpMethod("stcpay")}
                  className={`py-3 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    topUpMethod === "stcpay"
                      ? "border-2 border-[#4F2396] bg-purple-50/50 dark:bg-purple-950/30 text-[#4F2396] dark:text-purple-300"
                      : "border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <OfficialPaymentIcon name="stcpay" heightClass="h-7" />
                  <span>STC Pay</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTopUpMethod("card")}
                  className={`col-span-2 sm:col-span-2 py-3 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    topUpMethod === "card"
                      ? "border-2 border-[#4F2396] bg-purple-50/50 dark:bg-purple-950/30 text-[#4F2396] dark:text-purple-300"
                      : "border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <OfficialPaymentIcon name="vm" heightClass="h-7" />
                  <span>{t("Credit Card (Visa / Mastercard)", "بطاقة ائتمان (فيزا / ماستركارد)")}</span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setTopUpModalOpen(false)}
                className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
              >
                {t("Cancel", "إلغاء")}
              </button>

              <button
                type="button"
                disabled={isSubmitting || effectiveAmount < 10}
                onClick={handleExecuteTopUp}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#4F2396] to-[#7c3aed] text-white text-xs font-bold shadow-md shadow-purple-900/20 hover:opacity-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>{t("Processing...", "جارٍ المعالجة...")}</span>
                  </>
                ) : (
                  <span>
                    {t(
                      `Pay ${effectiveAmount.toFixed(2)} SAR`,
                      `دفع ${effectiveAmount.toFixed(2)} ر.س`
                    )}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL 2: REDEEM POINTS ===================== */}
      {redeemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#0E0E1A] border border-slate-200 dark:border-white/10 p-6 sm:p-7 shadow-2xl">
            <button
              type="button"
              onClick={() => setRedeemModalOpen(false)}
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

            {loyaltyPoints < 100 ? (
              <p className="text-xs text-rose-500 font-bold mb-5">
                {t(
                  "You need at least 100 points to make a redemption.",
                  "تحتاج إلى ١٠٠ نقطة على الأقل لإجراء عملية الاستبدال."
                )}
              </p>
            ) : (
              <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                {t(
                  "The SAR credit will be added immediately to your wallet balance and can be used on your next reservation.",
                  "سيتم إضافة المبلغ المالي فوراً إلى رصيد محفظتك ويمكنك استخدامه في حجزك القادم."
                )}
              </p>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setRedeemModalOpen(false)}
                className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
              >
                {t("Cancel", "إلغاء")}
              </button>

              <button
                type="button"
                disabled={isSubmitting || loyaltyPoints < 100}
                onClick={handleExecuteRedeem}
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
      )}
      {/* ===================== MODAL 3: OFFICIAL TAX INVOICE & RECEIPT ===================== */}
      {selectedReceiptTx && (
        <WalletTransactionReceiptModal
          transaction={selectedReceiptTx}
          onClose={() => setSelectedReceiptTx(null)}
          language={language}
          t={t}
        />
      )}
    </div>
  );
}
