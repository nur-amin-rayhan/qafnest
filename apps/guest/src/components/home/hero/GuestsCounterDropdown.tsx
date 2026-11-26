"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Plus, Minus } from "lucide-react";

interface GuestsCounterDropdownProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  guestsCount: number;
  adults: number;
  childrenCount?: number;
  children?: number;
  rooms?: number;
  onAdultsChange: (val: number) => void;
  onChildrenChange: (val: number) => void;
  onRoomsChange?: (val: number) => void;
  guestsLabel: string;
  selectGuestsLabel: string;
  adultsLabel: string;
  adultsSubLabel: string;
  childrenLabel: string;
  childrenSubLabel: string;
  roomsLabel?: string;
  roomsSubLabel?: string;
  language: string;
}

export function GuestsCounterDropdown({
  isOpen,
  onToggle,
  onClose,
  guestsCount,
  adults,
  childrenCount,
  children: propChildren,
  rooms = 1,
  onAdultsChange,
  onChildrenChange,
  onRoomsChange,
  guestsLabel,
  selectGuestsLabel,
  adultsLabel,
  adultsSubLabel,
  childrenLabel,
  childrenSubLabel,
  roomsLabel,
  roomsSubLabel,
  language,
}: GuestsCounterDropdownProps) {
  const children = childrenCount ?? propChildren ?? 0;
  const currentRooms = Math.max(1, rooms);
  const displayValue = guestsCount
    ? language === "ar"
      ? `${currentRooms} ${currentRooms === 1 ? "غرفة" : "غرف"} · ${guestsCount} ضيوف`
      : `${currentRooms} ${currentRooms === 1 ? "Room" : "Rooms"} · ${guestsCount} ${
          guestsCount === 1 ? "Guest" : "Guests"
        }`
    : selectGuestsLabel;

  return (
    <div className={`relative w-full flex-1 min-w-0 lg:min-w-[160px] transition-all ${isOpen ? "z-50" : "z-10"}`}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-3 sm:py-3.5 flex items-center justify-between text-start hover:bg-gray-50/60 dark:hover:bg-white/[0.04] rounded-xl transition-colors cursor-pointer"
      >
        <div className="min-w-0 pr-2 rtl:pr-0 rtl:pl-2">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium block whitespace-nowrap">
            {language === "ar" ? "الغرف والضيوف" : (roomsLabel && guestsLabel ? `${roomsLabel} & ${guestsLabel}` : guestsLabel)}
          </span>
          <span className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate block mt-0.5 whitespace-nowrap">
            {displayValue}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-purple-700 dark:text-purple-400 shrink-0 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Guests & Rooms Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            data-lenis-prevent="true"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2.5 right-0 rtl:right-auto rtl:left-0 w-[calc(100vw-2.5rem)] sm:w-[320px] max-w-[340px] z-[100] rounded-3xl bg-white dark:bg-[#0E0E1A] shadow-[0_20px_50px_rgba(0,0,0,0.25)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.85)] border border-gray-200/80 dark:border-white/15 p-4"
          >
            <h4 className="font-bold text-sm text-gray-900 dark:text-white pb-3 border-b border-gray-100 dark:border-white/10">
              {language === "ar" ? "تحديد عدد الغرف والضيوف" : (roomsLabel ? `${roomsLabel} & ${selectGuestsLabel}` : selectGuestsLabel)}
            </h4>

            {/* 1. Rooms Counter (at the very top) */}
            {onRoomsChange && (
              <div className="py-3 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">
                    {roomsLabel || (language === "ar" ? "الغرف" : "Rooms")}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {roomsSubLabel || (language === "ar" ? "عدد غرف النوم (الحد الأدنى ١)" : "Bedrooms (min 1)")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    aria-label="Remove one room"
                    disabled={currentRooms <= 1}
                    onClick={() => onRoomsChange(Math.max(1, currentRooms - 1))}
                    className="h-7 w-7 rounded-full border border-gray-300 dark:border-white/20 flex items-center justify-center text-gray-700 dark:text-white hover:border-purple-600 transition-colors disabled:opacity-30 cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-5 text-center text-xs font-bold text-gray-900 dark:text-white">
                    {currentRooms}
                  </span>
                  <button
                    type="button"
                    aria-label="Add one room"
                    disabled={currentRooms >= 20}
                    onClick={() => onRoomsChange(currentRooms + 1)}
                    className="h-7 w-7 rounded-full border border-gray-300 dark:border-white/20 flex items-center justify-center text-gray-700 dark:text-white hover:border-purple-600 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* 2. Adults Counter */}
            <div className="py-3 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-white">{adultsLabel}</p>
                <p className="text-[11px] text-gray-400">
                  {language === "ar" ? "١٣ سنة فأكثر (الحد الأدنى ١)" : `${adultsSubLabel} (min 1)`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Remove one adult"
                  disabled={adults <= 1}
                  onClick={() => onAdultsChange(Math.max(1, adults - 1))}
                  className="h-7 w-7 rounded-full border border-gray-300 dark:border-white/20 flex items-center justify-center text-gray-700 dark:text-white hover:border-purple-600 transition-colors disabled:opacity-30 cursor-pointer"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-5 text-center text-xs font-bold text-gray-900 dark:text-white">
                  {adults}
                </span>
                <button
                  type="button"
                  aria-label="Add one adult"
                  disabled={adults >= 30}
                  onClick={() => onAdultsChange(adults + 1)}
                  className="h-7 w-7 rounded-full border border-gray-300 dark:border-white/20 flex items-center justify-center text-gray-700 dark:text-white hover:border-purple-600 transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* 3. Children Counter */}
            <div className="py-3 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-white">{childrenLabel}</p>
                <p className="text-[11px] text-gray-400">
                  {language === "ar" ? "٢ - ١٢ سنة (الحد الأدنى ٠)" : `${childrenSubLabel} (min 0)`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Remove one child"
                  disabled={children <= 0}
                  onClick={() => onChildrenChange(Math.max(0, children - 1))}
                  className="h-7 w-7 rounded-full border border-gray-300 dark:border-white/20 flex items-center justify-center text-gray-700 dark:text-white hover:border-purple-600 transition-colors disabled:opacity-30 cursor-pointer"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-5 text-center text-xs font-bold text-gray-900 dark:text-white">
                  {children}
                </span>
                <button
                  type="button"
                  aria-label="Add one child"
                  disabled={children >= 20}
                  onClick={() => onChildrenChange(children + 1)}
                  className="h-7 w-7 rounded-full border border-gray-300 dark:border-white/20 flex items-center justify-center text-gray-700 dark:text-white hover:border-purple-600 transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Apply Button */}
            <div className="pt-3 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-purple-700 text-white text-xs font-bold shadow-md hover:bg-purple-800 transition-colors cursor-pointer"
              >
                {language === "ar"
                  ? `تطبيق (${adults + children} ضيوف · ${currentRooms} ${currentRooms === 1 ? "غرفة" : "غرف"})`
                  : `Apply (${adults + children} Guests · ${currentRooms} ${currentRooms === 1 ? "Room" : "Rooms"})`}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
