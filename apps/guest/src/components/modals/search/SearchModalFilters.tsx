"use client";

import React, { RefObject } from "react";
import { Search, X, MapPin, Home, Zap } from "lucide-react";
import { CITY_NAMES_AR } from "@/data/translations";

interface SearchModalFiltersProps {
  inputRef: RefObject<HTMLInputElement>;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  rentType: "daily" | "monthly";
  setRentType: (val: "daily" | "monthly") => void;
  selectedCity: string;
  setSelectedCity: (val: string) => void;
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  poolOnly: boolean;
  setPoolOnly: (val: boolean) => void;
  instantOnly: boolean;
  setInstantOnly: (val: boolean) => void;
  selfCheckinOnly: boolean;
  setSelfCheckinOnly: (val: boolean) => void;
  isDarkTheme: boolean;
  language: string;
  t: {
    properties: {
      instantBook: string;
      [key: string]: string;
    };
    [key: string]: unknown;
  };
}

export function SearchModalFilters({
  inputRef,
  searchQuery,
  setSearchQuery,
  rentType,
  setRentType,
  selectedCity,
  setSelectedCity,
  selectedCategory,
  setSelectedCategory,
  poolOnly,
  setPoolOnly,
  instantOnly,
  setInstantOnly,
  selfCheckinOnly,
  setSelfCheckinOnly,
  isDarkTheme,
  language,
  t,
}: SearchModalFiltersProps) {
  return (
    <>
      {/* Rent Type Mode Switcher */}
      <div className="flex items-center gap-2 mb-4 p-1 rounded-2xl bg-purple-500/10 border border-purple-500/20 w-fit">
        <button
          onClick={() => setRentType("daily")}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            rentType === "daily"
              ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-glow"
              : isDarkTheme
              ? "text-white/70 hover:text-white"
              : "text-gray-700 hover:text-gray-900"
          }`}
        >
          {language === "ar" ? "إيجار يومي" : "Daily Rent"}
        </button>
        <button
          onClick={() => setRentType("monthly")}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            rentType === "monthly"
              ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-glow"
              : isDarkTheme
              ? "text-white/70 hover:text-white"
              : "text-gray-700 hover:text-gray-900"
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
          <MapPin className="w-3 h-3 text-fuchsia-400" />{" "}
          {language === "ar" ? "وجهة المدينة" : "Destination City"}
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
          <Home className="w-3 h-3 text-violet-400" />{" "}
          {language === "ar" ? "نوع الوحدة" : "Property Type"}
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
              : isDarkTheme
              ? "bg-white/[0.04] text-white/60 border-white/10"
              : "bg-gray-100 text-gray-600 border-gray-200"
          }`}
        >
          <span>🏊 {language === "ar" ? "مسبح خاص" : "Private Pool"}</span>
        </button>

        <button
          onClick={() => setInstantOnly(!instantOnly)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border cursor-pointer ${
            instantOnly
              ? "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-400/50"
              : isDarkTheme
              ? "bg-white/[0.04] text-white/60 border-white/10"
              : "bg-gray-100 text-gray-600 border-gray-200"
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
              : isDarkTheme
              ? "bg-white/[0.04] text-white/60 border-white/10"
              : "bg-gray-100 text-gray-600 border-gray-200"
          }`}
        >
          <span>🔑 {language === "ar" ? "دخول ذاتي ذكي" : "Smart Lock"}</span>
        </button>
      </div>
    </>
  );
}
