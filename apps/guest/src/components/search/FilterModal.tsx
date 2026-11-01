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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-[#12101F] border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
          <h3 className="font-extrabold text-lg text-gray-900 dark:text-white">
            {language === "ar" ? "تصفية متقدمة" : "All Filters"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
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
                  className={`p-3 rounded-2xl border text-left rtl:text-right font-medium transition-all cursor-pointer flex items-center justify-between ${
                    selectedCategory === t.id
                      ? "border-violet-600 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 font-bold"
                      : "border-gray-200 dark:border-white/10 hover:border-gray-300 text-gray-700 dark:text-gray-300"
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
              <div className="flex-1 p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5">
                <span className="text-[11px] text-gray-400 block mb-0.5">
                  {language === "ar" ? "الحد الأدنى" : "Min Price"}
                </span>
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(Number(e.target.value))}
                  className="w-full bg-transparent font-bold text-sm text-gray-900 dark:text-white focus:outline-none"
                  min={0}
                  step={50}
                />
              </div>
              <span className="text-gray-400 font-bold">—</span>
              <div className="flex-1 p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5">
                <span className="text-[11px] text-gray-400 block mb-0.5">
                  {language === "ar" ? "الحد الأقصى" : "Max Price"}
                </span>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full bg-transparent font-bold text-sm text-gray-900 dark:text-white focus:outline-none"
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
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    bedrooms === n
                      ? "border-violet-600 bg-violet-600 text-white"
                      : "border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-gray-400"
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
                  className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 cursor-pointer transition-colors"
                >
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {language === "ar" ? opt.labelAr : opt.labelEn}
                  </span>
                  <input
                    type="checkbox"
                    checked={opt.checked}
                    onChange={opt.onChange}
                    className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 cursor-pointer"
                  />
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200 dark:border-white/10 flex items-center justify-between bg-gray-50 dark:bg-white/5">
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{language === "ar" ? "مسح الكل" : "Clear All"}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
          >
            {language === "ar" ? "تطبيق الفلاتر" : "Show Results"}
          </button>
        </div>
      </div>
    </div>
  );
}
