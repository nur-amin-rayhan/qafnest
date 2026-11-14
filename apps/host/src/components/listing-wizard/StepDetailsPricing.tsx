"use client";

import React from "react";
import { MAIN_FACILITIES, WizardDraft } from "./types";

interface StepDetailsPricingProps {
  draft: WizardDraft;
  updateDraft: <K extends keyof WizardDraft>(key: K, val: WizardDraft[K]) => void;
  toggleItem: (
    key: "mainFacilities" | "bathroomAmenities" | "propertyAmenities" | "propertyFeatures",
    item: string
  ) => void;
  lang: "ar" | "en";
  t: (en: string, ar: string) => string;
}

export function StepDetailsPricing({
  draft,
  updateDraft,
  toggleItem,
  lang,
  t,
}: StepDetailsPricingProps) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-slate-900">
        {t("Property Details", "تفاصيل العقار")}
      </h1>

      <div className="space-y-2">
        <label className="block text-sm font-black text-slate-900">
          {t("Property Area", "مساحة عقارك")} <span className="text-rose-500">*</span>
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min="0"
            placeholder="0"
            value={draft.area}
            onChange={(e) => {
              const raw = e.target.value;
              if (raw === "") {
                updateDraft("area", "");
                return;
              }
              updateDraft("area", raw.replace(/^0+(?=\d)/, ""));
            }}
            className="w-24 rounded-xl border border-slate-200 px-3 py-2.5 text-center text-sm font-black text-slate-800 outline-none focus:border-[#4F2396]"
          />
          <span className="text-xs font-extrabold text-slate-700">
            {t("Square Meters", "متر مربع")}
          </span>
        </div>
      </div>

      <hr className="border-slate-100" />

      <div className="space-y-3">
        <h2 className="text-sm font-black text-slate-900">
          {t("Nightly Pricing & License", "السعر الليلي والترخيص")}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1.5 text-xs font-bold text-slate-700">
            <span>
              {t("Weekday price (SAR)", "سعر أيام الأسبوع (ر.س)")}{" "}
              <span className="text-rose-500">*</span>
            </span>
            <input
              type="number"
              min="1"
              value={draft.weekdayPrice}
              onChange={(e) => updateDraft("weekdayPrice", e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-[#4F2396]"
            />
          </label>
          <label className="grid gap-1.5 text-xs font-bold text-slate-700">
            {t("Weekend price (SAR)", "سعر عطلة الأسبوع (ر.س)")}
            <input
              type="number"
              min="1"
              value={draft.weekendPrice}
              onChange={(e) => updateDraft("weekendPrice", e.target.value)}
              placeholder={draft.weekdayPrice || "0"}
              className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-[#4F2396]"
            />
          </label>
        </div>
        <label className="grid gap-1.5 text-xs font-bold text-slate-700">
          <span className="flex items-center justify-between gap-2">
            <span>
              {t("Ministry of Tourism License Number", "رقم ترخيص وزارة السياحة")}{" "}
              <span className="text-rose-500">*</span>
            </span>
            <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-black text-rose-600 border border-rose-200">
              {t("Required", "إلزامي")}
            </span>
          </span>
          <input
            type="text"
            required
            value={draft.tourismLicenseNumber}
            onChange={(e) => updateDraft("tourismLicenseNumber", e.target.value)}
            placeholder={t("e.g. 50001234", "مثال: 50001234")}
            className="rounded-xl border border-slate-200 px-3 py-2.5 font-semibold text-slate-800 outline-none focus:border-[#4F2396]"
          />
          {!draft.tourismLicenseNumber.trim() && (
            <span className="text-[11px] font-semibold text-amber-700">
              {t(
                "Tourism license number is mandatory to continue listing.",
                "رقم ترخيص وزارة السياحة مطلوب وإلزامي للمتابعة إلى الخطوة التالية."
              )}
            </span>
          )}
        </label>
      </div>

      <hr className="border-slate-100" />

      <div className="space-y-3">
        <div>
          <h2 className="text-sm font-black text-slate-900">
            {t("Main Property Facilities", "مرافق عقارك الرئيسية")}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {t(
              "Select all facilities available in your property",
              "اختر كل المرافق الموجودة في عقارك"
            )}
          </p>
        </div>

        <div className="grid grid-cols-4 gap-2.5">
          {MAIN_FACILITIES.map((fac) => {
            const Icon = fac.icon;
            const selected = draft.mainFacilities.includes(fac.id);
            return (
              <button
                key={fac.id}
                type="button"
                onClick={() => toggleItem("mainFacilities", fac.id)}
                className={`flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border p-2 text-center transition cursor-pointer ${
                  selected
                    ? "border-[#4F2396] bg-[#5a3296] text-white"
                    : "border-slate-200 bg-white text-[#5a3296] hover:bg-violet-50/50"
                }`}
              >
                <Icon size={24} strokeWidth={1.75} />
                <span className="text-[11px] font-extrabold leading-tight">
                  {lang === "ar" ? fac.id : fac.en}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
