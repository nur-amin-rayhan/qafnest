"use client";

import React from "react";
import { Home, ShieldCheck } from "lucide-react";
import type { Property } from "@/data/properties";

interface PropertyTermsTabProps {
  property: Property;
  anchorLabel: (en: string, ar: string) => string;
}

export function PropertyTermsTab({
  property,
  anchorLabel,
}: PropertyTermsTabProps) {
  return (
    <section
      id="terms"
      className="scroll-mt-32 border-t border-violet-100/80 py-8 dark:border-violet-500/15"
    >
      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">
        {anchorLabel("Before you book", "قبل الحجز")}
      </span>
      <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-gray-950 dark:text-white">
        {anchorLabel("Terms & policies", "الشروط والسياسات")}
      </h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50/60 via-white to-fuchsia-50/40 p-5 shadow-sm dark:border-violet-500/25 dark:from-violet-950/35 dark:via-[#141022] dark:to-fuchsia-950/20">
          <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
            <Home className="h-4 w-4 text-violet-600 dark:text-violet-300" />
            {anchorLabel("Booking conditions (by the host)", "شروط الحجز (من المضيف)")}
          </h3>
          {property.bookingConditions?.length ? (
            <ul className="mt-3 list-disc space-y-1 pl-6 text-sm text-gray-600 dark:text-gray-300">
              {property.bookingConditions.map((condition) => (
                <li key={condition}>{condition}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
              {anchorLabel(
                "No host-specific conditions have been added. Please confirm any special requirements before booking.",
                "لم تتم إضافة شروط خاصة من المضيف. يرجى تأكيد أي متطلبات خاصة قبل الحجز."
              )}
            </p>
          )}
        </div>
        <div className="rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50/60 via-white to-fuchsia-50/40 p-5 shadow-sm dark:border-violet-500/25 dark:from-violet-950/35 dark:via-[#141022] dark:to-fuchsia-950/20">
          <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
            <ShieldCheck className="h-4 w-4 text-violet-600 dark:text-violet-300" />
            {anchorLabel("Cancellation & Refund Policy", "سياسة الإلغاء والاسترداد")}
          </h3>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
            {anchorLabel(
              "The reservation cannot be cancelled or postponed.",
              "لا يمكن إلغاء الحجز أو تأجيله."
            )}
          </p>
        </div>
      </div>
    </section>
  );
}

