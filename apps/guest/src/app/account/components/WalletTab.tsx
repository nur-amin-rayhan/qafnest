"use client";

import React, { useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  Coins,
  Gift,
  PlusCircle,
  Sparkles,
  Zap,
} from "lucide-react";
import type { LoyaltyOffer, WalletTransaction } from "@/lib/services/walletService";
import { WalletTransactionReceiptModal } from "./WalletTransactionReceiptModal";
import { WalletRedeemModal, WalletTopUpModal, type TopUpMethod } from "./wallet/WalletModals";
import { WalletTransactionsSection, type WalletFilterTab } from "./wallet/WalletTransactionsSection";

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
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);
  const [redeemModalOpen, setRedeemModalOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<number>(250);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [topUpMethod, setTopUpMethod] = useState<TopUpMethod>("mada");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<WalletFilterTab>("all");
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<WalletTransaction | null>(null);

  const language: "en" | "ar" = t("en", "ar") === "ar" ? "ar" : "en";
  const effectiveAmount = customAmount ? parseFloat(customAmount) || 0 : topUpAmount;

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
        body: JSON.stringify({ amount: effectiveAmount, method: topUpMethod, locale: language, instant: false }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Top-up failed");
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
      setActionSuccessMsg(
        t(`Successfully topped up ${effectiveAmount.toFixed(2)} SAR to your wallet!`, `تم شحن ${effectiveAmount.toFixed(2)} ر.س بنجاح إلى محفظتك!`)
      );
      setTopUpModalOpen(false);
      setCustomAmount("");
      onRefreshWallet?.();
    } catch (err: unknown) {
      setActionErrorMsg(err instanceof Error ? err.message : "Top-up error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

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
      if (!res.ok || !data.success) throw new Error(data.error || "Redemption failed");
      setActionSuccessMsg(
        t(`Redeemed ${pointsToRedeem} points for ${(pointsToRedeem / 10).toFixed(2)} SAR credit!`, `تم استبدال ${pointsToRedeem} نقطة بـ ${(pointsToRedeem / 10).toFixed(2)} ر.س رصيد محفظة!`)
      );
      setRedeemModalOpen(false);
      onRefreshWallet?.();
    } catch (err: unknown) {
      setActionErrorMsg(err instanceof Error ? err.message : "Redemption error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (activeFilter === "topup") return tx.type === "topup";
    if (activeFilter === "booking") return tx.type === "booking_payment";
    if (activeFilter === "reward") return tx.type === "reward" || tx.type === "redemption";
    return true;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-white/10">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {t("Digital Wallet & Loyalty Points", "المحفظة الرقمية ونقاط المكافآت")}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t("Top up your balance, manage instant bookings, and track rewards.", "اشحن رصيد محفظتك، وادفع لحجوزاتك فوراً، وتابع نقاط مكافآتك وعروضك.")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
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

      {actionSuccessMsg && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-sm font-semibold">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-[#15042c] via-[#2d1159] to-[#5b1f99] p-6 sm:p-7 text-white shadow-xl shadow-purple-950/20 border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-[#FF9750] bg-white/10 px-2.5 py-1 rounded-full">
                QAFNEST GUEST WALLET
              </span>
              <p className="text-xs text-purple-200 mt-1">{t("Instant Booking & 0% Fees", "دفع فوري بدون رسوم بوابة")}</p>
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

        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-[#0b1329] via-[#10224d] to-[#1e3a8a] p-6 sm:p-7 text-white shadow-xl shadow-blue-950/20 border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-emerald-400 bg-white/10 px-2.5 py-1 rounded-full">
                {loyaltyTier} MEMBER
              </span>
              <p className="text-xs text-blue-200 mt-1">{t("Loyalty Rewards Program", "برنامج ولاء ومكافآت قاف")}</p>
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

      <WalletTransactionsSection
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        transactions={filteredTransactions}
        onSelectReceipt={setSelectedReceiptTx}
        t={t}
      />

      {topUpModalOpen && (
        <WalletTopUpModal
          topUpAmount={topUpAmount}
          setTopUpAmount={setTopUpAmount}
          customAmount={customAmount}
          setCustomAmount={setCustomAmount}
          topUpMethod={topUpMethod}
          setTopUpMethod={setTopUpMethod}
          effectiveAmount={effectiveAmount}
          isEligibleForTopupBonus={effectiveAmount >= 500}
          isSubmitting={isSubmitting}
          actionErrorMsg={actionErrorMsg}
          onClose={() => setTopUpModalOpen(false)}
          onSubmit={handleExecuteTopUp}
          t={t}
        />
      )}

      {redeemModalOpen && (
        <WalletRedeemModal
          loyaltyPoints={loyaltyPoints}
          isSubmitting={isSubmitting}
          onClose={() => setRedeemModalOpen(false)}
          onConfirm={handleExecuteRedeem}
          t={t}
        />
      )}

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
