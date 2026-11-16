"use client";

import React from "react";
import { Check, CreditCard, LockKeyhole } from "lucide-react";
import { OfficialPaymentIcon } from "@/components/common/OfficialPaymentIcon";
import type { SavedCard } from "@/lib/services/walletService";

export function SavedCardsSelector({
  savedCards,
  selectedCardId,
  setSelectedCardId,
  cardCvv,
  setCardCvv,
  setPaymentMessage,
  label,
}: {
  savedCards: SavedCard[];
  selectedCardId?: string | null;
  setSelectedCardId?: (id: string | null) => void;
  cardCvv?: string;
  setCardCvv?: (cvv: string) => void;
  setPaymentMessage: (msg: string | null) => void;
  label: (en: string, ar: string) => string;
}) {
  if (savedCards.length === 0) {
    return (
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
    );
  }

  return (
    <div className="my-3 rounded-2xl border border-violet-100 bg-violet-50/50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
        <span className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          {label("Saved Cards (1-Click Checkout)", "البطاقات المحفوظة (دفع فوري بنقرة واحدة)")}
        </span>
        <a
          href={`/${label("en", "ar")}/account?tab=payments`}
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
                onClick={() => setSelectedCardId?.(c.id)}
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
                  <span className="font-mono text-xs text-gray-900 dark:text-white">•••• {c.last4}</span>
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

              {isSelected && (
                c.supportsDirectCharge ? (
                  <div className="mt-2.5 pt-2.5 border-t border-violet-100 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs">
                      <LockKeyhole className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="font-bold text-gray-800 dark:text-gray-200 text-[11px]">
                        {c.hasSavedCvv
                          ? label("CVV Saved (1-Click Ready)", "رمز الأمان CVV محفوظ (دفع فوري)")
                          : label("Enter 3-digit CVV / CVC:", "أدخل رمز الأمان (CVV):")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        placeholder={c.hasSavedCvv ? "SAVED" : "•••"}
                        value={cardCvv || ""}
                        onChange={(e) => {
                          setCardCvv?.(e.target.value.replace(/\D/g, "").slice(0, 4));
                          setPaymentMessage(null);
                        }}
                        className="w-20 px-2.5 py-1 text-center font-mono text-xs font-black tracking-widest rounded-lg border border-violet-300 dark:border-violet-500/40 bg-violet-50/50 dark:bg-black/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                      <span className="text-[10px] text-gray-400 font-semibold">
                        {c.hasSavedCvv ? label("Optional update", "محفوظ تلقائياً") : label("Required for payment", "مطلوب للدفع")}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 pt-2 border-t border-violet-100 dark:border-white/10 text-[11px] font-medium text-violet-700 dark:text-violet-300">
                    {label(
                      "Saved from your previous MyFatoorah checkout. Click Pay to continue securely with this card brand.",
                      "بطاقة محفوظة من معاملتك السابقة. اضغط على الدفع للمتابعة عبر بوابة ماي فاتورة الآمنة."
                    )}
                  </p>
                )
              )}
            </div>
          );
        })}

        <div
          onClick={() => {
            setSelectedCardId?.("new");
            setCardCvv?.("");
            setPaymentMessage(null);
          }}
          className={`rounded-xl border transition-all cursor-pointer ${
            selectedCardId === "new" || selectedCardId === null
              ? "border-violet-600 bg-white p-3 shadow-sm dark:border-violet-400 dark:bg-violet-950/30"
              : "border-gray-200 bg-white/60 p-3 hover:bg-white dark:border-white/10 dark:bg-transparent"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2.5">
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                  selectedCardId === "new" || selectedCardId === null
                    ? "border-violet-600 bg-violet-600 text-white dark:border-violet-400 dark:bg-violet-400"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              >
                {(selectedCardId === "new" || selectedCardId === null) && <Check className="h-2.5 w-2.5" />}
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
            <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400 ps-6">
              {label(
                "Enter details securely on payment gateway. This card will be auto-saved to your Digital Wallet for 1-click checkout on future stays.",
                "أدخل بيانات البطاقة بأمان عبر بوابة الدفع. سيتم حفظ البطاقة تلقائياً في محفظتك الرقمية للاستخدام بنقرة واحدة في حجوزاتك القادمة."
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
