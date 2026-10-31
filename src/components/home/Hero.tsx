"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  Plus,
  Minus,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { normalizeCityId } from "@/data/properties";
import { CITY_NAMES_AR, CATEGORY_NAMES_AR } from "@/data/translations";

// All Saudi Arabian Cities & Destinations
const CITIES = [
  { id: "all", name: "All Saudi Destinations" },
  { id: "riyadh", name: "Riyadh" },
  { id: "jeddah", name: "Jeddah" },
  { id: "mecca", name: "Makkah" },
  { id: "madinah", name: "Madinah" },
  { id: "alula", name: "AlUla" },
  { id: "khobar", name: "Al Khobar" },
  { id: "dammam", name: "Dammam" },
  { id: "alhafuf", name: "Alhafuf and alahsa" },
  { id: "abha", name: "Abha" },
  { id: "taif", name: "Taif" },
  { id: "khamis-mushait", name: "Khamis Mushait" },
  { id: "tabuk", name: "Tabuk" },
  { id: "yanbu", name: "Yanbu" },
  { id: "jubail", name: "Jubail" },
  { id: "hail", name: "Hail" },
  { id: "jazan", name: "Jazan" },
  { id: "najran", name: "Najran" },
  { id: "buraidah", name: "Buraidah" },
  { id: "unaizah", name: "Unaizah" },
  { id: "al-bahah", name: "Al Bahah" },
  { id: "sakaka", name: "Sakaka" },
  { id: "arar", name: "Arar" },
  { id: "qatif", name: "Qatif" },
  { id: "diriyah", name: "Diriyah" },
  { id: "al-ammariyah", name: "Al-Ammariyah" },
  { id: "umluj", name: "Umluj" },
  { id: "al-wajh", name: "Al Wajh" },
  { id: "hafar-al-batin", name: "Hafar Al-Batin" },
  { id: "bisha", name: "Bisha" },
  { id: "al-majmaah", name: "Al Majma'ah" },
  { id: "sharurah", name: "Sharurah" },
  { id: "dhurma", name: "Dhurma" },
];

// Property Types (exact names and icons from screenshot)
const PROPERTY_TYPES = [
  {
    id: "all",
    name: "Apartments, Studios, rooms, Villas",
    icon: "🏠",
  },
  {
    id: "chalet",
    name: "Chalets, Istrahas and Resorts",
    icon: "🏊",
  },
  {
    id: "farm",
    name: "Farms",
    icon: "🌾",
  },
  {
    id: "camp",
    name: "Camps",
    icon: "⛺",
  },
  {
    id: "penthouse",
    name: "Serviced Apartments",
    icon: "🏢",
  },
];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAY_NAMES = ["S", "M", "T", "W", "T", "F", "S"];

export default function Hero() {
  const {
    t,
    language,
    selectedCity,
    setSelectedCity,
    selectedCategory,
    setSelectedCategory,
    checkinDate,
    setCheckinDate,
    checkoutDate,
    setCheckoutDate,
    guestsCount,
    setGuestsCount,
  } = useApp();

  // Active dropdown: 'city' | 'type' | 'date' | 'guests' | null
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // City search query inside dropdown
  const [citySearch, setCitySearch] = useState("");

  // Stepper counters for guests
  const [adults, setAdults] = useState<number>(Math.max(1, guestsCount - 1));
  const [children, setChildren] = useState<number>(1);

  // Calendar view navigation state
  const [viewDate, setViewDate] = useState<Date>(() => {
    if (checkinDate) {
      const [y, m, d] = checkinDate.split("-").map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date();
  });

  // Dynamic date helpers
  const getTodayISO = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const getFutureISO = (daysAhead: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  // Initialize dates if empty
  useEffect(() => {
    if (!checkinDate) {
      setCheckinDate(getFutureISO(1));
    }
    if (!checkoutDate) {
      setCheckoutDate(getFutureISO(2));
    }
  }, [checkinDate, checkoutDate, setCheckinDate, setCheckoutDate]);

  // Sync guests count
  useEffect(() => {
    setGuestsCount(adults + children);
  }, [adults, children, setGuestsCount]);

  // Format date like: "Wednesday, 28 October"
  const formatSingleDate = (isoString: string) => {
    if (!isoString) return "";
    const [y, m, d] = isoString.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
    const day = date.getDate();
    const month = date.toLocaleDateString("en-US", { month: "long" });
    return `${weekday}, ${day} ${month}`;
  };

  // Date range display string for search bar
  const dateRangeDisplay = () => {
    if (!checkinDate) return "Select dates";
    if (!checkoutDate) return `${formatSingleDate(checkinDate)} → Check-out`;
    return `${formatSingleDate(checkinDate)} → ${formatSingleDate(checkoutDate)}`;
  };

  // Handle clicking outside to close popovers
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Calendar day click handler
  const handleDayClick = (dayISO: string) => {
    if (dayISO < getTodayISO()) return;

    if (!checkinDate || (checkinDate && checkoutDate)) {
      setCheckinDate(dayISO);
      setCheckoutDate("");
    } else if (checkinDate && !checkoutDate) {
      if (dayISO > checkinDate) {
        setCheckoutDate(dayISO);
        setTimeout(() => setActiveDropdown(null), 250);
      } else {
        setCheckinDate(dayISO);
        setCheckoutDate("");
      }
    }
  };

  // Submit search to the dedicated results page with the selected criteria.
  const router = useRouter();
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveDropdown(null);

    const params = new URLSearchParams({
      city: normalizeCityId(selectedCity),
      type: selectedCategory,
      check_in: checkinDate,
      check_out: checkoutDate,
      guests: String(guestsCount),
    });
    router.push(`/search?${params.toString()}`);
  };

  // Current selected display texts with Arabic mapping
  const getCityLabel = (cityId: string, englishName: string) => {
    if (language === "ar") {
      return CITY_NAMES_AR[cityId] || englishName;
    }
    return englishName;
  };

  const getTypeLabel = (catId: string, englishName: string) => {
    if (language === "ar") {
      return CATEGORY_NAMES_AR[catId] || englishName;
    }
    return englishName;
  };

  const activeCityName =
    selectedCity === "all"
      ? (language === "ar" ? "الرياض" : "Riyadh")
      : getCityLabel(selectedCity, CITIES.find((c) => c.id === selectedCity)?.name || "Riyadh");

  const activeTypeName =
    selectedCategory === "all"
      ? (language === "ar" ? "جميع الوحدات" : "All Stays")
      : getTypeLabel(selectedCategory, PROPERTY_TYPES.find((p) => p.id === selectedCategory)?.name || "All Stays");

  const filteredCities = CITIES.filter((c) =>
    c.name.toLowerCase().includes(citySearch.toLowerCase())
  );

  // Month rendering logic
  const renderMonthCalendar = (year: number, month: number, isRightMonth = false) => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = getTodayISO();

    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8" />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dayISO = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const isPast = dayISO < today;
      const isCheckin = dayISO === checkinDate;
      const isCheckout = dayISO === checkoutDate;
      const isInRange =
        checkinDate &&
        checkoutDate &&
        dayISO > checkinDate &&
        dayISO < checkoutDate;

      days.push(
        <button
          key={dayISO}
          type="button"
          disabled={isPast}
          onClick={() => handleDayClick(dayISO)}
          className={`h-8 w-8 sm:h-9 sm:w-9 text-xs sm:text-sm font-semibold rounded-full flex items-center justify-center transition-all ${
            isPast
              ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
              : isCheckin || isCheckout
              ? "bg-purple-700 text-white font-bold shadow-md cursor-pointer scale-105"
              : isInRange
              ? "bg-purple-100 dark:bg-purple-900/40 text-purple-900 dark:text-purple-200 rounded-none cursor-pointer"
              : "text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer"
          }`}
        >
          {d}
        </button>
      );
    }

    return (
      <div className="w-full sm:w-64">
        {/* Month Header */}
        <div className="flex items-center justify-between mb-4 px-2">
          {!isRightMonth ? (
            <button
              type="button"
              onClick={() =>
                setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))
              }
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
              aria-label="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-6" />
          )}

          <h4 className="text-sm font-bold text-gray-900 dark:text-white">
            {MONTH_NAMES[month]} {year}
          </h4>

          {isRightMonth ? (
            <button
              type="button"
              onClick={() =>
                setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))
              }
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
              aria-label="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-6" />
          )}
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {DAY_NAMES.map((name, idx) => (
            <span
              key={idx}
              className="text-[11px] font-bold text-gray-400 dark:text-gray-500"
            >
              {name}
            </span>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 place-items-center">
          {days}
        </div>
      </div>
    );
  };

  const leftYear = viewDate.getFullYear();
  const leftMonth = viewDate.getMonth();
  const nextMonthDate = new Date(leftYear, leftMonth + 1, 1);
  const rightYear = nextMonthDate.getFullYear();
  const rightMonth = nextMonthDate.getMonth();

  return (
    <section id="top" className="relative z-40 pt-20 sm:pt-22 lg:pt-24 pb-4 sm:pb-6 overflow-visible">
      {/* Background Ambience - Hardware optimized radial gradient without heavy GPU blur */}
      <div className="absolute inset-0 grid-bg opacity-25 pointer-events-none" />
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(147, 51, 234, 0.15) 0%, rgba(168, 85, 247, 0.04) 50%, transparent 70%)",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-30 text-center">
        {/* Ministry Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/40 mb-2 sm:mb-2.5 border border-violet-200 dark:border-violet-500/20"
        >
          <span className="h-2 w-2 rounded-full bg-violet-600 dark:bg-fuchsia-400 animate-pulse" />
          {t.hero.badge}
        </motion.div>

        {/* Hero Title - Compact Gathern Style */}
        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 dark:text-white max-w-3xl mx-auto leading-tight mb-2 sm:mb-2.5">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-block mr-2 rtl:ml-2 rtl:mr-0"
          >
            {t.hero.title1}
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="inline-block text-gradient font-serif italic font-normal"
          >
            {t.hero.title2}
          </motion.span>
        </h1>

        {/* Hero Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-white/80 max-w-xl mx-auto font-light leading-relaxed mb-4 sm:mb-5"
        >
          {t.hero.subtitle}
        </motion.p>

        {/* ============================================================== */}
        {/* GATHERN BENCHMARK SEARCH BAR (SIMPLE & CLEAN)                  */}
        {/* ============================================================== */}
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="max-w-6xl mx-auto relative z-50"
        >
          <div className="bg-white dark:bg-[#0E0E1A] rounded-2xl sm:rounded-3xl shadow-[0_15px_45px_rgba(0,0,0,0.12)] border border-gray-200/80 dark:border-white/10 p-2 sm:p-2.5 relative z-50">
            <form
              onSubmit={handleSearchSubmit}
              className="flex flex-col lg:flex-row lg:items-center text-left relative"
            >
              {/* ---------------------------------------------------- */}
              {/* 1. CHOOSE A CITY (SINGLE LINE GUARANTEED)           */}
              {/* ---------------------------------------------------- */}
              <div
                className={`relative flex-1 min-w-[190px] border-b lg:border-b-0 lg:border-r border-gray-200/80 dark:border-white/10 transition-all ${
                  activeDropdown === "city" ? "z-50" : "z-10"
                }`}
              >
                <button
                  type="button"
                  onClick={() =>
                    setActiveDropdown(activeDropdown === "city" ? null : "city")
                  }
                  className="w-full px-4 py-3 sm:py-3.5 flex items-center justify-between text-left hover:bg-gray-50/60 dark:hover:bg-white/[0.04] rounded-xl transition-colors cursor-pointer"
                >
                  <div className="min-w-0 pr-2 rtl:pr-0 rtl:pl-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium block whitespace-nowrap">
                      {t.hero.chooseCity}
                    </span>
                    <span className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate block mt-0.5 whitespace-nowrap">
                      {activeCityName}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-purple-700 dark:text-purple-400 shrink-0 transition-transform ${
                      activeDropdown === "city" ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* City Dropdown Popover (All Saudi Cities List) */}
                <AnimatePresence>
                  {activeDropdown === "city" && (
                    <motion.div
                      data-lenis-prevent="true"
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full mt-2.5 left-0 rtl:left-auto rtl:right-0 w-[calc(100vw-2.5rem)] sm:w-[380px] max-w-[400px] z-[100] rounded-3xl bg-white dark:bg-[#0E0E1A] shadow-[0_20px_50px_rgba(0,0,0,0.25)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.85)] border border-gray-200/80 dark:border-white/15 overflow-hidden"
                    >
                      {/* Search Input Header */}
                      <div className="p-3.5 border-b border-gray-100 dark:border-white/10 sticky top-0 bg-white/95 dark:bg-[#0E0E1A]/95 backdrop-blur-md z-10">
                        <div className="relative flex items-center">
                          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 rtl:left-auto rtl:right-3.5" />
                          <input
                            type="text"
                            placeholder={t.hero.citySearchPlaceholder}
                            value={citySearch}
                            onChange={(e) => setCitySearch(e.target.value)}
                            className="w-full pl-9 pr-3 rtl:pl-3 rtl:pr-9 py-2 text-xs sm:text-sm rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-600"
                          />
                        </div>
                      </div>

                      {/* Comprehensive Saudi City List with Isolated Smooth Scrolling */}
                      <div
                        data-lenis-prevent="true"
                        onWheel={(e) => e.stopPropagation()}
                        onTouchMove={(e) => e.stopPropagation()}
                        className="dropdown-scroll max-h-80 p-2 space-y-0.5"
                        style={{ overscrollBehavior: "contain" }}
                      >
                        {filteredCities.map((city) => {
                          const isSelected = selectedCity === city.id;
                          return (
                            <button
                              key={city.id}
                              type="button"
                              onClick={() => {
                                setSelectedCity(city.id);
                                setActiveDropdown(null);
                              }}
                              className="w-full px-4 py-2.5 rounded-xl text-left rtl:text-right text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 flex items-center justify-between transition-colors cursor-pointer"
                            >
                              <span>{getCityLabel(city.id, city.name)}</span>
                              {isSelected && (
                                <Check className="w-4 h-4 text-purple-700 dark:text-purple-400 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                        {filteredCities.length === 0 && (
                          <div className="p-4 text-center text-xs text-gray-400">
                            No cities matching &quot;{citySearch}&quot;
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ---------------------------------------------------- */}
              {/* 2. PROPERTY TYPE                                     */}
              {/* ---------------------------------------------------- */}
              <div
                className={`relative flex-1 min-w-[210px] border-b lg:border-b-0 lg:border-r border-gray-200/80 dark:border-white/10 transition-all ${
                  activeDropdown === "type" ? "z-50" : "z-10"
                }`}
              >
                <button
                  type="button"
                  onClick={() =>
                    setActiveDropdown(activeDropdown === "type" ? null : "type")
                  }
                  className="w-full px-4 py-3 sm:py-3.5 flex items-center justify-between text-left hover:bg-gray-50/60 dark:hover:bg-white/[0.04] rounded-xl transition-colors cursor-pointer"
                >
                  <div className="min-w-0 pr-2 rtl:pr-0 rtl:pl-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium block whitespace-nowrap">
                      {t.hero.propertyType}
                    </span>
                    <span className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate block mt-0.5 whitespace-nowrap">
                      {activeTypeName}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-purple-700 dark:text-purple-400 shrink-0 transition-transform ${
                      activeDropdown === "type" ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Property Type Popover (Matching Screenshot 2) */}
                <AnimatePresence>
                  {activeDropdown === "type" && (
                    <motion.div
                      data-lenis-prevent="true"
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full mt-2.5 left-0 rtl:left-auto rtl:right-0 sm:left-auto lg:left-0 rtl:lg:left-auto rtl:lg:right-0 w-[calc(100vw-2.5rem)] sm:w-[360px] max-w-[380px] z-[100] rounded-3xl bg-white dark:bg-[#0E0E1A] shadow-[0_20px_50px_rgba(0,0,0,0.25)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.85)] border border-gray-200/80 dark:border-white/15 overflow-hidden"
                    >
                      {/* Header */}
                      <div className="p-4 border-b border-gray-100 dark:border-white/10 text-center">
                        <h3 className="font-bold text-base text-gray-900 dark:text-white">
                          {t.hero.chooseUnitType}
                        </h3>
                      </div>

                      {/* List */}
                      <div
                        data-lenis-prevent="true"
                        onWheel={(e) => e.stopPropagation()}
                        onTouchMove={(e) => e.stopPropagation()}
                        className="dropdown-scroll max-h-80 p-2 space-y-1"
                        style={{ overscrollBehavior: "contain" }}
                      >
                        {PROPERTY_TYPES.map((type) => {
                          const isSelected = selectedCategory === type.id;
                          return (
                            <button
                              key={type.id}
                              type="button"
                              onClick={() => {
                                setSelectedCategory(type.id);
                              }}
                              className="w-full px-3.5 py-3 rounded-xl text-left rtl:text-right text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center justify-between transition-colors cursor-pointer"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-base">{type.icon}</span>
                                <span>{getTypeLabel(type.id, type.name)}</span>
                              </div>
                              {isSelected && (
                                <Check className="w-4 h-4 text-purple-700 dark:text-purple-400 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Continue Button */}
                      <div className="p-3 border-t border-gray-100 dark:border-white/10 text-center">
                        <button
                          type="button"
                          onClick={() => setActiveDropdown(null)}
                          className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 hover:underline cursor-pointer"
                        >
                          {language === "ar" ? "متابعة ←" : "CONTINUE >"}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ---------------------------------------------------- */}
              {/* 3. CHECK-IN DATE (DUAL-MONTH CALENDAR)               */}
              {/* ---------------------------------------------------- */}
              <div
                className={`relative flex-[1.4] min-w-[270px] border-b lg:border-b-0 lg:border-r border-gray-200/80 dark:border-white/10 transition-all ${
                  activeDropdown === "date" ? "z-50" : "z-10"
                }`}
              >
                <button
                  type="button"
                  onClick={() =>
                    setActiveDropdown(activeDropdown === "date" ? null : "date")
                  }
                  className="w-full px-4 py-3 sm:py-3.5 flex items-center justify-between text-left hover:bg-gray-50/60 dark:hover:bg-white/[0.04] rounded-xl transition-colors cursor-pointer"
                >
                  <div className="min-w-0 pr-2 rtl:pr-0 rtl:pl-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium block whitespace-nowrap">
                      {t.hero.checkInDate}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate block mt-0.5 whitespace-nowrap">
                      {dateRangeDisplay()}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-purple-700 dark:text-purple-400 shrink-0 transition-transform ${
                      activeDropdown === "date" ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Calendar Popover (Matching Screenshot 3) */}
                <AnimatePresence>
                  {activeDropdown === "date" && (
                    <motion.div
                      data-lenis-prevent="true"
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full mt-2.5 left-1/2 -translate-x-1/2 lg:left-auto lg:right-0 rtl:lg:right-auto rtl:lg:left-0 lg:translate-x-0 w-[calc(100vw-2rem)] sm:w-auto max-w-[680px] z-[100] rounded-3xl bg-white dark:bg-[#0E0E1A] shadow-[0_20px_50px_rgba(0,0,0,0.25)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.85)] border border-gray-200/80 dark:border-white/15 p-4 sm:p-5 overflow-hidden"
                    >
                      <div className="flex flex-col sm:flex-row gap-6">
                        {renderMonthCalendar(leftYear, leftMonth, false)}
                        <div className="hidden sm:block w-px bg-gray-100 dark:bg-white/10" />
                        <div className="hidden sm:block">
                          {renderMonthCalendar(rightYear, rightMonth, true)}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/10 flex items-center justify-between text-xs text-gray-500">
                        <span>{t.hero.calendarHelp}</span>
                        <button
                          type="button"
                          onClick={() => setActiveDropdown(null)}
                          className="font-bold text-purple-700 dark:text-purple-400 hover:underline cursor-pointer"
                        >
                          {t.hero.done}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ---------------------------------------------------- */}
              {/* 4. GUESTS                                            */}
              {/* ---------------------------------------------------- */}
              <div
                className={`relative flex-1 min-w-[160px] transition-all ${
                  activeDropdown === "guests" ? "z-50" : "z-10"
                }`}
              >
                <button
                  type="button"
                  onClick={() =>
                    setActiveDropdown(activeDropdown === "guests" ? null : "guests")
                  }
                  className="w-full px-4 py-3 sm:py-3.5 flex items-center justify-between text-left hover:bg-gray-50/60 dark:hover:bg-white/[0.04] rounded-xl transition-colors cursor-pointer"
                >
                  <div className="min-w-0 pr-2 rtl:pr-0 rtl:pl-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium block whitespace-nowrap">
                      {t.hero.guests}
                    </span>
                    <span className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate block mt-0.5 whitespace-nowrap">
                      {guestsCount ? `${guestsCount} ${language === "ar" ? "ضيوف" : "Guests"}` : t.hero.selectGuests}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-purple-700 dark:text-purple-400 shrink-0 transition-transform ${
                      activeDropdown === "guests" ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Guests Popover */}
                <AnimatePresence>
                  {activeDropdown === "guests" && (
                    <motion.div
                      data-lenis-prevent="true"
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full mt-2.5 right-0 rtl:right-auto rtl:left-0 w-[calc(100vw-2.5rem)] sm:w-[320px] max-w-[340px] z-[100] rounded-3xl bg-white dark:bg-[#0E0E1A] shadow-[0_20px_50px_rgba(0,0,0,0.25)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.85)] border border-gray-200/80 dark:border-white/15 p-4"
                    >
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white pb-3 border-b border-gray-100 dark:border-white/10">
                        {t.hero.selectGuests}
                      </h4>

                      <div className="py-3 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-gray-900 dark:text-white">
                            {t.hero.adults}
                          </p>
                          <p className="text-[11px] text-gray-400">{t.hero.adultsSub}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            disabled={adults <= 1}
                            onClick={() => setAdults((prev) => Math.max(1, prev - 1))}
                            className="h-7 w-7 rounded-full border border-gray-300 dark:border-white/20 flex items-center justify-center text-gray-700 dark:text-white hover:border-purple-600 transition-colors disabled:opacity-30 cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-5 text-center text-xs font-bold text-gray-900 dark:text-white">
                            {adults}
                          </span>
                          <button
                            type="button"
                            disabled={adults >= 30}
                            onClick={() => setAdults((prev) => prev + 1)}
                            className="h-7 w-7 rounded-full border border-gray-300 dark:border-white/20 flex items-center justify-center text-gray-700 dark:text-white hover:border-purple-600 transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="py-3 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-gray-900 dark:text-white">
                            {t.hero.children}
                          </p>
                          <p className="text-[11px] text-gray-400">{t.hero.childrenSub}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            disabled={children <= 0}
                            onClick={() => setChildren((prev) => Math.max(0, prev - 1))}
                            className="h-7 w-7 rounded-full border border-gray-300 dark:border-white/20 flex items-center justify-center text-gray-700 dark:text-white hover:border-purple-600 transition-colors disabled:opacity-30 cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-5 text-center text-xs font-bold text-gray-900 dark:text-white">
                            {children}
                          </span>
                          <button
                            type="button"
                            disabled={children >= 20}
                            onClick={() => setChildren((prev) => prev + 1)}
                            className="h-7 w-7 rounded-full border border-gray-300 dark:border-white/20 flex items-center justify-center text-gray-700 dark:text-white hover:border-purple-600 transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="pt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setActiveDropdown(null)}
                          className="px-4 py-2 rounded-xl bg-purple-700 text-white text-xs font-bold shadow-md hover:bg-purple-800 transition-colors cursor-pointer"
                        >
                          Apply ({adults + children} Guests)
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ---------------------------------------------------- */}
              {/* SEARCH BUTTON (PURPLE SQUARE AS IN SCREENSHOT)      */}
              {/* ---------------------------------------------------- */}
              <div className="p-1.5 shrink-0 flex items-center justify-end">
                <button
                  type="submit"
                  aria-label="Search accommodations"
                  className="h-12 w-12 sm:h-13 sm:w-13 rounded-2xl bg-purple-800 hover:bg-purple-900 text-white flex items-center justify-center shadow-md transition-all hover:scale-105 cursor-pointer"
                >
                  <Search className="w-5 h-5 text-white" />
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
