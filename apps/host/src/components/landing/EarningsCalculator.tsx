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
  React.useEffect(() => {
    if (!calcModal && !howCalculatedOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCalcModal(null);
        setHowCalculatedOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [calcModal, howCalculatedOpen, setCalcModal, setHowCalculatedOpen]);

  return (
    <>
      <section id="calculator" className="mx-auto max-w-[1440px] px-5 pb-16 sm:px-8 lg:pb-24">
        <div className="relative overflow-hidden rounded-3xl border border-purple-900/30 bg-[#2D1259] dark:bg-[#160d2e] px-6 py-12 sm:px-14 lg:px-20 lg:py-16 text-white shadow-xl shadow-purple-950/20">
          <h2 className="text-center text-2xl sm:text-4xl font-black text-white tracking-tight">
            {t(
              "Calculate Your Expected Monthly Income",
              "احسب دخلك الشهري المتوقع من عقارك"
            )}
          </h2>

          <div className="mt-10 sm:mt-12 grid grid-cols-1 gap-6 md:grid-cols-3 items-center justify-items-center">
            {/* Step 1: Choose Property Type */}
            <div className="flex flex-col items-center gap-3 w-full">
              <h3 className="text-sm sm:text-base font-bold text-purple-200">
                1- {t("Choose Property Type", "اختر نوع عقارك")}
              </h3>
              <button
                type="button"
                onClick={() => setCalcModal("type")}
                className="flex h-[180px] w-full max-w-[220px] flex-col items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white/10 dark:bg-white/5 hover:bg-white/15 dark:hover:bg-white/10 p-4 transition-all cursor-pointer backdrop-blur-md"
              >
                <div className="grid h-14 w-14 place-items-center rounded-xl bg-white/15 text-white">
                  <Building2 size={28} />
                </div>
                <span className="inline-flex items-center gap-1.5 text-base sm:text-lg font-bold text-white">
                  <span>{lang === "ar" ? selectedTypeObj.ar : selectedTypeObj.en}</span>
                  <ChevronDown size={18} />
                </span>
              </button>
            </div>

            {/* Step 2: Choose City */}
            <div className="flex flex-col items-center gap-3 w-full">
              <h3 className="text-sm sm:text-base font-bold text-purple-200">
                2- {t("Choose City", "اختر المدينة")}
              </h3>
              <button
                type="button"
                onClick={() => setCalcModal("city")}
                className="flex h-[180px] w-full max-w-[220px] flex-col items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white/10 dark:bg-white/5 hover:bg-white/15 dark:hover:bg-white/10 p-4 transition-all cursor-pointer backdrop-blur-md"
              >
                <div className="grid h-14 w-14 place-items-center rounded-xl bg-white/15 text-white">
                  <MapPin size={28} />
                </div>
                <span className="inline-flex items-center gap-1.5 text-base sm:text-lg font-bold text-white">
                  <span>{lang === "ar" ? selectedCityObj.ar : selectedCityObj.en}</span>
                  <ChevronDown size={18} />
                </span>
              </button>
            </div>

            {/* Step 3: Expected Monthly Income */}
            <div className="flex flex-col items-center gap-3 w-full">
              <h3 className="text-sm sm:text-base font-bold text-purple-200">
                {t("Expected Income*", "متوسط دخلك المتوقع*")}
              </h3>
              <div className="flex h-[180px] w-full max-w-[220px] flex-col items-center justify-center rounded-2xl border border-amber-400/40 bg-white/10 dark:bg-white/5 p-4 text-center text-white backdrop-blur-md">
                <span className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
                  {expectedMonthlySar.toLocaleString()}
                </span>
                <span className="mt-1.5 text-sm sm:text-base font-bold text-[#FF9750]">
                  {t("SAR / Month", "ر.س / بالشهر")}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setHowCalculatedOpen(true)}
              className="text-xs sm:text-sm font-semibold text-purple-200 underline underline-offset-4 hover:text-[#FF9750] cursor-pointer"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          onClick={() => setCalcModal(null)}
        >
          <div
            className="w-full max-w-[460px] rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#12101a] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {calcModal === "type"
                  ? t("Choose Property Type", "اختر نوع عقارك")
                  : t("Choose City", "اختر المدينة")}
              </h3>
              <button
                type="button"
                onClick={() => setCalcModal(null)}
                className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-3.5 grid gap-1.5 max-h-[340px] overflow-y-auto">
              {calcModal === "type"
                ? PROPERTY_TYPE_LABELS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setCalcType(item.id);
                        setCalcModal(null);
                      }}
                      className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-bold transition cursor-pointer ${
                        calcType === item.id
                          ? "bg-purple-50 dark:bg-purple-950/50 text-[#4F2396] dark:text-purple-300"
                          : "text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900"
                      }`}
                    >
                      <span>{lang === "ar" ? item.ar : item.en}</span>
                      {calcType === item.id && <CheckCircle2 size={16} className="text-[#4F2396] dark:text-purple-300" />}
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
                      className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-bold transition cursor-pointer ${
                        calcCity === item.id
                          ? "bg-purple-50 dark:bg-purple-950/50 text-[#4F2396] dark:text-purple-300"
                          : "text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900"
                      }`}
                    >
                      <span>{lang === "ar" ? item.ar : item.en}</span>
                      {calcCity === item.id && <CheckCircle2 size={16} className="text-[#4F2396] dark:text-purple-300" />}
                    </button>
                  ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: HOW EARNINGS ARE CALCULATED */}
      {howCalculatedOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          onClick={() => setHowCalculatedOpen(false)}
        >
          <div
            className="w-full max-w-[620px] rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#12101a] p-6 sm:p-8 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {t(
                  "How are your expected earnings estimated?",
                  "كيف يتم تقدير أرباحك المتوقعة؟"
                )}
              </h3>
              <button
                type="button"
                onClick={() => setHowCalculatedOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
              {t(
                "We perform simple calculations for your expected monthly income:",
                "نقوم ببعض الحسابات البسيطة لأرباحك المتوقعة:"
              )}
            </p>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
              {t(
                "We take the average nightly rate based on the property type and city from confirmed bookings in your area over the last 3 months.",
                "نأخذ متوسط سعر الليلة بناءًا على نوع العقار والمدينة من خلال أسعار الحجوزات في منطقتك خلال آخر 3 أشهر."
              )}
            </p>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
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
