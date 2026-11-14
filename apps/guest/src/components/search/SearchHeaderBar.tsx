"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Grid,
  Map as MapIcon,
  Search,
} from "lucide-react";
import { SearchCityDropdown } from "./header/SearchCityDropdown";
import { SearchDatePickerDropdown } from "./header/SearchDatePickerDropdown";
import { SearchGuestsDropdown } from "./header/SearchGuestsDropdown";

interface SearchHeaderBarProps {
  language: "en" | "ar";
  cityName: string;
  activeCity: string;
  selectCity: (cityId: string) => void;
  checkinDate: string;
  setCheckinDate: (date: string) => void;
  checkoutDate: string;
  setCheckoutDate: (date: string) => void;
  guestsCount: number;
  adults: number;
  setAdults: React.Dispatch<React.SetStateAction<number>>;
  childrenCount: number;
  setChildren: React.Dispatch<React.SetStateAction<number>>;
  rooms?: number;
  setRooms?: React.Dispatch<React.SetStateAction<number>>;
  viewMode: "grid" | "map";
  setViewMode: (mode: "grid" | "map") => void;
  onSearch: () => void;
}

export default function SearchHeaderBar({
  language,
  cityName,
  activeCity,
  selectCity,
  checkinDate,
  setCheckinDate,
  checkoutDate,
  setCheckoutDate,
  guestsCount,
  adults,
  setAdults,
  childrenCount,
  setChildren,
  rooms = 1,
  setRooms,
  viewMode,
  setViewMode,
  onSearch,
}: SearchHeaderBarProps) {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchBarRef.current && !searchBarRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveDropdown(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div
      ref={searchBarRef}
      className="rounded-3xl border border-violet-200/90 dark:border-violet-500/25 bg-gradient-to-r from-violet-50/40 via-white to-fuchsia-50/30 dark:from-[#131020] dark:via-[#12101a] dark:to-[#161126] shadow-[0_10px_30px_rgba(109,40,217,0.08)] p-2 mb-1.5 relative z-50"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-1.5">
        {/* 1. Choose a City */}
        <SearchCityDropdown
          cityName={cityName}
          activeCity={activeCity}
          selectCity={selectCity}
          isOpen={activeDropdown === "city"}
          onToggle={() => setActiveDropdown(activeDropdown === "city" ? null : "city")}
          onClose={() => setActiveDropdown(null)}
          language={language}
        />

        {/* 2. Check-in and Check-out Dates */}
        <SearchDatePickerDropdown
          checkinDate={checkinDate}
          setCheckinDate={setCheckinDate}
          checkoutDate={checkoutDate}
          setCheckoutDate={setCheckoutDate}
          isOpen={activeDropdown === "date"}
          onToggle={() => setActiveDropdown(activeDropdown === "date" ? null : "date")}
          onClose={() => setActiveDropdown(null)}
          language={language}
        />

        {/* 3. Guest & Room Count (Adults, Children & Rooms Steppers) */}
        <SearchGuestsDropdown
          guestsCount={guestsCount}
          adults={adults}
          setAdults={setAdults}
          childrenCount={childrenCount}
          setChildren={setChildren}
          rooms={rooms}
          setRooms={setRooms}
          isOpen={activeDropdown === "guests"}
          onToggle={() => setActiveDropdown(activeDropdown === "guests" ? null : "guests")}
          onClose={() => setActiveDropdown(null)}
          language={language}
        />

        {/* Action Buttons: Search + Map Toggle */}
        <div className="flex items-center gap-2 p-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveDropdown(null);
              onSearch();
            }}
            className="h-10 px-4 rounded-2xl bg-gradient-to-r from-violet-700 via-purple-600 to-fuchsia-600 hover:from-violet-600 hover:to-fuchsia-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-violet-600/20 active:scale-95 cursor-pointer"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
            <span className="sm:inline">{language === "ar" ? "بحث" : "Search"}</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode(viewMode === "grid" ? "map" : "grid")}
            className="h-10 px-4 rounded-2xl border border-violet-300 dark:border-violet-500/30 bg-violet-50/70 dark:bg-violet-950/40 hover:bg-violet-100 dark:hover:bg-violet-900/50 text-violet-800 dark:text-violet-200 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            {viewMode === "grid" ? (
              <>
                <MapIcon className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                <span>{language === "ar" ? "الخريطة" : "Map"}</span>
              </>
            ) : (
              <>
                <Grid className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                <span>{language === "ar" ? "القائمة" : "Cards"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
