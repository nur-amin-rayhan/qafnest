"use client";

import { Crosshair, Expand, Layers, Minimize2, Minus, Plus, X } from "lucide-react";

interface MapControlsProps {
  onClose: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  isMuted: boolean;
  onToggleMuted: () => void;
  onResetMap: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  language: string;
}

export default function MapControls({
  onClose,
  isFullscreen,
  onToggleFullscreen,
  isMuted,
  onToggleMuted,
  onResetMap,
  onZoomIn,
  onZoomOut,
  language,
}: MapControlsProps) {
  return (
    <div className="absolute right-4 top-4 z-40 flex flex-col gap-2 rtl:right-auto rtl:left-4">
      <button
        type="button"
        onClick={onClose}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white/95 text-gray-800 shadow-lg transition hover:bg-gray-50 dark:border-white/10 dark:bg-[#181524]/95 dark:text-white dark:hover:bg-white/10"
        aria-label={language === "ar" ? "عرض القائمة" : "Show listings"}
        title={language === "ar" ? "عرض القائمة" : "Show listings"}
      >
        <X className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onToggleFullscreen}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white/95 text-gray-800 shadow-lg transition hover:bg-gray-50 dark:border-white/10 dark:bg-[#181524]/95 dark:text-white dark:hover:bg-white/10"
        aria-label={isFullscreen ? "Exit fullscreen map" : "Expand map"}
        title={isFullscreen ? "Exit fullscreen map" : "Expand map"}
      >
        {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
      </button>
      <button
        type="button"
        onClick={onToggleMuted}
        className={`flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 shadow-lg transition dark:border-white/10 ${
          isMuted
            ? "bg-violet-700 text-white"
            : "bg-white/95 text-gray-800 dark:bg-[#181524]/95 dark:text-white"
        }`}
        aria-label={language === "ar" ? "تغيير نمط الخريطة" : "Toggle map style"}
        title={language === "ar" ? "تغيير نمط الخريطة" : "Toggle map style"}
      >
        <Layers className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onResetMap}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white/95 text-gray-800 shadow-lg transition hover:bg-gray-50 dark:border-white/10 dark:bg-[#181524]/95 dark:text-white dark:hover:bg-white/10"
        aria-label={language === "ar" ? "إعادة توسيط الخريطة" : "Center map"}
        title={language === "ar" ? "إعادة توسيط الخريطة" : "Center map"}
      >
        <Crosshair className="h-4 w-4" />
      </button>
      <div className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white/95 shadow-lg dark:border-white/10 dark:bg-[#181524]/95">
        <button
          type="button"
          onClick={onZoomIn}
          className="flex h-10 w-10 items-center justify-center text-gray-800 transition hover:bg-gray-100 dark:text-white dark:hover:bg-white/10"
          aria-label={language === "ar" ? "تكبير" : "Zoom in"}
        >
          <Plus className="h-4 w-4" />
        </button>
        <div className="h-px bg-gray-200 dark:bg-white/10" />
        <button
          type="button"
          onClick={onZoomOut}
          className="flex h-10 w-10 items-center justify-center text-gray-800 transition hover:bg-gray-100 dark:text-white dark:hover:bg-white/10"
          aria-label={language === "ar" ? "تصغير" : "Zoom out"}
        >
          <Minus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

