"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Property } from "@/data/properties";
import { useProperties } from "@/hooks/useProperties";
import { propertyDetailHref } from "@/lib/propertyUrls";
import { SearchModalFilters } from "./search/SearchModalFilters";
import { SearchModalResultsList } from "./search/SearchModalResultsList";

export default function SearchModal() {
  const { properties } = useProperties();
  const {
    searchModalOpen,
    closeSearchModal,
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
    formatPrice,
    isDarkTheme,
    language,
    t,
  } = useApp();

  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [rentType, setRentType] = useState<"daily" | "monthly">("daily");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchModalOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [searchModalOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && searchModalOpen) {
        closeSearchModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchModalOpen, closeSearchModal]);

  if (!searchModalOpen) return null;

  // Filter properties based on live query and active filters
  const filteredResults = properties.filter((p: Property) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle =
        p.title.toLowerCase().includes(q) ||
        (p.titleAr || "").toLowerCase().includes(q);
      const matchCity = p.cityName.toLowerCase().includes(q) || p.city.toLowerCase().includes(q);
      const matchDistrict =
        (p.district || "").toLowerCase().includes(q) ||
        (p.districtAr || "").toLowerCase().includes(q) ||
        (p.address || "").toLowerCase().includes(q) ||
        (p.addressAr || "").toLowerCase().includes(q);
      const matchCat = p.categoryName.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
      const matchSpecs = p.specs.toLowerCase().includes(q);
      const matchFeatures = p.features.some((f) => f.toLowerCase().includes(q));
      if (!matchTitle && !matchCity && !matchDistrict && !matchCat && !matchSpecs && !matchFeatures) return false;
    }

    if (selectedCity !== "all" && p.city !== selectedCity) return false;
    if (selectedCategory !== "all") {
      if (selectedCategory === "villa" || selectedCategory === "apartments" || selectedCategory === "villa-apartment") {
        if (p.category !== "villa" && p.category !== "penthouse") return false;
      } else if (p.category !== selectedCategory) {
        return false;
      }
    }
    if (instantOnly && !p.instantBook) return false;
    if (poolOnly && !p.hasPool) return false;
    if (selfCheckinOnly && !p.selfCheckin) return false;

    return true;
  });

  const handleSelectProperty = (property: Property) => {
    setSelectedCity(property.city);
    setSelectedCategory(property.category);
    closeSearchModal();
    const el = document.getElementById("properties");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    } else {
      router.push(propertyDetailHref(property.id));
    }
  };

  const handleQuickTagClick = (tag: string, cityKey?: string, catKey?: string) => {
    setSearchQuery(tag);
    if (cityKey) setSelectedCity(cityKey);
    if (catKey) setSelectedCategory(catKey);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCity("all");
    setSelectedCategory("all");
    setPoolOnly(false);
    setInstantOnly(false);
    setSelfCheckinOnly(false);
  };

  const hasActiveFilters = Boolean(
    searchQuery ||
    selectedCity !== "all" ||
    selectedCategory !== "all" ||
    poolOnly ||
    instantOnly ||
    selfCheckinOnly
  );

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-start justify-center p-3 sm:p-6 sm:pt-16 bg-black/80 backdrop-blur-md transition-opacity duration-300 overflow-y-auto animate-in fade-in duration-200"
      onClick={closeSearchModal}
    >
      <div
        className={`w-full max-w-3xl rounded-3xl p-5 sm:p-7 relative shadow-2xl border my-auto sm:my-0 transition-colors ${
          isDarkTheme
            ? "bg-[#0E0E1A]/95 backdrop-blur-2xl border-white/10 text-white"
            : "bg-white border-purple-100 text-gray-900 shadow-[0_20px_60px_rgba(88,28,135,0.15)]"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-purple-500/15 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-violet-600 to-fuchsia-500 flex items-center justify-center text-white shadow-glow">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base sm:text-lg">
                {language === "ar" ? "البحث عن الإقامات" : "Search Accommodations"}
              </h3>
              <p className="text-[11px] text-muted">
                {language === "ar"
                  ? "استكشف أكثر من 12,000 شاليه، فيلا، ومنتجع موثق في جميع أنحاء المملكة"
                  : "Explore 12,000+ verified chalets, villas & resorts across Saudi Arabia"}
              </p>
            </div>
          </div>

          <button
            onClick={closeSearchModal}
            className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              isDarkTheme ? "bg-white/10 hover:bg-white/20 text-white" : "bg-purple-100 hover:bg-purple-200 text-gray-700"
            }`}
            aria-label="Close search"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Filter Controls */}
        <SearchModalFilters
          inputRef={inputRef}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          rentType={rentType}
          setRentType={setRentType}
          selectedCity={selectedCity}
          setSelectedCity={setSelectedCity}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          poolOnly={poolOnly}
          setPoolOnly={setPoolOnly}
          instantOnly={instantOnly}
          setInstantOnly={setInstantOnly}
          selfCheckinOnly={selfCheckinOnly}
          setSelfCheckinOnly={setSelfCheckinOnly}
          isDarkTheme={isDarkTheme}
          language={language}
          t={t}
        />

        {/* Live Search Results List */}
        <SearchModalResultsList
          filteredResults={filteredResults}
          hasFilters={hasActiveFilters}
          onResetFilters={handleResetFilters}
          onSelectProperty={handleSelectProperty}
          rentType={rentType}
          formatPrice={formatPrice}
          isDarkTheme={isDarkTheme}
          language={language}
          t={t}
          closeSearchModal={closeSearchModal}
        />

        {/* Footer Quick Tags */}
        <div className="mt-4 pt-3 border-t border-purple-500/15 flex items-center justify-between text-[11px] text-muted">
          <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap">
            <span className="font-bold shrink-0">{language === "ar" ? "مقترحات:" : "Suggestions:"}</span>
            <button
              onClick={() => handleQuickTagClick("Pool", "riyadh", "chalet")}
              className="text-violet-400 hover:underline px-1.5 py-0.5 rounded cursor-pointer"
            >
              {language === "ar" ? "شاليهات الرياض بمسبح" : "Riyadh Chalets with Pool"}
            </button>
            <span>•</span>
            <button
              onClick={() => handleQuickTagClick("Villa", "jeddah", "villa")}
              className="text-violet-400 hover:underline px-1.5 py-0.5 rounded cursor-pointer"
            >
              {language === "ar" ? "فلل خور أبحر الشاطئية" : "Obhur Waterfront Villas"}
            </button>
            <span>•</span>
            <button
              onClick={() => handleQuickTagClick("Camp", "alula", "camp")}
              className="text-violet-400 hover:underline px-1.5 py-0.5 rounded cursor-pointer"
            >
              {language === "ar" ? "مخيمات وقباب العلا" : "AlUla Glamping"}
            </button>
          </div>

          <span className="hidden sm:inline-block text-[10px]">
            {language === "ar" ? "اضغط ESC للإغلاق" : "Press ESC to close"}
          </span>
        </div>
      </div>
    </div>
  );
}
