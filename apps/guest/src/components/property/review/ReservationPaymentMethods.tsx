"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Wallet, LockKeyhole, ChevronRight, Gift, CreditCard, Check } from "lucide-react";
import { OfficialPaymentIcon } from "@/components/common/OfficialPaymentIcon";
import type { GatewayCapabilitiesResponse, PaymentMethod } from "./types";
import type { SavedCard } from "@/lib/services/walletService";

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

export function PaymentRow({
  selected,
  disabled,
  onSelect,
  title,
  description,
  marks,
}: {
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
  title: string;
  description: string;
  marks: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={`${title}. ${description}`}
      disabled={disabled}
      onClick={onSelect}
      className={`flex w-full items-center gap-3 py-4 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-500 disabled:cursor-not-allowed cursor-pointer ${
        selected ? "text-gray-950 dark:text-white" : "text-gray-800 dark:text-gray-200"
      }`}
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
          selected
            ? "border-violet-700 dark:border-violet-300"
            : "border-gray-400 dark:border-gray-500"
        }`}
        aria-hidden="true"
      >
        <span
          className={`h-2.5 w-2.5 rounded-full bg-violet-700 transition-transform dark:bg-violet-300 ${
            selected ? "scale-100" : "scale-0"
          }`}
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold">{title}</span>
        <span className="mt-0.5 block text-xs leading-5 text-gray-500 dark:text-gray-400">
          {description}
        </span>
      </span>
      <span className="ms-3 flex shrink-0 items-center justify-end">{marks}</span>
    </button>
  );
}

export function PaymentBrandLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
      {children}
    </span>
  );
}

export function GooglePayBrandMark() {
  return <OfficialPaymentIcon name="google" heightClass="h-7" />;
}

export function StcPayBrandMark() {
  return <OfficialPaymentIcon name="stcpay" heightClass="h-7" />;
}

export function SamsungPayBrandMark({ requiresSetup }: { requiresSetup?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {requiresSetup && (
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
          Setup pending
        </span>
      )}
      <span className="inline-flex items-center rounded-lg bg-[#1428A0] px-2.5 py-1 text-[11px] font-black tracking-tight text-white">
        Samsung Pay
      </span>
    </span>
  );
}

export function TabbyBrandMark() {
  return <OfficialPaymentIcon name="tabby" heightClass="h-7" />;
}

export function TamaraBrandMark() {
  return (
    <Image
      src="https://cdn.tamara.co/assets/png/tamara-logo-badge-en.png"
      alt="Tamara"
      width={64}
      height={28}
      unoptimized
      className="h-7 w-16 object-contain"
    />
  );
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
    if (paymentMethod === "samsung" && !samsungAvailable) {
      setPaymentMethod(null);
    }
  }, [paymentMethod, samsungAvailable, setPaymentMethod]);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/wallet/cards")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!isMounted) return;
        if (Array.isArray(d?.cards) && d.cards.length > 0) {
          setSavedCards(d.cards);
          if (!hasInitializedRef.current && setSelectedCardId) {
            hasInitializedRef.current = true;
            const def = d.cards.find((c: SavedCard) => c.isDefault) || d.cards[0];
            setSelectedCardId(def.id);
          }
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [user, setSelectedCardId]);

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
            {label(
              "Choose how you want to pay. Your selection stays on this page.",
              "اختر طريقة الدفع، وسيبقى اختيارك في هذه الصفحة."
            )}
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
              ? label(
                  "Please verify your mobile number above to unlock payment options and complete booking.",
                  "يرجى التحقق من رقم جوالك في القسم أعلاه لفتح خيارات الدفع وإتمام الحجز."
                )
              : label(
                  "Please sign in or enter your mobile number above to unlock payment options.",
                  "يرجى تسجيل الدخول أو إدخال رقم جوالك في القسم أعلاه لفتح خيارات الدفع واختيارها."
                )}
          </p>
        </div>
      ) : (
        <>
          <div
            role="radiogroup"
            aria-label={label("Payment method", "طريقة الدفع")}
            className="mt-4 divide-y divide-gray-200 border-y border-gray-200 dark:divide-white/10 dark:border-white/10"
          >
            {/* 1. QafNest Digital Wallet Option (Full or Split Payment) */}
            {totalAmount > 0 && walletBalance > 0 && walletBalance < totalAmount ? (
              <div className="py-3.5">
                <button
                  type="button"
                  role="switch"
                  aria-checked={useWalletCredit}
                  onClick={() => {
                    if (setUseWalletCredit) {
                      const next = !useWalletCredit;
                      setUseWalletCredit(next);
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
                      {label(
                        "Use QafNest Wallet Balance (Split Pay)",
                        "استخدام رصيد محفظة قاف نست (دفع جزئي)"
                      )}
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
                      {label(
                        `Wallet: -${walletBalance.toFixed(2)} SAR · Remaining due:`,
                        `من المحفظة: -${walletBalance.toFixed(2)} ر.س · المبلغ المتبقي:`
                      )}
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
                  if (setUseWalletCredit) setUseWalletCredit(false);
                  setPaymentMethod("wallet");
                  setPaymentMessage(null);
                }}
                title={label("QafNest Digital Wallet", "محفظة قاف نست الرقمية")}
                description={
                  totalAmount > 0 && walletBalance >= totalAmount
                    ? label(
                        `Available balance: ${walletBalance.toFixed(2)} SAR · Instant booking with 1.5X Points`,
                        `الرصيد المتاح: ${walletBalance.toFixed(2)} ر.س · خصم فوري ومضاعفة نقاط المكافآت ١.٥X`
                      )
                    : label(
                        `Available balance: ${walletBalance.toFixed(2)} SAR`,
                        `الرصيد المتاح: ${walletBalance.toFixed(2)} ر.س`
                      )
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

            {/* 2. Apple Pay Option */}
            {appleAvailable && (
              <PaymentRow
                selected={paymentMethod === "apple"}
                disabled={false}
                onSelect={() => {
                  setPaymentMethod("apple");
                  setPaymentMessage(null);
                }}
                title="Apple Pay"
                description={label("Pay securely with Apple Pay", "ادفع بأمان عبر Apple Pay")}
                marks={<OfficialPaymentIcon name="apple" heightClass="h-7" />}
              />
            )}

            {/* 3. Google Pay Option */}
            {googleAvailable && (
              <PaymentRow
                selected={paymentMethod === "google"}
                disabled={false}
                onSelect={() => {
                  setPaymentMethod("google");
                  setPaymentMessage(null);
                }}
                title="Google Pay"
                description={label(
                  "Express checkout with Google Pay via MyFatoorah",
                  "دفع سريع وآمن عبر Google Pay"
                )}
                marks={<GooglePayBrandMark />}
              />
            )}

            {/* 4. STC Pay Option */}
            {stcpayAvailable && (
              <PaymentRow
                selected={paymentMethod === "stcpay"}
                disabled={false}
                onSelect={() => {
                  setPaymentMethod("stcpay");
                  setPaymentMessage(null);
                }}
                title="STC Pay"
                description={label(
                  "Pay instantly with your STC Pay mobile wallet (SAR)",
                  "ادفع فوراً عبر محفظة STC Pay برقم الجوال"
                )}
                marks={<StcPayBrandMark />}
              />
            )}

            {/* 5. Samsung Pay Option (shown only when activated in MyFatoorah + Samsung Pay Portal) */}
            {samsungAvailable && (
              <PaymentRow
                selected={paymentMethod === "samsung"}
                disabled={false}
                onSelect={() => {
                  setPaymentMethod("samsung");
                  setPaymentMessage(null);
                }}
                title="Samsung Pay"
                description={label(
                  "Pay via Samsung Wallet (QR scan on desktop · biometric on Galaxy)",
                  "الدفع عبر Samsung Wallet (مسح QR على الكمبيوتر أو البصمة على جوال سامسونج)"
                )}
                marks={<SamsungPayBrandMark />}
              />
            )}

            {/* 6. Card Option */}
            {cardAvailable && (
              <PaymentRow
                selected={paymentMethod === "card"}
                disabled={false}
                onSelect={() => {
                  setPaymentMethod("card");
                  setPaymentMessage(null);
                }}
                title={label("Credit or debit card", "بطاقة مدى أو ائتمان")}
                description={label(
                  "Card gateway · Mada, Visa and Mastercard",
                  "بوابة البطاقات · مدى وVisa وMastercard"
                )}
                marks={
                  <span className="inline-flex items-center gap-1.5">
                    <OfficialPaymentIcon name="mada" heightClass="h-6" />
                    <OfficialPaymentIcon name="visa" heightClass="h-6" />
                    <OfficialPaymentIcon name="mastercard" heightClass="h-6" />
                  </span>
                }
              />
            )}

            {paymentMethod === "card" && savedCards.length > 0 && (
              <div className="my-3 rounded-2xl border border-violet-100 bg-violet-50/50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    {label("Saved Cards (1-Click Checkout)", "البطاقات المحفوظة (دفع فوري بنقرة واحدة)")}
                  </span>
                  <a
                    href="/account?tab=payments"
                    className="text-[11px] font-semibold text-violet-700 hover:underline dark:text-violet-400"
                  >
                    {label("+ Manage cards", "+ إدارة البطاقات")}
                  </a>
                </div>
                <div className="space-y-2.5">
                  {savedCards.map((c) => {
                    const isSelected = selectedCardId === c.id;
                    return (
                      <div
                        key={c.id}
                        className={`rounded-xl border transition-all ${
                          isSelected
                            ? "border-violet-600 bg-white p-2.5 shadow-sm dark:border-violet-400 dark:bg-violet-950/30"
                            : "border-gray-200 bg-white/60 p-2.5 hover:bg-white dark:border-white/10 dark:bg-transparent"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            if (setSelectedCardId) setSelectedCardId(c.id);
                          }}
                          className="flex w-full items-center justify-between text-xs cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                                isSelected
                                  ? "border-violet-600 bg-violet-600 text-white dark:border-violet-400 dark:bg-violet-400"
                                  : "border-gray-300 dark:border-gray-600"
                              }`}
                            >
                              {isSelected && <Check className="h-2.5 w-2.5" />}
                            </span>
                            <OfficialPaymentIcon name={c.brand} heightClass="h-6" />
                            <span className="font-mono text-xs text-gray-900 dark:text-white">
                              •••• {c.last4}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              ({c.expiryMonth}/{c.expiryYear})
                            </span>
                          </div>
                          {c.isDefault && (
                            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[9px] font-bold text-violet-700 dark:bg-violet-900/50 dark:text-violet-300">
                              {label("Default", "افتراضية")}
                            </span>
                          )}
                        </button>

                        {/* Inline CVV Requirement for Selected Saved Card */}
                        {isSelected && (
                          <div className="mt-2.5 pt-2.5 border-t border-violet-100 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-xs">
                              <LockKeyhole className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400 shrink-0" />
                              <span className="font-bold text-gray-800 dark:text-gray-200 text-[11px]">
                                {label("Enter 3-digit CVV / CVC:", "أدخل رمز الأمان (CVV):")}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="password"
                                inputMode="numeric"
                                maxLength={4}
                                placeholder="•••"
                                value={cardCvv || ""}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                                  if (setCardCvv) setCardCvv(val);
                                  if (setPaymentMessage) setPaymentMessage(null);
                                }}
                                className="w-16 px-2.5 py-1 text-center font-mono text-xs font-black tracking-widest rounded-lg border border-violet-300 dark:border-violet-500/40 bg-violet-50/50 dark:bg-black/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                              />
                              <span className="text-[10px] text-gray-400 font-semibold">
                                {label("Required for payment", "مطلوب للدفع")}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div
                    onClick={() => {
                      if (setSelectedCardId) setSelectedCardId("new");
                      if (setCardCvv) setCardCvv("");
                      if (setPaymentMessage) setPaymentMessage(null);
                    }}
                    className={`rounded-xl border transition-all cursor-pointer ${
                      selectedCardId === "new" || selectedCardId === null
                        ? "border-violet-600 bg-white p-3 shadow-sm dark:border-violet-400 dark:bg-violet-950/30"
                        : "border-gray-200 bg-white/60 p-3 hover:bg-white dark:border-white/10 dark:bg-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                            selectedCardId === "new" || selectedCardId === null
                              ? "border-violet-600 bg-violet-600 text-white dark:border-violet-400 dark:bg-violet-400"
                              : "border-gray-300 dark:border-gray-600"
                          }`}
                        >
                          {(selectedCardId === "new" || selectedCardId === null) && (
                            <Check className="h-2.5 w-2.5" />
                          )}
                        </span>
                        <CreditCard className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                        <span className="font-bold text-gray-900 dark:text-white">
                          {label("Pay with another card via gateway", "الدفع ببطاقة أخرى عبر البوابة")}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                        {label("Auto-save to wallet", "حفظ تلقائي")}
                      </span>
                    </div>
                    {(selectedCardId === "new" || selectedCardId === null) && (
                      <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400 ltr:pl-6 rtl:pr-6">
                        {label(
                          "Enter details securely on payment gateway. This card will be auto-saved to your Digital Wallet for 1-click checkout on future stays.",
                          "أدخل بيانات البطاقة بأمان عبر بوابة الدفع. سيتم حفظ البطاقة تلقائياً في محفظتك الرقمية للاستخدام بنقرة واحدة في حجوزاتك القادمة."
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === "card" && savedCards.length === 0 && (
              <div className="my-2.5 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 dark:border-emerald-500/20 dark:bg-emerald-950/20">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  <CreditCard className="h-4 w-4 shrink-0" />
                  <span>
                    {label(
                      "Your card will be securely auto-saved to your Digital Wallet for 1-click future checkout.",
                      "سيتم حفظ بطاقتك بأمان تلقائياً في محفظتك الرقمية للاستخدام السريع بنقرة واحدة مستقبلاً."
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Loyalty Reward Callout */}
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
                    paymentMethod === "wallet"
                      ? "Exclusive 1.5X Points offer applied automatically!"
                      : "Points are added automatically to your account upon confirmation.",
                    paymentMethod === "wallet"
                      ? "عرض مضاعفة ١.٥X نقطة مطبق تلقائياً عند الدفع من رصيد المحفظة!"
                      : "تضاف النقاط إلى محفظتك تلقائياً فور تأكيد الحجز."
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
                  className={`h-5 w-5 text-gray-600 transition-transform dark:text-gray-300 ${
                    splitMethodsOpen ? "rotate-90" : ""
                  }`}
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
                      onSelect={() => {
                        setPaymentMethod("tabby");
                        setPaymentMessage(null);
                      }}
                      title="Tabby"
                      description={`${label(
                        "Pay in 4 installments",
                        "ادفع على ٤ دفعات"
                      )} · 4 × ${installmentPrice}`}
                      marks={<TabbyBrandMark />}
                    />
                    <PaymentRow
                      selected={paymentMethod === "tamara"}
                      disabled={false}
                      onSelect={() => {
                        setPaymentMethod("tamara");
                        setPaymentMessage(null);
                      }}
                      title="Tamara"
                      description={`${label(
                        "Split into 4 payments",
                        "قسّم المبلغ على ٤ دفعات"
                      )} · 4 × ${installmentPrice}`}
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

