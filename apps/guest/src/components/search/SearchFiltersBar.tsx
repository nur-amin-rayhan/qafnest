"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  ArrowDownUp,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { FilterCategoryPopover } from "./filters/FilterCategoryPopover";
import { FilterDistrictPopover } from "./filters/FilterDistrictPopover";
import { FilterPricePopover } from "./filters/FilterPricePopover";
import { FilterDirectionPopover } from "./filters/FilterDirectionPopover";
import { FilterRatingPopover } from "./filters/FilterRatingPopover";
import { FilterSortPopover } from "./filters/FilterSortPopover";
import { SearchFilterPills } from "./filters/SearchFilterPills";

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
  const containerRef = useRef<HTMLDivElement>(null);

  // Popover state & dynamic horizontal offset so popovers render outside overflow-x-auto without clipping
  const [activePopover, setActivePopover] = useState<string | null>(null);
  const [popoverOffsetLeft, setPopoverOffsetLeft] = useState<number>(0);

  // Close popover when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActivePopover(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActivePopover(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
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

  const togglePopover = (name: string, event: React.MouseEvent<HTMLButtonElement>) => {
    if (activePopover === name) {
      setActivePopover(null);
      return;
    }
    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const btnRect = event.currentTarget.getBoundingClientRect();
      const maxLeft = Math.max(0, containerRect.width - 240);
      const rawLeft = btnRect.left - containerRect.left;
      setPopoverOffsetLeft(Math.min(Math.max(0, rawLeft), maxLeft));
    }
    setActivePopover(name);
  };

  const pillActiveClass =
    "border-violet-600 bg-gradient-to-r from-violet-600/15 via-purple-600/10 to-fuchsia-600/15 dark:from-violet-950/60 dark:to-fuchsia-950/40 text-violet-800 dark:text-violet-200 shadow-xs";
  const pillInactiveClass =
    "border-violet-200/80 dark:border-violet-500/20 bg-violet-50/35 dark:bg-[#12101a] text-gray-800 dark:text-gray-200 hover:border-violet-400 hover:bg-violet-50/70 dark:hover:border-violet-400/40";

  return (
    <div ref={containerRef} className="relative z-30 py-2">
      <div className="flex items-center gap-2">
        {/* Left Scroll Arrow */}
        <button
          type="button"
          onClick={() => scroll("left")}
          className="hidden sm:flex h-8 w-8 shrink-0 rounded-full border border-violet-200/80 dark:border-violet-500/25 hover:border-violet-500 bg-white dark:bg-[#12101a] text-violet-700 dark:text-violet-300 items-center justify-center transition-all shadow-xs active:scale-95 cursor-pointer"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
        </button>

        {/* Filter Pills Carousel */}
        <SearchFilterPills
          scrollRef={scrollRef as React.RefObject<HTMLDivElement>}
          language={language}
          activeFilterCount={activeFilterCount}
          onOpenFilterModal={onOpenFilterModal}
          activePopover={activePopover}
          togglePopover={togglePopover}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          apartmentCount={apartmentCount}
          selectedDistrict={selectedDistrict}
          priceRange={priceRange}
          dealsOnly={dealsOnly}
          setDealsOnly={setDealsOnly}
          selectedDirection={selectedDirection}
          minRating={minRating}
        />

        {/* Right Scroll Arrow */}
        <button
          type="button"
          onClick={() => scroll("right")}
          className="hidden sm:flex h-8 w-8 shrink-0 rounded-full border border-violet-200/80 dark:border-violet-500/25 hover:border-violet-500 bg-white dark:bg-[#12101a] text-violet-700 dark:text-violet-300 items-center justify-center transition-all shadow-xs active:scale-95 cursor-pointer"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-4 h-4 rtl:rotate-180" />
        </button>

        {/* Sort Button */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={(e) => togglePopover("sort", e)}
            className={`inline-flex items-center gap-1.5 rounded-2xl border px-3.5 py-2 text-xs font-bold shadow-xs transition cursor-pointer ${
              sortBy !== "recommended" ? pillActiveClass : pillInactiveClass
            }`}
            aria-expanded={activePopover === "sort"}
          >
            <ArrowDownUp className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
            <span className="hidden sm:inline">{language === "ar" ? "ترتيب" : "Sort"}</span>
            <ChevronDown
              className={`w-3 h-3 text-violet-600 dark:text-violet-400 transition-transform ${
                activePopover === "sort" ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Floating Popovers */}
      {activePopover === "category" && (
        <FilterCategoryPopover
          language={language}
          popoverOffsetLeft={popoverOffsetLeft}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          onClose={() => setActivePopover(null)}
        />
      )}

      {activePopover === "district" && (
        <FilterDistrictPopover
          language={language}
          popoverOffsetLeft={popoverOffsetLeft}
          selectedDistrict={selectedDistrict}
          setSelectedDistrict={setSelectedDistrict}
          availableDistricts={availableDistricts}
          onClose={() => setActivePopover(null)}
        />
      )}

      {activePopover === "price" && (
        <FilterPricePopover
          language={language}
          popoverOffsetLeft={popoverOffsetLeft}
          priceRange={priceRange}
          setPriceRange={setPriceRange}
          onClose={() => setActivePopover(null)}
        />
      )}

      {activePopover === "direction" && (
        <FilterDirectionPopover
          language={language}
          popoverOffsetLeft={popoverOffsetLeft}
          selectedDirection={selectedDirection}
          setSelectedDirection={setSelectedDirection}
          onClose={() => setActivePopover(null)}
        />
      )}

      {activePopover === "rating" && (
        <FilterRatingPopover
          language={language}
          popoverOffsetLeft={popoverOffsetLeft}
          minRating={minRating}
          setMinRating={setMinRating}
          onClose={() => setActivePopover(null)}
        />
      )}

      {activePopover === "sort" && (
        <FilterSortPopover
          language={language}
          sortBy={sortBy}
          setSortBy={setSortBy}
          onClose={() => setActivePopover(null)}
        />
      )}
    </div>
  );
}
