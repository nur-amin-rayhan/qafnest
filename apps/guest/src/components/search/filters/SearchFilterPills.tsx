"use client";

import React, { RefObject } from "react";
import {
  SlidersHorizontal,
  Home,
  MapPin,
  Tag,
  Percent,
  Compass,
  Star,
  ChevronDown,
  Building2,
} from "lucide-react";
import { getLocalizedDistrictName } from "@/lib/localization/localeHelper";

interface SearchFilterPillsProps {
  scrollRef: RefObject<HTMLDivElement>;
  language: string;
  activeFilterCount: number;
  onOpenFilterModal: () => void;
  activePopover: string | null;
  togglePopover: (name: string, event: React.MouseEvent<HTMLButtonElement>) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  apartmentCount: number;
  selectedDistrict: string;
  priceRange: "all" | "under500" | "500to1000" | "above1000";
  dealsOnly: boolean;
  setDealsOnly: (d: boolean) => void;
  selectedDirection: "all" | "north" | "south" | "east" | "west";
  minRating: number;
}

const pillBaseClass =
  "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold shrink-0 transition-all cursor-pointer border";
const pillActiveClass =
  "border-violet-600 bg-gradient-to-r from-violet-600/15 via-purple-600/10 to-fuchsia-600/15 dark:from-violet-950/60 dark:to-fuchsia-950/40 text-violet-800 dark:text-violet-200 shadow-xs";
const pillInactiveClass =
  "border-violet-200/80 dark:border-violet-500/20 bg-violet-50/35 dark:bg-[#12101a] text-gray-800 dark:text-gray-200 hover:border-violet-400 hover:bg-violet-50/70 dark:hover:border-violet-400/40";

export function SearchFilterPills({
  scrollRef,
  language,
  activeFilterCount,
  onOpenFilterModal,
  activePopover,
  togglePopover,
  selectedCategory,
  setSelectedCategory,
  apartmentCount,
  selectedDistrict,
  priceRange,
  dealsOnly,
  setDealsOnly,
  selectedDirection,
  minRating,
}: SearchFilterPillsProps) {
  return (
    <div
      ref={scrollRef}
      className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1 px-1"
    >
      {/* 1. All Filters Button */}
      <button
        type="button"
        onClick={onOpenFilterModal}
        className={`${pillBaseClass} ${
          activeFilterCount > 0 ? pillActiveClass : pillInactiveClass
        }`}
      >
        <SlidersHorizontal className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
        <span>{language === "ar" ? "تصفية" : "Filter"}</span>
        {activeFilterCount > 0 && (
          <span className="w-4 h-4 rounded-full bg-gradient-to-r from-violet-700 to-fuchsia-600 text-white text-[10px] flex items-center justify-center font-extrabold">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* 2. Property Category Dropdown Pill */}
      <button
        type="button"
        onClick={(e) => togglePopover("category", e)}
        className={`${pillBaseClass} ${
          selectedCategory !== "all" ? pillActiveClass : pillInactiveClass
        }`}
      >
        <Building2 className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
        <span>
          {selectedCategory === "all"
            ? language === "ar"
              ? "نوع العقار"
              : "Property Type"
            : selectedCategory === "chalet"
            ? language === "ar"
              ? "شاليهات ومنتجعات"
              : "Chalets & Resorts"
            : selectedCategory === "villa"
            ? language === "ar"
              ? "فلل خاصة"
              : "Villas"
            : selectedCategory === "farm"
            ? language === "ar"
              ? "مزارع"
              : "Farms"
            : selectedCategory === "camp"
            ? language === "ar"
              ? "مخيمات"
              : "Camps"
            : language === "ar"
            ? "شقق مخدومة"
            : "Apartments"}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-violet-600 dark:text-violet-400 transition-transform ${
            activePopover === "category" ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* 3. Quick Apartment Toggle Pill */}
      <button
        type="button"
        onClick={() =>
          setSelectedCategory(selectedCategory === "penthouse" ? "all" : "penthouse")
        }
        className={`${pillBaseClass} ${
          selectedCategory === "penthouse" ? pillActiveClass : pillInactiveClass
        }`}
      >
        <Home className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
        <span>
          {language === "ar" ? "شقق مخدومة" : "Apartment"} ({apartmentCount})
        </span>
      </button>

      {/* 4. District Dropdown Pill */}
      <button
        type="button"
        onClick={(e) => togglePopover("district", e)}
        className={`${pillBaseClass} ${
          selectedDistrict !== "all" ? pillActiveClass : pillInactiveClass
        }`}
      >
        <MapPin className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
        <span>
          {selectedDistrict !== "all"
            ? getLocalizedDistrictName(selectedDistrict, language === "ar" ? "ar" : "en") || selectedDistrict
            : language === "ar"
            ? "الحي"
            : "District"}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-violet-600 dark:text-violet-400 transition-transform ${
            activePopover === "district" ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* 5. Total Price Dropdown Pill */}
      <button
        type="button"
        onClick={(e) => togglePopover("price", e)}
        className={`${pillBaseClass} ${
          priceRange !== "all" ? pillActiveClass : pillInactiveClass
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
        <ChevronDown
          className={`w-3 h-3 text-violet-600 dark:text-violet-400 transition-transform ${
            activePopover === "price" ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* 6. Deals & Discounts Pill Toggle */}
      <button
        type="button"
        onClick={() => setDealsOnly(!dealsOnly)}
        className={`${pillBaseClass} ${
          dealsOnly
            ? "border-rose-400 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 shadow-xs"
            : pillInactiveClass
        }`}
      >
        <Percent className="w-3.5 h-3.5 text-rose-500" />
        <span>{language === "ar" ? "العروض والخصومات" : "Deals & discounts"}</span>
      </button>

      {/* 7. Direction Dropdown Pill */}
      <button
        type="button"
        onClick={(e) => togglePopover("direction", e)}
        className={`${pillBaseClass} ${
          selectedDirection !== "all" ? pillActiveClass : pillInactiveClass
        }`}
      >
        <Compass className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
        <span>
          {selectedDirection === "north"
            ? language === "ar"
              ? "الشمال"
              : "North"
            : selectedDirection === "east"
            ? language === "ar"
              ? "الشرق"
              : "East"
            : selectedDirection === "west"
            ? language === "ar"
              ? "الغرب"
              : "West"
            : selectedDirection === "south"
            ? language === "ar"
              ? "الجنوب"
              : "South"
            : language === "ar"
            ? "الاتجاه"
            : "Direction"}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-violet-600 dark:text-violet-400 transition-transform ${
            activePopover === "direction" ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* 8. Rating Dropdown Pill */}
      <button
        type="button"
        onClick={(e) => togglePopover("rating", e)}
        className={`${pillBaseClass} ${
          minRating > 0 ? pillActiveClass : pillInactiveClass
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
        <ChevronDown
          className={`w-3 h-3 text-violet-600 dark:text-violet-400 transition-transform ${
            activePopover === "rating" ? "rotate-180" : ""
          }`}
        />
      </button>
    </div>
  );
}

