"use client";

import React from "react";
import Image from "next/image";
import { MapPin, Map, Link as LinkIcon, ExternalLink } from "lucide-react";
import { resolveSaudiCity } from "@qafnest/shared";
import { CATEGORIES, WizardDraft } from "./types";
import { InteractiveLocationPicker } from "./InteractiveLocationPicker";
import {
  SAUDI_CITIES,
  getCityInfo,
  toCityId,
  getDistrictDisplay,
  getCityDisplay,
} from "@/lib/geo/saudiLocations";
import { buildGoogleMapsEmbedUrl, buildGoogleMapsUrl } from "@/lib/geo/mapsUrlParser";

interface StepCategoryLocationProps {
  step: number;
  draft: WizardDraft;
  updateDraft: <K extends keyof WizardDraft>(key: K, val: WizardDraft[K]) => void;
  pin: { x: number; y: number };
  setPin: (pin: { x: number; y: number }) => void;
  lang: "ar" | "en";
  t: (en: string, ar: string) => string;
}

export function StepCategoryLocation({
  step,
  draft,
  updateDraft,
  pin,
  setPin,
  lang,
  t,
}: StepCategoryLocationProps) {
  // Step 0: Property Name & Category Selection
  if (step === 0) {
    return (
      <div className="space-y-6" dir={lang === "ar" ? "rtl" : "ltr"}>
        <h1 className="text-2xl font-black text-slate-900">
          {t("Property Information", "معلومات العقار")}
        </h1>

        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-black text-slate-900">
              {t("Property Name (English & Arabic)", "اسم العقار (بالإنجليزية والعربية)")}
            </h2>
            <p className="mt-1 text-xs font-medium text-slate-500">
              {t(
                "Enter the property name in both languages so each site version displays its matching language.",
                "أدخل اسم العقار باللغتين ليظهر الاسم الإنجليزي في النسخة الإنجليزية والعربي في النسخة العربية."
              )}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-900">
                {t("Property Name (English)", "اسم العقار (بالإنجليزية)")}{" "}
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                dir="ltr"
                value={draft.title}
                onChange={(e) => updateDraft("title", e.target.value)}
                placeholder="e.g. Royal Ammariyah Private Chalet"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-xs sm:text-sm font-bold text-slate-800 outline-none focus:border-[#4F2396]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-900">
                {t("Property Name (Arabic)", "اسم العقار (بالعربية)")}{" "}
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                dir="rtl"
                value={draft.titleAr}
                onChange={(e) => updateDraft("titleAr", e.target.value)}
                placeholder="مثال: شاليه العمارية الملكي الخاص"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-xs sm:text-sm font-bold text-slate-800 outline-none focus:border-[#4F2396]"
              />
            </div>
          </div>
        </div>

        <hr className="border-slate-100" />

        <div className="space-y-3">
          <div>
            <h2 className="text-sm font-black text-slate-900">
              {t("Property Category", "تصنيف عقارك")}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {t("Select the appropriate category", "حدد التصنيف المناسب")}
            </p>
          </div>

          {/* 10 Photo Category Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {CATEGORIES.map((cat) => {
              const isSelected = draft.category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => updateDraft("category", cat.id)}
                  className={`group relative aspect-square overflow-hidden rounded-xl border-2 transition cursor-pointer ${
                    isSelected
                      ? "border-[#4F2396] ring-2 ring-[#4F2396]/30"
                      : "border-transparent"
                  }`}
                >
                  <Image
                    src={cat.image}
                    alt={cat.id}
                    fill
                    unoptimized
                    className="object-cover brightness-75 group-hover:scale-105 transition"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/60" />
                  <span
                    className={`absolute top-2 inset-x-2 text-[11px] font-black leading-tight text-white drop-shadow ${
                      lang === "ar" ? "text-right" : "text-left"
                    }`}
                  >
                    {lang === "ar" ? cat.id : cat.en}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Step 1: Interactive Map Location Picker (Draggable Pin, Manual Address, Fine Adjustment)
  if (step === 1) {
    return (
      <InteractiveLocationPicker
        draft={draft}
        updateDraft={updateDraft}
        pin={pin}
        setPin={setPin}
        lang={lang}
        t={t}
      />
    );
  }

  // Step 2: Confirm Property Address (City, Dynamic District, Direction, Detailed Address Confirmation)
  if (step === 2) {
    const hasSelectedCity = Boolean(draft.city && draft.city.trim());
    const currentCityInfo = hasSelectedCity ? getCityInfo(draft.city) : null;

    const handleCityChange = (newCityName: string) => {
      if (!newCityName) return;
      const city = getCityInfo(newCityName);
      const sharedCity = resolveSaudiCity(city.id) || resolveSaudiCity(city.en);
      updateDraft("city", city.id);
      updateDraft("state", sharedCity?.regionEn || "");
      updateDraft("stateAr", sharedCity?.regionAr || "");
      updateDraft("district", "");
      updateDraft("districtAr", "");
      updateDraft("street", "");
      updateDraft("streetAr", "");
      updateDraft("postalCode", "");
      updateDraft("direction", "");
      updateDraft("address", "");
      updateDraft("addressAr", "");
      updateDraft("latitude", city.lat);
      updateDraft("longitude", city.lng);
      updateDraft("googleMapsUrl", buildGoogleMapsUrl(city.lat, city.lng));
      setPin(city.defaultPin);
    };

    const rawDistrictForPreview =
      lang === "ar"
        ? draft.districtAr || draft.district
        : draft.district || draft.districtAr;
    const displayDistrictName = rawDistrictForPreview
      ? getDistrictDisplay(rawDistrictForPreview, lang, draft.city)
      : t("District not entered", "لم يتم إدخال الحي");
    const displayCityName = hasSelectedCity
      ? getCityDisplay(draft.city, lang)
      : t("City not chosen", "لم يتم اختيار المدينة");
    const hasPreviewLocation =
      typeof draft.latitude === "number" && typeof draft.longitude === "number";
    const previewLat = draft.latitude ?? currentCityInfo?.lat;
    const previewLng = draft.longitude ?? currentCityInfo?.lng;
    const miniEmbedUrl =
      typeof previewLat === "number" && typeof previewLng === "number"
        ? buildGoogleMapsEmbedUrl(
            previewLat,
            previewLng,
            lang,
            undefined,
            draft.district ? 15 : 11
          )
        : "";

    return (
      <div className="space-y-5" dir={lang === "ar" ? "rtl" : "ltr"}>
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            {t("Confirm Property Address", "تأكيد عنوان العقار")}
          </h1>
          <p className="text-xs text-slate-500 font-bold mt-1">
            {t(
              "Verify your administrative details and confirmed address.",
              "تحقق من البيانات الإدارية وتأكيد العنوان."
            )}
          </p>
        </div>

        {/* City & State/Region (Linked to Google Maps Location Link) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-sm font-black text-slate-900">
              {t("City", "المدينة")} <span className="text-rose-500">*</span>
            </label>
            <select
              value={toCityId(draft.city)}
              onChange={(e) => handleCityChange(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs sm:text-sm font-bold text-slate-800 outline-none transition focus:border-[#4F2396] focus:ring-2 focus:ring-[#4F2396]/20 cursor-pointer"
            >
              <option value="" disabled>
                {t("Choose city...", "اختر المدينة...")}
              </option>
              {SAUDI_CITIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {lang === "ar" ? c.id : c.en}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-black text-slate-900">
              {t("State / Region", "المنطقة / الإمارة")}
            </label>
            <input
              type="text"
              dir={lang === "ar" ? "rtl" : "ltr"}
              value={lang === "ar" ? draft.stateAr || draft.state || "" : draft.state || draft.stateAr || ""}
              onChange={(e) => {
                if (lang === "ar") {
                  updateDraft("stateAr", e.target.value);
                } else {
                  updateDraft("state", e.target.value);
                }
              }}
              placeholder={t("e.g. Riyadh Province", "مثال: منطقة الرياض")}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs sm:text-sm font-bold text-slate-800 outline-none transition focus:border-[#4F2396] focus:ring-2 focus:ring-[#4F2396]/20"
            />
          </div>
        </div>

        {/* Google Maps Location Link (Verified & Shareable) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <LinkIcon size={13} className="text-[#4F2396]" />
              <span>{t("Saved Google Maps Location Link", "رابط موقع خرائط جوجل المحفوظ")}</span>
            </label>
            {draft.googleMapsUrl && (
              <a
                href={draft.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#4F2396] hover:underline"
              >
                <ExternalLink size={11} />
                <span>{t("Verify on Google Maps", "فتح في خرائط جوجل")}</span>
              </a>
            )}
          </div>
          <input
            type="url"
            dir="ltr"
            value={draft.googleMapsUrl || ""}
            onChange={(e) => updateDraft("googleMapsUrl", e.target.value)}
            placeholder="https://maps.google.com/..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-mono text-slate-700 outline-none transition focus:border-[#4F2396] focus:bg-white focus:ring-2 focus:ring-[#4F2396]/20"
          />
        </div>

        {/* District Direct Inputs (English & Arabic) */}
        <div className="space-y-2">
          <label className="block text-sm font-black text-slate-900">
            {t("District", "الحي")} <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <span className="block text-[11px] font-bold text-slate-600">
                {t("District (English)", "الحي (بالإنجليزية)")} <span className="text-rose-500">*</span>
              </span>
              <input
                type="text"
                dir="ltr"
                value={draft.district}
                onChange={(e) => updateDraft("district", e.target.value)}
                placeholder="e.g. Al-Olaya, Al-Shati"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs sm:text-sm font-bold text-slate-800 outline-none transition focus:border-[#4F2396] focus:ring-2 focus:ring-[#4F2396]/20"
              />
            </div>
            <div className="space-y-1">
              <span className="block text-[11px] font-bold text-slate-600">
                {t("District (Arabic)", "الحي (بالعربية)")} <span className="text-rose-500">*</span>
              </span>
              <input
                type="text"
                dir="rtl"
                value={draft.districtAr}
                onChange={(e) => updateDraft("districtAr", e.target.value)}
                placeholder="مثال: حي العليا، حي الشاطئ"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs sm:text-sm font-bold text-slate-800 outline-none transition focus:border-[#4F2396] focus:ring-2 focus:ring-[#4F2396]/20"
              />
            </div>
          </div>
        </div>

        {/* Street, Landmark & Postal Details (Direct Inputs) */}
        <div className="space-y-2">
          <label className="block text-sm font-black text-slate-900">
            {t("Street & Address Details", "تفاصيل الشارع والعنوان")}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <span className="block text-[11px] font-bold text-slate-600">
                {t("Street / Area (English)", "الشارع / المعلم (إنجليزي)")}
              </span>
              <input
                type="text"
                dir="ltr"
                value={draft.street || ""}
                onChange={(e) => updateDraft("street", e.target.value)}
                placeholder="e.g. King Fahd Road"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none transition focus:border-[#4F2396] focus:ring-2 focus:ring-[#4F2396]/20"
              />
            </div>
            <div className="space-y-1">
              <span className="block text-[11px] font-bold text-slate-600">
                {t("Street / Area (Arabic)", "الشارع / المعلم (عربي)")}
              </span>
              <input
                type="text"
                dir="rtl"
                value={draft.streetAr || ""}
                onChange={(e) => updateDraft("streetAr", e.target.value)}
                placeholder="مثال: طريق الملك فهد"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none transition focus:border-[#4F2396] focus:ring-2 focus:ring-[#4F2396]/20"
              />
            </div>
            <div className="space-y-1">
              <span className="block text-[11px] font-bold text-slate-600">
                {t("Postal / Building Code", "الرمز البريدي / رقم المبنى")}
              </span>
              <input
                type="text"
                dir="ltr"
                value={draft.postalCode || ""}
                onChange={(e) => updateDraft("postalCode", e.target.value)}
                placeholder="e.g. 12211"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none transition focus:border-[#4F2396] focus:ring-2 focus:ring-[#4F2396]/20"
              />
            </div>
          </div>
        </div>

        {/* Full Confirmed Address (English & Arabic Direct Inputs) */}
        <div className="space-y-2">
          <label className="block text-sm font-black text-slate-900">
            {t("Confirmed Full Address (English & Arabic)", "العنوان الكامل والمؤكد (إنجليزي وعربي)")}{" "}
            <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <span className="block text-[11px] font-bold text-slate-600">
                {t("Full Address (English)", "العنوان الكامل (بالإنجليزية)")} <span className="text-rose-500">*</span>
              </span>
              <input
                type="text"
                dir="ltr"
                value={draft.address || ""}
                onChange={(e) => updateDraft("address", e.target.value)}
                placeholder="Street name, building number, landmark..."
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs sm:text-sm font-bold text-slate-800 outline-none transition focus:border-[#4F2396] focus:ring-2 focus:ring-[#4F2396]/20"
              />
            </div>
            <div className="space-y-1">
              <span className="block text-[11px] font-bold text-slate-600">
                {t("Full Address (Arabic)", "العنوان الكامل (بالعربية)")} <span className="text-rose-500">*</span>
              </span>
              <input
                type="text"
                dir="rtl"
                value={draft.addressAr || ""}
                onChange={(e) => updateDraft("addressAr", e.target.value)}
                placeholder="اسم الشارع، رقم المبنى، معلم مميز..."
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs sm:text-sm font-bold text-slate-800 outline-none transition focus:border-[#4F2396] focus:ring-2 focus:ring-[#4F2396]/20"
              />
            </div>
          </div>
        </div>

        {/* Mini Embedded Google Map Preview Card */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600">
            <span className="flex items-center gap-1.5 text-[#4F2396] font-black">
              <Map size={14} />
              {t("Pinned Location Preview", "معاينة الموقع المثبت")}
            </span>
            <span className="font-mono text-[10px] text-slate-500 direction-ltr">
              {hasPreviewLocation
                ? `${draft.latitude!.toFixed(4)}°, ${draft.longitude!.toFixed(4)}°`
                : t("Not pinned yet", "غير محدد بعد")}
            </span>
          </div>

          <div className="relative h-32 w-full overflow-hidden rounded-lg border border-slate-200 bg-[#e9e6df]">
            {miniEmbedUrl ? (
              <iframe
                key={miniEmbedUrl}
                title={t("Mini Property Map", "معاينة خريطة العقار")}
                src={miniEmbedUrl}
                className="h-full w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center text-center px-3 text-xs font-bold text-slate-500 gap-1">
                <MapPin size={20} className="text-slate-400" />
                <span>
                  {t(
                    "Select a city and district above or go back to pin on map",
                    "اختر المدينة والحي أعلاه أو عد للخريطة لتحديد الموقع"
                  )}
                </span>
              </div>
            )}
            {(hasSelectedCity || draft.district) && (
              <span
                className={`absolute bottom-1.5 start-2 rounded bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white ${
                  lang === "ar" ? "text-right" : "text-left"
                }`}
              >
                {displayDistrictName} - {displayCityName}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
