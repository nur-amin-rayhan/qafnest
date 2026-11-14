"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2,
  PlusCircle,
  CreditCard,
  Trash2,
  ShieldCheck,
  X,
  Loader2,
  AlertCircle,
  Check,
} from "lucide-react";
import type { SavedCard } from "@/lib/services/walletService";
import {
  detectCardBrand,
  detectCardBrandOrNull,
  formatCardNumberInput,
  getCardBrandMeta,
} from "@/lib/services/cardBrand";
import { OfficialPaymentIcon } from "@/components/common/OfficialPaymentIcon";

interface PaymentMethodsTabProps {
  t: (en: string, ar: string) => string;
}

export default function PaymentMethodsTab({ t }: PaymentMethodsTabProps) {
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [addCardModalOpen, setAddCardModalOpen] = useState(false);
  const [samsungAvailable, setSamsungAvailable] = useState(false);

  // Form states
  const [cardholderName, setCardholderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [isDefault, setIsDefault] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const fetchCards = useCallback(async () => {
    try {
      setLoadingCards(true);
      const res = await fetch("/api/wallet/cards");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.cards)) {
          setSavedCards(data.cards);
        }
      }
    } catch (err) {
      console.warn("Could not load saved cards:", err);
    } finally {
      setLoadingCards(false);
    }
  }, []);

  useEffect(() => {
    fetchCards();
    fetch("/api/payments/methods")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.methods?.samsung?.available) {
          setSamsungAvailable(true);
        }
      })
      .catch(() => {});
  }, [fetchCards]);

  const handleFormatCardNumber = (val: string) => {
    setCardNumber(formatCardNumberInput(val));
  };

  const handleFormatExpiry = (val: string) => {
    const raw = val.replace(/\D/g, "").slice(0, 4);
    if (raw.length >= 3) {
      setExpiry(`${raw.slice(0, 2)}/${raw.slice(2, 4)}`);
    } else {
      setExpiry(raw);
    }
  };

  const liveDetectedBrand = detectCardBrandOrNull(cardNumber);
  const liveDetectedMeta = liveDetectedBrand ? getCardBrandMeta(liveDetectedBrand) : null;

  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const cleanNum = cardNumber.replace(/\D/g, "");
    if (!cardholderName.trim()) {
      setFormError(t("Cardholder name is required", "اسم حامل البطاقة مطلوب"));
      return;
    }
    if (cleanNum.length < 15) {
      setFormError(t("Card number must be 16 digits", "رقم البطاقة يجب أن يتكون من 16 رقماً"));
      return;
    }
    const [month, year] = expiry.split("/");
    if (!month || !year || parseInt(month, 10) < 1 || parseInt(month, 10) > 12) {
      setFormError(t("Invalid expiry date (MM/YY)", "تاريخ الانتهاء غير صحيح (شهر/سنة)"));
      return;
    }
    if (cvv.length < 3) {
      setFormError(t("CVV security code is required", "رمز الأمان CVV مطلوب"));
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/wallet/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardholderName,
          cardNumber: cleanNum,
          expiryMonth: month,
          expiryYear: year,
          brand: detectCardBrand(cleanNum),
          isDefault,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save card");
      }

      setFormSuccess(t("Card saved successfully!", "تم حفظ البطاقة بنجاح!"));
      setCardholderName("");
      setCardNumber("");
      setExpiry("");
      setCvv("");
      setAddCardModalOpen(false);
      fetchCards();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving card";
      setFormError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      const res = await fetch(`/api/wallet/cards?cardId=${encodeURIComponent(cardId)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSavedCards((prev) => prev.filter((c) => c.id !== cardId));
      }
    } catch (err) {
      console.warn("Notice: Error deleting card:", err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-white/10">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {t("Payment Methods & Saved Cards", "طرق الدفع والبطاقات المحفوظة")}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t(
              "Save your cards for 1-click booking checkout like Amazon and Tabby.",
              "احفظ بطاقاتك البنكية لإتمام حجوزاتك بنقرة واحدة سريعة دون الحاجة لإعادة إدخال البيانات."
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setFormError(null);
            setFormSuccess(null);
            setAddCardModalOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#4F2396] text-white font-bold text-xs shadow-md shadow-purple-900/20 hover:opacity-95 transition-all cursor-pointer"
        >
          <PlusCircle size={16} />
          <span>{t("Add New Card", "+ إضافة بطاقة جديدة")}</span>
        </button>
      </div>

      {/* Success Notification Alert */}
      {formSuccess && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-sm font-semibold">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{formSuccess}</span>
        </div>
      )}

      {/* Saved Cards List */}
      <div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-[#4F2396] dark:text-purple-400" />
          <span>{t("Your Saved Cards (1-Click Checkout)", "بطاقاتك المحفوظة (سداد فوري بنقرة واحدة)")}</span>
        </h3>

        {loadingCards ? (
          <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
            <Loader2 className="w-6 h-6 animate-spin text-[#4F2396] mx-auto mb-2" />
            <p className="text-xs text-slate-400">{t("Loading your cards...", "جارٍ تحميل البطاقات...")}</p>
          </div>
        ) : savedCards.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-white/5 border border-dashed border-slate-200 dark:border-white/10">
            <CreditCard className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {t("No cards saved yet", "لا توجد بطاقات محفوظة حتى الآن")}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {t(
                "Add your Mada, Visa, or Mastercard to pay instantly during reservation checkout without re-typing card details.",
                "أضف بطاقة مدى أو فيزا أو ماستركارد ليتم سداد حجوزاتك القادمة فوراً وبأمان بنقرة واحدة."
              )}
            </p>
            <button
              type="button"
              onClick={() => setAddCardModalOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-[#4F2396] dark:text-purple-300 font-bold text-xs hover:bg-purple-200 transition-colors cursor-pointer"
            >
              <PlusCircle size={14} />
              <span>{t("Add your first card", "إضافة بطاقتك الأولى")}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {savedCards.map((card) => {
              const brandColor =
                card.brand === "mada"
                  ? "from-emerald-700 to-teal-900"
                  : card.brand === "visa"
                  ? "from-blue-700 to-indigo-900"
                  : card.brand === "amex"
                  ? "from-sky-600 to-blue-900"
                  : "from-amber-600 to-rose-900";

              return (
                <div
                  key={card.id}
                  className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-lg bg-gradient-to-tr ${brandColor} flex flex-col justify-between min-h-[170px] border border-white/15`}
                >
                  <div className="flex items-center justify-between">
                    <OfficialPaymentIcon name={card.brand} heightClass="h-7" />
                    {card.isDefault && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 text-[10px] font-black">
                        <Check size={12} />
                        {t("Default", "الافتراضية")}
                      </span>
                    )}
                  </div>

                  <div className="my-4 font-mono text-lg sm:text-xl font-bold tracking-widest" dir="ltr">
                    •••• •••• •••• {card.last4}
                  </div>

                  <div className="flex items-end justify-between text-xs text-white/90 pt-2 border-t border-white/15">
                    <div>
                      <p className="text-[9px] uppercase text-white/60">{t("Cardholder", "اسم الحامل")}</p>
                      <p className="font-bold truncate max-w-[150px]">{card.cardholderName}</p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-[9px] uppercase text-white/60">{t("Expires", "الانتهاء")}</p>
                        <p className="font-mono font-bold">
                          {card.expiryMonth}/{card.expiryYear}
                        </p>
                      </div>

                      <button
                        type="button"
                        title={t("Delete Card", "حذف البطاقة")}
                        onClick={() => handleDeleteCard(card.id)}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-rose-300 transition-colors cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Accepted Gateways & Compliances */}
      <div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
          {t("Supported Payment Channels & Compliance", "بوابات السداد المعتمدة والتوافق الأمني")}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Mada */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <OfficialPaymentIcon name="mada" heightClass="h-9" />
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {t("Mada Debit Cards", "بطاقات مدى البنكية")}
                </p>
                <p className="text-xs text-slate-500">{t("0% Gateway fees", "بدون أي رسوم إضافية")}</p>
              </div>
            </div>
            <CheckCircle2 size={18} className="text-emerald-500" />
          </div>

          {/* Apple Pay */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <OfficialPaymentIcon name="apple" heightClass="h-9" />
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Apple Pay</p>
                <p className="text-xs text-slate-500">{t("1-Tap Express", "سداد فوري بنقرة واحدة")}</p>
              </div>
            </div>
            <CheckCircle2 size={18} className="text-emerald-500" />
          </div>

          {/* Google Pay */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <OfficialPaymentIcon name="google" heightClass="h-9" />
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Google Pay</p>
                <p className="text-xs text-slate-500">{t("Web & Android Express", "دفع سريع عبر الويب وأندرويد")}</p>
              </div>
            </div>
            <CheckCircle2 size={18} className="text-emerald-500" />
          </div>

          {/* STC Pay */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <OfficialPaymentIcon name="stcpay" heightClass="h-9" />
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">STC Pay</p>
                <p className="text-xs text-slate-500">{t("Saudi Mobile Wallet (SAR)", "محفظة الجوال السعودية (ر.س)")}</p>
              </div>
            </div>
            <CheckCircle2 size={18} className="text-emerald-500" />
          </div>

          {/* Samsung Pay (shown only when activated) */}
          {samsungAvailable && (
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1428A0] text-white font-black text-[10px] flex items-center justify-center">
                  S Pay
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Samsung Pay</p>
                  <p className="text-xs text-slate-500">{t("QR on Desktop · Biometric on Galaxy", "QR على الكمبيوتر · البصمة على سامسونج")}</p>
                </div>
              </div>
              <CheckCircle2 size={18} className="text-emerald-500" />
            </div>
          )}

          {/* Tabby */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center">
                tabby
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Tabby (تابي)</p>
                <p className="text-xs text-slate-500">{t("Split in 4 payments", "قسّم على ٤ دفعات بدون فوائد")}</p>
              </div>
            </div>
            <CheckCircle2 size={18} className="text-emerald-500" />
          </div>

          {/* Tamara */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FF9750] text-slate-950 font-black text-xs flex items-center justify-center">
                tamara
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Tamara (تمارا)</p>
                <p className="text-xs text-slate-500">{t("Pay in 4 with 0% interest", "ادفع على ٤ دفعات ميسرة")}</p>
              </div>
            </div>
            <CheckCircle2 size={18} className="text-emerald-500" />
          </div>
        </div>
      </div>

      {/* PCI-DSS Security Card */}
      <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/30 text-xs text-[#4F2396] dark:text-purple-300 flex items-center gap-3">
        <ShieldCheck size={20} className="shrink-0 text-emerald-600" />
        <span>
          {t(
            "Cards are securely tokenized following PCI-DSS Level 1 compliance. CVV codes are never stored on our servers.",
            "يتم حفظ وتشفير البطاقات بنظام الرموز المشفرة (Tokenization) المعتمد من البنك المركزي وPCI-DSS Level 1 دون تخزين رمز الأمان."
          )}
        </span>
      </div>

      {/* ===================== ADD CARD MODAL ===================== */}
      {addCardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#0E0E1A] border border-slate-200 dark:border-white/10 p-6 sm:p-7 shadow-2xl">
            <button
              type="button"
              onClick={() => setAddCardModalOpen(false)}
              className="absolute top-5 right-5 rtl:right-auto rtl:left-5 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-[#4F2396] dark:text-purple-300 flex items-center justify-center">
                <CreditCard size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {t("Save New Payment Card", "إضافة بطاقة دفع جديدة")}
                </h3>
                <p className="text-xs text-slate-500">
                  {t("Mada, Visa, or Mastercard for fast checkout", "مدى، فيزا، أو ماستركارد لسداد أسرع")}
                </p>
              </div>
            </div>

            {formError && (
              <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-bold border border-rose-200 dark:border-rose-500/20">
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCard} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t("Cardholder Name", "اسم حامل البطاقة (كما هو مدون عليها)")}
                </label>
                <input
                  type="text"
                  required
                  placeholder={t("e.g. MOHAMMED AL-OTAIBI", "مثال: محمد العتيبي")}
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-xs font-bold focus:outline-hidden focus:border-[#4F2396]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t("Card Number", "رقم البطاقة (١٦ رقماً)")}
                  </label>
                  {liveDetectedBrand && liveDetectedMeta && (
                    <span className="text-[10px] font-black uppercase text-[#4F2396] dark:text-purple-300">
                      {t(liveDetectedMeta.labelEn, liveDetectedMeta.labelAr)}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="0000 0000 0000 0000"
                    value={cardNumber}
                    onChange={(e) => handleFormatCardNumber(e.target.value)}
                    className="w-full px-4 py-2.5 ltr:pr-16 rtl:pl-16 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white font-mono text-sm tracking-wider focus:outline-hidden focus:border-[#4F2396]"
                    dir="ltr"
                  />
                  <div className="pointer-events-none absolute right-2.5 rtl:right-auto rtl:left-2.5 top-1/2 -translate-y-1/2 flex items-center">
                    {liveDetectedBrand ? (
                      <OfficialPaymentIcon name={liveDetectedBrand} heightClass="h-6" />
                    ) : (
                      <CreditCard className="text-slate-400 w-4 h-4 mr-1" />
                    )}
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <OfficialPaymentIcon
                    name="mada"
                    heightClass="h-5"
                    className={liveDetectedBrand && liveDetectedBrand !== "mada" ? "opacity-35 transition-opacity" : "transition-opacity"}
                  />
                  <OfficialPaymentIcon
                    name="visa"
                    heightClass="h-5"
                    className={liveDetectedBrand && liveDetectedBrand !== "visa" ? "opacity-35 transition-opacity" : "transition-opacity"}
                  />
                  <OfficialPaymentIcon
                    name="mastercard"
                    heightClass="h-5"
                    className={liveDetectedBrand && liveDetectedBrand !== "mastercard" ? "opacity-35 transition-opacity" : "transition-opacity"}
                  />
                  <OfficialPaymentIcon
                    name="amex"
                    heightClass="h-5"
                    className={liveDetectedBrand && liveDetectedBrand !== "amex" ? "opacity-35 transition-opacity" : "transition-opacity"}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t("Expiry Date (MM/YY)", "تاريخ الانتهاء (شهر/سنة)")}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="MM/YY"
                    value={expiry}
                    onChange={(e) => handleFormatExpiry(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white font-mono text-xs text-center focus:outline-hidden focus:border-[#4F2396]"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t("CVV Code", "رمز الأمان (CVV)")}
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    placeholder="•••"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, ""))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white font-mono text-xs text-center focus:outline-hidden focus:border-[#4F2396]"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="default-check"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded text-[#4F2396] focus:ring-[#4F2396]"
                />
                <label htmlFor="default-check" className="text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer">
                  {t("Set as default card for future bookings", "تعيين كبطاقة افتراضية للحجوزات القادمة")}
                </label>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setAddCardModalOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
                >
                  {t("Cancel", "إلغاء")}
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#4F2396] to-[#7c3aed] text-white text-xs font-bold shadow-md shadow-purple-900/20 hover:opacity-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>{t("Saving...", "جارٍ الحفظ...")}</span>
                    </>
                  ) : (
                    <span>{t("Save Card", "حفظ البطاقة")}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
