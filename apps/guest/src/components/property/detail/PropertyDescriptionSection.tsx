"use client";

import React from "react";
import { Star } from "lucide-react";
import type { Property } from "@/data/properties";

interface PropertyDescriptionSectionProps {
  property: Property;
  title: string;
  district: string;
  categoryName: string;
  capacity: number;
  specs: string;
  hasDiscount: boolean;
  anchorLabel: (en: string, ar: string) => string;
}

export function PropertyDescriptionSection({
  property,
  title,
  district,
  categoryName,
  capacity,
  specs,
  hasDiscount,
  anchorLabel,
}: PropertyDescriptionSectionProps) {
  return (
    <section
      id="description"
      className="scroll-mt-32 border-b border-violet-100/80 py-8 dark:border-violet-500/15"
    >
      <h2 className="text-2xl font-extrabold tracking-tight text-gray-950 dark:text-white">
        {anchorLabel("Description", "الوصف")}
      </h2>
      {property.tourismLicenseNumber && (
        <p className="mt-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
          {anchorLabel("Tourism Ministry License Number", "رقم ترخيص وزارة السياحة")}:{" "}
          {property.tourismLicenseNumber}. {specs}
        </p>
      )}
      <p className="mt-4 max-w-4xl whitespace-pre-line text-sm leading-7 text-gray-600 dark:text-gray-300">
        {anchorLabel(
          property.description ||
            property.descriptionAr ||
            `${title} is in ${district}. This ${categoryName.toLowerCase()} accommodates up to ${capacity} guests. Review the property features, house rules and booking details before confirming your stay.`,
          property.descriptionAr ||
            property.description ||
            `${title} في ${district}. يستوعب هذا المكان حتى ${capacity} ضيوف. راجع المرافق وقواعد الإقامة وتفاصيل الحجز قبل تأكيد إقامتك.`
        )}
      </p>

      {(hasDiscount || property.discountPercentage) && (
        <div className="mt-6 flex items-center justify-between rounded-3xl border border-rose-200/90 bg-[#FDF2F2] p-5 dark:border-rose-500/30 dark:bg-rose-950/25 shadow-xs">
          <div>
            <span className="text-base sm:text-lg font-black tracking-tight text-rose-600 dark:text-rose-400">
              {property.discountPercentage ||
                Math.round(
                  ((property.originalPrice! - property.basePrice) /
                    property.originalPrice!) *
                    100
                )}
              % OFF
            </span>
            <p className="mt-0.5 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200">
              {anchorLabel(
                "Host offers a special discount for booking",
                "المضيف يقدم خصم خاص للحجز"
              )}
            </p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100/80 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300 shrink-0 shadow-xs">
            <Star className="h-5 w-5 sm:h-6 sm:w-6 fill-violet-700 text-violet-700 dark:fill-violet-300 dark:text-violet-300" />
          </div>
        </div>
      )}
    </section>
  );
}

