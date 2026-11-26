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
    <div className="mt-4 rounded-2xl border border-slate-200/85 bg-slate-50/60 p-4 sm:p-5 dark:border-slate-800 dark:bg-[#110F18]">
      <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold text-sm mb-3.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
          <Sofa className="h-4 w-4" />
        </span>
        <span>{anchorLabel("Living Rooms & Seating", "المجالس والجلسات")}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
        <div className="rounded-xl border border-slate-200/70 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900/90 shadow-2xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium block">
            {anchorLabel("Main Majlis", "المجلس الرئيسي")}
          </span>
          <span className="mt-1 block font-bold text-slate-900 dark:text-white text-sm">
            {anchorLabel(
              `Seats up to ${majlisDetails.mainMajlisCapacity} persons`,
              `يسع لـ ${majlisDetails.mainMajlisCapacity} شخص`
            )}
          </span>
        </div>
        {majlisDetails.outdoorSeatingCapacity && (
          <div className="rounded-xl border border-slate-200/70 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900/90 shadow-2xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium block">
              {anchorLabel("Outdoor Seating", "الجلسة الخارجية")}
            </span>
            <span className="mt-1 block font-bold text-slate-900 dark:text-white text-sm">
              {anchorLabel(
                `Seats up to ${majlisDetails.outdoorSeatingCapacity} persons`,
                `تتسع لـ ${majlisDetails.outdoorSeatingCapacity} شخص`
              )}
            </span>
          </div>
        )}
        <div className="rounded-xl border border-slate-200/70 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900/90 shadow-2xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium block">
            {anchorLabel("Access", "نوع الإقامة")}
          </span>
          <span className="mt-1 block font-bold text-slate-900 dark:text-white text-sm">{chaletFor}</span>
        </div>
      </div>
    </div>
  );
}

