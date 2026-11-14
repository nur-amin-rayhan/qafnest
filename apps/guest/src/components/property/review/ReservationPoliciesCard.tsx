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
    <section className="mt-6 rounded-3xl border border-violet-200/85 bg-white p-5 shadow-[0_12px_35px_rgba(109,40,217,0.06)] dark:border-violet-500/20 dark:bg-[#12101a] sm:p-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-violet-600 dark:text-violet-300" />
        <h2 className="text-lg font-bold text-gray-950 dark:text-white">
          {label("Booking policies and conditions", "سياسات وشروط الحجز")}
        </h2>
      </div>
      <div className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
        <p className="rounded-2xl border border-violet-200/70 bg-violet-50/35 p-4 dark:border-violet-500/20 dark:bg-violet-950/20">
          <strong className="block text-gray-900 dark:text-white">
            {label("Stay times", "أوقات الإقامة")}
          </strong>
          <span className="mt-1 block">
            {label("Check-in", "تسجيل الوصول")} {bookingCheckinTime} ·{" "}
            {label("Check-out", "تسجيل المغادرة")} {bookingCheckoutTime}
          </span>
        </p>
        <p className="rounded-2xl border border-rose-200/80 bg-rose-50/50 p-4 text-xs leading-6 text-rose-900 dark:border-rose-500/20 dark:bg-rose-950/20 dark:text-rose-200">
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

