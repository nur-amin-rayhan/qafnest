"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronRight, Gift, LockKeyhole, Wallet } from "lucide-react";
import { OfficialPaymentIcon } from "@/components/common/OfficialPaymentIcon";
import type { SavedCard } from "@/lib/services/walletService";
import type { GatewayCapabilitiesResponse, PaymentMethod } from "./types";
import {
  GooglePayBrandMark,
  PaymentBrandLabel,
  PaymentRow,
  SamsungPayBrandMark,
  StcPayBrandMark,
  TabbyBrandMark,
  TamaraBrandMark,
} from "./PaymentBrandMarks";
import { SavedCardsSelector } from "./SavedCardsSelector";

export {
  GooglePayBrandMark,
  PaymentBrandLabel,
  PaymentRow,
  SamsungPayBrandMark,
  StcPayBrandMark,
  TabbyBrandMark,
  TamaraBrandMark,
};

interface ReservationPaymentMethodsProps {
  phoneVerified: boolean;
  paymentMethod: PaymentMethod | null;
  setPaymentMethod: (method: PaymentMethod | null) => void;
  setPaymentMessage: (msg: string | null) => void;
  user: unknown;
  installmentPrice: string;
  walletBalance?: number;
  totalAmount?: number;
  useWalletCredit?: boolean;
  setUseWalletCredit?: (use: boolean) => void;
  gatewayCapabilities?: GatewayCapabilitiesResponse | null;
  label: (en: string, ar: string) => string;
  selectedCardId?: string | null;
  setSelectedCardId?: (id: string | null) => void;
  cardCvv?: string;
  setCardCvv?: (cvv: string) => void;
}

export default function ReservationPaymentMethods({
  phoneVerified,
  paymentMethod,
  setPaymentMethod,
  setPaymentMessage,
  user,
  installmentPrice,
  walletBalance = 0,
  totalAmount = 0,
  useWalletCredit = false,
  setUseWalletCredit,
  gatewayCapabilities,
  label,
  selectedCardId,
  setSelectedCardId,
  cardCvv,
  setCardCvv,
}: ReservationPaymentMethodsProps) {
  const [splitMethodsOpen, setSplitMethodsOpen] = useState(false);
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const hasInitializedRef = React.useRef(false);
  const methods = gatewayCapabilities?.methods;
  const appleAvailable = methods?.apple?.available !== false;
  const googleAvailable = methods?.google?.available !== false;
  const stcpayAvailable = methods?.stcpay?.available !== false;
  const cardAvailable = methods?.card?.available !== false || methods?.mada?.available !== false;
  const samsungAvailable = Boolean(methods?.samsung?.available);

  useEffect(() => {
    if (paymentMethod === "samsung" && !samsungAvailable) setPaymentMethod(null);
  }, [paymentMethod, samsungAvailable, setPaymentMethod]);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/wallet/cards")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!isMounted || !Array.isArray(d?.cards) || d.cards.length === 0) return;
        setSavedCards(d.cards);
        if (!hasInitializedRef.current && setSelectedCardId) {
          hasInitializedRef.current = true;
          const def = d.cards.find((c: SavedCard) => c.isDefault) || d.cards[0];
          setSelectedCardId(def.id);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [user, setSelectedCardId]);

  const selectMethod = (next: PaymentMethod) => {
    setPaymentMethod(next);
    setPaymentMessage(null);
  };

  return (
    <section
      id="payment-methods"
      className="mt-6 scroll-mt-28 rounded-3xl border border-violet-200/85 bg-white p-5 shadow-[0_12px_35px_rgba(109,40,217,0.06)] dark:border-violet-500/20 dark:bg-[#12101a] sm:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-950 dark:text-white">
            {label("Payment Methods", "طرق الدفع")}
          </h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {label("Choose how you want to pay. Your selection stays on this page.", "اختر طريقة الدفع، وسيبقى اختيارك في هذه الصفحة.")}
          </p>
        </div>
        <Wallet className="h-5 w-5 shrink-0 text-violet-600 dark:text-violet-300" />
      </div>

      {!phoneVerified ? (
        <div className="mt-5 rounded-2xl border border-dashed border-violet-200 bg-violet-50/50 p-6 text-center dark:border-violet-500/20 dark:bg-violet-950/20">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <h3 className="mt-2.5 text-sm font-bold text-gray-900 dark:text-white">
            {label("Payment Methods are Locked", "طرق الدفع مقفلة")}
          </h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            {user
              ? label("Please verify your mobile number above to unlock payment options and complete booking.", "يرجى التحقق من رقم جوالك في القسم أعلاه لفتح خيارات الدفع وإتمام الحجز.")
              : label("Please sign in or enter your mobile number above to unlock payment options.", "يرجى تسجيل الدخول أو إدخال رقم جوالك في القسم أعلاه لفتح خيارات الدفع واختيارها.")}
          </p>
        </div>
      ) : (
        <>
          <div
            role="radiogroup"
            aria-label={label("Payment method", "طريقة الدفع")}
            className="mt-4 divide-y divide-gray-200 border-y border-gray-200 dark:divide-white/10 dark:border-white/10"
          >
            {totalAmount > 0 && walletBalance > 0 && walletBalance < totalAmount ? (
              <div className="py-3.5">
                <button
                  type="button"
                  role="switch"
                  aria-checked={useWalletCredit}
                  onClick={() => {
                    if (setUseWalletCredit) {
                      setUseWalletCredit(!useWalletCredit);
                      if (paymentMethod === "wallet") setPaymentMethod(null);
                      setPaymentMessage(null);
                    }
                  }}
                  className="flex w-full items-center gap-3 py-1 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-500 cursor-pointer"
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                      useWalletCredit
                        ? "border-violet-700 bg-violet-700 text-white dark:border-violet-400 dark:bg-violet-400 dark:text-slate-950"
                        : "border-gray-400 dark:border-gray-500"
                    }`}
                    aria-hidden="true"
                  >
                    {useWalletCredit && <Check className="h-3.5 w-3.5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-gray-950 dark:text-white">
                      {label("Use QafNest Wallet Balance (Split Pay)", "استخدام رصيد محفظة قاف نست (دفع جزئي)")}
                    </span>
                    <span className="mt-0.5 block text-xs leading-5 text-gray-500 dark:text-gray-400">
                      {label(
                        `Deduct ${walletBalance.toFixed(2)} SAR from wallet · Pay remaining ${(totalAmount - walletBalance).toFixed(2)} SAR via any method below`,
                        `خصم ${walletBalance.toFixed(2)} ر.س من المحفظة · وسداد المتبقي (${(totalAmount - walletBalance).toFixed(2)} ر.س) بأي وسيلة دفع أدناه`
                      )}
                    </span>
                  </span>
                  <span className="ms-3 flex shrink-0 items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-black text-emerald-600 dark:text-emerald-400">
                      <Wallet className="h-3.5 w-3.5" />
                      {walletBalance.toFixed(2)} SAR
                    </span>
                  </span>
                </button>

                {useWalletCredit && (
                  <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-violet-200 bg-violet-50/70 px-3.5 py-2.5 text-xs dark:border-violet-500/25 dark:bg-violet-950/30">
                    <span className="font-semibold text-violet-900 dark:text-violet-200">
                      {label(`Wallet: -${walletBalance.toFixed(2)} SAR · Remaining due:`, `من المحفظة: -${walletBalance.toFixed(2)} ر.س · المبلغ المتبقي:`)}
                    </span>
                    <span className="font-mono font-black text-violet-700 dark:text-violet-300">
                      {(totalAmount - walletBalance).toFixed(2)} SAR
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <PaymentRow
                selected={paymentMethod === "wallet"}
                disabled={walletBalance <= 0 && totalAmount > 0}
                onSelect={() => {
                  setUseWalletCredit?.(false);
                  selectMethod("wallet");
                }}
                title={label("QafNest Digital Wallet", "محفظة قاف نست الرقمية")}
                description={
                  totalAmount > 0 && walletBalance >= totalAmount
                    ? label(`Available balance: ${walletBalance.toFixed(2)} SAR · Instant booking with 1.5X Points`, `الرصيد المتاح: ${walletBalance.toFixed(2)} ر.س · خصم فوري ومضاعفة نقاط المكافآت ١.٥X`)
                    : label(`Available balance: ${walletBalance.toFixed(2)} SAR`, `الرصيد المتاح: ${walletBalance.toFixed(2)} ر.س`)
                }
                marks={
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-black ${
                      totalAmount > 0 && walletBalance >= totalAmount
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300"
                    }`}
                  >
                    <Wallet className="h-3.5 w-3.5" />
                    {walletBalance.toFixed(2)} SAR
                  </span>
                }
              />
            )}

            {appleAvailable && (
              <PaymentRow
                selected={paymentMethod === "apple"}
                disabled={false}
                onSelect={() => selectMethod("apple")}
                title="Apple Pay"
                description={label("Pay securely with Apple Pay", "ادفع بأمان عبر Apple Pay")}
                marks={<OfficialPaymentIcon name="apple" heightClass="h-7" />}
              />
            )}

            {googleAvailable && (
              <PaymentRow
                selected={paymentMethod === "google"}
                disabled={false}
                onSelect={() => selectMethod("google")}
                title="Google Pay"
                description={label("Express checkout with Google Pay via MyFatoorah", "دفع سريع وآمن عبر Google Pay")}
                marks={<GooglePayBrandMark />}
              />
            )}

            {stcpayAvailable && (
              <PaymentRow
                selected={paymentMethod === "stcpay"}
                disabled={false}
                onSelect={() => selectMethod("stcpay")}
                title="STC Pay"
                description={label("Pay instantly with your STC Pay mobile wallet (SAR)", "ادفع فوراً عبر محفظة STC Pay برقم الجوال")}
                marks={<StcPayBrandMark />}
              />
            )}

            {samsungAvailable && (
              <PaymentRow
                selected={paymentMethod === "samsung"}
                disabled={false}
                onSelect={() => selectMethod("samsung")}
                title="Samsung Pay"
                description={label("Pay via Samsung Wallet (QR scan on desktop · biometric on Galaxy)", "الدفع عبر Samsung Wallet (مسح QR على الكمبيوتر أو البصمة على جوال سامسونج)")}
                marks={<SamsungPayBrandMark />}
              />
            )}

            {cardAvailable && (
              <PaymentRow
                selected={paymentMethod === "card"}
                disabled={false}
                onSelect={() => selectMethod("card")}
                title={label("Credit or debit card", "بطاقة مدى أو ائتمان")}
                description={label("Card gateway · Mada, Visa and Mastercard", "بوابة البطاقات · مدى وVisa وMastercard")}
                marks={
                  <span className="inline-flex items-center gap-1.5">
                    <OfficialPaymentIcon name="mada" heightClass="h-6" />
                    <OfficialPaymentIcon name="visa" heightClass="h-6" />
                    <OfficialPaymentIcon name="mastercard" heightClass="h-6" />
                  </span>
                }
              />
            )}

            {paymentMethod === "card" && (
              <SavedCardsSelector
                savedCards={savedCards}
                selectedCardId={selectedCardId}
                setSelectedCardId={setSelectedCardId}
                cardCvv={cardCvv}
                setCardCvv={setCardCvv}
                setPaymentMessage={setPaymentMessage}
                label={label}
              />
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-purple-200/60 bg-gradient-to-r from-purple-50/90 to-amber-50/70 p-3.5 dark:border-purple-500/20 dark:from-purple-950/30 dark:to-amber-950/20">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#4F2396] text-white">
                <Gift className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-white">
                  {label("Earn Reward Points on this Stay", "اكسب نقاط مكافآت مع هذا الحجز")}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  {label(
                    paymentMethod === "wallet" ? "Exclusive 1.5X Points offer applied automatically!" : "Points are added automatically to your account upon confirmation.",
                    paymentMethod === "wallet" ? "عرض مضاعفة ١.٥X نقطة مطبق تلقائياً عند الدفع من رصيد المحفظة!" : "تضاف النقاط إلى محفظتك تلقائياً فور تأكيد الحجز."
                  )}
                </p>
              </div>
            </div>
            <span className="rounded-full bg-[#FF9750] px-2.5 py-1 text-[10px] font-black text-slate-950">
              {paymentMethod === "wallet" ? "1.5X REWARDS" : "REWARD POINTS"}
            </span>
          </div>

          <div className="mt-1 border-b border-gray-200 dark:border-white/10">
            <button
              type="button"
              aria-expanded={splitMethodsOpen}
              onClick={() => setSplitMethodsOpen((open) => !open)}
              className="flex w-full items-center justify-between gap-3 py-4 text-start cursor-pointer"
            >
              <span className="text-sm font-bold text-gray-950 dark:text-white">
                {label("Pay in Splits", "ادفع بالتقسيط")}
              </span>
              <span className="flex items-center gap-3">
                <TabbyBrandMark />
                <TamaraBrandMark />
                <ChevronRight
                  className={`h-5 w-5 text-gray-600 transition-transform dark:text-gray-300 ${splitMethodsOpen ? "rotate-90" : ""}`}
                />
              </span>
            </button>
            <AnimatePresence initial={false}>
              {splitMethodsOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div
                    role="radiogroup"
                    aria-label={label("Installment provider", "مزود التقسيط")}
                    className="-mt-px divide-y divide-gray-200 border-t border-gray-200 dark:divide-white/10 dark:border-white/10"
                  >
                    <PaymentRow
                      selected={paymentMethod === "tabby"}
                      disabled={false}
                      onSelect={() => selectMethod("tabby")}
                      title="Tabby"
                      description={`${label("Pay in 4 installments", "ادفع على ٤ دفعات")} · 4 × ${installmentPrice}`}
                      marks={<TabbyBrandMark />}
                    />
                    <PaymentRow
                      selected={paymentMethod === "tamara"}
                      disabled={false}
                      onSelect={() => selectMethod("tamara")}
                      title="Tamara"
                      description={`${label("Split into 4 payments", "قسّم المبلغ على ٤ دفعات")} · 4 × ${installmentPrice}`}
                      marks={<TamaraBrandMark />}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-gray-50 p-3 text-xs leading-5 text-gray-600 dark:bg-white/[0.04] dark:text-gray-300">
            <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-violet-600 dark:text-violet-300" />
            <p>
              {label(
                "Card, Apple Pay, Google Pay, and STC Pay use MyFatoorah's secure checkout. Tabby and Tamara use separate providers. Card details are entered only in the provider's secure checkout.",
                "تعمل البطاقات وApple Pay وGoogle Pay وSTC Pay عبر بوابة ماي فاتورة الآمنة. ولكل من تابي وتمارا مزود مستقل. لا تُدخل بيانات البطاقة إلا في صفحة الدفع الآمنة للمزود."
              )}
            </p>
          </div>
        </>
      )}
    </section>
  );
}
