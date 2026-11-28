"use client";

import React from "react";
import { Building2, Star } from "lucide-react";
import { PropertyPerformanceItem } from "./types";

interface PropertyPerformanceTableProps {
  propertyPerformance: PropertyPerformanceItem[];
  lang: "ar" | "en";
  t: (en: string, ar: string) => string;
}

export function PropertyPerformanceTable({
  propertyPerformance,
  lang,
  t,
}: PropertyPerformanceTableProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#12101a] p-6 sm:p-7 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white">
            {t("Property Performance Breakdown", "تفاصيل أداء الوحدات والعقارات")}
          </h3>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
            {t(
              "Revenue, completed stays, and rating score for each registered unit",
              "الإيرادات والحجوزات ومتوسط التقييم لكل وحدة مسجلة"
            )}
          </p>
        </div>
        <span className="rounded-full bg-violet-100 dark:bg-purple-950/60 px-3 py-1 text-xs font-black text-[#4F2396] dark:text-purple-300">
          {propertyPerformance.length} {t("Units", "وحدات")}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left rtl:text-right text-xs">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              <th className="py-3 px-3">{t("Property", "الوحدة")}</th>
              <th className="py-3 px-3">{t("Location", "الموقع")}</th>
              <th className="py-3 px-3">{t("Nightly Base", "السعر الأساسي")}</th>
              <th className="py-3 px-3">{t("Stays", "الحجوزات")}</th>
              <th className="py-3 px-3">{t("Total Revenue", "إجمالي المبيعات")}</th>
              <th className="py-3 px-3">{t("Rating", "التقييم")}</th>
              <th className="py-3 px-3">{t("Status", "الحالة")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-bold text-slate-700 dark:text-slate-300">
            {propertyPerformance.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-xs font-bold text-slate-400 dark:text-slate-500">
                  {t("No properties registered yet.", "لا توجد عقارات مسجلة حتى الآن.")}
                </td>
              </tr>
            ) : (
              propertyPerformance.map((p) => (
              <tr key={p.propertyId} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/60 transition">
                <td className="py-3.5 px-3">
                  <div className="flex items-center gap-3">
                    {p.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.image}
                        alt={p.title}
                        className="h-10 w-14 shrink-0 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                      />
                    ) : (
                      <div className="h-10 w-14 shrink-0 rounded-lg bg-violet-50 dark:bg-purple-950/60 text-[#4F2396] dark:text-purple-300 flex items-center justify-center">
                        <Building2 size={16} />
                      </div>
                    )}
                    <div>
                      <p className="font-black text-slate-900 dark:text-white">
                        {lang === "ar" ? p.titleAr : p.title}
                      </p>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">{p.category}</span>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400">
                  {p.city} · {p.district}
                </td>
                <td className="py-3.5 px-3 font-mono">
                  {p.basePrice} {t("SAR", "ر.س")}
                </td>
                <td className="py-3.5 px-3">
                  {p.bookingsCount} {t("stays", "حجز")} ({p.nightsBooked} {t("nights", "ليلة")})
                </td>
                <td className="py-3.5 px-3 font-mono font-black text-slate-900 dark:text-white">
                  {p.totalRevenue.toLocaleString()} {t("SAR", "ر.س")}
                </td>
                <td className="py-3.5 px-3">
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 px-2 py-0.5 text-[11px] font-black text-amber-900 dark:text-amber-300">
                    <Star size={11} className="fill-amber-400 text-amber-400" />
                    <span>{p.averageRating}</span>
                  </span>
                </td>
                <td className="py-3.5 px-3">
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-black ${
                      p.isApproved
                        ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"
                        : "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300"
                    }`}
                  >
                    {p.isApproved
                      ? t("Active / Live", "معتمد ونشط")
                      : t("Pending", "قيد المراجعة")}
                  </span>
                </td>
              </tr>
            ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

