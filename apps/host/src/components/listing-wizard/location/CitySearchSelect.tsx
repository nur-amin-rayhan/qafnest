"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Search, Check, MapPin, X } from "lucide-react";
import { resolveSaudiCity } from "@qafnest/shared";
import { SAUDI_CITIES, normalizeSearchText, toCityId } from "@/lib/geo/saudiLocations";

interface CitySearchSelectProps {
  value?: string;
  onSelect: (cityId: string) => void;
  lang: "ar" | "en";
  t: (en: string, ar: string) => string;
}

/**
 * Searchable single-line Saudi city dropdown replacing the open multi-row pill list
 * on Step 1 ("Property Address & Location") of the host listing wizard.
 */
export function CitySearchSelect({ value, onSelect, lang, t }: CitySearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedId = toCityId(value);
  const selectedCity = useMemo(
    () => SAUDI_CITIES.find((c) => c.id === selectedId) || null,
    [selectedId]
  );

  const filteredCities = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return SAUDI_CITIES;
    const norm = normalizeSearchText(trimmed);
    const lower = trimmed.toLowerCase();
    const aliasMatch = resolveSaudiCity(trimmed);
    return SAUDI_CITIES.filter(
      (c) =>
        normalizeSearchText(c.id).includes(norm) ||
        c.en.toLowerCase().includes(lower) ||
        (aliasMatch && c.en.toLowerCase() === aliasMatch.en.toLowerCase())
    );
  }, [query]);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery("");
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => searchInputRef.current?.focus());
    }
  }, [isOpen]);

  const handleChoose = (cityId: string) => {
    onSelect(cityId);
    setIsOpen(false);
    setQuery("");
  };

  return (
    <div ref={containerRef} className="relative z-30 flex flex-col sm:flex-row sm:items-center gap-2">
      <label className="text-xs font-black text-slate-700 shrink-0">
        {t("City", "المدينة")} <span className="text-rose-500">*</span>
      </label>

      <div className="relative flex-1 max-w-md">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className={`w-full flex items-center justify-between gap-2 rounded-xl border bg-white px-3.5 py-2.5 text-xs sm:text-sm font-bold transition shadow-sm cursor-pointer ${
            isOpen
              ? "border-[#4F2396] ring-2 ring-[#4F2396]/20 text-slate-900"
              : "border-slate-200 hover:border-purple-300 text-slate-800"
          }`}
        >
          <span className="flex items-center gap-2 min-w-0">
            <MapPin size={15} className="text-[#4F2396] shrink-0" />
            {selectedCity ? (
              <span className="truncate">
                {lang === "ar" ? selectedCity.id : selectedCity.en}
                <span className="ms-1.5 text-[11px] font-semibold text-slate-400">
                  ({lang === "ar" ? selectedCity.en : selectedCity.id})
                </span>
              </span>
            ) : (
              <span className="text-slate-400 truncate">
                {t("Select city...", "اختر المدينة...")}
              </span>
            )}
          </span>
          <ChevronDown
            size={16}
            className={`text-slate-400 shrink-0 transition-transform ${isOpen ? "rotate-180 text-[#4F2396]" : ""}`}
          />
        </button>

        {isOpen && (
          <div className="absolute start-0 end-0 top-full mt-1.5 z-50 rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
            <div className="p-2.5 border-b border-slate-100 bg-slate-50/70">
              <div className="relative flex items-center">
                <Search size={14} className="absolute start-3 text-slate-400 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("Search city (English or Arabic)...", "ابحث عن المدينة...")}
                  className="w-full rounded-xl border border-slate-200 bg-white ps-8 pe-7 py-2 text-xs font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#4F2396]"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label={t("Clear city search", "مسح البحث")}
                    className="absolute end-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            <div
              role="listbox"
              aria-label={t("Saudi Cities", "مدن المملكة")}
              className="max-h-64 overflow-y-auto p-1.5 space-y-0.5"
            >
              {filteredCities.length > 0 ? (
                filteredCities.map((c) => {
                  const isActive = selectedId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      onClick={() => handleChoose(c.id)}
                      className={`w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-start text-xs font-bold transition cursor-pointer ${
                        isActive
                          ? "bg-purple-50 text-[#4F2396]"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className="truncate">
                        {lang === "ar" ? c.id : c.en}
                        <span className="ms-1.5 text-[11px] font-medium text-slate-400">
                          {lang === "ar" ? c.en : c.id}
                        </span>
                      </span>
                      {isActive && <Check size={14} className="text-[#4F2396] shrink-0" />}
                    </button>
                  );
                })
              ) : (
                <div className="px-3 py-5 text-center text-xs font-bold text-slate-400">
                  {t("No matching Saudi cities found", "لم يتم العثور على مدينة مطابقة")}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
