"use client";

import React from "react";

interface WizardProgressFooterProps {
  step: number;
  totalSteps: number;
  canProceed: boolean;
  submitting: boolean;
  onPrev: () => void;
  onNext: () => void;
  t: (en: string, ar: string) => string;
}

export function WizardProgressFooter({
  step,
  totalSteps,
  canProceed,
  submitting,
  onPrev,
  onNext,
  t,
}: WizardProgressFooterProps) {
  const progressPercent = Math.round(((step + 1) / totalSteps) * 100);

  return (
    <div className="bg-white">
      {/* Top Progress Track */}
      <div className="h-[3px] w-full bg-[#e2dcf0] overflow-hidden">
        <div
          className="h-full bg-[#4F2396] transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex items-center justify-center gap-5 px-6 py-4">
        <button
          type="button"
          onClick={onPrev}
          className="min-w-[125px] rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs sm:text-sm font-extrabold text-[#4F2396] hover:bg-violet-50 transition cursor-pointer"
        >
          {t("Previous", "السابق")}
        </button>

        <button
          type="button"
          disabled={!canProceed || submitting}
          onClick={onNext}
          className={`min-w-[125px] rounded-xl px-5 py-2.5 text-xs sm:text-sm font-extrabold text-white transition ${
            canProceed
              ? "bg-[#4F2396] hover:bg-[#3d1979] cursor-pointer"
              : "bg-[#c4c4c4] cursor-not-allowed"
          }`}
        >
          {step === totalSteps - 1
            ? submitting
              ? t("Saving...", "جاري الحفظ...")
              : t("Done", "خلصنا")
            : t("Next", "التالي")}
        </button>
      </div>
    </div>
  );
}
