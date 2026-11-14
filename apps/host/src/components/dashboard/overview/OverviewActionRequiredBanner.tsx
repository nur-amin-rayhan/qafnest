"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import type { HostPropertySummary } from "./types";

interface OverviewActionRequiredBannerProps {
  propertiesNeedingAction: HostPropertySummary[];
  lang: "ar" | "en";
  t: (en: string, ar: string) => string;
}

export function OverviewActionRequiredBanner({
  propertiesNeedingAction,
  lang,
  t,
}: OverviewActionRequiredBannerProps) {
  if (propertiesNeedingAction.length === 0) return null;

  return (
    <div className="rounded-3xl border-2 border-amber-300 bg-amber-50/90 p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-500 text-white shadow-xs">
            <AlertTriangle size={22} />
          </div>
          <div>
            <h3 className="text-base font-black text-amber-950">
              {t(
                `Action Required: ${propertiesNeedingAction.length} Property Listing(s) Need Revisions`,
                `تنبيه مراجعة: ${propertiesNeedingAction.length} عقار بحاجة إلى تعديل بسيط للاعتماد`
              )}
            </h3>
            <p className="mt-1 text-xs sm:text-sm font-semibold text-amber-900 leading-relaxed">
              {t(
                "The QafNest Operations team reviewed your listing and left specific notes. Update the details and resubmit to go live.",
                "فريق إدارة المنصة قام بمراجعة بيانات عقارك وقدم ملاحظات محددة. يرجى الاطلاع عليها وتعديلها لإعادة الإرسال والاعتماد الفوري."
              )}
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {propertiesNeedingAction.map((prop) => (
                <span
                  key={prop.id}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-200/80 px-2.5 py-1 text-xs font-bold text-amber-950"
                >
                  <span>{prop.title}</span>
                  <span className="text-[10px] text-amber-800">#{prop.id.slice(0, 6)}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href={`/${lang}/properties/new?edit=${propertiesNeedingAction[0]?.id}`}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 text-xs sm:text-sm font-black transition shadow-xs"
          >
            <span>{t("Review Feedback & Edit", "الاطلاع على الملاحظات والتعديل")}</span>
            <ArrowRight size={15} className={lang === "ar" ? "rotate-180" : ""} />
          </Link>
        </div>
      </div>
    </div>
  );
}

