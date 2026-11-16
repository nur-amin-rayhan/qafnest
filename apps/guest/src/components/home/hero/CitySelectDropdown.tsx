"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown, Check } from "lucide-react";
import { CITIES } from "./heroConstants";

interface CitySelectDropdownProps {
  isOpen: boolean;
  onToggle: () => void;
  selectedCity: string;
  onSelectCity: (cityId: string) => void;
  chooseCityLabel: string;
  searchPlaceholder: string;
  activeCityName: string;
  getCityLabel: (cityId: string, englishName: string) => string;
}

export function CitySelectDropdown({
  isOpen,
  onToggle,
  selectedCity,
  onSelectCity,
  chooseCityLabel,
  searchPlaceholder,
  activeCityName,
  getCityLabel,
}: CitySelectDropdownProps) {
  const [citySearch, setCitySearch] = useState("");

  const filteredCities = CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(citySearch.toLowerCase()) ||
      (c.nameAr && c.nameAr.includes(citySearch))
  );

  return (
    <div
      className={`relative flex-1 min-w-0 lg:min-w-[180px] border-b lg:border-b-0 lg:border-e border-gray-200/80 dark:border-white/10 transition-all ${
        isOpen ? "z-50" : "z-10"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-3 sm:py-3.5 flex items-center justify-between text-start hover:bg-gray-50/60 dark:hover:bg-white/[0.04] rounded-xl transition-colors cursor-pointer"
      >
        <div className="min-w-0 pr-2 rtl:pr-0 rtl:pl-2">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium block whitespace-nowrap">
            {chooseCityLabel}
          </span>
          <span className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate block mt-0.5 whitespace-nowrap">
            {activeCityName}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-purple-700 dark:text-purple-400 shrink-0 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* City Dropdown Popover (All Saudi Cities List) */}
      <AnimatePresence>
        {isOpen && (
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
                  placeholder={searchPlaceholder}
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  className="w-full pl-9 pr-3 rtl:pl-3 rtl:pr-9 py-2 text-xs sm:text-sm rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-600"
                />
              </div>
            </div>

            {/* Saudi Cities List with Isolated Smooth Scrolling */}
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
                    onClick={() => onSelectCity(city.id)}
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
  );
}

