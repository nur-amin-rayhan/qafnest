"use client";

import React, { useState } from "react";
import { ShieldCheck, ChevronDown } from "lucide-react";
import type { Property } from "@/data/properties";

interface PropertyGuaranteeSectionProps {
  property: Property;
  anchorLabel: (en: string, ar: string) => string;
}

export default function PropertyGuaranteeSection({
  property,
  anchorLabel,
}: PropertyGuaranteeSectionProps) {
  const [promiseExpanded, setPromiseExpanded] = useState(false);

  return (
    <section
      id="guarantee"
      className="scroll-mt-32 overflow-hidden rounded-3xl border border-violet-200/85 bg-white shadow-[0_10px_30px_rgba(109,40,217,0.06)] dark:border-violet-500/25 dark:bg-[#12101a]"
    >
      <button
        type="button"
        onClick={() => setPromiseExpanded((expanded) => !expanded)}
        aria-expanded={promiseExpanded}
        className="flex w-full items-center gap-4 p-5 text-left transition hover:bg-violet-50/50 dark:hover:bg-violet-500/10 sm:p-6 cursor-pointer"
      >
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-700 text-white shadow-lg shadow-violet-700/25">
          <ShieldCheck className="h-7 w-7" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold text-gray-950 dark:text-white">
            {anchorLabel("QafNest guest support", "دعم ضيوف قاف نست")}
          </span>
          <span className="mt-1 block text-sm text-gray-600 dark:text-gray-300">
            {anchorLabel(
              "Clear listing details and support during your stay",
              "تفاصيل واضحة ودعم أثناء إقامتك"
            )}
          </span>
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-violet-600 dark:text-violet-400 transition-transform ${
            promiseExpanded ? "rotate-180" : ""
          }`}
        />
      </button>
      {promiseExpanded && (
        <div className="border-t border-violet-100 px-5 py-5 text-sm leading-7 text-gray-600 dark:border-violet-500/20 dark:text-gray-300 sm:px-6">
          <p>
            {anchorLabel(
              "Review the property description, amenities and host conditions before booking. If you need help with your reservation, contact QafNest support.",
              "راجع وصف العقار والمرافق وشروط المضيف قبل الحجز. إذا احتجت إلى مساعدة بشأن حجزك، تواصل مع دعم قاف نست."
            )}
          </p>
          {property.tourismLicenseNumber && (
            <p className="mt-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
              {anchorLabel(
                "Tourism Ministry License Number",
                "رقم ترخيص وزارة السياحة"
              )}
              : {property.tourismLicenseNumber}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

