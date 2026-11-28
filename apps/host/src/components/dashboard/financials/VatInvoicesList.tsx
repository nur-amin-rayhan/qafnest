"use client";

import React, { useState } from "react";
import { FileText, Eye } from "lucide-react";
import type { HostVatInvoice } from "@/lib/services/hostFinancialsService";
import { VatInvoiceModal } from "./VatInvoiceModal";

interface VatInvoicesListProps {
  invoices?: HostVatInvoice[];
  lang: "ar" | "en";
  t: (en: string, ar: string) => string;
}

const DEFAULT_INVOICES: HostVatInvoice[] = [];

export function VatInvoicesList({ invoices = DEFAULT_INVOICES, lang, t }: VatInvoicesListProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<HostVatInvoice | null>(null);

  return (
    <>
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#12101a] p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">
            {t(
              "Tax & Commission Invoices (ZATCA Compliant)",
              "الفواتير الضريبية (متوافقة مع هيئة الزكاة والضريبة والجمارك)"
            )}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {t(
              "Official VAT invoices for platform service fees, ready for your accounting records and tax deduction.",
              "فواتير ضريبية رسمية لرسوم عمولة المنصة، معتمدة ومجهزة لقيودك المحاسبية والإقرارات الضريبية."
            )}
          </p>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {invoices.length === 0 ? (
            <div className="py-10 text-center text-xs font-bold text-slate-400 dark:text-slate-500">
              {t("No tax invoices generated yet.", "لا توجد فواتير ضريبية مصدرة حتى الآن.")}
            </div>
          ) : invoices.map((inv) => (
            <div
              key={inv.id}
              onClick={() => setSelectedInvoice(inv)}
              className="py-4 flex items-center justify-between hover:bg-slate-50/70 dark:hover:bg-slate-900/60 p-3 rounded-2xl transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-50 dark:bg-purple-950/60 text-[#4F2396] dark:text-purple-300">
                  <FileText size={18} />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white font-mono">
                    {inv.id}
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    {inv.date} · {inv.propertyTitle}
                  </p>
                  <span className="text-[11px] font-mono text-[#4F2396] dark:text-purple-300">
                    {t("Booking", "الحجز")}: {inv.bookingRef}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white font-mono">
                  {inv.total} {t("SAR", "ر.س")}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedInvoice(inv);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 transition cursor-pointer"
                >
                  <Eye size={13} />
                  <span>{t("View / PDF", "معاينة / PDF")}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <VatInvoiceModal
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        lang={lang}
        t={t}
      />
    </>
  );
}
