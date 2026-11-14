"use client";

import React from "react";
import { Building2, CheckCircle2, ChevronDown, MapPin, X } from "lucide-react";
import {
  CityCalcKey,
  PropertyCalcType,
  PROPERTY_TYPE_LABELS,
  CITY_LABELS,
} from "./types";

interface EarningsCalculatorProps {
  lang: "ar" | "en";
  t: (en: string, ar: string) => string;
  calcType: PropertyCalcType;
  setCalcType: (type: PropertyCalcType) => void;
  calcCity: CityCalcKey;
  setCalcCity: (city: CityCalcKey) => void;
  calcModal: "type" | "city" | null;
  setCalcModal: (modal: "type" | "city" | null) => void;
  howCalculatedOpen: boolean;
  setHowCalculatedOpen: (open: boolean) => void;
  expectedMonthlySar: number;
  selectedTypeObj: { id: PropertyCalcType; ar: string; en: string };
  selectedCityObj: { id: CityCalcKey; ar: string; en: string };
}

export function EarningsCalculator({
  lang,
  t,
  calcType,
  setCalcType,
  calcCity,
  setCalcCity,
  calcModal,
  setCalcModal,
  howCalculatedOpen,
  setHowCalculatedOpen,
  expectedMonthlySar,
  selectedTypeObj,
  selectedCityObj,
}: EarningsCalculatorProps) {
  return (
    <>
      <section id="calculator" className="mx-auto max-w-[1440px] px-5 pb-16 sm:px-8 lg:pb-24">
        <div
          className="relative overflow-hidden px-6 py-12 sm:px-16 lg:px-28 lg:py-16 shadow-2xl shadow-violet-950/20"
          style={{
            backgroundImage:
              "linear-gradient(10.37deg, #9C57FF -3.23%, #9351F3 -3.23%, #4F2396 78.2%)",
            borderRadius: "32px 32px 32px 0",
          }}
        >
          <h2 className="text-center text-2xl sm:text-4xl font-black text-white">
            {t(
              "Calculate Your Expected Monthly Income",
              "احسب دخلك الشهري المتوقع من عقارك"
            )}
          </h2>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3 items-center justify-items-center">
            {/* Step 1: Choose Property Type */}
            <div className="flex flex-col items-center gap-3">
              <h3 className="text-lg font-extrabold text-white">
                1- {t("Choose Property Type", "اختر نوع عقارك")}
              </h3>
              <button
                type="button"
                onClick={() => setCalcModal("type")}
                className="flex h-[200px] w-[200px] flex-col items-center justify-center gap-4 rounded-2xl border-2 border-[#F6F6F6] bg-[#F6F6F6] p-4 shadow-lg transition hover:scale-[1.03] cursor-pointer"
              >
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-violet-100 text-[#4F2396]">
                  <Building2 size={34} />
                </div>
                <span className="inline-flex items-center gap-1.5 text-lg font-black text-[#4F2396]">
                  <span>{lang === "ar" ? selectedTypeObj.ar : selectedTypeObj.en}</span>
                  <ChevronDown size={18} />
                </span>
              </button>
            </div>

            {/* Step 2: Choose City */}
            <div className="flex flex-col items-center gap-3">
              <h3 className="text-lg font-extrabold text-white">
                2- {t("Choose City", "اختر المدينة")}
              </h3>
              <button
                type="button"
                onClick={() => setCalcModal("city")}
                className="flex h-[200px] w-[200px] flex-col items-center justify-center gap-4 rounded-2xl border-2 border-[#F6F6F6] bg-[#F6F6F6] p-4 shadow-lg transition hover:scale-[1.03] cursor-pointer"
              >
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-violet-100 text-[#4F2396]">
                  <MapPin size={34} />
                </div>
                <span className="inline-flex items-center gap-1.5 text-lg font-black text-[#4F2396]">
                  <span>{lang === "ar" ? selectedCityObj.ar : selectedCityObj.en}</span>
                  <ChevronDown size={18} />
                </span>
              </button>
            </div>

            {/* Step 3: Expected Monthly Income */}
            <div className="flex flex-col items-center gap-3">
              <h3 className="text-lg font-extrabold text-white">
                {t("Expected Income*", "متوسط دخلك المتوقع*")}
              </h3>
              <div className="flex h-[200px] w-[200px] flex-col items-center justify-center rounded-2xl border-2 border-[#F6F6F6] bg-white/10 p-4 text-center text-white backdrop-blur-sm">
                <span className="text-4xl sm:text-5xl font-black tracking-tight">
                  {expectedMonthlySar.toLocaleString()}
                </span>
                <span className="mt-2 text-lg font-extrabold text-[#FF9750]">
                  {t("SAR / Month", "ر.س / بالشهر")}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setHowCalculatedOpen(true)}
              className="text-sm sm:text-base font-extrabold text-white underline underline-offset-4 hover:text-[#FF9750] cursor-pointer"
            >
              {t(
                "How are your expected earnings calculated?",
                "كيف يتم تقدير أرباحك المتوقعة؟"
              )}
            </button>
          </div>
        </div>
      </section>

      {/* MODAL 1: SELECT PROPERTY TYPE OR CITY */}
      {calcModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
          onClick={() => setCalcModal(null)}
        >
          <div
            className="w-full max-w-[480px] rounded-3xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-[#4F2396]">
                {calcModal === "type"
                  ? t("Choose Property Type", "اختر نوع عقارك")
                  : t("Choose City", "اختر المدينة")}
              </h3>
              <button
                type="button"
                onClick={() => setCalcModal(null)}
                className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 grid gap-1.5 max-h-[360px] overflow-y-auto">
              {calcModal === "type"
                ? PROPERTY_TYPE_LABELS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setCalcType(item.id);
                        setCalcModal(null);
                      }}
                      className={`flex items-center justify-between rounded-2xl px-4 py-3.5 text-base font-extrabold transition cursor-pointer ${
                        calcType === item.id
                          ? "bg-violet-100 text-[#4F2396]"
                          : "text-slate-800 hover:bg-violet-50/60"
                      }`}
                    >
                      <span>{lang === "ar" ? item.ar : item.en}</span>
                      {calcType === item.id && <CheckCircle2 size={18} className="text-[#4F2396]" />}
                    </button>
                  ))
                : CITY_LABELS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setCalcCity(item.id);
                        setCalcModal(null);
                      }}
                      className={`flex items-center justify-between rounded-2xl px-4 py-3.5 text-base font-extrabold transition cursor-pointer ${
                        calcCity === item.id
                          ? "bg-violet-100 text-[#4F2396]"
                          : "text-slate-800 hover:bg-violet-50/60"
                      }`}
                    >
                      <span>{lang === "ar" ? item.ar : item.en}</span>
                      {calcCity === item.id && <CheckCircle2 size={18} className="text-[#4F2396]" />}
                    </button>
                  ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: HOW EARNINGS ARE CALCULATED */}
      {howCalculatedOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
          onClick={() => setHowCalculatedOpen(false)}
        >
          <div
            className="w-full max-w-[680px] rounded-3xl bg-white p-6 sm:p-10 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                {t(
                  "How are your expected earnings estimated?",
                  "كيف يتم تقدير أرباحك المتوقعة؟"
                )}
              </h3>
              <button
                type="button"
                onClick={() => setHowCalculatedOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-sm sm:text-base font-semibold text-slate-600 leading-7">
              {t(
                "We perform simple calculations for your expected monthly income:",
                "نقوم ببعض الحسابات البسيطة لأرباحك المتوقعة:"
              )}
            </p>
            <p className="text-sm sm:text-base text-slate-600 leading-7">
              {t(
                "We take the average nightly rate based on the property type and city from confirmed bookings in your area over the last 3 months.",
                "نأخذ متوسط سعر الليلة بناءًا على نوع العقار والمدينة من خلال أسعار الحجوزات في منطقتك خلال آخر 3 أشهر."
              )}
            </p>
            <p className="text-sm sm:text-base text-slate-600 leading-7">
              {t(
                "Keep in mind, these are estimates and your actual income depends on factors such as calendar availability, pricing, and hospitality quality.",
                "ضع في اعتبارك، هذه مجرد تقديرات وأرباحك تعتمد على عدد من العوامل الأخرى مثل الإتاحة والسعر والطلب في منطقتك، وأيضاً تعتمد على ضيافتك وحسن استقبالك لضيوفك."
              )}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
