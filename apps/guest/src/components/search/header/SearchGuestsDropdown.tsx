"use client";

import React from "react";
import { ChevronDown, Minus, Plus } from "lucide-react";

interface SearchGuestsDropdownProps {
  guestsCount: number;
  adults: number;
  setAdults: React.Dispatch<React.SetStateAction<number>>;
  childrenCount: number;
  setChildren: React.Dispatch<React.SetStateAction<number>>;
  rooms?: number;
  setRooms?: React.Dispatch<React.SetStateAction<number>>;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  language: "en" | "ar";
}

export function SearchGuestsDropdown({
  guestsCount,
  adults,
  setAdults,
  childrenCount,
  setChildren,
  rooms = 0,
  setRooms,
  isOpen,
  onToggle,
  onClose,
  language,
}: SearchGuestsDropdownProps) {
  const currentRooms = Math.max(0, rooms);

  return (
    <div className="relative flex-1 min-w-[180px] px-3 py-1.5">
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left rtl:text-right flex items-center justify-between cursor-pointer rounded-xl hover:bg-violet-50/60 dark:hover:bg-white/5 px-1.5 py-0.5 transition-colors"
      >
        <div className="min-w-0 pr-2">
          <span className="text-[10px] uppercase font-extrabold tracking-wider text-violet-700/75 dark:text-violet-300/80 block leading-tight">
            {language === "ar" ? "الغرف والضيوف" : "Rooms & Guests"}
          </span>
          <span className="font-extrabold text-xs sm:text-sm text-gray-900 dark:text-white truncate block mt-0.5">
            {language === "ar"
              ? `${
                  currentRooms === 0
                    ? "أي غرف"
                    : `${currentRooms} ${currentRooms === 1 ? "غرفة" : "غرف"}`
                } · ${guestsCount} ضيوف`
              : `${
                  currentRooms === 0
                    ? "Any Rooms"
                    : `${currentRooms} ${currentRooms === 1 ? "Room" : "Rooms"}`
                } · ${guestsCount} ${guestsCount === 1 ? "Guest" : "Guests"}`}
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
          onWheel={(e) => e.stopPropagation()}
          className="absolute top-full right-0 rtl:right-auto rtl:left-0 mt-2.5 w-80 rounded-3xl bg-white dark:bg-[#141122] border border-violet-200/90 dark:border-violet-500/30 shadow-[0_22px_55px_rgba(109,40,217,0.2)] p-4 z-[90]"
        >
          <h4 className="font-extrabold text-xs uppercase tracking-wider text-violet-700 dark:text-violet-300 pb-2.5 border-b border-violet-100 dark:border-violet-500/20">
            {language === "ar" ? "تحديد عدد الغرف والضيوف" : "Select Rooms & Guests"}
          </h4>

          {/* 1. Rooms Row (at the very top) */}
          {setRooms && (
            <div className="py-3 border-b border-violet-100/80 dark:border-violet-500/15 flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white">
                  {language === "ar" ? "الغرف" : "Rooms"}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  {language === "ar" ? "عدد غرف النوم (0 = الكل)" : "Bedrooms (0 = Any)"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Remove one room"
                  onClick={() => setRooms((prev) => Math.max(0, prev - 1))}
                  disabled={currentRooms <= 0}
                  className="h-8 w-8 rounded-full border border-violet-300 dark:border-violet-500/30 bg-violet-50/50 dark:bg-white/5 text-violet-700 dark:text-white hover:bg-violet-100 flex items-center justify-center disabled:opacity-35 cursor-pointer transition-colors"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="min-w-5 text-center text-sm font-extrabold text-gray-900 dark:text-white">
                  {currentRooms}
                </span>
                <button
                  type="button"
                  aria-label="Add one room"
                  onClick={() => setRooms((prev) => Math.min(20, prev + 1))}
                  disabled={currentRooms >= 20}
                  className="h-8 w-8 rounded-full border border-violet-300 dark:border-violet-500/30 bg-violet-50/50 dark:bg-white/5 text-violet-700 dark:text-white hover:bg-violet-100 flex items-center justify-center disabled:opacity-35 cursor-pointer transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* 2. Adults Row */}
          <div className="py-3 border-b border-violet-100/80 dark:border-violet-500/15 flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white">
                {language === "ar" ? "البالغون" : "Adults"}
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {language === "ar" ? "١٣ سنة فأكثر (الحد الأدنى ١)" : "Ages 13 or above (min 1)"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Remove one adult"
                onClick={() => setAdults((prev) => Math.max(1, prev - 1))}
                disabled={adults <= 1}
                className="h-8 w-8 rounded-full border border-violet-300 dark:border-violet-500/30 bg-violet-50/50 dark:bg-white/5 text-violet-700 dark:text-white hover:bg-violet-100 flex items-center justify-center disabled:opacity-35 cursor-pointer transition-colors"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="min-w-5 text-center text-sm font-extrabold text-gray-900 dark:text-white">
                {adults}
              </span>
              <button
                type="button"
                aria-label="Add one adult"
                onClick={() => setAdults((prev) => Math.min(30, prev + 1))}
                disabled={adults >= 30}
                className="h-8 w-8 rounded-full border border-violet-300 dark:border-violet-500/30 bg-violet-50/50 dark:bg-white/5 text-violet-700 dark:text-white hover:bg-violet-100 flex items-center justify-center disabled:opacity-35 cursor-pointer transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* 3. Children Row */}
          <div className="py-3 border-b border-violet-100/80 dark:border-violet-500/15 flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white">
                {language === "ar" ? "الأطفال" : "Children"}
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {language === "ar" ? "٢ - ١٢ سنة (الحد الأدنى ٠)" : "Ages 2–12 (min 0)"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Remove one child"
                onClick={() => setChildren((prev) => Math.max(0, prev - 1))}
                disabled={childrenCount <= 0}
                className="h-8 w-8 rounded-full border border-violet-300 dark:border-violet-500/30 bg-violet-50/50 dark:bg-white/5 text-violet-700 dark:text-white hover:bg-violet-100 flex items-center justify-center disabled:opacity-35 cursor-pointer transition-colors"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="min-w-5 text-center text-sm font-extrabold text-gray-900 dark:text-white">
                {childrenCount}
              </span>
              <button
                type="button"
                aria-label="Add one child"
                onClick={() => setChildren((prev) => Math.min(20, prev + 1))}
                disabled={childrenCount >= 20}
                className="h-8 w-8 rounded-full border border-violet-300 dark:border-violet-500/30 bg-violet-50/50 dark:bg-white/5 text-violet-700 dark:text-white hover:bg-violet-100 flex items-center justify-center disabled:opacity-35 cursor-pointer transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="mt-3.5 flex items-center justify-between">
            <span className="text-xs font-bold text-violet-800 dark:text-violet-200">
              {language === "ar"
                ? `الإجمالي: ${currentRooms} ${currentRooms === 1 ? "غرفة" : "غرف"} · ${guestsCount} ضيوف`
                : `Total: ${currentRooms} ${currentRooms === 1 ? "Room" : "Rooms"} · ${guestsCount} ${guestsCount === 1 ? "Guest" : "Guests"}`}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-gradient-to-r from-violet-700 to-fuchsia-600 px-4 py-1.5 text-xs font-bold text-white hover:opacity-95 cursor-pointer shadow-xs"
            >
              {language === "ar" ? "تم" : "Done"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
