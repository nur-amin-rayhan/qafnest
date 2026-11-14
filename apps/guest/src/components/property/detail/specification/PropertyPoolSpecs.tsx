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
    <div className="mt-5 rounded-3xl border border-violet-200/80 bg-violet-50/35 p-5 dark:border-violet-500/20 dark:bg-[#12101a]">
      <div className="flex items-center gap-2 text-violet-800 dark:text-violet-300 font-bold text-sm mb-3">
        <Waves className="h-4 w-4 text-violet-600 dark:text-violet-400" />
        <span>{anchorLabel("Swimming Pool Specifications", "مواصفات المسبح")}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="rounded-2xl border border-violet-200/70 bg-white p-3 dark:border-violet-500/20 dark:bg-[#161224]">
          <span className="text-gray-500 dark:text-gray-400 block">
            {anchorLabel("Pool Type", "نوع المسبح")}
          </span>
          <span className="mt-0.5 block font-bold text-gray-900 dark:text-white">
            {poolDetails?.type === "indoor"
              ? anchorLabel("Indoor Pool", "مسبح داخلي خاص")
              : anchorLabel("Outdoor Pool", "مسبح خارجي خاص")}
          </span>
        </div>
        <div className="rounded-2xl border border-violet-200/70 bg-white p-3 dark:border-violet-500/20 dark:bg-[#161224]">
          <span className="text-gray-500 dark:text-gray-400 block">
            {anchorLabel("Safety Barrier", "حاجز الأمان")}
          </span>
          <span className="mt-0.5 block font-bold text-gray-900 dark:text-white">
            {poolDetails?.hasBarrier
              ? anchorLabel("Child safety barrier present", "متوفر حاجز حماية للأطفال")
              : anchorLabel("Open pool", "بدون حاجز")}
          </span>
        </div>
        {poolDetails?.dimensions && (
          <div className="rounded-2xl border border-violet-200/70 bg-white p-3 dark:border-violet-500/20 dark:bg-[#161224]">
            <span className="text-gray-500 dark:text-gray-400 block">
              {anchorLabel("Dimensions", "أبعاد المسبح")}
            </span>
            <span className="mt-0.5 block font-bold text-gray-900 dark:text-white">
              {poolDetails.dimensions}
            </span>
          </div>
        )}
        {poolDetails?.depth && (
          <div className="rounded-2xl border border-violet-200/70 bg-white p-3 dark:border-violet-500/20 dark:bg-[#161224]">
            <span className="text-gray-500 dark:text-gray-400 block">
              {anchorLabel("Depth", "عمق المسبح")}
            </span>
            <span className="mt-0.5 block font-bold text-gray-900 dark:text-white">
              {poolDetails.depth}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

