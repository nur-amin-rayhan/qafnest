"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2,
  PlusCircle,
  CreditCard,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  Check,
} from "lucide-react";
import type { SavedCard } from "@/lib/services/walletService";
import { useAuth } from "@/context/AuthContext";
import { getGuestAuthorizationHeaders } from "@/lib/auth/clientAuthHeaders";
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
  const { user, session } = useAuth();
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [addCardModalOpen, setAddCardModalOpen] = useState(false);

  // Form states
  const [cardholderName, setCardholderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [isDefault, setIsDefault] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [cardActionError, setCardActionError] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  const fetchCards = useCallback(async () => {
    try {
      setLoadingCards(true);
      const headers = await getGuestAuthorizationHeaders(session);
      const res = await fetch("/api/wallet/cards", { headers, cache: "no-store" });
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
  }, [session]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards, user?.id]);

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

    setIsSaving(true);
    try {
      const authHeaders = await getGuestAuthorizationHeaders(session);
      const res = await fetch("/api/wallet/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          cardholderName,
          last4: cleanNum.slice(-4),
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
      setCardActionError(null);
      if (Array.isArray(data.cards)) {
        setSavedCards(data.cards);
      } else if (data.card) {
        setSavedCards((prev) => {
          const next = data.card.isDefault
            ? prev.map((c) => ({ ...c, isDefault: false }))
            : [...prev];
          const existingIdx = next.findIndex((c) => c.id === data.card.id);
          if (existingIdx >= 0) {
            next[existingIdx] = data.card;
            return next;
          }
          return [...next, data.card];
        });
      }
      setCardholderName("");
      setCardNumber("");
      setExpiry("");
      setAddCardModalOpen(false);
      void fetchCards();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving card";
      setFormError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetDefaultCard = async (cardId: string) => {
    setCardActionError(null);
    setFormSuccess(null);
    setSettingDefaultId(cardId);
    try {
      const headers = await getGuestAuthorizationHeaders(session);
      const res = await fetch("/api/wallet/cards", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ cardId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        if (Array.isArray(data.cards)) {
          setSavedCards(data.cards);
        } else {
          setSavedCards((prev) => prev.map((c) => ({ ...c, isDefault: c.id === cardId })));
        }
        setFormSuccess(t("Default card updated.", "تم تحديث البطاقة الافتراضية."));
      } else {
        setCardActionError(
          data.error || t("Could not update default card.", "تعذر تحديث البطاقة الافتراضية.")
        );
      }
    } catch {
      setCardActionError(t("Network error updating default card.", "خطأ في الاتصال أثناء تحديث البطاقة."));
    } finally {
      setSettingDefaultId(null);
    }
  };

  const handleDeleteCard = async (card: SavedCard) => {
    setCardActionError(null);
    setFormSuccess(null);

    if (savedCards.length <= 1) {
      setCardActionError(
        t(
          "You must keep at least one default card saved. Add another card first before deleting this one.",
          "يجب الإبقاء على بطاقة افتراضية واحدة على الأقل. أضف بطاقة أخرى أولاً قبل حذف هذه البطاقة."
        )
      );
      return;
    }

    if (card.isDefault) {
      setCardActionError(
        t(
          "Set another card as your Default card first before deleting this default card.",
          "عيّن بطاقة أخرى كبطاقة افتراضية أولاً قبل حذف البطاقة الافتراضية الحالية."
        )
      );
      return;
    }

    try {
      const headers = await getGuestAuthorizationHeaders(session);
      const res = await fetch(`/api/wallet/cards?cardId=${encodeURIComponent(card.id)}`, {
        method: "DELETE",
        headers,
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        if (Array.isArray(data.cards)) {
          setSavedCards(data.cards);
        } else {
          setSavedCards((prev) => prev.filter((c) => c.id !== card.id));
        }
        setFormSuccess(t("Card removed successfully.", "تم حذف البطاقة بنجاح."));
      } else {
        setCardActionError(
          t(data.error || "Unable to delete card.", data.messageAr || data.error || "تعذر حذف البطاقة.")
        );
      }
    } catch (err) {
      console.warn("Notice: Error deleting card:", err);
      setCardActionError(t("Network error while deleting card.", "خطأ في الاتصال أثناء حذف البطاقة."));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">
            {t("Payment Methods & Saved Cards", "طرق الدفع والبطاقات المحفوظة")}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t(
              "Manage your saved Mada, Visa, Mastercard, and American Express cards.",
              "إدارة بطاقات مدى وفيزا وماستركارد وأمريكان إكسبرس المحفوظة لحجوزاتك."
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
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#4F2396] text-white font-semibold text-xs hover:bg-[#3d1979] transition-colors cursor-pointer"
        >
          <PlusCircle size={15} />
          <span>{t("Add Card", "إضافة بطاقة")}</span>
        </button>
      </div>

      {/* Success / Error Notification Alerts */}
      {formSuccess && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-sm font-medium">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{formSuccess}</span>
        </div>
      )}
      {cardActionError && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/20 text-rose-800 dark:text-rose-300 text-sm font-medium">
          <AlertCircle size={18} className="text-rose-600 shrink-0" />
          <span>{cardActionError}</span>
        </div>
      )}

      {/* Saved Cards List */}
      <div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-[#4F2396] dark:text-purple-400" />
          <span>{t("Saved Cards", "البطاقات المحفوظة")}</span>
        </h3>

        {loadingCards ? (
          <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-slate-800">
            <Loader2 className="w-6 h-6 animate-spin text-[#4F2396] mx-auto mb-2" />
            <p className="text-xs text-slate-400">{t("Loading your cards...", "جارٍ تحميل البطاقات...")}</p>
          </div>
        ) : savedCards.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-white/5 border border-dashed border-slate-200 dark:border-slate-800">
            <CreditCard className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {t("No cards saved yet", "لا توجد بطاقات محفوظة حتى الآن")}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {t(
                "Add a Mada, Visa, or Mastercard for faster booking checkout.",
                "أضف بطاقة مدى أو فيزا أو ماستركارد لإتمام الحجز بسرعة."
              )}
            </p>
            <button
              type="button"
              onClick={() => setAddCardModalOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-[#4F2396] dark:text-purple-300 font-semibold text-xs hover:bg-purple-200 transition-colors cursor-pointer"
            >
              <PlusCircle size={14} />
              <span>{t("Add your first card", "إضافة بطاقتك الأولى")}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {savedCards.map((card) => {
              return (
                <div
                  key={card.id}
                  className="rounded-2xl p-5 bg-slate-900 dark:bg-slate-800/90 text-white border border-slate-800 dark:border-slate-700 flex flex-col justify-between min-h-[164px]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <OfficialPaymentIcon name={card.brand} heightClass="h-7" />
                    {card.isDefault ? (
                      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold">
                        <Check size={12} />
                        {t("Default", "الافتراضية")}
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={settingDefaultId === card.id}
                        onClick={() => handleSetDefaultCard(card.id)}
                        className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-[10px] font-semibold transition cursor-pointer disabled:opacity-50"
                      >
                        {settingDefaultId === card.id
                          ? t("Setting...", "جاري التعيين...")
                          : t("Set as Default", "تعيين كافتراضية")}
                      </button>
                    )}
                  </div>

                  <div className="my-4 font-mono text-lg font-semibold tabular-nums tracking-wider" dir="ltr">
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
                        title={
                          card.isDefault
                            ? savedCards.length <= 1
                              ? t(
                                  "At least one default card is required. Add another card first.",
                                  "يجب الإبقاء على بطاقة افتراضية واحدة على الأقل. أضف بطاقة أخرى أولاً."
                                )
                              : t(
                                  "Set another card as Default before deleting this card.",
                                  "عيّن بطاقة أخرى كافتراضية أولاً قبل حذف هذه البطاقة."
                                )
                            : t("Delete Card", "حذف البطاقة")
                        }
                        onClick={() => handleDeleteCard(card)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          card.isDefault
                            ? "bg-white/5 text-white/35 hover:bg-white/10"
                            : "bg-white/10 hover:bg-white/20 text-rose-300"
                        }`}
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

      {/* ===================== ADD CARD MODAL ===================== */}
      {addCardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55">
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#0E0E1A] border border-slate-200 dark:border-white/10 p-6 shadow-xl">
            <button
              type="button"
              onClick={() => setAddCardModalOpen(false)}
              className="absolute top-5 end-5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[#F4EEFF] dark:bg-purple-950/40 text-[#4F2396] dark:text-purple-300 flex items-center justify-center">
                <CreditCard size={20} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  {t("Save New Payment Card", "إضافة بطاقة دفع جديدة")}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {t("Mada, Visa, or Mastercard for fast checkout", "مدى، فيزا، أو ماستركارد لسداد أسرع")}
                </p>
              </div>
            </div>

            {formError && (
              <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 text-xs font-medium border border-rose-200 dark:border-rose-500/20">
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCard} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-800 dark:text-slate-300 mb-1">
                  {t("Cardholder Name", "اسم حامل البطاقة (كما هو مدون عليها)")}
                </label>
                <input
                  type="text"
                  required
                  placeholder={t("e.g. MOHAMMED AL-OTAIBI", "مثال: محمد العتيبي")}
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#06060B] text-slate-900 dark:text-white placeholder:text-slate-500 text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F2396]/35 focus:border-[#4F2396]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-800 dark:text-slate-300">
                    {t("Card Number", "رقم البطاقة (١٦ رقماً)")}
                  </label>
                  {liveDetectedBrand && liveDetectedMeta && (
                    <span className="text-[10px] font-semibold uppercase text-[#4F2396] dark:text-purple-300">
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
                    className="w-full px-4 py-2.5 ltr:pr-16 rtl:pl-16 rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#06060B] text-slate-900 dark:text-white placeholder:text-slate-500 font-mono tabular-nums text-sm tracking-wider focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F2396]/35 focus:border-[#4F2396]"
                    dir="ltr"
                  />
                  <div className="pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2 flex items-center">
                    {liveDetectedBrand ? (
                      <OfficialPaymentIcon name={liveDetectedBrand} heightClass="h-6" />
                    ) : (
                      <CreditCard className="text-slate-500 w-4 h-4 me-1" />
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-xs font-medium text-slate-800 dark:text-slate-300 mb-1">
                    {t("Expiry Date (MM/YY)", "تاريخ الانتهاء (شهر/سنة)")}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="MM/YY"
                    value={expiry}
                    onChange={(e) => handleFormatExpiry(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#06060B] text-slate-900 dark:text-white placeholder:text-slate-500 font-mono text-xs text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F2396]/35 focus:border-[#4F2396]"
                    dir="ltr"
                  />
                </div>

                <div className="rounded-xl bg-[#F9F8FD] dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 px-3 py-2.5 text-[11px] text-slate-600 dark:text-slate-400">
                  {t("CVV is requested only during live checkout and is never stored.", "يُطلب رمز الأمان CVV عند الدفع فقط ولا يُخزَّن على خوادمنا.")}
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
                <label htmlFor="default-check" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  {t("Set as default card for future bookings", "تعيين كبطاقة افتراضية للحجوزات القادمة")}
                </label>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setAddCardModalOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-300 dark:border-white/15 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer"
                >
                  {t("Cancel", "إلغاء")}
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 rounded-xl bg-[#4F2396] hover:bg-[#3d1979] text-white text-xs font-semibold disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer transition-colors"
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
