"use client";

import React, { useState, useMemo, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  Map as MapIcon,
  Grid,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Sparkles,
  Minus,
  Plus,
} from "lucide-react";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import BookingModal from "@/components/modals/BookingModal";
import AuthModal from "@/components/modals/AuthModal";
import SearchPropertyCard from "@/components/search/SearchPropertyCard";
import SearchFiltersBar from "@/components/search/SearchFiltersBar";
import InteractiveMapView from "@/components/search/InteractiveMapView";
import PopularCitiesSection from "@/components/search/PopularCitiesSection";
import FilterModal from "@/components/search/FilterModal";
import { getPropertyCapacity, normalizeCityId } from "@/data/properties";
import { useProperties } from "@/hooks/useProperties";
import { CITY_NAMES_AR } from "@/data/translations";
import { useApp } from "@/context/AppContext";

const CITIES = [
  { id: "all", name: "All Saudi Destinations", nameAr: "جميع الوجهات" },
  { id: "riyadh", name: "Riyadh", nameAr: "الرياض" },
  { id: "jeddah", name: "Jeddah", nameAr: "جدة" },
  { id: "alula", name: "AlUla", nameAr: "العلا" },
  { id: "khobar", name: "Al Khobar", nameAr: "الخبر" },
  { id: "dammam", name: "Dammam", nameAr: "الدمام" },
  { id: "alhafuf", name: "Alhafuf and alahsa", nameAr: "الهفوف والأحساء" },
  { id: "abha", name: "Abha", nameAr: "أبها" },
  { id: "taif", name: "Taif", nameAr: "الطائف" },
  { id: "mecca", name: "Makkah", nameAr: "مكة المكرمة" },
  { id: "madinah", name: "Madinah", nameAr: "المدينة المنورة" },
  { id: "tabuk", name: "Tabuk", nameAr: "تبوك" },
  { id: "buraidah", name: "Buraidah", nameAr: "بريدة" },
];

function SearchContent() {
  const { properties } = useProperties();
  const searchParams = useSearchParams();
  const router = useRouter();
  const {
    language,
    selectedCity,
    setSelectedCity,
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
    setGuestsCount,
  } = useApp();

  // Initialize from URL params if present
  const searchParamString = searchParams.toString();
  useEffect(() => {
    const params = new URLSearchParams(searchParamString);
    const cityParam = params.get("city");
    const normalizedCity = cityParam ? normalizeCityId(cityParam) : null;
    if (normalizedCity) setSelectedCity(normalizedCity);

    const catParam = params.get("type") || params.get("category");
    if (catParam) setSelectedCategory(catParam);

    const checkinParam = params.get("check_in");
    if (checkinParam) setCheckinDate(checkinParam);
    const checkoutParam = params.get("check_out");
    if (checkoutParam) setCheckoutDate(checkoutParam);

    const guestsParam = params.get("guests");
    if (guestsParam) {
      const parsedGuests = Number(guestsParam);
      if (Number.isInteger(parsedGuests) && parsedGuests > 0) {
        setGuestsCount(parsedGuests);
      }
    }
  }, [
    searchParamString,
    setSelectedCity,
    setSelectedCategory,
    setCheckinDate,
    setCheckoutDate,
    setGuestsCount,
  ]);

  const activeCity = normalizeCityId(searchParams.get("city") || selectedCity);

  // View state: 'grid' | 'map'
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [selectedMapPropertyId, setSelectedMapPropertyId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"recommended" | "price-low" | "price-high" | "rating" | "reviews">("recommended");

  // Filter Bar States
  const [selectedDistrict, setSelectedDistrict] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<"all" | "under500" | "500to1000" | "above1000">("all");
  const [dealsOnly, setDealsOnly] = useState(false);
  const [selectedDirection, setSelectedDirection] = useState<"all" | "north" | "south" | "east" | "west">("all");
  const [minRating, setMinRating] = useState<number>(0);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Advanced price range numbers
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(5000);
  const [bedrooms, setBedrooms] = useState<number>(0);

  // Search Bar dropdowns: 'city' | 'date' | 'guests' | null
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [citySearch, setCitySearch] = useState("");
  const searchBarRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchBarRef.current && !searchBarRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter properties
  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      // 1. City match
      if (activeCity !== "all" && normalizeCityId(p.city) !== activeCity) return false;

      // 2. Category match
      if (selectedCategory !== "all" && p.category !== selectedCategory) return false;

      // 3. District match
      if (selectedDistrict !== "all") {
        const dist = p.district || "";
        if (!dist.toLowerCase().includes(selectedDistrict.toLowerCase())) return false;
      }

      // 4. Direction match
      if (selectedDirection !== "all" && p.direction !== selectedDirection) {
        return false;
      }

      // 5. Deals Only
      if (dealsOnly && (!p.discountPercentage || p.discountPercentage <= 0)) return false;

      // 6. Rating match
      if (minRating > 0 && p.rating < minRating) return false;

      // 7. Price range
      if (priceRange === "under500" && p.basePrice >= 500) return false;
      if (priceRange === "500to1000" && (p.basePrice < 500 || p.basePrice > 1000)) return false;
      if (priceRange === "above1000" && p.basePrice <= 1000) return false;

      if (p.basePrice < minPrice || p.basePrice > maxPrice) return false;

      // 8. Bedrooms
      if (bedrooms > 0 && (p.bedroomsCount || 1) < bedrooms) return false;

      // 9. Instant / Pool / Self-checkin
      if (instantOnly && !p.instantBook) return false;
      if (poolOnly && !p.hasPool) return false;
      if (selfCheckinOnly && !p.selfCheckin) return false;
      if (getPropertyCapacity(p) < guestsCount) return false;

      return true;
    });
  }, [
    activeCity,
    selectedCategory,
    selectedDistrict,
    selectedDirection,
    dealsOnly,
    minRating,
    priceRange,
    minPrice,
    maxPrice,
    bedrooms,
    instantOnly,
    poolOnly,
    selfCheckinOnly,
    guestsCount,
    properties,
  ]);

  const sortedProperties = useMemo(() => {
    if (sortBy === "recommended") return filteredProperties;
    return [...filteredProperties].sort((a, b) => {
      if (sortBy === "price-low" || sortBy === "price-high") {
        const priceA = a.basePrice;
        const priceB = b.basePrice;
        return sortBy === "price-low" ? priceA - priceB : priceB - priceA;
      }
      if (sortBy === "rating") return b.rating - a.rating || b.reviewsCount - a.reviewsCount;
      return b.reviewsCount - a.reviewsCount || b.rating - a.rating;
    });
  }, [filteredProperties, sortBy]);

  // Extract available districts for this city
  const availableDistricts = useMemo(() => {
    const set = new Set<string>();
    properties.filter((p) => activeCity === "all" || normalizeCityId(p.city) === activeCity).forEach((p) => {
      if (p.district) {
        const parts = p.district.split(",");
        const distName = parts.length > 1 ? parts[1].trim() : parts[0].trim();
        set.add(distName);
      }
    });
    return Array.from(set);
  }, [activeCity, properties]);

  // Count apartments
  const apartmentCount = useMemo(() => {
    return properties.filter(
      (p) =>
        (activeCity === "all" || normalizeCityId(p.city) === activeCity) &&
        getPropertyCapacity(p) >= guestsCount &&
        (p.category === "penthouse" || p.categoryName.toLowerCase().includes("apartment"))
    ).length;
  }, [activeCity, guestsCount, properties]);

  const handleResetFilters = () => {
    setSelectedDistrict("all");
    setPriceRange("all");
    setDealsOnly(false);
    setSelectedDirection("all");
    setMinRating(0);
    setMinPrice(0);
    setMaxPrice(5000);
    setBedrooms(0);
    setSelectedCategory("all");
    setInstantOnly(false);
    setPoolOnly(false);
    setSelfCheckinOnly(false);
  };

  const currentCityObj = CITIES.find((c) => c.id === activeCity) || {
    id: activeCity,
    name: activeCity,
    nameAr: CITY_NAMES_AR[activeCity] || activeCity,
  };
  const cityName = language === "ar" ? currentCityObj.nameAr : currentCityObj.name;

  const selectCity = (cityId: string) => {
    const normalizedCity = normalizeCityId(cityId);
    setSelectedCity(normalizedCity);
    setSelectedDistrict("all");
    setActiveDropdown(null);
    setCitySearch("");

    const params = new URLSearchParams(searchParamString);
    params.set("city", normalizedCity);
    params.set("type", selectedCategory);
    if (checkinDate) params.set("check_in", checkinDate);
    else params.delete("check_in");
    if (checkoutDate) params.set("check_out", checkoutDate);
    else params.delete("check_out");
    params.set("guests", String(guestsCount));
    router.replace(`/search?${params.toString()}`, { scroll: false });
  };

  const handleSearch = () => {
    setActiveDropdown(null);

    const params = new URLSearchParams(searchParamString);
    params.set("city", activeCity);
    params.set("type", selectedCategory);
    if (checkinDate) params.set("check_in", checkinDate);
    else params.delete("check_in");
    if (checkoutDate) params.set("check_out", checkoutDate);
    else params.delete("check_out");
    params.set("guests", String(guestsCount));
    router.replace(`/search?${params.toString()}`, { scroll: false });
    document.getElementById("search-results")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#08070D] text-gray-900 dark:text-gray-100 flex flex-col">
      <Navbar />

      <main className="flex-grow pt-20 sm:pt-22 pb-16">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* ========================================================= */}
          {/* 1. BREADCRUMBS (Home > Search > Riyadh)                   */}
          {/* ========================================================= */}
          <nav className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 py-2.5 mb-2">
            <Link href="/" className="hover:text-violet-600 transition-colors">
              {language === "ar" ? "الرئيسية" : "Home"}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
            <span>{language === "ar" ? "البحث" : "Search"}</span>
            <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              {cityName}
            </span>
          </nav>

          {/* ========================================================= */}
          {/* 2. GATHERN COMPACT INLINE SEARCH BAR                      */}
          {/* ========================================================= */}
          <div
            ref={searchBarRef}
            className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#12101F] shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-2 mb-4 relative z-40"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              {/* City Selector */}
              <div className="relative flex-1 px-3 py-1.5 border-b md:border-b-0 md:border-r border-gray-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === "city" ? null : "city")}
                  className="w-full text-left rtl:text-right flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block leading-tight">
                      {language === "ar" ? "المدينة" : "City"}
                    </span>
                    <span className="font-bold text-sm text-gray-900 dark:text-white">
                      {cityName}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {activeDropdown === "city" && (
                  <div className="absolute top-full left-0 mt-2 w-64 rounded-2xl bg-white dark:bg-[#151224] border border-gray-200 dark:border-white/10 shadow-xl p-2 z-50">
                    <input
                      type="text"
                      placeholder={language === "ar" ? "ابحث عن مدينة..." : "Search destination..."}
                      value={citySearch}
                      onChange={(e) => setCitySearch(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg text-xs bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 mb-2 focus:outline-none"
                    />
                    <div className="max-h-56 overflow-y-auto space-y-0.5">
                      {CITIES.filter((c) =>
                        c.name.toLowerCase().includes(citySearch.toLowerCase())
                      ).map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => selectCity(c.id)}
                          className={`w-full text-left rtl:text-right px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                            activeCity === c.id
                              ? "bg-violet-600 text-white"
                              : "hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-gray-200"
                          }`}
                        >
                          {language === "ar" ? c.nameAr : c.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Dates Indicator */}
              <div className="relative flex-1 px-3 py-1.5 border-b md:border-b-0 md:border-r border-gray-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === "date" ? null : "date")}
                  className="w-full text-left rtl:text-right flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block leading-tight">
                      {language === "ar" ? "تاريخ الحجز" : "Dates"}
                    </span>
                    <span className="font-bold text-sm text-gray-900 dark:text-white">
                      {checkinDate ? `${checkinDate} → ${checkoutDate || "..."}` : "Select dates"}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
                {activeDropdown === "date" && (
                  <div className="absolute top-full left-0 rtl:left-auto rtl:right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-[#151224] border border-gray-200 dark:border-white/10 shadow-xl p-4 z-50">
                    <div className="grid grid-cols-2 gap-3">
                      <label className="text-[10px] font-bold uppercase text-gray-400">
                        {language === "ar" ? "تسجيل الوصول" : "Check-in"}
                        <input
                          type="date"
                          value={checkinDate}
                          onChange={(event) => {
                            const nextCheckin = event.target.value;
                            setCheckinDate(nextCheckin);
                            if (checkoutDate && nextCheckin && checkoutDate <= nextCheckin) {
                              setCheckoutDate("");
                            }
                          }}
                          className="mt-1 w-full rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-2 py-2 text-xs text-gray-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
                        />
                      </label>
                      <label className="text-[10px] font-bold uppercase text-gray-400">
                        {language === "ar" ? "تسجيل المغادرة" : "Check-out"}
                        <input
                          type="date"
                          value={checkoutDate}
                          min={checkinDate || undefined}
                          onChange={(event) => setCheckoutDate(event.target.value)}
                          className="mt-1 w-full rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-2 py-2 text-xs text-gray-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
                        />
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveDropdown(null)}
                      className="mt-3 w-full rounded-lg bg-violet-600 px-3 py-2 text-xs font-bold text-white hover:bg-violet-700"
                    >
                      {language === "ar" ? "تم" : "Done"}
                    </button>
                  </div>
                )}
              </div>

              {/* Guests */}
              <div className="relative flex-1 px-3 py-1.5">
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === "guests" ? null : "guests")}
                  className="w-full text-left rtl:text-right flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block leading-tight">
                      {language === "ar" ? "الضيوف" : "Guests"}
                    </span>
                    <span className="font-bold text-sm text-gray-900 dark:text-white">
                      {guestsCount} {language === "ar" ? "ضيوف" : "Guests"}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
                {activeDropdown === "guests" && (
                  <div className="absolute top-full left-0 rtl:left-auto rtl:right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-[#151224] border border-gray-200 dark:border-white/10 shadow-xl p-4 z-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {language === "ar" ? "الضيوف" : "Guests"}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          {language === "ar" ? "عدد الضيوف" : "Number of guests"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          aria-label="Remove one guest"
                          onClick={() => setGuestsCount(Math.max(1, guestsCount - 1))}
                          disabled={guestsCount <= 1}
                          className="h-8 w-8 rounded-full border border-gray-200 dark:border-white/15 flex items-center justify-center disabled:opacity-40"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-5 text-center text-sm font-bold text-gray-900 dark:text-white">
                          {guestsCount}
                        </span>
                        <button
                          type="button"
                          aria-label="Add one guest"
                          onClick={() => setGuestsCount(Math.min(20, guestsCount + 1))}
                          disabled={guestsCount >= 20}
                          className="h-8 w-8 rounded-full border border-gray-200 dark:border-white/15 flex items-center justify-center disabled:opacity-40"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveDropdown(null)}
                      className="mt-3 w-full rounded-lg bg-violet-600 px-3 py-2 text-xs font-bold text-white hover:bg-violet-700"
                    >
                      {language === "ar" ? "تم" : "Done"}
                    </button>
                  </div>
                )}
              </div>

              {/* Action Buttons: Search + Map Toggle */}
              <div className="flex items-center gap-2 p-1 shrink-0">
                <button
                  type="button"
                  onClick={handleSearch}
                  className="h-10 w-10 rounded-xl bg-violet-700 hover:bg-violet-800 text-white flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer"
                  aria-label="Search"
                >
                  <Search className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode(viewMode === "grid" ? "map" : "grid")}
                  className="px-4 py-2 rounded-xl bg-violet-700 hover:bg-violet-800 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  {viewMode === "grid" ? (
                    <>
                      <MapIcon className="w-4 h-4" />
                      <span>{language === "ar" ? "الخريطة" : "Map"}</span>
                    </>
                  ) : (
                    <>
                      <Grid className="w-4 h-4" />
                      <span>{language === "ar" ? "القائمة" : "Cards"}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 3. HORIZONTAL FILTER CHIPS BAR (Filter, District, Price)   */}
          {/* ========================================================= */}
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

          {/* ========================================================= */}
          {/* 4. TOTAL COUNT HEADER (e.g. 2263 Properties in Riyadh)    */}
          {/* ========================================================= */}
          <div id="search-results" className="flex items-center justify-between mt-5 mb-5 scroll-mt-24">
            <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white">
              {filteredProperties.length}{" "}
              {language === "ar"
                ? `عقار متاح في ${cityName}`
                : `Properties in ${cityName}`}
            </h1>

            {/* Clear Filters shortcut */}
            {(selectedDistrict !== "all" ||
              selectedCategory !== "all" ||
              priceRange !== "all" ||
              dealsOnly ||
              selectedDirection !== "all" ||
              minRating > 0 ||
              minPrice > 0 ||
              maxPrice < 5000 ||
              bedrooms > 0 ||
              instantOnly ||
              poolOnly ||
              selfCheckinOnly) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{language === "ar" ? "إعادة تعيين الفلاتر" : "Reset Filters"}</span>
              </button>
            )}
          </div>

          {/* ========================================================= */}
          {/* 5. MAIN CONTENT: INTERACTIVE MAP OR 3-COLUMN PROPERTY GRID*/}
          {/* ========================================================= */}
          {viewMode === "map" ? (
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)] gap-4 items-stretch">
              <InteractiveMapView
                properties={sortedProperties}
                selectedPropertyId={selectedMapPropertyId}
                onSelectProperty={(propertyId) => {
                  setSelectedMapPropertyId(propertyId);
                  document.getElementById(`map-list-${propertyId}`)?.scrollIntoView({
                    block: "nearest",
                    behavior: "smooth",
                  });
                }}
                onClose={() => setViewMode("grid")}
              />
              <section
                aria-label={language === "ar" ? "نتائج البحث على الخريطة" : "Map search results"}
                className="max-h-[680px] overflow-y-auto overscroll-contain rounded-3xl border border-gray-200 bg-gray-50/70 p-3 dark:border-white/10 dark:bg-[#0d0b16]"
              >
                <div className="sticky top-0 z-10 mb-3 flex items-center justify-between rounded-xl border border-gray-200/80 bg-white/95 px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-[#12101a]/95 dark:text-gray-200">
                  <span>{filteredProperties.length} {language === "ar" ? "عقارات" : "properties"}</span>
                  <span className="text-[10px] font-medium text-gray-400">{language === "ar" ? "اضغط دبوس الخريطة لعرض العقار" : "Select a map pin to find its listing"}</span>
                </div>
                {sortedProperties.length === 0 ? (
                  <div className="rounded-2xl bg-white p-8 text-center text-sm text-gray-500 dark:bg-[#12101a] dark:text-gray-400">
                    {language === "ar" ? "لا توجد عقارات مطابقة" : "No properties match these filters"}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                    {sortedProperties.map((property, idx) => (
                      <div
                        id={`map-list-${property.id}`}
                        key={property.id}
                        onMouseEnter={() => setSelectedMapPropertyId(property.id)}
                        onFocusCapture={() => setSelectedMapPropertyId(property.id)}
                        className={`rounded-2xl transition-shadow ${selectedMapPropertyId === property.id ? "ring-2 ring-violet-500 ring-offset-2 ring-offset-gray-50 dark:ring-offset-[#0d0b16]" : ""}`}
                      >
                        <SearchPropertyCard property={property} priority={idx < 2} />
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="rounded-3xl p-16 text-center border border-gray-200 dark:border-white/10 bg-white dark:bg-[#12101F]">
              <Sparkles className="w-8 h-8 text-violet-500 mx-auto mb-3" />
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                {language === "ar" ? "لا توجد عقارات مطابقة" : "No properties found"}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-5">
                {language === "ar"
                  ? "جرب إزالة بعض الفلاتر أو تغيير الحي لرؤية المزيد من العقارات."
                  : "Try clearing some filters or selecting another district to see more results."}
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-5 py-2.5 rounded-full bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                {language === "ar" ? "إظهار كافة العقارات" : "Show All Properties"}
              </button>
            </div>
          ) : (
            /* 3-Column Responsive Grid matching Gathern Screenshot */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedProperties.map((property, idx) => (
                <SearchPropertyCard
                  key={property.id}
                  property={property}
                  priority={idx < 3}
                />
              ))}
            </div>
          )}

          {/* ========================================================= */}
          {/* 6. POPULAR CITIES LAST WEEK (Gathern Benchmark Bottom)    */}
          {/* ========================================================= */}
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
      <BookingModal />
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
