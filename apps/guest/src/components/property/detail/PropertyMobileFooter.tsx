"use client";

import React from "react";
import type { Property } from "@/data/properties";

interface PropertyMobileFooterProps {
  property: Property;
  nights: number;
  hasDiscount: boolean;
  estimatedTotal: number;
  formatPrice: (price: number) => string;
  onReserve: () => void;
  anchorLabel: (en: string, ar: string) => string;
}

export function PropertyMobileFooter({
  property,
  nights,
  hasDiscount,
  estimatedTotal,
  formatPrice,
  onReserve,
  anchorLabel,
}: PropertyMobileFooterProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/90 bg-white/95 p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur-md dark:border-slate-800 dark:bg-[#0E0D16]/95 lg:hidden">
      <div className="mx-auto flex max-w-xl items-center justify-between gap-4">
        <div>
          <span className="block text-[10px] text-gray-500 dark:text-gray-400">
            {nights} {anchorLabel(nights === 1 ? "night" : "nights", "ليلة")}
          </span>
          <div className="flex items-baseline gap-1.5">
            {hasDiscount && (
              <span className="text-xs text-rose-500 line-through font-bold">
                {formatPrice(
                  (property.originalPrice || property.basePrice) * nights
                )}
              </span>
            )}
            <span className="font-extrabold text-base sm:text-lg text-gray-950 dark:text-white">
              {formatPrice(estimatedTotal)}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onReserve}
          className="rounded-xl bg-[#4F2396] hover:bg-[#3D1A78] px-6 py-3 text-sm font-bold text-white shadow-xs transition cursor-pointer"
        >
          {anchorLabel("Continue", "متابعة")}
        </button>
      </div>
    </div>
  );
}

