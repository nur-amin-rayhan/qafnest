"use client";

import React from "react";
import { X } from "lucide-react";

interface SplitPaymentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: string;
  estimatedTotal: number;
  splitInstallment: string;
}

export function SplitPaymentsModal({
  isOpen,
  onClose,
  language,
  estimatedTotal,
  splitInstallment,
}: SplitPaymentsModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-violet-300 bg-gradient-to-b from-white via-violet-50/30 to-white p-6 shadow-2xl dark:border-violet-500/35 dark:from-[#19142A] dark:to-[#120E1E]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-violet-100 pb-3 dark:border-white/10">
          <h3 className="text-base font-extrabold text-[#2E1065] dark:text-white">
            {language === "ar"
              ? "قسّم دفعتك على ٤ دفعات بدون فوائد"
              : "Split into 4 interest-free payments"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-violet-100 hover:text-violet-700 dark:hover:bg-white/10 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-gray-600 dark:text-gray-300">
          {language === "ar"
            ? `اختر تمارا أو تابي أو MIS Pay عند الدفع وقسّم إجمالي الحجز (${estimatedTotal} ر.س) على ٤ دفعات شهرية بقيمة ${splitInstallment} ر.س بدون أي رسوم تأخير أو فوائد.`
            : `Select Tamara, Tabby, or MIS Pay at checkout to split your ${estimatedTotal} SAR booking into 4 monthly payments of ${splitInstallment} SAR — 0% interest and Shariah-compliant.`}
        </p>

        <div className="mt-4 space-y-2.5">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className="flex items-center justify-between rounded-xl border border-violet-200/70 bg-violet-50/50 px-3.5 py-2.5 text-xs dark:border-violet-500/25 dark:bg-white/5"
            >
              <span className="font-bold text-gray-800 dark:text-gray-200">
                {step === 1
                  ? language === "ar"
                    ? "الدفعة الأولى (اليوم عند الحجز)"
                    : "1st Payment (Today at booking)"
                  : language === "ar"
                  ? `الدفعة ${step} (بعد ${step - 1} شهر)`
                  : `Payment ${step} (Month ${step - 1})`}
              </span>
              <span className="font-extrabold text-violet-700 dark:text-violet-300">
                {splitInstallment} SAR
              </span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-gradient-to-r from-violet-700 to-fuchsia-600 py-2.5 text-xs font-bold text-white shadow-md cursor-pointer"
        >
          {language === "ar" ? "حسناً، فهمت" : "Got it"}
        </button>
      </div>
    </div>
  );
}

