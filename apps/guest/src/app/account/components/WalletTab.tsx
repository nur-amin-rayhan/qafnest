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
import { getGuestAuthorizationHeaders } from "@/lib/auth/clientAuthHeaders";
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
      const authHeaders = await getGuestAuthorizationHeaders();
      const res = await fetch("/api/wallet/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
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
      const authHeaders = await getGuestAuthorizationHeaders();
      const res = await fetch("/api/wallet/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-white/[0.08]">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">
            {t("Wallet & Loyalty Points", "المحفظة ونقاط الولاء")}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            {t("Top up your balance, pay for bookings, and review wallet activity.", "اشحن رصيدك وادفع لحجوزاتك وتابع حركات المحفظة.")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setActionErrorMsg(null);
              setRedeemModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-[#06060B] border border-slate-300 dark:border-white/15 text-slate-800 dark:text-slate-200 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <Gift size={15} className="text-amber-600 dark:text-amber-400" />
            <span>{t("Redeem Points", "استبدال النقاط")}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActionErrorMsg(null);
              setTopUpModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#4F2396] text-white font-semibold text-xs hover:bg-[#3d1979] transition-colors cursor-pointer"
          >
            <PlusCircle size={15} />
            <span>{t("Top Up Wallet", "شحن المحفظة")}</span>
          </button>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-sm font-medium">
          <CheckCircle2 size={18} className="text-emerald-700 dark:text-emerald-400 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-[#F9F8FD] dark:bg-white/[0.03] p-6 border border-slate-200 dark:border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-5">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#4F2396] dark:text-purple-300">
                {t("Wallet Balance", "رصيد المحفظة")}
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                {t("Available for instant checkout", "متاح للسداد الفوري")}
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#F4EEFF] dark:bg-[#4F2396]/25 text-[#4F2396] dark:text-purple-300 flex items-center justify-center font-semibold text-xs">
              SAR
            </div>
          </div>

          <div className="mb-5">
            <div className="text-2xl sm:text-3xl font-semibold font-mono tabular-nums tracking-tight text-slate-900 dark:text-white">
              <bdi dir="ltr">{walletBalance.toFixed(2)} SAR</bdi>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 pt-3.5 border-t border-slate-200 dark:border-white/10">
            <span className="truncate max-w-[160px] font-medium text-slate-800 dark:text-slate-200">{displayName}</span>
            <button
              type="button"
              onClick={() => setTopUpModalOpen(true)}
              className="inline-flex items-center gap-1 font-semibold text-[#4F2396] dark:text-purple-300 hover:underline cursor-pointer"
            >
              <span>{t("Top up", "شحن الرصيد")}</span>
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-[#F9F8FD] dark:bg-white/[0.03] p-6 border border-slate-200 dark:border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-5">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                {loyaltyTier} {t("Tier", "فئة")}
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                {t("Loyalty Points", "نقاط المكافآت")}
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <Coins size={18} />
            </div>
          </div>

          <div className="mb-5">
            <div className="flex items-baseline gap-2.5">
              <span className="text-2xl sm:text-3xl font-semibold font-mono tabular-nums tracking-tight text-slate-900 dark:text-white" dir="ltr">
                {loyaltyPoints}
              </span>
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                (<bdi dir="ltr">{(loyaltyPoints / 10).toFixed(2)} SAR</bdi>)
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 pt-3.5 border-t border-slate-200 dark:border-white/10">
            <span className="flex items-center gap-1.5">
              <Zap size={14} className="text-amber-600 dark:text-amber-400" />
              <span>{t("Earn points on completed stays", "اكسب نقاطاً عند إتمام الحجوزات")}</span>
            </span>
            <button
              type="button"
              onClick={() => setRedeemModalOpen(true)}
              className="inline-flex items-center gap-1 font-semibold text-[#4F2396] dark:text-purple-300 hover:underline cursor-pointer"
            >
              <span>{t("Redeem", "استبدال")}</span>
              <ChevronRight size={14} className="rtl:rotate-180" />
            </button>
          </div>
        </div>
      </div>

      {offers.length > 0 && (
        <div className="p-5 rounded-2xl bg-[#F9F8FD] dark:bg-white/[0.03] border border-slate-200 dark:border-white/10">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#4F2396] dark:text-purple-300" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                {t("Loyalty Offers", "عروض الولاء")}
              </h3>
            </div>
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
              {t("Active Campaigns", "حملات جارية")}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className="p-4 rounded-xl bg-white dark:bg-[#06060B] border border-slate-200 dark:border-white/10 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded-md bg-[#F4EEFF] dark:bg-purple-900/40 text-[#4F2396] dark:text-purple-300 text-[10px] font-semibold">
                      {t(offer.badgeEn, offer.badgeAr)}
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white mb-1">
                    {t(offer.titleEn, offer.titleAr)}
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
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
