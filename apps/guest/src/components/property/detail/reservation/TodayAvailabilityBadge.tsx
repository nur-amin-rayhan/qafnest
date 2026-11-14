"use client";

import React from "react";
import { Clock, CheckCircle2, Sparkles } from "lucide-react";
import type { PropertyDailyTimeSlotStatus } from "@qafnest/shared";

interface TodayAvailabilityBadgeProps {
  status?: PropertyDailyTimeSlotStatus | null;
  language: string;
}

export function TodayAvailabilityBadge({
  status,
  language,
}: TodayAvailabilityBadgeProps) {
  if (!status || !status.isCheckoutDay) return null;

  const isAr = language === "ar";

  if (status.isCurrentlyOccupied) {
    return (
      <div className="mb-4 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent p-3.5 text-xs">
        <div className="flex items-center gap-2 font-extrabold text-amber-700 dark:text-amber-300">
          <Clock className="h-4 w-4 shrink-0 animate-pulse text-amber-600 dark:text-amber-400" />
          <span>
            {isAr
              ? `مشغول حتى ${status.checkoutCutoff || "12:00"} ظهراً (يوم مغادرة)`
              : `Occupied until ${status.checkoutCutoff || "12:00"} PM (Checkout Day)`}
          </span>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-amber-800/90 dark:text-amber-200/80">
          {isAr
            ? `العقار مشغول حالياً وينتقل تلقائياً إلى الحالة المتاحة بعد الساعة ${status.checkoutCutoff || "12:00"} ظهراً لاستقبال وصول جديد.`
            : `Property is occupied until the ${status.checkoutCutoff || "12:00"} PM cutoff, transitioning to available for same-day check-ins.`}
        </p>
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-2xl border border-emerald-500/35 bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-transparent p-3.5 text-xs">
      <div className="flex items-center gap-2 font-extrabold text-emerald-700 dark:text-emerald-300">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <span className="flex items-center gap-1.5">
          {isAr ? "متاح لتسجيل الوصول اليوم" : "Available for Check-in Today"}
          <Sparkles className="h-3 w-3 text-emerald-500" />
        </span>
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-emerald-800/90 dark:text-emerald-200/80">
        {isAr
          ? `اكتملت مغادرة النزيل السابق عند الساعة ${status.checkoutCutoff || "12:00"} ظهراً. متاح للحجز واستقبال الضيوف الجدد.`
          : `Prior guest checkout completed at ${status.checkoutCutoff || "12:00"} PM cutoff. Ready for same-day check-in.`}
      </p>
    </div>
  );
}

