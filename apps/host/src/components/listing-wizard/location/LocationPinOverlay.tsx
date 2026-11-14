"use client";

import { MapPin, Compass } from "lucide-react";
import type { CityInfo } from "@/lib/geo/saudiLocations";

interface LocationPinOverlayProps {
  pin: { x: number; y: number };
  zoomScale: number;
  cityInfo: CityInfo;
  isDragging: boolean;
  hoverDistrict: {
    ar: string;
    en: string;
    dirAr: string;
    dirEn: string;
  } | null;
  localizedDistrict: string;
  localizedDirection: string;
  lang: "ar" | "en";
}

export function LocationPinOverlay({
  pin,
  zoomScale,
  cityInfo,
  isDragging,
  hoverDistrict,
  localizedDistrict,
  localizedDirection,
  lang,
}: LocationPinOverlayProps) {
  return (
    <>
      {/* Map Graphical Grid / Street Layout */}
      <div
        className="absolute inset-0 transition-transform duration-200"
        style={{
          transform: `scale(${zoomScale})`,
          transformOrigin: `${pin.x}% ${pin.y}%`,
          backgroundImage:
            "linear-gradient(28deg, transparent 45%, #cbd5e1 46%, #cbd5e1 49%, transparent 50%), linear-gradient(118deg, transparent 33%, #cbd5e1 34%, #cbd5e1 37%, transparent 38%), linear-gradient(0deg, #dedad2 1.5px, transparent 1.5px), linear-gradient(90deg, #dedad2 1.5px, transparent 1.5px)",
          backgroundSize: "100% 100%, 100% 100%, 24px 24px, 24px 24px",
        }}
      >
        <div className="absolute top-0 bottom-0 left-[48%] w-4 -rotate-12 bg-amber-200/40 border-x border-amber-300/40 pointer-events-none" />
        <div className="absolute left-0 right-0 top-[45%] h-4 rotate-6 bg-amber-200/40 border-y border-amber-300/40 pointer-events-none" />

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none opacity-40">
          <span className="text-3xl font-black text-slate-700 tracking-wider">
            {lang === "ar" ? cityInfo.id : cityInfo.en}
          </span>
        </div>

        {cityInfo.districts.slice(0, 6).map((d) => (
          <div
            key={d.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-60 text-center"
            style={{ left: `${d.x}%`, top: `${d.y}%` }}
          >
            <div className="h-1.5 w-1.5 rounded-full bg-slate-500 mx-auto mb-0.5" />
            <span className="text-[10px] font-bold text-slate-600 bg-white/70 px-1 py-0.5 rounded shadow-xs">
              {lang === "ar" ? d.id.replace("حي ", "") : d.en}
            </span>
          </div>
        ))}
      </div>

      {/* Active Draggable Pin Component */}
      <div
        className="absolute -translate-x-1/2 -translate-y-full pointer-events-none transition-all duration-75 z-20"
        style={{
          left: `${pin.x}%`,
          top: `${pin.y}%`,
        }}
      >
        <div
          className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-black text-white shadow-lg pointer-events-none flex items-center gap-1 transition-all ${
            isDragging ? "bg-[#4F2396] scale-105" : "bg-slate-800/90"
          }`}
        >
          <Compass size={11} className="text-amber-300 animate-spin" />
          <span>
            {isDragging
              ? lang === "ar"
                ? hoverDistrict?.ar
                  ? `${hoverDistrict.ar} (${hoverDistrict.dirAr})`
                  : "جاري التحريك بدقة..."
                : hoverDistrict?.en
                ? `${hoverDistrict.en} (${hoverDistrict.dirEn})`
                : "Dragging to fine-tune..."
              : `${localizedDistrict} (${localizedDirection})`}
          </span>
        </div>

        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-8 h-8 rounded-full bg-[#4F2396]/20 animate-ping pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-3.5 h-3.5 rounded-full bg-[#4F2396] border-2 border-white shadow pointer-events-none" />

        <div className="relative filter drop-shadow-[0_6px_8px_rgba(79,35,150,0.4)]">
          <MapPin
            size={38}
            className="fill-[#4F2396] text-white stroke-[1.5] transition-transform group-hover:scale-110"
          />
        </div>
      </div>
    </>
  );
}

