import React from "react";
import { ShieldCheck } from "lucide-react";

interface ReservationPoliciesCardProps {
  bookingCheckinTime: string;
  bookingCheckoutTime: string;
  label: (en: string, ar: string) => string;
}

export function ReservationPoliciesCard({
  bookingCheckinTime,
  bookingCheckoutTime,
  label,
}: ReservationPoliciesCardProps) {
  return (
    <section className="mt-6 rounded-2xl border border-slate-200/85 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-[#110F18] sm:p-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-[#4F2396] dark:text-purple-400" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          {label("Booking policies and conditions", "سياسات وشروط الحجز")}
        </h2>
      </div>
      <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
        <p className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/60">
          <strong className="block text-slate-900 dark:text-white font-bold">
            {label("Stay times", "أوقات الإقامة")}
          </strong>
          <span className="mt-1 block font-medium">
            {label("Check-in", "تسجيل الوصول")} {bookingCheckinTime} ·{" "}
            {label("Check-out", "تسجيل المغادرة")} {bookingCheckoutTime}
          </span>
        </p>
        <p className="rounded-xl border border-rose-200/80 bg-rose-50/60 p-4 text-xs leading-6 text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-200">
          <strong className="mb-1 block font-bold">
            {label("Cancellation & Refund Policy", "سياسة الإلغاء والاسترداد")}
          </strong>
          {label(
            "The reservation cannot be cancelled or postponed.",
            "لا يمكن إلغاء الحجز أو تأجيله."
          )}
        </p>
      </div>
    </section>
  );
}

