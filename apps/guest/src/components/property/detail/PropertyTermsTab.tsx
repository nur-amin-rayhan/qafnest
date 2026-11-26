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
      <span className="text-xs font-semibold text-[#4F2396] dark:text-purple-300">
        {anchorLabel("Before you book", "قبل الحجز")}
      </span>
      <h2 className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
        {anchorLabel("Terms & policies", "الشروط والسياسات")}
      </h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/85 bg-slate-50/60 p-5 shadow-xs dark:border-slate-800 dark:bg-[#110F18]">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <Home className="h-4 w-4 text-[#4F2396] dark:text-purple-400" />
            {anchorLabel("Booking conditions (by the host)", "شروط الحجز (من المضيف)")}
          </h3>
          {property.bookingConditions?.length ? (
            <ul className="mt-3 list-disc space-y-1 pl-6 text-sm text-slate-600 dark:text-slate-300">
              {property.bookingConditions.map((condition) => (
                <li key={condition}>{condition}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              {anchorLabel(
                "No host-specific conditions have been added. Please confirm any special requirements before booking.",
                "لم تتم إضافة شروط خاصة من المضيف. يرجى تأكيد أي متطلبات خاصة قبل الحجز."
              )}
            </p>
          )}
        </div>
        <div className="rounded-2xl border border-slate-200/85 bg-slate-50/60 p-5 shadow-xs dark:border-slate-800 dark:bg-[#110F18]">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <ShieldCheck className="h-4 w-4 text-[#4F2396] dark:text-purple-400" />
            {anchorLabel("Cancellation & Refund Policy", "سياسة الإلغاء والاسترداد")}
          </h3>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
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

