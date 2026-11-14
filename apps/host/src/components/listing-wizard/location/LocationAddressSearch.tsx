"use client";

import React from "react";
import { Search, CheckCircle2, AlertCircle, Sparkles, Link as LinkIcon, MapPin, Loader2 } from "lucide-react";
import type { CityInfo } from "@/lib/geo/saudiLocations";

interface LocationAddressSearchProps {
  inputMode: "address" | "maps_url";
  setInputMode: (mode: "address" | "maps_url") => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onLocate: (customQuery?: string) => void;
  mapsUrlInput: string;
  setMapsUrlInput: (url: string) => void;
  onExtractUrl: (customUrl?: string) => void;
  isResolvingUrl: boolean;
  feedback: { text: string; isError?: boolean } | null;
  cityInfo: CityInfo;
  selectedDistrict: string;
  lang: "ar" | "en";
  t: (en: string, ar: string) => string;
}

export function LocationAddressSearch({
  inputMode,
  setInputMode,
  searchQuery,
  setSearchQuery,
  onLocate,
  mapsUrlInput,
  setMapsUrlInput,
  onExtractUrl,
  isResolvingUrl,
  feedback,
  cityInfo,
  selectedDistrict,
  lang,
  t,
}: LocationAddressSearchProps) {
  return (
    <div className="space-y-2.5">
      {/* 1. Dual Mode Segmented Control */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
          {inputMode === "maps_url" ? (
            <>
              <LinkIcon size={13} className="text-[#4F2396]" />
              <span>
                {t(
                  "Google Maps Location Link (Auto-fills City, State & Address)",
                  "رابط موقع خرائط جوجل (يُعبئ المدينة والمنطقة والعنوان تلقائياً)"
                )}
              </span>
            </>
          ) : (
            <>
              <MapPin size={13} className="text-[#4F2396]" />
              <span>{t("Manual Address or District", "العنوان التفصيلي أو اسم الحي")}</span>
            </>
          )}
        </label>

        <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200">
          <button
            type="button"
            onClick={() => setInputMode("maps_url")}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-extrabold transition cursor-pointer ${
              inputMode === "maps_url"
                ? "bg-white text-[#4F2396] shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <LinkIcon size={12} />
            <span>{t("Google Maps Link", "رابط خرائط جوجل")}</span>
          </button>
          <button
            type="button"
            onClick={() => setInputMode("address")}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-extrabold transition cursor-pointer ${
              inputMode === "address"
                ? "bg-white text-[#4F2396] shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <MapPin size={12} />
            <span>{t("Address Search", "البحث بالعنوان")}</span>
          </button>
        </div>
      </div>

      {/* 2. Input Control */}
      {inputMode === "address" ? (
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onPaste={(e) => {
                const pasted = e.clipboardData?.getData("text")?.trim();
                if (pasted && /^https?:\/\//i.test(pasted)) {
                  setSearchQuery(pasted);
                  setTimeout(() => onLocate(pasted), 20);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onLocate();
                }
              }}
              placeholder={t("e.g. Al-Malqa, Prince Turki St, Riyadh...", "مثال: حي الملقا، طريق الأمير تركي، الرياض...")}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-[#4F2396] focus:ring-2 focus:ring-[#4F2396]/20 shadow-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 end-2 flex items-center px-1 text-slate-400 hover:text-slate-600 text-xs"
                title={t("Clear", "مسح")}
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => onLocate()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#4F2396] px-3.5 py-2.5 text-xs font-black text-white shadow-md transition hover:bg-[#3e1b78] active:scale-95 shrink-0 cursor-pointer"
          >
            <Search size={14} className="stroke-[2.5]" />
            <span>{t("Locate on Map", "تحديد على الخريطة")}</span>
          </button>
        </div>
      ) : (
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={mapsUrlInput}
              onChange={(e) => setMapsUrlInput(e.target.value)}
              onPaste={(e) => {
                const pasted = e.clipboardData?.getData("text")?.trim();
                if (pasted && (pasted.includes("http") || /^-?\d+\.\d+\s*,\s*-?\d+\.\d+$/.test(pasted))) {
                  setMapsUrlInput(pasted);
                  setTimeout(() => onExtractUrl(pasted), 20);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onExtractUrl();
                }
              }}
              placeholder={t(
                "Paste Google Maps share link (maps.app.goo.gl/...), <iframe> embed code, or lat,lng",
                "الصق رابط مشاركة جوجل مابس، أو كود التضمين <iframe>، أو الإحداثيات"
              )}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-[#4F2396] focus:ring-2 focus:ring-[#4F2396]/20 shadow-sm"
            />
            {mapsUrlInput && (
              <button
                type="button"
                onClick={() => setMapsUrlInput("")}
                className="absolute inset-y-0 end-2 flex items-center px-1 text-slate-400 hover:text-slate-600 text-xs"
                title={t("Clear", "مسح")}
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="button"
            disabled={isResolvingUrl}
            onClick={() => onExtractUrl()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#4F2396] px-3.5 py-2.5 text-xs font-black text-white shadow-md transition hover:bg-[#3e1b78] active:scale-95 shrink-0 cursor-pointer disabled:opacity-50"
          >
            {isResolvingUrl ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <LinkIcon size={14} className="stroke-[2.5]" />
            )}
            <span>{t("Extract & Pin", "استخراج وتثبيت")}</span>
          </button>
        </div>
      )}

      {/* 3. Feedback Banner */}
      {feedback && (
        <div
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold border animate-fadeIn ${
            feedback.isError
              ? "bg-rose-50 border-rose-200 text-rose-800"
              : "bg-emerald-50 border-emerald-200 text-emerald-800"
          }`}
        >
          {feedback.isError ? (
            <AlertCircle size={13} className="text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* 4. Quick District Suggestion Pills (in Address mode) */}
      {inputMode === "address" && cityInfo.districts.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
            <Sparkles size={11} className="text-[#4F2396]" />
            {t("Suggested districts:", "أحياء مقترحة:")}
          </span>
          {cityInfo.districts.slice(0, 5).map((d: { id: string; en: string }) => {
            const isSelected = selectedDistrict === d.id || selectedDistrict === d.en;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => {
                  const queryText = lang === "ar" ? `${d.id}، ${cityInfo.id}` : `${d.en}, ${cityInfo.en}`;
                  setSearchQuery(queryText);
                  onLocate(lang === "ar" ? d.id : d.en);
                }}
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold transition border cursor-pointer ${
                  isSelected
                    ? "bg-[#4F2396] text-white border-[#4F2396] shadow-sm"
                    : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200/80"
                }`}
              >
                {lang === "ar" ? d.id : d.en}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
