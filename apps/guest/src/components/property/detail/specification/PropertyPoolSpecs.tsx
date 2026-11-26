"use client";

import { Waves } from "lucide-react";
import type { Property } from "@/data/properties";

interface PropertyPoolSpecsProps {
  poolDetails: Property["poolDetails"];
  anchorLabel: (en: string, ar: string) => string;
}

export default function PropertyPoolSpecs({
  poolDetails,
  anchorLabel,
}: PropertyPoolSpecsProps) {
  return (
    <div className="mt-5 rounded-2xl border border-slate-200/85 bg-slate-50/60 p-4 sm:p-5 dark:border-slate-800 dark:bg-[#110F18]">
      <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold text-sm mb-3.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
          <Waves className="h-4 w-4" />
        </span>
        <span>{anchorLabel("Swimming Pool Specifications", "مواصفات المسبح")}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="rounded-xl border border-slate-200/70 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900/90 shadow-2xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium block">
            {anchorLabel("Pool Type", "نوع المسبح")}
          </span>
          <span className="mt-1 block font-bold text-slate-900 dark:text-white text-sm">
            {poolDetails?.type === "indoor"
              ? anchorLabel("Indoor Pool", "مسبح داخلي خاص")
              : anchorLabel("Outdoor Pool", "مسبح خارجي خاص")}
          </span>
        </div>
        <div className="rounded-xl border border-slate-200/70 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900/90 shadow-2xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium block">
            {anchorLabel("Safety Barrier", "حاجز الأمان")}
          </span>
          <span className="mt-1 block font-bold text-slate-900 dark:text-white text-sm">
            {poolDetails?.hasBarrier
              ? anchorLabel("Child safety barrier present", "متوفر حاجز حماية للأطفال")
              : anchorLabel("Open pool", "بدون حاجز")}
          </span>
        </div>
        {poolDetails?.dimensions && (
          <div className="rounded-xl border border-slate-200/70 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900/90 shadow-2xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium block">
              {anchorLabel("Dimensions", "أبعاد المسبح")}
            </span>
            <span className="mt-1 block font-bold text-slate-900 dark:text-white text-sm">
              {poolDetails.dimensions}
            </span>
          </div>
        )}
        {poolDetails?.depth && (
          <div className="rounded-xl border border-slate-200/70 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900/90 shadow-2xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium block">
              {anchorLabel("Depth", "عمق المسبح")}
            </span>
            <span className="mt-1 block font-bold text-slate-900 dark:text-white text-sm">
              {poolDetails.depth}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

