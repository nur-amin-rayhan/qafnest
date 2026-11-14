"use client";

import React, { useState } from "react";
import { ExternalLink, Copy, Check } from "lucide-react";
import { buildGoogleMapsUrl } from "@/lib/geo/mapsUrlParser";

interface LocationCoordinateCardProps {
  localizedDistrict: string;
  localizedDirection: string;
  localizedAddress: string;
  currentLat: number;
  currentLng: number;
  googleMapsUrl?: string;
  embedIframeCode?: string;
  hasSelectedLocation?: boolean;
  lang: "ar" | "en";
  t: (en: string, ar: string) => string;
}

export function LocationCoordinateCard({
  localizedDistrict,
  localizedDirection,
  localizedAddress,
  currentLat,
  currentLng,
  googleMapsUrl,
  embedIframeCode,
  hasSelectedLocation = true,
  lang,
  t,
}: LocationCoordinateCardProps) {
  const [copiedMode, setCopiedMode] = useState<"link" | "embed" | null>(null);
  const locationUrl = googleMapsUrl || buildGoogleMapsUrl(currentLat, currentLng);

  const handleCopy = (e: React.MouseEvent, mode: "link" | "embed") => {
    e.stopPropagation();
    const payload =
      mode === "embed" && embedIframeCode ? embedIframeCode : locationUrl;
    navigator.clipboard.writeText(payload);
    setCopiedMode(mode);
    setTimeout(() => setCopiedMode(null), 2000);
  };

  if (!hasSelectedLocation) {
    return (
      <div
        className={`absolute bottom-2.5 inset-x-2.5 z-30 rounded-xl bg-white/95 px-3.5 py-2.5 shadow-lg backdrop-blur-md border border-slate-200/90 ${
          lang === "ar" ? "text-right" : "text-left"
        }`}
      >
        <p className="text-xs font-extrabold text-slate-700">
          {t(
            "Select a city above, search an address, paste a Google Maps share link / embed code, or switch to Interactive Pin.",
            "اختر المدينة أعلاه أو ابحث عن الحي أو الصق رابط خرائط جوجل / كود التضمين أو فعّل تحديد الدبوس."
          )}
        </p>
      </div>
    );
  }

  return (
    <div
      className={`absolute bottom-2.5 inset-x-2.5 z-30 rounded-xl bg-white/95 p-3 shadow-lg backdrop-blur-md border border-slate-200/90 ${
        lang === "ar" ? "text-right" : "text-left"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-[10px] font-black text-[#4F2396]">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              {localizedDistrict
                ? localizedDirection
                  ? `${localizedDistrict} (${localizedDirection})`
                  : localizedDistrict
                : t("Pinned Location", "موقع محدد")}
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 font-mono text-[9px] direction-ltr">
              {currentLat.toFixed(4)}°, {currentLng.toFixed(4)}°
            </span>
          </div>
          <p className="text-xs font-bold text-slate-800 line-clamp-1 mt-0.5">
            {localizedAddress || locationUrl}
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => handleCopy(e, "link")}
            title={t("Copy Google Maps Share Link", "نسخ رابط خرائط جوجل")}
            className="inline-flex items-center gap-1 rounded-md bg-slate-100 hover:bg-slate-200 px-2 py-1 text-[10px] font-bold text-slate-700 transition cursor-pointer"
          >
            {copiedMode === "link" ? (
              <>
                <Check size={11} className="text-emerald-600" />
                <span className="text-emerald-700">{t("Copied", "تم النسخ")}</span>
              </>
            ) : (
              <>
                <Copy size={11} className="text-slate-500" />
                <span>{t("Maps Link", "رابط الموقع")}</span>
              </>
            )}
          </button>

          {embedIframeCode && (
            <button
              type="button"
              onClick={(e) => handleCopy(e, "embed")}
              title={t("Copy Embed HTML Code", "نسخ كود التضمين (iframe)")}
              className="inline-flex items-center gap-1 rounded-md bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2 py-1 text-[10px] font-bold text-[#4F2396] transition cursor-pointer"
            >
              {copiedMode === "embed" ? (
                <>
                  <Check size={11} className="text-emerald-600" />
                  <span className="text-emerald-700">{t("Copied", "نُسخ")}</span>
                </>
              ) : (
                <>
                  <Copy size={11} />
                  <span>{t("Embed Code", "كود التضمين")}</span>
                </>
              )}
            </button>
          )}

          <a
            href={locationUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={t("Open in Google Maps", "فتح في خرائط جوجل")}
            className="flex h-6 w-6 items-center justify-center rounded-md bg-purple-50 text-[#4F2396] hover:bg-purple-100 border border-purple-200 transition"
          >
            <ExternalLink size={11} />
          </a>
        </div>
      </div>
    </div>
  );
}
