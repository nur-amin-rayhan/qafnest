"use client";

import React, { useState } from "react";
import Link from "next/link";
import { KeyRound, Lock, Hash, ArrowRight } from "lucide-react";
import { SmartLockPinKeypad } from "@/app/my-bookings/components/SmartLockPinKeypad";

interface SmartLockTabProps {
  t: (en: string, ar: string) => string;
  language?: string;
}

export function SmartLockTab({ t, language = "en" }: SmartLockTabProps) {
  const [customPin, setCustomPin] = useState<string>("");
  const lang = language === "ar" ? "ar" : "en";

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl border border-violet-100 bg-white p-6 shadow-xs dark:border-white/10 dark:bg-[#12101a] sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-900/40 text-[#4F2396] dark:text-violet-300">
              <KeyRound className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-950 dark:text-white">
                {t("Smart Lock & Keyless Entry", "القفل الذكي والدخول الذاتي")}
              </h2>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                {t(
                  "Manual smart lock PIN entry guide for contactless self check-in.",
                  "إعداد وإدخال رمز القفل الذكي يدوياً للدخول الذاتي بدون مفاتيح."
                )}
              </p>
            </div>
          </div>
          <Link
            href="/my-bookings"
            className="inline-flex items-center gap-1.5 rounded-2xl bg-[#4F2396] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#3d1a75] transition"
          >
            <span>{t("Go to My Bookings", "عرض حجوزاتي وأقفال الوحدات")}</span>
            <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
          </Link>
        </div>
      </div>

      {/* Manual PIN Preview Card */}
      <div className="rounded-3xl border border-violet-100 bg-white p-6 shadow-xs dark:border-white/10 dark:bg-[#12101a] sm:p-7 space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-white/10">
          <div>
            <h3 className="text-base font-bold text-gray-950 dark:text-white">
              {t("Manual Smart Lock Passcode", "رمز القفل الذكي اليدوي")}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t("Configure manual smart lock PIN", "إعداد رمز القفل الذكي يدوياً")}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-violet-50 px-3 py-1.5 text-xs font-bold text-[#4F2396] dark:bg-violet-950/30 dark:text-violet-300">
            <Lock className="h-3.5 w-3.5" />
            <span>{t("Manual Only", "يدوي فقط")}</span>
          </span>
        </div>

        <div className="max-w-md mx-auto">
          <SmartLockPinKeypad
            customPin={customPin}
            language={lang}
            onKeyPress={(num) => {
              if (customPin.length < 8) setCustomPin((prev) => prev + num);
            }}
            onClear={() => setCustomPin("")}
            onBackspace={() => setCustomPin((prev) => prev.slice(0, -1))}
            label={t}
          />
        </div>

        {/* Step Guide */}
        <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4 dark:border-white/5 dark:bg-white/5">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-800 dark:text-gray-200">
            <Hash className="h-4 w-4 text-[#4F2396] dark:text-violet-400" />
            <span>{t("How Self Check-in Works with Smart Locks:", "طريقة فتح الباب الذاتي عند الوصول:")}</span>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3 text-xs text-gray-600 dark:text-gray-400">
            <div className="rounded-xl bg-white p-3 border border-gray-100 dark:bg-[#191624] dark:border-white/5">
              <span className="font-bold text-[#4F2396] dark:text-violet-300 block mb-1">1. {t("Wake Keypad", "تنشيط اللوحة")}</span>
              <p>{t("Touch the lock screen with your palm to turn on digits.", "المس واجهة القفل بيدك لإضاءة الأرقام.")}</p>
            </div>
            <div className="rounded-xl bg-white p-3 border border-gray-100 dark:bg-[#191624] dark:border-white/5">
              <span className="font-bold text-[#4F2396] dark:text-violet-300 block mb-1">2. {t("Enter Code", "إدخال الرمز")}</span>
              <p>{t("Type your manually assigned smart lock passcode.", "أدخل الرمز المعتمد الخاص بحجزك.")}</p>
            </div>
            <div className="rounded-xl bg-white p-3 border border-gray-100 dark:bg-[#191624] dark:border-white/5">
              <span className="font-bold text-[#4F2396] dark:text-violet-300 block mb-1">3. {t("Unlock Door", "فتح القفل")}</span>
              <p>{t("Press # (or unlock icon) to unlock immediately.", "اضغط على رمز # أو علامة القفل للدخول.")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
