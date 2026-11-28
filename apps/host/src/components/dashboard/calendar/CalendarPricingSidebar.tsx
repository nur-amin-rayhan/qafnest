"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  Save,
  RotateCcw,
  SlidersHorizontal,
  Clock,
  Building2,
} from "lucide-react";
import type { PropertyBookingSlotConfig } from "@qafnest/shared";
import type { HostPropertySummary } from "../HostOverviewHub";

const DAYS_OF_WEEK = [
  { key: "sunday", nameEn: "Sunday", nameAr: "الأحد", isWeekend: false },
  { key: "monday", nameEn: "Monday", nameAr: "الاثنين", isWeekend: false },
  { key: "tuesday", nameEn: "Tuesday", nameAr: "الثلاثاء", isWeekend: false },
  { key: "wednesday", nameEn: "Wednesday", nameAr: "الأربعاء", isWeekend: false },
  { key: "thursday", nameEn: "Thursday", nameAr: "الخميس", isWeekend: true },
  { key: "friday", nameEn: "Friday", nameAr: "الجمعة", isWeekend: true },
  { key: "saturday", nameEn: "Saturday", nameAr: "السبت", isWeekend: true },
] as const;

interface CalendarPricingSidebarProps {
  masterBasePrice: string;
  setMasterBasePrice: (val: string) => void;
  customDayPricing: Record<string, string>;
  setCustomDayPricing: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  slotConfig: PropertyBookingSlotConfig;
  onToggleSlotFormat: (formatId: "standard_4pm_12pm" | "twelve_hour_12am_12pm", enabled: boolean) => void;
  onChangeTwelveHourPrice: (val: string) => void;
  savedNotice: boolean;
  saveError: string | null;
  isSaving: boolean;
  selectedPropertyId: string;
  properties?: HostPropertySummary[];
  selectedProperty?: HostPropertySummary | null;
  onSelectPropertyId?: (id: string) => void;
  handleSavePricing: () => Promise<void>;
  t: (en: string, ar: string) => string;
  lang: "ar" | "en";
}

export function CalendarPricingSidebar({
  masterBasePrice,
  setMasterBasePrice,
  customDayPricing,
  setCustomDayPricing,
  slotConfig,
  onToggleSlotFormat,
  onChangeTwelveHourPrice,
  savedNotice,
  saveError,
  isSaving,
  selectedPropertyId,
  properties,
  selectedProperty,
  onSelectPropertyId,
  handleSavePricing,
  t,
  lang,
}: CalendarPricingSidebarProps) {
  const [show7DaySection, setShow7DaySection] = useState(true);

  const handleDayPriceChange = (dayKey: string, val: string) => {
    setCustomDayPricing((prev) => ({
      ...prev,
      [dayKey]: val,
    }));
  };

  const resetAllDaysToBase = () => {
    setCustomDayPricing({
      sunday: "",
      monday: "",
      tuesday: "",
      wednesday: "",
      thursday: "",
      friday: "",
      saturday: "",
    });
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#12101a] p-5 sm:p-6 shadow-xs space-y-5 flex flex-col justify-between">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800/80 pb-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-violet-50 dark:bg-purple-950/60 text-[#4F2396] dark:text-purple-300">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              {t("Pricing Configuration", "إعدادات التسعير المتقدمة")}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {t("Base rate & granular 7-day pricing", "السعر الأساسي وتسعير الأيام التفصيلي")}
            </p>
          </div>
        </div>

        {/* Active Property Banner & Selector */}
        <div className="rounded-2xl border-2 border-violet-200/90 dark:border-purple-800/60 bg-gradient-to-br from-violet-50/90 via-white to-violet-50/40 dark:from-purple-950/40 dark:via-[#161226] dark:to-purple-950/20 p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-[#4F2396] dark:text-purple-300 flex items-center gap-1.5">
              <Building2 size={13} />
              {t("Active Listing", "العقار المختار")}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {t("Live Synced", "متزامن مع المنصة")}
            </span>
          </div>

          {properties && properties.length > 0 && onSelectPropertyId ? (
            <select
              value={selectedPropertyId}
              onChange={(e) => onSelectPropertyId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs sm:text-sm font-black text-slate-900 dark:text-white shadow-xs outline-none focus:border-[#4F2396] focus:ring-2 focus:ring-[#4F2396]/20 cursor-pointer"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} {p.city ? `(${p.city})` : ""}
                </option>
              ))}
            </select>
          ) : (
            <div className="text-xs font-black text-slate-800 dark:text-slate-200 truncate">
              {selectedProperty?.title || selectedPropertyId || t("Selected Unit", "العقار المحدد")}
            </div>
          )}
        </div>

        {/* Master Base Price */}
        <div className="rounded-2xl bg-slate-50/80 dark:bg-slate-900/50 p-3.5 border border-slate-200/80 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-slate-800 dark:text-slate-200">
              {t("Master Base Price", "السعر الأساسي المعتمد")}
            </label>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-violet-100 dark:bg-purple-950/70 text-[#4F2396] dark:text-purple-300">
              {t("Default Fallback", "الافتراضي")}
            </span>
          </div>
          <div className="relative">
            <input
              type="number"
              min="1"
              value={masterBasePrice}
              onChange={(e) => setMasterBasePrice(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-black text-slate-900 dark:text-white outline-none focus:border-[#4F2396] focus:ring-2 focus:ring-[#4F2396]/20 transition"
            />
            <span className="absolute inset-y-0 end-3 flex items-center text-xs font-bold text-slate-400 dark:text-slate-500">
              {t("SAR / night", "ر.س / ليلة")}
            </span>
          </div>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {t(
              "Automatically applied to any day of the week or date without a specific custom rate.",
              "يطبق تلقائياً على أي يوم في الأسبوع أو تاريخ غير مخصص بسعر منفرد."
            )}
          </p>
        </div>

        {/* Booking Timing Formats & 12-Hour Manual Rate Controls */}
        <div className="rounded-2xl bg-violet-50/50 dark:bg-purple-950/20 p-3.5 border border-violet-200/80 dark:border-purple-900/50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-black text-slate-900 dark:text-white">
              <Clock size={14} className="text-[#4F2396] dark:text-purple-400" />
              {t("Booking Time-Slot Formats", "أنماط أوقات الحجز المتاحة")}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white dark:bg-purple-950/60 text-[#4F2396] dark:text-purple-300 border border-violet-200 dark:border-purple-800">
              {t("Live Sync", "مزامنة فورية")}
            </span>
          </div>

          {/* Format 1: Default 4:00 PM -> 12:00 PM */}
          <label className="flex items-center justify-between gap-2 rounded-xl bg-white dark:bg-slate-900/80 p-2.5 border border-slate-200/80 dark:border-slate-800 cursor-pointer">
            <div className="min-w-0">
              <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>{t("4:00 PM → 12:00 PM", "4:00 م ← 12:00 م")}</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300">
                  {t("Primary", "رئيسي")}
                </span>
              </div>
              <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                {t("Check-in 4 PM · Check-out 12 PM (Standard)", "دخول 4:00 م · خروج 12:00 م")}
              </div>
            </div>
            <input
              type="checkbox"
              checked={slotConfig.enableStandard4pmTo12pm}
              onChange={(e) => onToggleSlotFormat("standard_4pm_12pm", e.target.checked)}
              className="h-4 w-4 accent-[#4F2396] rounded cursor-pointer"
            />
          </label>

          {/* Format 2: Optional 12-Hour 12:00 AM -> 12:00 PM */}
          <div className="rounded-xl bg-white dark:bg-slate-900/80 p-2.5 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <label className="flex items-center justify-between gap-2 cursor-pointer">
              <div className="min-w-0">
                <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>{t("12:00 AM → 12:00 PM", "12:00 ص ← 12:00 م")}</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-violet-100 dark:bg-purple-950/70 text-[#4F2396] dark:text-purple-300">
                    {t("12h Slot", "12 ساعة")}
                  </span>
                </div>
                <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                  {t("Optional 12-hour stay (Morning turnover)", "إقامة 12 ساعة (من منتصف الليل حتى الظهر)")}
                </div>
              </div>
              <input
                type="checkbox"
                checked={slotConfig.enableTwelveHour12amTo12pm}
                onChange={(e) => onToggleSlotFormat("twelve_hour_12am_12pm", e.target.checked)}
                className="h-4 w-4 accent-[#4F2396] rounded cursor-pointer"
              />
            </label>

            {slotConfig.enableTwelveHour12amTo12pm && (
              <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                  {t("Manual 12-Hour Slot Rate (SAR)", "سعر فترة الـ 12 ساعة اليدوي (ر.س)")}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    placeholder={masterBasePrice || "450"}
                    value={slotConfig.twelveHourPrice ?? ""}
                    onChange={(e) => onChangeTwelveHourPrice(e.target.value)}
                    className="w-full rounded-lg border border-violet-200 dark:border-purple-800/80 bg-violet-50/30 dark:bg-slate-900 px-2.5 py-1.5 text-xs font-black text-slate-900 dark:text-white outline-none focus:border-[#4F2396] focus:ring-1 focus:ring-[#4F2396]"
                  />
                  <span className="absolute inset-y-0 end-2.5 flex items-center text-[10px] font-bold text-slate-400 pointer-events-none">
                    {t("SAR / 12h", "ر.س / 12س")}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  {t(
                    "Set manually by Host. Platform adds only the guest service fee.",
                    "يحدده المضيف يدوياً، وتضيف المنصة رسوم الخدمة فقط."
                  )}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Granular 7-Day Pricing Toggle */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShow7DaySection((prev) => !prev)}
              className="flex items-center gap-1.5 text-xs font-black text-slate-800 dark:text-slate-200 hover:text-[#4F2396] dark:hover:text-purple-300 transition cursor-pointer"
            >
              <SlidersHorizontal size={14} className="text-[#4F2396] dark:text-purple-400" />
              <span>{t("Granular 7-Day Pricing", "تسعير أيام الأسبوع (7 أيام)")}</span>
            </button>
            <button
              type="button"
              onClick={resetAllDaysToBase}
              className="text-[11px] font-bold text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1 transition cursor-pointer"
              title={t("Reset all days to base rate", "إعادة تعيين كافة الأيام للسعر الأساسي")}
            >
              <RotateCcw size={11} />
              <span>{t("Reset to Base", "تفريغ للأساسي")}</span>
            </button>
          </div>

          {show7DaySection && (
            <div className="grid grid-cols-1 gap-2 max-h-[320px] overflow-y-auto pe-1">
              {DAYS_OF_WEEK.map((day) => {
                const dayVal = customDayPricing[day.key] || "";
                const isConfigured = Boolean(dayVal && Number(dayVal) > 0);

                return (
                  <div
                    key={day.key}
                    className="flex items-center justify-between gap-2 p-2 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                  >
                    <div className="min-w-[90px]">
                      <div className="text-xs font-black text-slate-800 dark:text-slate-200">
                        {lang === "ar" ? day.nameAr : day.nameEn}
                      </div>
                      <span
                        className={`text-[9px] font-bold ${
                          day.isWeekend ? "text-amber-600 dark:text-amber-400" : "text-slate-400 dark:text-slate-500"
                        }`}
                      >
                        {day.isWeekend
                          ? t("Weekend", "عطلة أسبوع")
                          : t("Weekday", "يوم عادي")}
                      </span>
                    </div>

                    <div className="relative flex-1 max-w-[140px]">
                      <input
                        type="number"
                        min="1"
                        placeholder={masterBasePrice || "Base"}
                        value={dayVal}
                        onChange={(e) => handleDayPriceChange(day.key, e.target.value)}
                        className={`w-full rounded-lg border px-2.5 py-1 text-xs font-black outline-none transition ${
                          isConfigured
                            ? "border-[#4F2396] dark:border-purple-500 bg-violet-50/30 dark:bg-purple-950/40 text-[#4F2396] dark:text-purple-300"
                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                        } focus:ring-1 focus:ring-[#4F2396]`}
                      />
                      <span className="absolute inset-y-0 end-2 flex items-center text-[10px] font-bold text-slate-400 dark:text-slate-500 pointer-events-none">
                        ر.س
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Info Hint */}
        <div className="rounded-2xl bg-violet-50/70 dark:bg-purple-950/30 p-3 border border-violet-100 dark:border-purple-900/40 text-xs text-violet-900 dark:text-purple-200 flex items-start gap-2">
          <Info size={15} className="text-[#4F2396] dark:text-purple-400 shrink-0 mt-0.5" />
          <p className="font-semibold text-[11px] leading-relaxed">
            {t(
              "Leave any day empty to inherit the Master Base Price. Click any cell in the calendar to override a specific date.",
              "اترك حقل أي يوم فارغاً ليعتمد تلقائياً السعر الأساسي. انقر على أي تاريخ في التقويم لتخصيص سعره بشكل فردي."
            )}
          </p>
        </div>
      </div>

      {/* Footer Save Area */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5">
        {savedNotice && (
          <div className="rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 p-2 text-xs font-bold text-center flex items-center justify-center gap-1.5 animate-in fade-in">
            <CheckCircle2 size={13} />
            <span>{t("Rates updated successfully!", "تم تحديث الأسعار بنجاح!")}</span>
          </div>
        )}
        {saveError && (
          <div className="rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 p-2 text-xs font-bold text-center flex items-center justify-center gap-1.5 animate-in fade-in">
            <AlertCircle size={13} />
            <span>{saveError}</span>
          </div>
        )}
        <button
          type="button"
          onClick={handleSavePricing}
          disabled={isSaving || !selectedPropertyId}
          className="w-full py-2.5 rounded-2xl bg-[#4F2396] hover:bg-[#3D1A78] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-black transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
        >
          {isSaving ? (
            <LoaderCircle size={15} className="animate-spin" />
          ) : (
            <Save size={15} />
          )}
          <span>
            {isSaving
              ? t("Saving...", "جارٍ الحفظ...")
              : t("Save Pricing Changes", "حفظ وتطبيق الأسعار")}
          </span>
        </button>
      </div>
    </div>
  );
}
