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
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#110F18]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {language === "ar"
              ? "قسّم دفعتك على ٤ دفعات بدون فوائد"
              : "Split into 4 interest-free payments"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          {language === "ar"
            ? `اختر تمارا أو تابي أو MIS Pay عند الدفع وقسّم إجمالي الحجز (${estimatedTotal} ر.س) على ٤ دفعات شهرية بقيمة ${splitInstallment} ر.س بدون أي رسوم تأخير أو فوائد.`
            : `Select Tamara, Tabby, or MIS Pay at checkout to split your ${estimatedTotal} SAR booking into 4 monthly payments of ${splitInstallment} SAR — 0% interest and Shariah-compliant.`}
        </p>

        <div className="mt-4 space-y-2.5">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/70 px-3.5 py-2.5 text-xs dark:border-slate-800 dark:bg-slate-900/60"
            >
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {step === 1
                  ? language === "ar"
                    ? "الدفعة الأولى (اليوم عند الحجز)"
                    : "1st Payment (Today at booking)"
                  : language === "ar"
                  ? `الدفعة ${step} (بعد ${step - 1} شهر)`
                  : `Payment ${step} (Month ${step - 1})`}
              </span>
              <span className="font-bold text-[#4F2396] dark:text-purple-300">
                {splitInstallment} SAR
              </span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-[#4F2396] hover:bg-[#3D1A78] py-2.5 text-xs font-bold text-white shadow-xs cursor-pointer transition"
        >
          {language === "ar" ? "حسناً، فهمت" : "Got it"}
        </button>
      </div>
    </div>
  );
}

