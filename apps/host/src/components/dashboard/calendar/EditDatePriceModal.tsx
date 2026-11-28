"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Tag,
  Lock,
  Unlock,
  CheckCircle2,
  Calendar,
  Sparkles,
  RotateCcw,
  Clock,
  AlertTriangle,
} from "lucide-react";

import type {
  CalendarDaySlotSummary,
  DateSlotOverride,
  PropertyBookingSlotConfig,
  RateSource,
} from "@qafnest/shared";
import { isFormatEnabledOnDate, getRiyadhNowInfo } from "@qafnest/shared";

interface EditDatePriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateIso: string | null;
  isBooked: boolean;
  isBlocked: boolean;
  onToggleBlock: (dateIso: string) => void;
  currentOverridePrice: number | null;
  effectiveRate: number;
  effectiveSource: RateSource;
  onSaveOverride: (dateIso: string, price: number | null) => Promise<void> | void;
  slotSummary?: CalendarDaySlotSummary | null;
  slotConfig?: PropertyBookingSlotConfig | null;
  onSaveDateSlotOverride?: (dateIso: string, override: DateSlotOverride | null) => Promise<void>;
  lang: "ar" | "en";
  t: (en: string, ar: string) => string;
}

export function EditDatePriceModal({
  isOpen,
  onClose,
  dateIso,
  isBooked,
  isBlocked,
  onToggleBlock,
  currentOverridePrice,
  effectiveRate,
  effectiveSource,
  onSaveOverride,
  slotSummary,
  slotConfig,
  onSaveDateSlotOverride,
  lang,
  t,
}: EditDatePriceModalProps) {
  const [overrideInput, setOverrideInput] = useState<string>("");
  const [twelveHourPriceInput, setTwelveHourPriceInput] = useState<string>("");
  const [standardEnabled, setStandardEnabled] = useState<boolean>(true);
  const [twelveHourEnabled, setTwelveHourEnabled] = useState<boolean>(false);
  const [slotError, setSlotError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (currentOverridePrice && currentOverridePrice > 0) {
      setOverrideInput(String(currentOverridePrice));
    } else {
      setOverrideInput("");
    }
    setSlotError(null);

    if (dateIso && slotConfig) {
      const ov = slotConfig.dateSlotOverrides?.[dateIso];
      setStandardEnabled(isFormatEnabledOnDate(slotConfig, "standard_4pm_12pm", dateIso, isBlocked ? [dateIso] : []));
      setTwelveHourEnabled(isFormatEnabledOnDate(slotConfig, "twelve_hour_12am_12pm", dateIso, isBlocked ? [dateIso] : []));
      if (ov?.twelveHourPrice && ov.twelveHourPrice > 0) {
        setTwelveHourPriceInput(String(ov.twelveHourPrice));
      } else {
        setTwelveHourPriceInput("");
      }
    }
  }, [currentOverridePrice, dateIso, slotConfig, isBlocked]);

  if (!isOpen || !dateIso) return null;

  const dateObj = new Date(`${dateIso}T12:00:00Z`);
  const formattedDate = dateObj.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const isPastDate = Boolean(dateIso && dateIso < getRiyadhNowInfo().dateIso);
  const morningBooked = slotSummary?.morningStatus === "booked";
  const eveningBooked = slotSummary?.eveningStatus === "booked";
  const hasAnyBooking = morningBooked || eveningBooked || isBooked;

  const getSourceLabel = () => {
    switch (effectiveSource) {
      case "date_override":
        return t("Custom Date Override", "سعر مخصص لهذا اليوم");
      case "day_of_week":
        return t("Day-of-Week Rate", "سعر يوم الأسبوع المحدد");
      case "weekend_weekday":
        return t("Weekend Fallback", "سعر عطلة الأسبوع");
      case "base_rate":
      default:
        return t("Master Base Rate", "السعر الأساسي المعتمد");
    }
  };

  const handleApplyAll = async () => {
    if (isPastDate) return;
    setIsSubmitting(true);
    setSlotError(null);
    try {
      const num = Number(overrideInput);
      if (overrideInput.trim() && !isNaN(num) && num > 0) {
        await onSaveOverride(dateIso, num);
      }

      if (onSaveDateSlotOverride) {
        const num12h = Number(twelveHourPriceInput);
        await onSaveDateSlotOverride(dateIso, {
          standardEnabled,
          twelveHourEnabled,
          twelveHourPrice: twelveHourPriceInput.trim() && !isNaN(num12h) && num12h > 0 ? num12h : null,
        });
      }
      onClose();
    } catch (err: unknown) {
      setSlotError(err instanceof Error ? err.message : t("Could not update slot settings", "تعذر تحديث إعدادات الفترة"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearOverride = async () => {
    if (isPastDate) return;
    setIsSubmitting(true);
    try {
      await onSaveOverride(dateIso, null);
      setOverrideInput("");
      if (onSaveDateSlotOverride) {
        await onSaveDateSlotOverride(dateIso, null);
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#12101a] p-6 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-violet-100 dark:bg-purple-950/60 text-[#4F2396] dark:text-purple-300">
              <Calendar size={18} />
            </div>
            <div>
              <h3 className="text-base font-black leading-tight">
                {t("Date Time-Slots & Pricing", "إدارة الفترات والتسعير لليوم")}
              </h3>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{formattedDate}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {isPastDate && (
          <div className="flex items-center gap-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900/60 p-3 text-xs font-bold text-slate-600 dark:text-slate-400">
            <Lock size={15} className="shrink-0 text-slate-500 dark:text-slate-400" />
            <span>{t("This date has passed and is closed. Past dates cannot be modified.", "هذا التاريخ منقضي ومغلق بالفعل ولا يمكن تعديله.")}</span>
          </div>
        )}

        {/* Live Slot Window Breakdown */}
        <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/50 p-3.5 border border-slate-200/80 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {hasAnyBooking ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-purple-100 dark:bg-purple-950/70 text-[#4F2396] dark:text-purple-300">
                  <CheckCircle2 size={13} />
                  {slotSummary?.overallStatus === "split_checkout_open"
                    ? t("Split Day (Out 12 PM · Open 4 PM+)", "يوم منقسم (مغادرة 12 م · متاح 4 م)")
                    : slotSummary?.overallStatus === "split_checkin_open"
                    ? t("Split Day (Open 12 AM · Booked 4 PM+)", "يوم منقسم (متاح 12 ص · محجوز 4 م)")
                    : t("Booked", "محجوز")}
                </span>
              ) : isBlocked ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300">
                  <Lock size={13} /> {t("Closed / Blocked", "مغلق بالكامل")}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300">
                  <Sparkles size={13} /> {t("Available", "متاح للحجز")}
                </span>
              )}
            </div>
            <div className="text-end">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{t("Standard Rate", "السعر الأساسي")}</div>
              <div className="text-sm font-black text-slate-900 dark:text-white">
                {effectiveRate} <span className="text-xs font-bold text-slate-500 dark:text-slate-400">ر.س</span>
              </div>
              <div className="text-[10px] font-bold text-[#4F2396] dark:text-purple-400">{getSourceLabel()}</div>
            </div>
          </div>

          {slotSummary && (slotSummary.occupiedWindows.length > 0 || slotSummary.openWindows.length > 0) && (
            <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 space-y-1.5 text-[11px]">
              {slotSummary.occupiedWindows.map((win, idx) => (
                <div key={`occ-${idx}`} className="flex items-center justify-between rounded-lg bg-purple-50 dark:bg-purple-950/40 px-2.5 py-1.5 text-[#4F2396] dark:text-purple-300 font-bold">
                  <span>● {lang === "ar" ? win.labelAr : win.labelEn}</span>
                  {win.bookingRef && <span className="font-mono text-[10px] opacity-80">{win.bookingRef}</span>}
                </div>
              ))}
              {slotSummary.openWindows.map((win, idx) => (
                <div key={`open-${idx}`} className="flex items-center justify-between rounded-lg bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1.5 text-emerald-800 dark:text-emerald-300 font-bold">
                  <span>○ {lang === "ar" ? win.labelAr : win.labelEn}</span>
                  {win.price ? <span className="font-black">{win.price} SAR</span> : null}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Per-Date Slot Availability Toggles */}
        <div className="rounded-2xl border border-violet-200/80 dark:border-purple-900/50 bg-violet-50/30 dark:bg-purple-950/20 p-3.5 space-y-2.5">
          <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
            <Clock size={14} className="text-[#4F2396] dark:text-purple-400" />
            {t("Per-Date Slot Controls", "التحكم بفترات هذا اليوم")}
          </div>

          <label className={`flex items-center justify-between rounded-xl bg-white dark:bg-slate-900/80 p-2.5 border ${eveningBooked ? "border-purple-200 dark:border-purple-800 opacity-75" : "border-slate-200 dark:border-slate-800"} cursor-pointer`}>
            <div>
              <div className="text-xs font-black text-slate-900 dark:text-white">
                {t("4:00 PM → 12:00 PM Next Day", "4:00 م ← 12:00 م اليوم التالي")}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                {eveningBooked
                  ? t("Locked — evening/night already booked", "مقفل — يوجد حجز مؤكد لهذه الفترة")
                  : t("Toggle standard afternoon check-in for this date", "تفعيل أو إيقاف وصول الساعة 4 مساءً لهذا اليوم")}
              </div>
            </div>
            <input
              type="checkbox"
              disabled={eveningBooked || isSubmitting || isPastDate}
              checked={eveningBooked ? true : standardEnabled}
              onChange={(e) => setStandardEnabled(e.target.checked)}
              className="h-4 w-4 accent-[#4F2396] cursor-pointer"
            />
          </label>

          <div className={`rounded-xl bg-white dark:bg-slate-900/80 p-2.5 border ${morningBooked ? "border-purple-200 dark:border-purple-800 opacity-75" : "border-slate-200 dark:border-slate-800"} space-y-2`}>
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="text-xs font-black text-slate-900 dark:text-white">
                  {t("12:00 AM → 12:00 PM (12-Hour Slot)", "12:00 ص ← 12:00 م (فترة 12 ساعة)")}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  {morningBooked
                    ? t("Occupied — morning hours until 12 PM booked/checkout", "مشغول — الفترة الصباحية حتى 12 م محجوزة")
                    : t("Offer 12 AM – 12 PM 12h slot on this specific date", "إتاحة فترة 12 ساعة من منتصف الليل حتى الظهر في هذا اليوم")}
                </div>
              </div>
              <input
                type="checkbox"
                disabled={morningBooked || isSubmitting || isPastDate}
                checked={morningBooked ? false : twelveHourEnabled}
                onChange={(e) => setTwelveHourEnabled(e.target.checked)}
                className="h-4 w-4 accent-[#4F2396] cursor-pointer"
              />
            </label>

            {twelveHourEnabled && !morningBooked && (
              <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {t("Custom 12-Hour Rate for This Date (Optional)", "سعر مخصص لفترة 12 ساعة لهذا اليوم (اختياري)")}
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder={slotConfig?.twelveHourPrice ? String(slotConfig.twelveHourPrice) : String(effectiveRate)}
                  value={twelveHourPriceInput}
                  onChange={(e) => setTwelveHourPriceInput(e.target.value)}
                  disabled={isSubmitting || isPastDate}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-black text-slate-900 dark:text-white outline-none focus:border-[#4F2396]"
                />
              </div>
            )}
          </div>
        </div>

        {/* Custom Price Override Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Tag size={14} className="text-[#4F2396] dark:text-purple-400" />
            {t("Override Standard Rate for This Date", "تخصيص السعر الليلي لهذا التاريخ")}
          </label>
          <div className="relative">
            <input
              type="number"
              min="1"
              placeholder={String(effectiveRate)}
              value={overrideInput}
              onChange={(e) => setOverrideInput(e.target.value)}
              disabled={isSubmitting || isPastDate}
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm font-black text-slate-900 dark:text-white outline-none focus:border-[#4F2396] focus:ring-2 focus:ring-[#4F2396]/20 transition"
            />
            <span className="absolute inset-y-0 end-3.5 flex items-center text-xs font-bold text-slate-400 dark:text-slate-500">
              {t("SAR / night", "ر.س / ليلة")}
            </span>
          </div>
        </div>

        {slotError && (
          <div className="rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 p-2.5 text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertTriangle size={14} className="shrink-0" />
            <span>{slotError}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col gap-2">
          {isPastDate ? (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-2xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-black transition cursor-pointer"
            >
              {t("Close View", "إغلاق العرض")}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleApplyAll}
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-2xl bg-[#4F2396] hover:bg-[#3D1A78] disabled:opacity-50 text-white text-xs sm:text-sm font-black transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Tag size={15} />
                <span>{t("Save Date Slots & Pricing", "حفظ إعدادات الفترات والسعر")}</span>
              </button>

              {currentOverridePrice || slotConfig?.dateSlotOverrides?.[dateIso] ? (
                <button
                  type="button"
                  onClick={handleClearOverride}
                  disabled={isSubmitting}
                  className="w-full py-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw size={14} />
                  <span>{t("Clear Date Overrides", "إلغاء تخصيصات هذا التاريخ")}</span>
                </button>
              ) : null}

              {!hasAnyBooking && (
                <button
                  type="button"
                  onClick={() => {
                    onToggleBlock(dateIso);
                    onClose();
                  }}
                  className={`w-full py-2 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    isBlocked
                      ? "bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                      : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {isBlocked ? <Unlock size={14} /> : <Lock size={14} />}
                  <span>
                    {isBlocked
                      ? t("Re-open Full Date", "إعادة فتح اليوم بالكامل")
                      : t("Close / Block Entire Date", "إغلاق اليوم بالكامل")}
                  </span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
