"use client";

import React from "react";
import {
  PROPERTY_AMENITIES,
  PROPERTY_FEATURES,
  WIZARD_STEPS,
  type WizardArrayField,
  type WizardDraft,
} from "./types";

interface StepAmenitiesFeaturesProps {
  step: number;
  draft: WizardDraft;
  toggleItem: (key: WizardArrayField, item: string) => void;
  lang: "ar" | "en";
  t: (en: string, ar: string) => string;
}

export function StepAmenitiesFeatures({
  step,
  draft,
  toggleItem,
  lang,
  t,
}: StepAmenitiesFeaturesProps) {
  if (step === WIZARD_STEPS.PROPERTY_AMENITIES) {
    return (
      <div className="space-y-5">
        <div className="flex items-baseline gap-2">
          <h1 className="text-2xl font-black text-slate-900">
            {t("Property Amenities", "مرافق العقار")}
          </h1>
          <span className="text-xs font-bold text-slate-400">
            {t("Optional", "اختياري")}
          </span>
        </div>

        <div className="flex flex-wrap gap-2.5 pt-2">
          {PROPERTY_AMENITIES.map((item) => {
            const selected = draft.propertyAmenities.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleItem("propertyAmenities", item.id)}
                className={`rounded-full border px-4 py-2 text-xs font-extrabold transition cursor-pointer ${
                  selected
                    ? "border-[#4F2396] bg-[#4F2396] text-white"
                    : "border-slate-200 bg-white text-[#4F2396] hover:bg-violet-50"
                }`}
              >
                {lang === "ar" ? item.ar : item.en}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (step === WIZARD_STEPS.PROPERTY_FEATURES) {
    return (
      <div className="space-y-5">
        <div className="flex items-baseline gap-2">
          <h1 className="text-2xl font-black text-slate-900">
            {t("Property Features", "مميزات العقار")}
          </h1>
          <span className="text-xs font-bold text-slate-400">
            {t("Optional", "اختياري")}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2.5 pt-2">
          {PROPERTY_FEATURES.map((feat) => {
            const Icon = feat.icon;
            const selected = draft.propertyFeatures.includes(feat.id);
            return (
              <button
                key={feat.id}
                type="button"
                onClick={() => toggleItem("propertyFeatures", feat.id)}
                className={`flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border p-2 text-center transition cursor-pointer ${
                  selected
                    ? "border-[#4F2396] bg-[#5a3296] text-white"
                    : "border-slate-200 bg-white text-[#5a3296] hover:bg-violet-50/50"
                }`}
              >
                <Icon size={22} strokeWidth={1.75} />
                <span className="text-[10px] font-extrabold leading-tight">
                  {lang === "ar" ? feat.id : feat.en}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}
