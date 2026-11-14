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
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-violet-200/80 bg-gradient-to-r from-violet-50/95 via-white/95 to-fuchsia-50/95 p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur-lg dark:border-violet-500/30 dark:from-[#120e1f]/95 dark:via-[#0b0912]/95 dark:to-[#181028]/95 lg:hidden">
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
          className="rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-violet-600/25 transition hover:from-violet-700 hover:to-fuchsia-700 cursor-pointer"
        >
          {anchorLabel("Continue", "متابعة")}
        </button>
      </div>
    </div>
  );
}

