"use client";

import React from "react";
import { Check, AlertCircle, Delete } from "lucide-react";
import { formatPinDisplay, validateCustomPin } from "@/lib/services/smartLockPinService";

interface SmartLockPinKeypadProps {
  customPin: string;
  language: "en" | "ar";
  onKeyPress: (num: string) => void;
  onClear: () => void;
  onBackspace: () => void;
  label: (en: string, ar: string) => string;
}

export function SmartLockPinKeypad({
  customPin,
  language,
  onKeyPress,
  onClear,
  onBackspace,
  label,
}: SmartLockPinKeypadProps) {
  const manualValidation = validateCustomPin(customPin, language);

  return (
    <div className="space-y-4">
      <div className="relative rounded-2xl border border-violet-200 bg-violet-50/50 p-4 text-center dark:border-violet-500/20 dark:bg-violet-950/20">
        <label
          htmlFor="custom-smart-lock-pin"
          className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400"
        >
          {label("Enter 4 to 8 Digits", "أدخل من 4 إلى 8 أرقام")}
        </label>
        <input
          id="custom-smart-lock-pin"
          type="text"
          readOnly
          value={formatPinDisplay(customPin)}
          placeholder="— — — —"
          className="mt-1 w-full bg-transparent text-center font-mono text-2xl font-bold tracking-[0.2em] text-gray-900 dark:text-white rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
        />
      </div>

      {/* Validation Feedback */}
      {customPin.length > 0 && (
        <div
          className={`flex items-center gap-2 rounded-xl p-2.5 text-xs font-medium ${
            manualValidation.valid
              ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300"
              : "bg-rose-50 text-rose-700 dark:bg-rose-400/10 dark:text-rose-200"
          }`}
        >
          {manualValidation.valid ? (
            <Check className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          )}
          <span>
            {manualValidation.valid
              ? label("PIN meets all safety standards.", "رمز مطابق لكافة معايير الأمان.")
              : manualValidation.error}
          </span>
        </div>
      )}

      {/* Numeric Keypad Buttons */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => onKeyPress(num)}
            className="flex h-11 items-center justify-center rounded-2xl border border-gray-200 bg-white text-lg font-bold text-gray-900 shadow-xs hover:bg-violet-50 hover:border-violet-300 active:scale-95 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-violet-900/30 transition cursor-pointer"
          >
            {num}
          </button>
        ))}
        <button
          type="button"
          onClick={onClear}
          className="flex h-11 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-xs font-bold text-gray-600 hover:bg-rose-50 hover:text-rose-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 transition cursor-pointer"
        >
          {label("Clear", "مسح")}
        </button>
        <button
          type="button"
          onClick={() => onKeyPress("0")}
          className="flex h-11 items-center justify-center rounded-2xl border border-gray-200 bg-white text-lg font-bold text-gray-900 shadow-xs hover:bg-violet-50 hover:border-violet-300 active:scale-95 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-violet-900/30 transition cursor-pointer"
        >
          0
        </button>
        <button
          type="button"
          onClick={onBackspace}
          className="flex h-11 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 transition cursor-pointer"
        >
          <Delete className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
