"use client";

import React from "react";
import { StepperRow } from "./StepperRow";
import { BATHROOM_AMENITIES, WizardDraft } from "./types";

interface StepSpecificationsProps {
  step: number;
  draft: WizardDraft;
  updateDraft: <K extends keyof WizardDraft>(key: K, val: WizardDraft[K]) => void;
  toggleItem: (
    key: "mainFacilities" | "bathroomAmenities" | "propertyAmenities" | "propertyFeatures",
    item: string
  ) => void;
  lang: "ar" | "en";
  t: (en: string, ar: string) => string;
}

export function StepSpecifications({
  step,
  draft,
  updateDraft,
  toggleItem,
  lang,
  t,
}: StepSpecificationsProps) {
  if (step === 4) {
    return (
      <div className="space-y-5">
        <h1 className="text-2xl font-black text-slate-900">
          {t("Bedroom Details", "تفاصيل غرف النوم")}
        </h1>

        <div className="space-y-3 pt-2">
          <StepperRow
            label={t("Number of bedrooms", "عدد غرف النوم")}
            value={draft.bedroomsCount}
            onChange={(v) => updateDraft("bedroomsCount", v)}
          />
          <StepperRow
            label={t("Number of single beds", "عدد الاسرة المفردة")}
            value={draft.singleBedsCount}
            onChange={(v) => updateDraft("singleBedsCount", v)}
          />
          <StepperRow
            label={t("Number of master beds", "عدد الاسرة الماستر")}
            value={draft.masterBedsCount}
            onChange={(v) => updateDraft("masterBedsCount", v)}
          />
        </div>
      </div>
    );
  }

  if (step === 5) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            {t("Majlis Details", "تفاصيل المجالس")}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {t(
              "Select all sitting areas available in your property",
              "اختر كل المرافق الموجودة في عقارك"
            )}
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <StepperRow
            label={t("Main Majlis", "مجلس رئيسي")}
            value={draft.mainMajlisCount}
            onChange={(v) => updateDraft("mainMajlisCount", v)}
          />
          <StepperRow
            label={t("Additional Majlis", "مجلس إضافي")}
            value={draft.extraMajlisCount}
            onChange={(v) => updateDraft("extraMajlisCount", v)}
          />
          <StepperRow
            label={t("Outdoor Seating", "جلسة خارجية")}
            value={draft.outdoorSeatingCount}
            onChange={(v) => updateDraft("outdoorSeatingCount", v)}
          />
          <StepperRow
            label={t("External Annex", "ملحق خارجي")}
            value={draft.externalAnnexCount}
            onChange={(v) => updateDraft("externalAnnexCount", v)}
          />
        </div>
      </div>
    );
  }

  if (step === 6) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-black text-slate-900">
          {t("Bathroom Details", "تفاصيل دورات المياه")}
        </h1>

        <StepperRow
          label={t("Number of bathrooms", "عدد دورات المياه")}
          value={draft.bathroomsCount}
          onChange={(v) => updateDraft("bathroomsCount", v)}
        />

        <hr className="border-slate-100" />

        <div className="space-y-3">
          <h2 className="text-sm font-black text-slate-900">
            {t("Bathroom Amenities", "مرافق دورات المياه")}
          </h2>
          <div className="flex flex-wrap gap-2">
            {BATHROOM_AMENITIES.map((item) => {
              const selected = draft.bathroomAmenities.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleItem("bathroomAmenities", item.id)}
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
      </div>
    );
  }

  return null;
}
