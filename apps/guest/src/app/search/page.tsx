"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { ChevronRight, RotateCcw } from "lucide-react";
import { localizePath } from "@/lib/localization/localeHelper";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import SmoothScroll from "@/components/common/SmoothScroll";
import AuthModal from "@/components/modals/AuthModal";
import SearchFiltersBar from "@/components/search/SearchFiltersBar";
import PopularCitiesSection from "@/components/search/PopularCitiesSection";
import FilterModal from "@/components/search/FilterModal";
import SearchHeaderBar from "@/components/search/SearchHeaderBar";
import SearchResultsSection from "@/components/search/SearchResultsSection";
import { useSearchPageFilters } from "./hooks/useSearchPageFilters";

function SearchContent() {
  const {
    language,
    activeCity,
    cityName,
    selectedCategory,
    setSelectedCategory,
    instantOnly,
    setInstantOnly,
    poolOnly,
    setPoolOnly,
    selfCheckinOnly,
    setSelfCheckinOnly,
    checkinDate,
    setCheckinDate,
    checkoutDate,
    setCheckoutDate,
    guestsCount,
    adults,
    setAdults,
    children,
    setChildren,
    viewMode,
    setViewMode,
    selectedMapPropertyId,
    setSelectedMapPropertyId,
    sortBy,
    setSortBy,
    selectedDistrict,
    setSelectedDistrict,
    priceRange,
    setPriceRange,
    dealsOnly,
    setDealsOnly,
    selectedDirection,
    setSelectedDirection,
    minRating,
    setMinRating,
    isFilterModalOpen,
    setIsFilterModalOpen,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    bedrooms,
    setBedrooms,
    isStickyScrolled,
    filteredProperties,
    sortedProperties,
    availableDistricts,
    apartmentCount,
    handleResetFilters,
    selectCity,
    handleSearch,
    hasActiveFilters,
  } = useSearchPageFilters();

  return (
    <div className="min-h-screen bg-white dark:bg-[#08070D] text-gray-900 dark:text-gray-100 flex flex-col">
      <SmoothScroll />
      <Navbar />

      <main className="flex-grow pt-20 sm:pt-22 pb-16">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs (Home > Search > City) */}
          <nav className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 py-2">
            <Link href={localizePath("/", language)} className="hover:text-violet-600 transition-colors">
              {language === "ar" ? "الرئيسية" : "Home"}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
            <Link href={localizePath("/search", language)} className="hover:text-violet-600 transition-colors">
              {language === "ar" ? "البحث" : "Search"}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
            <span className="font-semibold text-violet-700 dark:text-violet-300">
              {cityName}
            </span>
          </nav>

          {/* Sticky Search Header & Filter Bar */}
          <div
            className={`lg:sticky lg:top-[64px] z-40 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 pt-2 pb-1.5 transition-all duration-200 ${isStickyScrolled
                ? "bg-white/95 dark:bg-[#08070D]/95 backdrop-blur-xl border-b border-violet-200/80 dark:border-violet-500/20 shadow-[0_12px_34px_rgba(109,40,217,0.08)]"
                : "bg-white/90 dark:bg-[#08070D]/90 backdrop-blur-md border-b border-violet-100/80 dark:border-white/10"
              }`}
          >
            {/* Modular Search Header Bar */}
            <SearchHeaderBar
              language={language}
              cityName={cityName}
              activeCity={activeCity}
              selectCity={selectCity}
              checkinDate={checkinDate}
              setCheckinDate={setCheckinDate}
              checkoutDate={checkoutDate}
              setCheckoutDate={setCheckoutDate}
              guestsCount={guestsCount}
              adults={adults}
              setAdults={setAdults}
              childrenCount={children}
              setChildren={setChildren}
              rooms={bedrooms > 0 ? bedrooms : 1}
              setRooms={setBedrooms}
              viewMode={viewMode}
              setViewMode={setViewMode}
              onSearch={handleSearch}
            />

            {/* Horizontal Filter Chips Bar */}
            <SearchFiltersBar
              totalCount={filteredProperties.length}
              apartmentCount={apartmentCount}
              sortBy={sortBy}
              setSortBy={setSortBy}
              selectedDistrict={selectedDistrict}
              setSelectedDistrict={setSelectedDistrict}
              availableDistricts={availableDistricts}
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              dealsOnly={dealsOnly}
              setDealsOnly={setDealsOnly}
              instantOnly={instantOnly}
              poolOnly={poolOnly}
              selfCheckinOnly={selfCheckinOnly}
              minPrice={minPrice}
              maxPrice={maxPrice}
              bedrooms={bedrooms}
              selectedDirection={selectedDirection}
              setSelectedDirection={setSelectedDirection}
              minRating={minRating}
              setMinRating={setMinRating}
              onOpenFilterModal={() => setIsFilterModalOpen(true)}
            />
          </div>

          {/* Total Count Header */}
          <div id="search-results" className="flex items-center justify-between mt-5 mb-5 scroll-mt-44">
            <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white">
              {filteredProperties.length}{" "}
              {language === "ar"
                ? `عقار متاح في ${cityName}`
                : `Properties in ${cityName}`}
            </h1>

            {/* Clear Filters shortcut */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-bold text-violet-700 hover:text-violet-800 dark:text-violet-300 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200/80 dark:border-violet-500/25 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{language === "ar" ? "إعادة تعيين الفلاتر" : "Reset Filters"}</span>
              </button>
            )}
          </div>

          {/* Results: Interactive Map View / 3-Column Grid / Empty State */}
          <SearchResultsSection
            viewMode={viewMode}
            setViewMode={setViewMode}
            sortedProperties={sortedProperties}
            filteredCount={filteredProperties.length}
            selectedMapPropertyId={selectedMapPropertyId}
            setSelectedMapPropertyId={setSelectedMapPropertyId}
            language={language}
            onResetFilters={handleResetFilters}
          />

          {/* Popular Cities Last Week */}
          <PopularCitiesSection
            onSelectCity={(cityId) => {
              selectCity(cityId);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </div>
      </main>

      <Footer />

      {/* Modals */}
      <AuthModal />
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        instantOnly={instantOnly}
        setInstantOnly={setInstantOnly}
        poolOnly={poolOnly}
        setPoolOnly={setPoolOnly}
        selfCheckinOnly={selfCheckinOnly}
        setSelfCheckinOnly={setSelfCheckinOnly}
        minPrice={minPrice}
        setMinPrice={setMinPrice}
        maxPrice={maxPrice}
        setMaxPrice={setMaxPrice}
        bedrooms={bedrooms}
        setBedrooms={setBedrooms}
        onReset={handleResetFilters}
      />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#08070D]">
          <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
