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
      className="scroll-mt-32 overflow-hidden rounded-2xl border border-slate-200/85 bg-white shadow-xs dark:border-slate-800 dark:bg-[#110F18]"
    >
      <button
        type="button"
        onClick={() => setPromiseExpanded((expanded) => !expanded)}
        aria-expanded={promiseExpanded}
        className="flex w-full items-center gap-4 p-5 text-left transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40 sm:p-6 cursor-pointer"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#4F2396] dark:bg-purple-950/60 dark:text-purple-300">
          <ShieldCheck className="h-6 w-6" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold text-slate-900 dark:text-white">
            {anchorLabel("QafNest guest support", "دعم ضيوف قاف نست")}
          </span>
          <span className="mt-1 block text-sm text-slate-600 dark:text-slate-300">
            {anchorLabel(
              "Clear listing details and support during your stay",
              "تفاصيل واضحة ودعم أثناء إقامتك"
            )}
          </span>
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-slate-500 dark:text-slate-400 transition-transform ${
            promiseExpanded ? "rotate-180" : ""
          }`}
        />
      </button>
      {promiseExpanded && (
        <div className="border-t border-slate-200/80 px-5 py-5 text-sm leading-7 text-slate-600 dark:border-slate-800 dark:text-slate-300 sm:px-6">
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

