"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Search,
  X,
  MapPin,
  Home,
  Star,
  Zap,
  ArrowRight,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { PROPERTIES, Property } from "@/data/properties";
import {
  CITY_NAMES_AR,
  CATEGORY_NAMES_AR,
  PROPERTY_TITLES_AR,
  PROPERTY_SPECS_AR,
} from "@/data/translations";

export default function SearchModal() {
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
    openBookingModal,
    isDarkTheme,
    language,
    t,
  } = useApp();

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
  const filteredResults = PROPERTIES.filter((p: Property) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchCity = p.cityName.toLowerCase().includes(q) || p.city.toLowerCase().includes(q);
      const matchCat = p.categoryName.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
      const matchSpecs = p.specs.toLowerCase().includes(q);
      const matchFeatures = p.features.some((f) => f.toLowerCase().includes(q));
      if (!matchTitle && !matchCity && !matchCat && !matchSpecs && !matchFeatures) return false;
    }

    if (selectedCity !== "all" && p.city !== selectedCity) return false;
    if (selectedCategory !== "all" && p.category !== selectedCategory) return false;
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
    }
  };

  const handleQuickTagClick = (tag: string, cityKey?: string, catKey?: string) => {
    setSearchQuery(tag);
    if (cityKey) setSelectedCity(cityKey);
    if (catKey) setSelectedCategory(catKey);
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-start justify-center p-3 sm:p-6 sm:pt-16 bg-black/80 backdrop-blur-md transition-opacity duration-300 overflow-y-auto animate-in fade-in duration-200"
      onClick={closeSearchModal}
    >
      <div
        className={`w-full max-w-3xl rounded-3xl p-5 sm:p-7 relative shadow-2xl border my-auto sm:my-0 transition-colors ${
          isDarkTheme
            ? "bg-[#0E0E1A]/95 backdrop-blur-2xl border-white/10 text-white"
            : "bg-white/98 backdrop-blur-2xl border-purple-100 text-gray-900 shadow-[0_20px_60px_rgba(88,28,135,0.15)]"
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

        {/* Rent Type Mode Switcher (Daily vs Monthly - Gathern Pattern) */}
        <div className="flex items-center gap-2 mb-4 p-1 rounded-2xl bg-purple-500/10 border border-purple-500/20 w-fit">
          <button
            onClick={() => setRentType("daily")}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              rentType === "daily"
                ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-glow"
                : isDarkTheme ? "text-white/70 hover:text-white" : "text-gray-700 hover:text-gray-900"
            }`}
          >
            {language === "ar" ? "إيجار يومي" : "Daily Rent"}
          </button>
          <button
            onClick={() => setRentType("monthly")}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              rentType === "monthly"
                ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-glow"
                : isDarkTheme ? "text-white/70 hover:text-white" : "text-gray-700 hover:text-gray-900"
            }`}
          >
            <span>{language === "ar" ? "إيجار شهري" : "Monthly Rent"}</span>
            <span className="text-[9px] uppercase px-1.5 py-0.2 rounded-full bg-emerald-400/20 text-emerald-400 font-bold">
              {language === "ar" ? "خصم ٣٥٪" : "Save 35%"}
            </span>
          </button>
        </div>

        {/* Main Search Input */}
        <div className="relative mb-4">
          <Search className="w-5 h-5 absolute left-4 rtl:left-auto rtl:right-4 top-1/2 -translate-y-1/2 text-violet-400" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              language === "ar"
                ? "ابحث بالمدينة، اسم العقار، مسبح خاص، فيلا، شاليه..."
                : "Search by city, property name, pool, private villa, chalet..."
            }
            className={`w-full rounded-2xl pl-12 rtl:pl-4 rtl:pr-12 pr-10 py-3.5 text-sm sm:text-base font-semibold focus:outline-none transition-colors border ${
              isDarkTheme
                ? "bg-white/[0.05] border-white/15 focus:border-fuchsia-400 text-white placeholder-white/40"
                : "bg-purple-50/60 border-purple-200 focus:border-purple-600 text-gray-900 placeholder-gray-400"
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 rtl:right-auto rtl:left-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-fg p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* City Filter Pills */}
        <div className="mb-3.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted block mb-1.5 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-fuchsia-400" /> {language === "ar" ? "وجهة المدينة" : "Destination City"}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "all", name: language === "ar" ? "جميع المدن" : "All Saudi" },
              { id: "riyadh", name: language === "ar" ? CITY_NAMES_AR.riyadh : "Riyadh" },
              { id: "jeddah", name: language === "ar" ? CITY_NAMES_AR.jeddah : "Jeddah" },
              { id: "alula", name: language === "ar" ? CITY_NAMES_AR.alula : "AlUla" },
              { id: "khobar", name: language === "ar" ? CITY_NAMES_AR.khobar : "Al Khobar" },
              { id: "abha", name: language === "ar" ? CITY_NAMES_AR.abha : "Abha" },
            ].map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCity(c.id)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                  selectedCity === c.id
                    ? "bg-violet-600 text-white border-violet-500 shadow-glow"
                    : isDarkTheme
                    ? "bg-white/[0.04] text-white/70 border-white/10 hover:border-white/20"
                    : "bg-purple-50 text-gray-700 border-purple-100 hover:border-purple-300"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Property Category Pills */}
        <div className="mb-4">
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted block mb-1.5 flex items-center gap-1">
            <Home className="w-3 h-3 text-violet-400" /> {language === "ar" ? "نوع الوحدة" : "Property Type"}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "all", name: language === "ar" ? "جميع الأنواع" : "All Types" },
              { id: "chalet", name: language === "ar" ? "شاليهات ومنتجعات" : "Chalets & Resorts" },
              { id: "villa", name: language === "ar" ? "فلل خاصة" : "Private Villas" },
              { id: "farm", name: language === "ar" ? "مزارع واستراحات" : "Country Farms" },
              { id: "camp", name: language === "ar" ? "مخيمات صحراوية" : "Desert Camps" },
              { id: "penthouse", name: language === "ar" ? "شقق مخدومة" : "Serviced Apartments" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                  selectedCategory === cat.id
                    ? "bg-fuchsia-600 text-white border-fuchsia-500 shadow-glow"
                    : isDarkTheme
                    ? "bg-white/[0.04] text-white/70 border-white/10 hover:border-white/20"
                    : "bg-purple-50 text-gray-700 border-purple-100 hover:border-purple-300"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Fast Amenity Toggles */}
        <div className="flex flex-wrap items-center gap-2 mb-4 pt-3 border-t border-purple-500/15">
          <button
            onClick={() => setPoolOnly(!poolOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border cursor-pointer ${
              poolOnly
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-400/50"
                : isDarkTheme ? "bg-white/[0.04] text-white/60 border-white/10" : "bg-gray-100 text-gray-600 border-gray-200"
            }`}
          >
            <span>🏊 {language === "ar" ? "مسبح خاص" : "Private Pool"}</span>
          </button>

          <button
            onClick={() => setInstantOnly(!instantOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border cursor-pointer ${
              instantOnly
                ? "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-400/50"
                : isDarkTheme ? "bg-white/[0.04] text-white/60 border-white/10" : "bg-gray-100 text-gray-600 border-gray-200"
            }`}
          >
            <Zap className="w-3 h-3 text-fuchsia-400" />
            <span>{t.properties.instantBook}</span>
          </button>

          <button
            onClick={() => setSelfCheckinOnly(!selfCheckinOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border cursor-pointer ${
              selfCheckinOnly
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/50"
                : isDarkTheme ? "bg-white/[0.04] text-white/60 border-white/10" : "bg-gray-100 text-gray-600 border-gray-200"
            }`}
          >
            <span>🔑 {language === "ar" ? "دخول ذاتي ذكي" : "Smart Lock"}</span>
          </button>
        </div>

        {/* Live Search Results List */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">
              {filteredResults.length} {language === "ar" ? "عقار متطابق" : "Properties Matching"}
            </span>
            {(searchQuery || selectedCity !== "all" || selectedCategory !== "all" || poolOnly || instantOnly || selfCheckinOnly) && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCity("all");
                  setSelectedCategory("all");
                  setPoolOnly(false);
                  setInstantOnly(false);
                  setSelfCheckinOnly(false);
                }}
                className="text-xs text-fuchsia-400 hover:underline cursor-pointer"
              >
                {language === "ar" ? "إعادة ضبط الفلاتر" : "Reset All Filters"}
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
            {filteredResults.length === 0 ? (
              <div className="p-8 text-center text-muted">
                <p className="text-sm font-semibold mb-1">
                  {language === "ar" ? "لم يتم العثور على إقامات متطابقة" : "No accommodations found"}
                </p>
                <p className="text-xs">
                  {language === "ar" ? "جرب اختيار مدينة أخرى أو تغيير خيارات التصفية." : "Try selecting another city or relaxing filter criteria."}
                </p>
              </div>
            ) : (
              filteredResults.map((p) => {
                const title = language === "ar" ? (PROPERTY_TITLES_AR[p.id] || p.title) : p.title;
                const cityName = language === "ar" ? (CITY_NAMES_AR[p.city] || p.cityName) : p.cityName;
                const categoryName = language === "ar" ? (CATEGORY_NAMES_AR[p.category] || p.categoryName) : p.categoryName;
                const specs = language === "ar" ? (PROPERTY_SPECS_AR[p.specs] || p.specs) : p.specs;

                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelectProperty(p)}
                    className={`p-2.5 rounded-2xl border transition-all flex items-center gap-3 cursor-pointer group ${
                      isDarkTheme
                        ? "bg-white/[0.03] border-white/10 hover:bg-white/[0.07] hover:border-violet-400/40"
                        : "bg-purple-50/40 border-purple-100 hover:bg-purple-50 hover:border-purple-300"
                    }`}
                  >
                    <div className="relative h-16 w-20 sm:h-18 sm:w-24 rounded-xl overflow-hidden shrink-0">
                      <Image src={p.image} alt={title} fill className="object-cover group-hover:scale-105 transition-transform" />
                    </div>

                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] uppercase font-bold text-fuchsia-400 tracking-wider">
                          {cityName} · {categoryName}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] font-bold text-fg">
                          <Star className="w-3 h-3 fill-fuchsia-400 text-fuchsia-400" />
                          <span>{p.rating}</span>
                        </div>
                      </div>

                      <h4 className="text-xs sm:text-sm font-bold text-fg truncate group-hover:text-fuchsia-400 transition-colors">
                        {title}
                      </h4>

                      <p className="text-[11px] text-muted truncate">{specs}</p>
                    </div>

                    <div className="text-right rtl:text-left shrink-0">
                      <p className="text-xs sm:text-sm font-bold text-fg">
                        {formatPrice(rentType === "monthly" ? Math.round(p.basePrice * 20) : p.basePrice)}
                      </p>
                      <span className="text-[10px] text-muted block">
                        {rentType === "monthly" ? (language === "ar" ? "لكل شهر" : "per month") : (language === "ar" ? "لكل ليلة" : "per night")}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          closeSearchModal();
                          openBookingModal(title, p.basePrice);
                        }}
                        className="mt-1 text-[10px] font-bold text-violet-400 hover:text-fuchsia-400 flex items-center gap-0.5 justify-end rtl:justify-start"
                      >
                        <span>{t.properties.book}</span>
                        <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

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
