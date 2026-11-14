"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  KeyRound,
  Lock,
  Hash,
  ShieldCheck,
  AlertCircle,
  Check,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getReviewAuthorizationHeaders } from "@/lib/reviews/client";
import { validateCustomPin } from "@/lib/services/smartLockPinService";
import { SmartLockPinKeypad } from "./SmartLockPinKeypad";

interface SmartLockPinModalProps {
  bookingId: string;
  bookingRef?: string;
  bookingStatus?: string;
  initialPin: string | null;
  isOpen: boolean;
  onClose: () => void;
  onPinSaved: (newPin: string) => void;
  language: "en" | "ar";
  label: (en: string, ar: string) => string;
}

export function SmartLockPinModal({
  bookingId,
  bookingRef,
  bookingStatus,
  initialPin,
  isOpen,
  onClose,
  onPinSaved,
  language,
  label,
}: SmartLockPinModalProps) {
  const { session } = useAuth();
  const [customPin, setCustomPin] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCustomPin(initialPin || "");
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, initialPin]);

  if (!isOpen) return null;

  const isCancelled = bookingStatus === "cancelled";
  const manualValidation = validateCustomPin(customPin, language);

  const handleSavePin = async () => {
    if (isCancelled) {
      setErrorMsg(label("PIN assignment is disabled for cancelled reservations.", "تم تعطيل تعيين رمز القفل للحجوزات الملغية."));
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    const validation = validateCustomPin(customPin, language);

    if (!validation.valid) {
      setErrorMsg(validation.error || label("Invalid PIN", "رمز غير صالح"));
      return;
    }

    setIsSaving(true);
    try {
      const headers = await getReviewAuthorizationHeaders(session);
      const targetRef = bookingRef || bookingId;
      const res = await fetch(`/api/bookings/${encodeURIComponent(targetRef)}/pin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({ pin: customPin }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to save PIN");
      }

      setSuccessMsg(
        label(
          "Smart Lock PIN successfully programmed & synced!",
          "تم حفظ وتفعيل رمز القفل الذكي بنجاح!"
        )
      );
      onPinSaved(customPin);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to save PIN");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-violet-100 dark:border-white/10 dark:bg-[#161321] space-y-5 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-900/40 text-[#4F2396] dark:text-violet-300">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {label("Manual Smart Lock PIN", "تعيين رمز القفل الذكي يدوياً")}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {label("Keyless Self Check-in", "الدخول الذاتي بدون مفتاح")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/5 dark:hover:text-gray-200 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center justify-center gap-1.5 rounded-2xl bg-violet-50 py-2 text-xs font-bold text-[#4F2396] dark:bg-violet-950/30 dark:text-violet-300">
          <Lock className="h-3.5 w-3.5" />
          <span>{label("Manual PIN Entry", "إدخال الرمز يدوياً")}</span>
        </div>

        <SmartLockPinKeypad
          customPin={customPin}
          language={language}
          onKeyPress={(num) => {
            if (customPin.length < 8) setCustomPin((prev) => prev + num);
          }}
          onClear={() => setCustomPin("")}
          onBackspace={() => setCustomPin((prev) => prev.slice(0, -1))}
          label={label}
        />

        {/* Door Check-in Quick Guide */}
        <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-3.5 dark:border-white/5 dark:bg-white/5">
          <p className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-300">
            <Hash className="h-3.5 w-3.5 text-[#4F2396] dark:text-violet-400" />
            <span>{label("How to open the door at check-in:", "طريقة فتح الباب عند الوصول:")}</span>
          </p>
          <ol className="mt-2 space-y-1 text-[11px] text-gray-600 dark:text-gray-400 list-decimal list-inside">
            <li>{label("Touch the smart lock keypad to wake the display.", "المس لوحة المفاتيح لتشغيل الشاشة.")}</li>
            <li>{label("Enter your PIN code.", "أدخل رمز الدخول المعتمد.")}</li>
            <li>{label("Press the # key (or lock button) to unlock.", "اضغط على زر # أو علامة القفل لفتح الباب.")}</li>
          </ol>
        </div>

        {/* Status Alerts */}
        {isCancelled && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-500/20 dark:bg-rose-950/20 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{label("PIN assignment is strictly disabled for cancelled reservations.", "تم تعطيل تعيين رمز القفل للحجوزات الملغية.")}</span>
          </div>
        )}
        {errorMsg && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-500/20 dark:bg-rose-950/20 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-950/20 dark:text-emerald-300 flex items-center gap-2">
            <Check className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Submit & Sync Button */}
        <div className="pt-2">
          <button
            type="button"
            disabled={isSaving || isCancelled || !manualValidation.valid}
            onClick={handleSavePin}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#4F2396] hover:bg-[#3d1a75] py-3 text-sm font-bold text-white shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{label("Syncing with Door Keypad…", "جارٍ البرمجة والمزامنة مع القفل...")}</span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                <span>{label("Save & Program Smart Lock", "حفظ وبرمجة القفل الذكي")}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
