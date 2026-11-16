"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import { PROPERTY_TYPES } from "./heroConstants";

interface PropertyTypeDropdownProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
  propertyTypeLabel: string;
  chooseUnitTypeLabel: string;
  activeTypeName: string;
  language: string;
  getTypeLabel: (catId: string, englishName: string) => string;
}

export function PropertyTypeDropdown({
  isOpen,
  onToggle,
  onClose,
  selectedCategory,
  onSelectCategory,
  propertyTypeLabel,
  chooseUnitTypeLabel,
  activeTypeName,
  language,
  getTypeLabel,
}: PropertyTypeDropdownProps) {
  return (
    <div
      className={`relative flex-1 min-w-0 lg:min-w-[190px] border-b lg:border-b-0 lg:border-e border-gray-200/80 dark:border-white/10 transition-all ${
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
            {propertyTypeLabel}
          </span>
          <span className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate block mt-0.5 whitespace-nowrap">
            {activeTypeName}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-purple-700 dark:text-purple-400 shrink-0 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Property Type Popover */}
      <AnimatePresence>
        {isOpen && (
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
                {chooseUnitTypeLabel}
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
                      onSelectCategory(type.id);
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
                onClick={onClose}
                className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 hover:underline cursor-pointer"
              >
                {language === "ar" ? "متابعة ←" : "CONTINUE >"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

