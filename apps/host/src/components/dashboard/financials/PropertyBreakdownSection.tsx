"use client";

import React, { useMemo, useState } from "react";
import { Building2, ArrowRight, RotateCcw, Calendar, CheckCircle2, Clock, PauseCircle } from "lucide-react";
import type { HostPropertyFinanceSummary } from "@/lib/services/hostFinancialsTypes";

interface PropertyBreakdownSectionProps {
  propertyLedgers: HostPropertyFinanceSummary[];
  selectedPropertyId: string;
  onSelectProperty: (propertyId: string) => void;
  lang: "ar" | "en";
  t: (en: string, ar: string) => string;
}

function formatSar(amount: number): string {
  return Number(amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function PropertyBreakdownSection({
  propertyLedgers,
  selectedPropertyId,
  onSelectProperty,
  lang,
  t,
}: PropertyBreakdownSectionProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of propertyLedgers) {
      const key = (p.category || "property").toLowerCase();
      if (!map.has(key)) {
        map.set(key, p.categoryName || p.category || "Property");
      }
    }
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [propertyLedgers]);

  const filteredProperties = useMemo(() => {
    if (categoryFilter === "all") return propertyLedgers;
    return propertyLedgers.filter(
      (p) => (p.category || "property").toLowerCase() === categoryFilter
    );
  }, [propertyLedgers, categoryFilter]);

  const selectedProperty = useMemo(
    () =>
      selectedPropertyId !== "all"
        ? propertyLedgers.find((p) => p.propertyId === selectedPropertyId) || null
        : null,
    [propertyLedgers, selectedPropertyId]
  );

  if (propertyLedgers.length === 0) {
    return null;
  }

  if (selectedProperty) {
    return (
      <div className="rounded-2xl border border-violet-200 dark:border-purple-800/80 bg-white dark:bg-[#12101a] p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-violet-100 dark:bg-purple-950/60 text-[#4F2396] dark:text-purple-300">
              <Building2 size={18} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {selectedProperty.propertyTitle}
                </h2>
                <span className="rounded-full bg-violet-50 dark:bg-purple-950/40 border border-violet-200 dark:border-purple-900 px-2.5 py-0.5 text-[10px] font-black text-[#4F2396] dark:text-purple-300">
                  {selectedProperty.categoryName}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                {selectedProperty.city} · {selectedProperty.bookingsCount}{" "}
                {t("confirmed bookings", "حجوزات مؤكدة")}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectProperty("all")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 px-3.5 py-2 text-xs font-extrabold text-slate-700 dark:text-slate-200 transition cursor-pointer self-start sm:self-auto"
          >
            <RotateCcw size={13} />
            <span>{t("All Properties Overview", "العودة لجميع العقارات")}</span>
          </button>
        </div>

        {/* Selected Property Metric Strip (No VAT Shown) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/60 p-3.5">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 block">
              {t("Property Gross", "إجمالي العقار")}
            </span>
            <span className="mt-1 text-base font-black text-slate-900 dark:text-white block font-mono">
              {formatSar(selectedProperty.grossRevenue)} SAR
            </span>
          </div>
          <div className="rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 p-3.5">
            <span className="text-[10px] font-extrabold uppercase text-rose-500 dark:text-rose-400 block">
              {t("Service Fee", "عمولة المنصة")}
            </span>
            <span className="mt-1 text-base font-black text-rose-700 dark:text-rose-300 block font-mono">
              -{formatSar(selectedProperty.serviceFeeAmount + selectedProperty.promoDiscountAmount)} SAR
            </span>
          </div>
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/60 p-3.5">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 block">
              {t("Net Earnings", "صافي الدخل")}
            </span>
            <span className="mt-1 text-base font-black text-slate-900 dark:text-white block font-mono">
              {formatSar(selectedProperty.netEarnings)} SAR
            </span>
          </div>
          <div className="rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 p-3.5">
            <span className="text-[10px] font-extrabold uppercase text-emerald-700 dark:text-emerald-400 block">
              {t("Paid Out", "تم تحويله")}
            </span>
            <span className="mt-1 text-base font-black text-emerald-700 dark:text-emerald-300 block font-mono">
              {formatSar(selectedProperty.paidOut)} SAR
            </span>
          </div>
          <div className="rounded-2xl bg-violet-50 dark:bg-purple-950/40 p-3.5">
            <span className="text-[10px] font-extrabold uppercase text-[#4F2396] dark:text-purple-300 block">
              {t("Remaining Due", "المستحق المتبقي")}
            </span>
            <span className="mt-1 text-base font-black text-[#4F2396] dark:text-purple-300 block font-mono">
              {formatSar(selectedProperty.dueAmount)} SAR
            </span>
          </div>
        </div>

        {/* Property Bookings Ledger */}
        <div className="space-y-2">
          <h3 className="text-xs font-black uppercase text-slate-400 dark:text-slate-500">
            {t("Property Booking Transactions", "سجل معاملات هذا العقار")} ({selectedProperty.bookings.length})
          </h3>
          {selectedProperty.bookings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 py-8 text-center text-xs font-bold text-slate-400 dark:text-slate-500">
              {t("No confirmed bookings for this property yet.", "لا توجد حجوزات مؤكدة لهذا العقار حتى الآن.")}
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
              {selectedProperty.bookings.map((tx) => (
                <div
                  key={tx.bookingId}
                  className="p-3.5 bg-white dark:bg-[#12101a] hover:bg-slate-50/80 dark:hover:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-slate-900 dark:text-white">{tx.bookingReference}</span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          tx.payoutStatus === "disbursed"
                            ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"
                            : tx.payoutStatus === "on_hold"
                            ? "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300"
                            : "bg-violet-100 dark:bg-purple-950/60 text-violet-800 dark:text-purple-300"
                        }`}
                      >
                        {tx.payoutStatus === "disbursed" ? (
                          <CheckCircle2 size={10} />
                        ) : tx.payoutStatus === "on_hold" ? (
                          <PauseCircle size={10} />
                        ) : (
                          <Clock size={10} />
                        )}
                        {tx.payoutStatus === "disbursed"
                          ? t("Transferred", "محول")
                          : tx.payoutStatus === "on_hold"
                          ? t("On Hold", "معلق")
                          : t("Pending", "قيد المعالجة")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      <Calendar size={11} />
                      <span>
                        {tx.checkIn} → {tx.checkOut} ({tx.nights} {t("nights", "ليالٍ")})
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 sm:gap-6 font-mono text-end">
                    <div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-sans">{t("Gross", "الإجمالي")}</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{formatSar(tx.grossAmount)} SAR</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-rose-500 dark:text-rose-400 block font-sans">{t("Service Fee", "العمولة")}</span>
                      <span className="font-bold text-rose-600 dark:text-rose-400">
                        -{formatSar(tx.serviceFeeAmount + tx.promoDiscountAmount)} SAR
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#4F2396] dark:text-purple-400 block font-sans">{t("Net Payout", "الصافي")}</span>
                      <span className="font-black text-[#4F2396] dark:text-purple-300">{formatSar(tx.netPayout)} SAR</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#12101a] p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
            {t("Earnings & Dues by Property", "تفاصيل الأرباح والمستحقات حسب العقار")}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {t(
              "Inspect individual revenue, service fee deductions, paid balance, and pending dues for each of your properties.",
              "استعرض إيرادات كل عقار على حدة، والعمولة المخصومة، والمبالغ المحولة، والمستحق المتبقي."
            )}
          </p>
        </div>

        {/* Category Filter Pills */}
        {categories.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-900/80 p-1 rounded-2xl border border-transparent dark:border-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => setCategoryFilter("all")}
              className={`rounded-xl px-3 py-1.5 transition cursor-pointer ${
                categoryFilter === "all"
                  ? "bg-white dark:bg-[#12101a] text-[#4F2396] dark:text-purple-300 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {t("All Categories", "كل الفئات")}
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id)}
                className={`rounded-xl px-3 py-1.5 transition cursor-pointer ${
                  categoryFilter === cat.id
                    ? "bg-white dark:bg-[#12101a] text-[#4F2396] dark:text-purple-300 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredProperties.map((prop) => (
          <div
            key={prop.propertyId}
            className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-900 hover:border-violet-200 dark:hover:border-purple-800 hover:shadow-sm transition p-4 flex flex-col justify-between gap-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="inline-flex items-center rounded-full bg-violet-100/80 dark:bg-purple-950/60 px-2 py-0.5 text-[10px] font-black text-[#4F2396] dark:text-purple-300">
                  {lang === "ar" ? prop.categoryName : prop.categoryName}
                </span>
                <h3 className="mt-1.5 text-sm font-black text-slate-900 dark:text-white truncate" title={prop.propertyTitle}>
                  {prop.propertyTitle}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {prop.city} · {prop.bookingsCount} {t("bookings", "حجوزات")}
                </p>
              </div>
              <span className="font-mono text-xs font-black text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 shrink-0">
                {formatSar(prop.basePrice)} {t("SAR/night", "ر.س/ليلة")}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs bg-white dark:bg-[#12101a] rounded-xl border border-slate-100 dark:border-slate-800 p-3">
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block">{t("Gross Revenue", "إجمالي الدخل")}</span>
                <span className="font-mono font-black text-slate-900 dark:text-white">{formatSar(prop.grossRevenue)} SAR</span>
              </div>
              <div>
                <span className="text-[10px] text-rose-500 dark:text-rose-400 font-bold block">{t("Service Fee", "عمولة المنصة")}</span>
                <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                  -{formatSar(prop.serviceFeeAmount + prop.promoDiscountAmount)} SAR
                </span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold block">{t("Paid Out", "تم تحويله")}</span>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{formatSar(prop.paidOut)} SAR</span>
              </div>
              <div>
                <span className="text-[10px] text-[#4F2396] dark:text-purple-400 font-bold block">{t("Remaining Due", "المستحق المتبقي")}</span>
                <span className="font-mono font-black text-[#4F2396] dark:text-purple-300">{formatSar(prop.dueAmount)} SAR</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSelectProperty(prop.propertyId)}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-white dark:bg-slate-900 border border-violet-200 dark:border-purple-800 hover:bg-[#4F2396] hover:text-white hover:border-[#4F2396] py-2 text-xs font-black text-[#4F2396] dark:text-purple-300 transition cursor-pointer"
            >
              <span>{t("Open Property Finance", "عرض حسابات هذا العقار")}</span>
              <ArrowRight size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
