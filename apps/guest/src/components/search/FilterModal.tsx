"use client";

import React from "react";
import { X, Check, RotateCcw } from "lucide-react";
import { useApp } from "@/context/AppContext";

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
  instantOnly: boolean;
  setInstantOnly: (b: boolean) => void;
  poolOnly: boolean;
  setPoolOnly: (b: boolean) => void;
  selfCheckinOnly: boolean;
  setSelfCheckinOnly: (b: boolean) => void;
  minPrice: number;
  setMinPrice: (n: number) => void;
  maxPrice: number;
  setMaxPrice: (n: number) => void;
  bedrooms: number;
  setBedrooms: (n: number) => void;
  onReset: () => void;
}

export default function FilterModal({
  isOpen,
  onClose,
  selectedCategory,
  setSelectedCategory,
  instantOnly,
  setInstantOnly,
  poolOnly,
  setPoolOnly,
  selfCheckinOnly,
  setSelfCheckinOnly,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  bedrooms,
  setBedrooms,
  onReset,
}: FilterModalProps) {
  const { language } = useApp();

  if (!isOpen) return null;

  return (
    <div
      data-lenis-prevent="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-[#12101F] border border-violet-200/85 dark:border-violet-500/25 shadow-[0_24px_65px_rgba(109,40,217,0.22)] overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-violet-100 dark:border-violet-500/20 flex items-center justify-between bg-violet-50/40 dark:bg-violet-950/20">
          <h3 className="font-extrabold text-lg text-gray-900 dark:text-white">
            {language === "ar" ? "تصفية متقدمة" : "All Filters"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-violet-100 dark:hover:bg-white/10 text-violet-700 dark:text-violet-300 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div
          data-lenis-prevent="true"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          className="p-6 overflow-y-auto space-y-6 text-sm"
          style={{ overscrollBehavior: "contain" }}
        >
          {/* 1. Property Type */}
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-3">
              {language === "ar" ? "نوع الإقامة" : "Property Type"}
            </h4>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: "all", labelEn: "All Types", labelAr: "جميع الوحدات" },
                { id: "penthouse", labelEn: "Apartments & Studios", labelAr: "شقق واستوديوهات" },
                { id: "chalet", labelEn: "Chalets & Resorts", labelAr: "شاليهات ومنتجعات" },
                { id: "villa", labelEn: "Private Villas", labelAr: "فلل خاصة" },
                { id: "farm", labelEn: "Country Farms", labelAr: "مزارع ريفية" },
                { id: "camp", labelEn: "Desert Camps", labelAr: "مخيمات صحراوية" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedCategory(t.id)}
                  className={`p-3 rounded-2xl border text-left rtl:text-right font-semibold transition-all cursor-pointer flex items-center justify-between ${
                    selectedCategory === t.id
                      ? "border-violet-600 bg-violet-100/70 dark:bg-violet-950/50 text-violet-800 dark:text-violet-200 font-bold shadow-xs"
                      : "border-violet-200/80 dark:border-violet-500/20 bg-violet-50/30 dark:bg-white/5 hover:border-violet-400 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <span>{language === "ar" ? t.labelAr : t.labelEn}</span>
                  {selectedCategory === t.id && <Check className="w-4 h-4 text-violet-600" />}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Price Range */}
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-3">
              {language === "ar" ? "نطاق السعر بالليلة (ر.س)" : "Nightly Price Range (SAR)"}
            </h4>
            <div className="flex items-center gap-3">
              <div className="flex-1 p-3.5 rounded-2xl border border-violet-200/80 dark:border-violet-500/20 bg-violet-50/35 dark:bg-white/5">
                <span className="text-[11px] font-semibold text-violet-700/80 dark:text-violet-300/80 block mb-0.5">
                  {language === "ar" ? "الحد الأدنى" : "Min Price"}
                </span>
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(Number(e.target.value))}
                  className="w-full bg-transparent font-extrabold text-sm text-gray-900 dark:text-white focus:outline-none"
                  min={0}
                  step={50}
                />
              </div>
              <span className="text-violet-400 font-bold">—</span>
              <div className="flex-1 p-3.5 rounded-2xl border border-violet-200/80 dark:border-violet-500/20 bg-violet-50/35 dark:bg-white/5">
                <span className="text-[11px] font-semibold text-violet-700/80 dark:text-violet-300/80 block mb-0.5">
                  {language === "ar" ? "الحد الأقصى" : "Max Price"}
                </span>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full bg-transparent font-extrabold text-sm text-gray-900 dark:text-white focus:outline-none"
                  min={100}
                  step={50}
                />
              </div>
            </div>
          </div>

          {/* 3. Bedrooms Count */}
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-3">
              {language === "ar" ? "عدد غرف النوم" : "Bedrooms"}
            </h4>
            <div className="flex items-center gap-2">
              {[0, 1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setBedrooms(n)}
                  className={`flex-1 py-2.5 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                    bedrooms === n
                      ? "border-violet-700 bg-gradient-to-r from-violet-700 to-fuchsia-600 text-white shadow-sm"
                      : "border-violet-200/80 dark:border-violet-500/20 bg-violet-50/30 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:border-violet-400"
                  }`}
                >
                  {n === 0 ? (language === "ar" ? "الكل" : "Any") : `${n}+`}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Instant Book & Key Features */}
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-3">
              {language === "ar" ? "المزايا وخيارات الحجز" : "Booking Options & Amenities"}
            </h4>
            <div className="space-y-2.5">
              {[
                {
                  id: "instant",
                  labelEn: "⚡ Instant Booking",
                  labelAr: "⚡ حجز فوري بدون انتظار تأكيد",
                  checked: instantOnly,
                  onChange: () => setInstantOnly(!instantOnly),
                },
                {
                  id: "self",
                  labelEn: "🔑 Self Check-in (Smart Lock)",
                  labelAr: "🔑 دخول ذاتي بقفل ذكي",
                  checked: selfCheckinOnly,
                  onChange: () => setSelfCheckinOnly(!selfCheckinOnly),
                },
                {
                  id: "pool",
                  labelEn: "🏊 Private Swimming Pool",
                  labelAr: "🏊 مسبح خاص",
                  checked: poolOnly,
                  onChange: () => setPoolOnly(!poolOnly),
                },
              ].map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-colors ${
                    opt.checked
                      ? "border-violet-600 bg-violet-50/70 dark:bg-violet-950/40"
                      : "border-violet-200/80 dark:border-violet-500/20 bg-violet-50/25 dark:bg-white/5 hover:border-violet-400"
                  }`}
                >
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {language === "ar" ? opt.labelAr : opt.labelEn}
                  </span>
                  <input
                    type="checkbox"
                    checked={opt.checked}
                    onChange={opt.onChange}
                    className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 cursor-pointer accent-violet-700"
                  />
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-violet-100 dark:border-violet-500/20 flex items-center justify-between bg-violet-50/40 dark:bg-violet-950/20">
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs font-bold text-violet-700 dark:text-violet-300 hover:underline transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{language === "ar" ? "مسح الكل" : "Clear All"}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-violet-700 via-purple-600 to-fuchsia-600 hover:from-violet-600 hover:to-fuchsia-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
          >
            {language === "ar" ? "تطبيق الفلاتر" : "Show Results"}
          </button>
        </div>
      </div>
    </div>
  );
}
