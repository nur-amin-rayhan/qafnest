"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  SlidersHorizontal,
  ArrowDownUp,
  Home,
  MapPin,
  Tag,
  Percent,
  Compass,
  Star,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
} from "lucide-react";
import { useApp } from "@/context/AppContext";

interface SearchFiltersBarProps {
  totalCount: number;
  apartmentCount: number;
  sortBy: "recommended" | "price-low" | "price-high" | "rating" | "reviews";
  setSortBy: (sort: "recommended" | "price-low" | "price-high" | "rating" | "reviews") => void;
  selectedDistrict: string;
  setSelectedDistrict: (d: string) => void;
  availableDistricts: string[];
  priceRange: "all" | "under500" | "500to1000" | "above1000";
  setPriceRange: (p: "all" | "under500" | "500to1000" | "above1000") => void;
  dealsOnly: boolean;
  setDealsOnly: (d: boolean) => void;
  instantOnly: boolean;
  poolOnly: boolean;
  selfCheckinOnly: boolean;
  minPrice: number;
  maxPrice: number;
  bedrooms: number;
  selectedDirection: "all" | "north" | "south" | "east" | "west";
  setSelectedDirection: (d: "all" | "north" | "south" | "east" | "west") => void;
  minRating: number;
  setMinRating: (r: number) => void;
  onOpenFilterModal: () => void;
}

export default function SearchFiltersBar({
  apartmentCount,
  sortBy,
  setSortBy,
  selectedDistrict,
  setSelectedDistrict,
  availableDistricts,
  priceRange,
  setPriceRange,
  dealsOnly,
  setDealsOnly,
  instantOnly,
  poolOnly,
  selfCheckinOnly,
  minPrice,
  maxPrice,
  bedrooms,
  selectedDirection,
  setSelectedDirection,
  minRating,
  setMinRating,
  onOpenFilterModal,
}: SearchFiltersBarProps) {
  const { language, selectedCategory, setSelectedCategory } = useApp();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Popover state
  const [activePopover, setActivePopover] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActivePopover(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const delta = dir === "left" ? -240 : 240;
    scrollRef.current.scrollBy({ left: delta, behavior: "smooth" });
  };

  // Calculate active filter count
  let activeFilterCount = 0;
  if (selectedDistrict !== "all") activeFilterCount++;
  if (priceRange !== "all") activeFilterCount++;
  if (dealsOnly) activeFilterCount++;
  if (selectedDirection !== "all") activeFilterCount++;
  if (minRating > 0) activeFilterCount++;
  if (selectedCategory !== "all") activeFilterCount++;
  if (minPrice > 0 || maxPrice < 5000) activeFilterCount++;
  if (bedrooms > 0) activeFilterCount++;
  if (instantOnly) activeFilterCount++;
  if (poolOnly) activeFilterCount++;
  if (selfCheckinOnly) activeFilterCount++;

  const togglePopover = (name: string) => {
    setActivePopover(activePopover === name ? null : name);
  };

  return (
    <div ref={containerRef} className="relative z-30 py-3 border-b border-gray-200/80 dark:border-white/10">
      <div className="flex items-center gap-2">
        {/* Left Scroll Arrow */}
        <button
          type="button"
          onClick={() => scroll("left")}
          className="hidden sm:flex h-8 w-8 shrink-0 rounded-full border border-gray-200 dark:border-white/10 hover:border-gray-400 dark:hover:border-white/30 bg-white dark:bg-[#12101a] text-gray-700 dark:text-gray-200 items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
        </button>

        {/* Filter Pills Carousel */}
        <div
          ref={scrollRef}
          className="flex items-center gap-2.5 overflow-x-auto no-scrollbar scroll-smooth py-1 px-1 -mx-1"
        >
          {/* 1. All Filters Button */}
          <button
            type="button"
            onClick={onOpenFilterModal}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer border ${
              activeFilterCount > 0
                ? "border-violet-600 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 shadow-sm"
                : "border-gray-200 dark:border-white/15 bg-white dark:bg-[#12101a] text-gray-800 dark:text-gray-200 hover:border-gray-400"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
            <span>{language === "ar" ? "تصفية" : "Filter"}</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-violet-600 text-white text-[10px] flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* 2. Quick Category / Apartment Pill */}
          <button
            type="button"
            onClick={() =>
              setSelectedCategory(selectedCategory === "penthouse" ? "all" : "penthouse")
            }
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer border ${
              selectedCategory === "penthouse"
                ? "border-violet-600 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300"
                : "border-gray-200 dark:border-white/15 bg-white dark:bg-[#12101a] text-gray-800 dark:text-gray-200 hover:border-gray-400"
            }`}
          >
            <Home className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
            <span>
              {language === "ar" ? "شقق مخدومة" : "Apartment"} ({apartmentCount})
            </span>
          </button>

          {/* 3. District Dropdown */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => togglePopover("district")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                selectedDistrict !== "all"
                  ? "border-violet-600 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300"
                  : "border-gray-200 dark:border-white/15 bg-white dark:bg-[#12101a] text-gray-800 dark:text-gray-200 hover:border-gray-400"
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
              <span>
                {selectedDistrict !== "all"
                  ? selectedDistrict
                  : language === "ar"
                  ? "الحي"
                  : "District"}
              </span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {activePopover === "district" && (
              <div className="absolute top-full left-0 rtl:left-auto rtl:right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-[#14121F] border border-gray-200 dark:border-white/10 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="text-[11px] font-bold text-gray-400 dark:text-gray-500 px-3 py-1.5 uppercase tracking-wider">
                  {language === "ar" ? "اختر الحي" : "Choose District"}
                </div>
                <div className="max-h-52 overflow-y-auto space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDistrict("all");
                      setActivePopover(null);
                    }}
                    className={`w-full text-left rtl:text-right px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between cursor-pointer ${
                      selectedDistrict === "all"
                        ? "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 font-bold"
                        : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5"
                    }`}
                  >
                    <span>{language === "ar" ? "جميع الأحياء" : "All Districts"}</span>
                    {selectedDistrict === "all" && <Check className="w-3.5 h-3.5 text-violet-600" />}
                  </button>
                  {availableDistricts.map((dist) => (
                    <button
                      key={dist}
                      type="button"
                      onClick={() => {
                        setSelectedDistrict(dist);
                        setActivePopover(null);
                      }}
                      className={`w-full text-left rtl:text-right px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between cursor-pointer ${
                        selectedDistrict === dist
                          ? "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 font-bold"
                          : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5"
                      }`}
                    >
                      <span>{dist}</span>
                      {selectedDistrict === dist && <Check className="w-3.5 h-3.5 text-violet-600" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 4. Total Price Dropdown */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => togglePopover("price")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                priceRange !== "all"
                  ? "border-violet-600 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300"
                  : "border-gray-200 dark:border-white/15 bg-white dark:bg-[#12101a] text-gray-800 dark:text-gray-200 hover:border-gray-400"
              }`}
            >
              <Tag className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
              <span>
                {priceRange === "under500"
                  ? "< 500 SAR"
                  : priceRange === "500to1000"
                  ? "500 - 1000 SAR"
                  : priceRange === "above1000"
                  ? "> 1000 SAR"
                  : language === "ar"
                  ? "السعر الإجمالي"
                  : "Total Price"}
              </span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {activePopover === "price" && (
              <div className="absolute top-full left-0 rtl:left-auto rtl:right-0 mt-2 w-52 rounded-2xl bg-white dark:bg-[#14121F] border border-gray-200 dark:border-white/10 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="text-[11px] font-bold text-gray-400 dark:text-gray-500 px-3 py-1.5 uppercase tracking-wider">
                  {language === "ar" ? "نطاق السعر" : "Price Range"}
                </div>
                {[
                  { id: "all", labelEn: "All Prices", labelAr: "جميع الأسعار" },
                  { id: "under500", labelEn: "Under 500 SAR", labelAr: "أقل من 500 ر.س" },
                  { id: "500to1000", labelEn: "500 - 1,000 SAR", labelAr: "500 - 1,000 ر.س" },
                  { id: "above1000", labelEn: "Above 1,000 SAR", labelAr: "أكثر من 1,000 ر.س" },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setPriceRange(p.id as "all" | "under500" | "500to1000" | "above1000");
                      setActivePopover(null);
                    }}
                    className={`w-full text-left rtl:text-right px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between cursor-pointer ${
                      priceRange === p.id
                        ? "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 font-bold"
                        : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5"
                    }`}
                  >
                    <span>{language === "ar" ? p.labelAr : p.labelEn}</span>
                    {priceRange === p.id && <Check className="w-3.5 h-3.5 text-violet-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 5. Deals & Discounts Pill Toggle */}
          <button
            type="button"
            onClick={() => setDealsOnly(!dealsOnly)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer border ${
              dealsOnly
                ? "border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                : "border-gray-200 dark:border-white/15 bg-white dark:bg-[#12101a] text-gray-800 dark:text-gray-200 hover:border-gray-400"
            }`}
          >
            <Percent className="w-3.5 h-3.5 text-rose-500" />
            <span>{language === "ar" ? "العروض والخصومات" : "Deals & discounts"}</span>
          </button>

          {/* 6. Direction Dropdown */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => togglePopover("direction")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                selectedDirection !== "all"
                  ? "border-violet-600 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300"
                  : "border-gray-200 dark:border-white/15 bg-white dark:bg-[#12101a] text-gray-800 dark:text-gray-200 hover:border-gray-400"
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
              <span>
                {selectedDirection === "north"
                  ? language === "ar" ? "شمال الرياض" : "North"
                  : selectedDirection === "east"
                  ? language === "ar" ? "شرق الرياض" : "East"
                  : selectedDirection === "west"
                  ? language === "ar" ? "غرب الرياض" : "West"
                  : selectedDirection === "south"
                  ? language === "ar" ? "جنوب الرياض" : "South"
                  : language === "ar"
                  ? "الاتجاه"
                  : "Direction"}
              </span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {activePopover === "direction" && (
              <div className="absolute top-full left-0 rtl:left-auto rtl:right-0 mt-2 w-48 rounded-2xl bg-white dark:bg-[#14121F] border border-gray-200 dark:border-white/10 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="text-[11px] font-bold text-gray-400 dark:text-gray-500 px-3 py-1.5 uppercase tracking-wider">
                  {language === "ar" ? "اتجاه المدينة" : "City Direction"}
                </div>
                {[
                  { id: "all", labelEn: "All Directions", labelAr: "جميع الاتجاهات" },
                  { id: "north", labelEn: "North", labelAr: "شمال الرياض" },
                  { id: "east", labelEn: "East", labelAr: "شرق الرياض" },
                  { id: "west", labelEn: "West", labelAr: "غرب الرياض" },
                  { id: "south", labelEn: "South", labelAr: "جنوب الرياض" },
                ].map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => {
                      setSelectedDirection(d.id as "all" | "north" | "south" | "east" | "west");
                      setActivePopover(null);
                    }}
                    className={`w-full text-left rtl:text-right px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between cursor-pointer ${
                      selectedDirection === d.id
                        ? "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 font-bold"
                        : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5"
                    }`}
                  >
                    <span>{language === "ar" ? d.labelAr : d.labelEn}</span>
                    {selectedDirection === d.id && <Check className="w-3.5 h-3.5 text-violet-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 7. Rating Dropdown */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => togglePopover("rating")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                minRating > 0
                  ? "border-violet-600 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300"
                  : "border-gray-200 dark:border-white/15 bg-white dark:bg-[#12101a] text-gray-800 dark:text-gray-200 hover:border-gray-400"
              }`}
            >
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>
                {minRating > 0
                  ? `★ ${minRating.toFixed(1)}+`
                  : language === "ar"
                  ? "التقييم"
                  : "Rating"}
              </span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {activePopover === "rating" && (
              <div className="absolute top-full right-0 rtl:right-auto rtl:left-0 mt-2 w-48 rounded-2xl bg-white dark:bg-[#14121F] border border-gray-200 dark:border-white/10 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="text-[11px] font-bold text-gray-400 dark:text-gray-500 px-3 py-1.5 uppercase tracking-wider">
                  {language === "ar" ? "الحد الأدنى للتقييم" : "Minimum Rating"}
                </div>
                {[
                  { val: 0, labelEn: "All Ratings", labelAr: "جميع التقييمات" },
                  { val: 10, labelEn: "★ 10.0 Only", labelAr: "★ 10.0 فقط" },
                  { val: 9.5, labelEn: "★ 9.5 and above", labelAr: "★ 9.5 وأعلى" },
                  { val: 9.0, labelEn: "★ 9.0 and above", labelAr: "★ 9.0 وأعلى" },
                ].map((r) => (
                  <button
                    key={r.val}
                    type="button"
                    onClick={() => {
                      setMinRating(r.val);
                      setActivePopover(null);
                    }}
                    className={`w-full text-left rtl:text-right px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between cursor-pointer ${
                      minRating === r.val
                        ? "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 font-bold"
                        : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5"
                    }`}
                  >
                    <span>{language === "ar" ? r.labelAr : r.labelEn}</span>
                    {minRating === r.val && <Check className="w-3.5 h-3.5 text-violet-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Scroll Arrow */}
        <button
          type="button"
          onClick={() => scroll("right")}
          className="hidden sm:flex h-8 w-8 shrink-0 rounded-full border border-gray-200 dark:border-white/10 hover:border-gray-400 dark:hover:border-white/30 bg-white dark:bg-[#12101a] text-gray-700 dark:text-gray-200 items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-4 h-4 rtl:rotate-180" />
        </button>
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => togglePopover("sort")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-800 shadow-sm transition hover:border-violet-400 dark:border-white/15 dark:bg-[#12101a] dark:text-gray-200"
            aria-expanded={activePopover === "sort"}
          >
            <ArrowDownUp className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
            <span className="hidden sm:inline">{language === "ar" ? "ترتيب" : "Sort"}</span>
          </button>
          {activePopover === "sort" && (
            <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-[#14121F]">
              <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {language === "ar" ? "ترتيب النتائج" : "Sort results"}
              </div>
              {[
                { id: "recommended", en: "Recommended", ar: "موصى به" },
                { id: "price-low", en: "Price: low to high", ar: "السعر: الأقل أولاً" },
                { id: "price-high", en: "Price: high to low", ar: "السعر: الأعلى أولاً" },
                { id: "rating", en: "Top rated", ar: "الأعلى تقييماً" },
                { id: "reviews", en: "Most reviewed", ar: "الأكثر تقييماً" },
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setSortBy(option.id as typeof sortBy);
                    setActivePopover(null);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-medium rtl:text-right ${
                    sortBy === option.id
                      ? "bg-violet-50 font-bold text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/5"
                  }`}
                >
                  <span>{language === "ar" ? option.ar : option.en}</span>
                  {sortBy === option.id && <Check className="h-3.5 w-3.5 text-violet-600" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
