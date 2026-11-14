"use client";

import { Sofa } from "lucide-react";
import type { Property } from "@/data/properties";

interface PropertyMajlisSpecsProps {
  majlisDetails: NonNullable<Property["majlisDetails"]>;
  chaletFor: string;
  anchorLabel: (en: string, ar: string) => string;
}

export default function PropertyMajlisSpecs({
  majlisDetails,
  chaletFor,
  anchorLabel,
}: PropertyMajlisSpecsProps) {
  return (
    <div className="mt-4 rounded-3xl border border-violet-200/80 bg-violet-50/35 p-5 dark:border-violet-500/20 dark:bg-[#12101a]">
      <div className="flex items-center gap-2 text-violet-800 dark:text-violet-300 font-bold text-sm mb-3">
        <Sofa className="h-4 w-4 text-violet-600 dark:text-violet-400" />
        <span>{anchorLabel("Living Rooms & Seating", "المجالس والجلسات")}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
        <div className="rounded-2xl border border-violet-200/70 bg-white p-3 dark:border-violet-500/20 dark:bg-[#161224]">
          <span className="text-gray-500 dark:text-gray-400 block">
            {anchorLabel("Main Majlis", "المجلس الرئيسي")}
          </span>
          <span className="mt-0.5 block font-bold text-gray-900 dark:text-white">
            {anchorLabel(
              `Seats up to ${majlisDetails.mainMajlisCapacity} persons`,
              `يسع لـ ${majlisDetails.mainMajlisCapacity} شخص`
            )}
          </span>
        </div>
        {majlisDetails.outdoorSeatingCapacity && (
          <div className="rounded-2xl border border-violet-200/70 bg-white p-3 dark:border-violet-500/20 dark:bg-[#161224]">
            <span className="text-gray-500 dark:text-gray-400 block">
              {anchorLabel("Outdoor Seating", "الجلسة الخارجية")}
            </span>
            <span className="mt-0.5 block font-bold text-gray-900 dark:text-white">
              {anchorLabel(
                `Seats up to ${majlisDetails.outdoorSeatingCapacity} persons`,
                `تتسع لـ ${majlisDetails.outdoorSeatingCapacity} شخص`
              )}
            </span>
          </div>
        )}
        <div className="rounded-2xl border border-violet-200/70 bg-white p-3 dark:border-violet-500/20 dark:bg-[#161224]">
          <span className="text-gray-500 dark:text-gray-400 block">
            {anchorLabel("Access", "نوع الإقامة")}
          </span>
          <span className="mt-0.5 block font-bold text-gray-900 dark:text-white">{chaletFor}</span>
        </div>
      </div>
    </div>
  );
}

