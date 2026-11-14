"use client";

import React from "react";
import {
  ZoomIn,
  ZoomOut,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Navigation,
} from "lucide-react";

interface LocationMapControlsProps {
  onNudge: (dx: number, dy: number) => void;
  onResetCenter: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onUseCurrentLocation: () => void;
  isLocatingGps: boolean;
  t: (en: string, ar: string) => string;
}

export function LocationMapControls({
  onNudge,
  onResetCenter,
  onZoomIn,
  onZoomOut,
  onUseCurrentLocation,
  isLocatingGps,
  t,
}: LocationMapControlsProps) {
  return (
    <>
      {/* Floating Micro-Nudge D-Pad Controls */}
      <div className="absolute top-2.5 end-2.5 z-30 flex flex-col items-center gap-1 rounded-xl bg-white/95 p-1.5 shadow-lg backdrop-blur-sm border border-slate-200">
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-0.5">
          {t("Fine Tuning", "تعديل دقيق")}
        </span>
        <div className="grid grid-cols-3 gap-1">
          <div />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNudge(0, -1.5);
            }}
            title={t("Nudge North", "تحريك للأعلى / شمال")}
            className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-slate-700 hover:bg-[#4F2396] hover:text-white transition active:scale-90 cursor-pointer"
          >
            <ChevronUp size={14} className="stroke-[3]" />
          </button>
          <div />

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNudge(-1.5, 0);
            }}
            title={t("Nudge West", "تحريك لليسار / غرب")}
            className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-slate-700 hover:bg-[#4F2396] hover:text-white transition active:scale-90 cursor-pointer"
          >
            <ChevronLeft size={14} className="stroke-[3]" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onResetCenter();
            }}
            title={t("Center Map", "إعادة للمركز")}
            className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-100 text-[#4F2396] hover:bg-[#4F2396] hover:text-white transition active:scale-90 cursor-pointer"
          >
            <Crosshair size={12} className="stroke-[3]" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNudge(1.5, 0);
            }}
            title={t("Nudge East", "تحريك لليمين / شرق")}
            className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-slate-700 hover:bg-[#4F2396] hover:text-white transition active:scale-90 cursor-pointer"
          >
            <ChevronRight size={14} className="stroke-[3]" />
          </button>

          <div />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNudge(0, 1.5);
            }}
            title={t("Nudge South", "تحريك للأسفل / جنوب")}
            className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-slate-700 hover:bg-[#4F2396] hover:text-white transition active:scale-90 cursor-pointer"
          >
            <ChevronDown size={14} className="stroke-[3]" />
          </button>
          <div />
        </div>
      </div>

      {/* Map Zoom Controls */}
      <div className="absolute top-2.5 start-2.5 z-30 flex flex-col overflow-hidden rounded-xl bg-white/95 shadow-md backdrop-blur-sm border border-slate-200">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onZoomIn();
          }}
          title={t("Zoom In", "تكبير")}
          className="flex h-7 w-7 items-center justify-center text-slate-700 hover:bg-slate-100 transition active:bg-slate-200 cursor-pointer"
        >
          <ZoomIn size={14} className="stroke-[2.5]" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onZoomOut();
          }}
          title={t("Zoom Out", "تصغير")}
          className="flex h-7 w-7 items-center justify-center border-t border-slate-200 text-slate-700 hover:bg-slate-100 transition active:bg-slate-200 cursor-pointer"
        >
          <ZoomOut size={14} className="stroke-[2.5]" />
        </button>
      </div>

      {/* Current GPS Geolocation Button */}
      <div className="absolute bottom-20 start-2.5 z-30">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onUseCurrentLocation();
          }}
          disabled={isLocatingGps}
          title={t("Use Current Device Location", "استخدام موقعي الفعلي")}
          className="flex items-center gap-1.5 rounded-xl bg-white/95 px-2.5 py-1.5 text-[11px] font-black text-slate-700 shadow-md backdrop-blur-sm border border-slate-200 hover:bg-slate-50 transition active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <Navigation
            size={12}
            className={`text-[#4F2396] ${isLocatingGps ? "animate-spin" : ""}`}
          />
          <span>{isLocatingGps ? t("Locating...", "جارٍ التحديد...") : t("My Location", "موقعي")}</span>
        </button>
      </div>
    </>
  );
}

