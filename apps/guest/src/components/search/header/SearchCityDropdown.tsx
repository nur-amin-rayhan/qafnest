"use client";

import React, { useState } from "react";
import { ChevronDown, Search, Check } from "lucide-react";
import { CITIES } from "../searchConstants";

interface SearchCityDropdownProps {
  cityName: string;
  activeCity: string;
  selectCity: (cityId: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  language: "en" | "ar";
}

export function SearchCityDropdown({
  cityName,
  activeCity,
  selectCity,
  isOpen,
  onToggle,
  onClose,
  language,
}: SearchCityDropdownProps) {
  const [citySearch, setCitySearch] = useState("");

  return (
    <div className="relative flex-1 min-w-[200px] px-3 py-1.5 border-b lg:border-b-0 lg:border-r border-violet-200/60 dark:border-violet-500/20">
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left rtl:text-right flex items-center justify-between cursor-pointer rounded-xl hover:bg-violet-50/60 dark:hover:bg-white/5 px-1.5 py-0.5 transition-colors"
      >
        <div className="min-w-0 pr-2">
          <span className="text-[10px] uppercase font-extrabold tracking-wider text-violet-700/75 dark:text-violet-300/80 block leading-tight">
            {language === "ar" ? "اختر المدينة" : "Choose a City"}
          </span>
          <span className="font-extrabold text-xs sm:text-sm text-gray-900 dark:text-white truncate block mt-0.5">
            {cityName}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          data-lenis-prevent="true"
          className="absolute top-full left-0 rtl:left-auto rtl:right-0 mt-2.5 w-[calc(100vw-2.5rem)] sm:w-80 rounded-3xl bg-white dark:bg-[#141122] border border-violet-200/90 dark:border-violet-500/30 shadow-[0_22px_55px_rgba(109,40,217,0.2)] p-3 z-[90]"
        >
          <div className="relative flex items-center mb-2">
            <Search className="w-3.5 h-3.5 text-violet-500 absolute left-3 rtl:left-auto rtl:right-3" />
            <input
              type="text"
              placeholder={language === "ar" ? "ابحث عن مدينة..." : "Search destination..."}
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              className="w-full pl-8 pr-3 rtl:pl-3 rtl:pr-8 py-2 rounded-2xl text-xs bg-violet-50/50 dark:bg-white/5 border border-violet-200/80 dark:border-violet-500/20 text-gray-900 dark:text-white focus:outline-none focus:border-violet-600"
            />
          </div>
          <div
            data-lenis-prevent="true"
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            className="dropdown-scroll max-h-64 overflow-y-auto space-y-0.5 pr-1"
            style={{ overscrollBehavior: "contain" }}
          >
            {CITIES.filter(
              (c) =>
                c.name.toLowerCase().includes(citySearch.toLowerCase()) ||
                c.nameAr.includes(citySearch)
            ).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  selectCity(c.id);
                  onClose();
                  setCitySearch("");
                }}
                className={`w-full text-left rtl:text-right px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors ${
                  activeCity === c.id
                    ? "bg-violet-100/80 dark:bg-violet-950/60 text-violet-800 dark:text-violet-200 font-bold"
                    : "hover:bg-violet-50/60 dark:hover:bg-white/5 text-gray-700 dark:text-gray-200"
                }`}
              >
                <span>{language === "ar" ? c.nameAr : c.name}</span>
                {activeCity === c.id && <Check className="w-3.5 h-3.5 text-violet-600" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

