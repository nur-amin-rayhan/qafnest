"use client";

import React, { useState } from "react";
import { Eye, ShieldCheck, Download, Loader2 } from "lucide-react";
import type { AdminTaxInvoiceRecord } from "@/lib/services/adminInvoicesService";
import { downloadInvoicePdf } from "@/lib/services/downloadInvoicePdf";
import { AdminInvoiceModal } from "./AdminInvoiceModal";
import { useAdminAuth } from "@/context/AdminAuthContext";

import { adminPath } from "@/lib/adminUrl";
interface InvoicesLedgerTableProps {
  invoices: AdminTaxInvoiceRecord[];
}

export function InvoicesLedgerTable({ invoices }: InvoicesLedgerTableProps) {
  const { t, dir } = useAdminAuth();
  const [selectedInvoice, setSelectedInvoice] = useState<AdminTaxInvoiceRecord | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDirectDownload = async (e: React.MouseEvent, inv: AdminTaxInvoiceRecord) => {
    e.stopPropagation();
    setDownloadingId(inv.id);
    try {
      await downloadInvoicePdf(inv);
    } catch (err) {
      console.error("Direct PDF generation failed, opening fallback window:", err);
      window.open(adminPath(`/api/admin/zatca?action=download_pdf&invoiceId=${inv.id}`), "_blank");
    } finally {
      setDownloadingId(null);
    }
  };

  if (invoices.length === 0) {
    return (
      <div
        dir={dir}
        className="py-16 text-center text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/90 dark:border-slate-800"
      >
        {t("No tax invoices matching the current filter criteria.", "لا توجد فواتير ضريبية مطابقة لمعايير البحث الحالية.")}
      </div>
    );
  }

  const currencyLabel = t("SAR", "ر.س");

  return (
    <>
      <div
        dir={dir}
        className="border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-[#0E0D16] shadow-xs"
      >
        <div className="overflow-x-auto">
          <table className="min-w-[740px] w-full text-xs sm:text-sm text-start">
            <thead className="bg-slate-50/90 dark:bg-slate-900/90 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200/80 dark:border-slate-800 text-xs">
              <tr>
                <th className="p-3.5 text-start">{t("Invoice # / Date", "رقم الفاتورة / التاريخ")}</th>
                <th className="p-3.5 text-start">{t("Type", "النوع")}</th>
                <th className="p-3.5 text-start">{t("Client / Booking", "العميل / الحجز")}</th>
                <th className="p-3.5 text-end">{t("Taxable Amount", "المبلغ الخاضع للضريبة")}</th>
                <th className="p-3.5 text-end">{t("15% VAT", "ضريبة القيمة المضافة 15%")}</th>
                <th className="p-3.5 text-end">{t("Total with VAT", "الإجمالي شامل الضريبة")}</th>
                <th className="p-3.5 text-center">{t("ZATCA Stamp", "حالة الزكاة والضريبة")}</th>
                <th className="p-3.5 text-end">{t("Action", "الإجراء")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-900 dark:text-slate-100">
              {invoices.map((inv) => (
                <tr
                  key={inv.id}
                  onClick={() => setSelectedInvoice(inv)}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition cursor-pointer"
                >
                  {/* Invoice # / Date */}
                  <td className="p-3.5">
                    <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 text-sm block">{inv.invoiceNumber}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">{inv.issueDate}</span>
                  </td>

                  {/* Type */}
                  <td className="p-3.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                        inv.type === "guest_stay"
                          ? "bg-purple-50 dark:bg-purple-950/60 text-[#4F2396] dark:text-purple-300 border-purple-200 dark:border-purple-800"
                          : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                      }`}
                    >
                      {inv.type === "guest_stay"
                        ? t("Guest Stay", "إقامة ضيف")
                        : t("Host Commission", "عمولة مضيف")}
                    </span>
                  </td>

                  {/* Client / Booking */}
                  <td className="p-3.5">
                    <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm block truncate max-w-[200px]">
                      {inv.clientName}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono block mt-0.5">
                      {t("Ref:", "المرجع:")} {inv.bookingReference} · {inv.propertyTitle}
                    </span>
                  </td>

                  {/* Taxable */}
                  <td className="p-3.5 text-end font-mono text-slate-900 dark:text-slate-100 text-sm">
                    {currencyLabel} {inv.taxableAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>

                  {/* VAT */}
                  <td className="p-3.5 text-end font-mono font-medium text-emerald-600 dark:text-emerald-400 text-sm">
                    {currencyLabel} {inv.vatAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>

                  {/* Total */}
                  <td className="p-3.5 text-end font-mono font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                    {currencyLabel} {inv.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>

                  {/* ZATCA Status */}
                  <td className="p-3.5 text-center">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <ShieldCheck size={13} />
                      <span className="capitalize">
                        {inv.zatcaStatus === "cleared"
                          ? t("Cleared", "معتمدة")
                          : inv.zatcaStatus === "reported"
                          ? t("Reported", "مبلّغة")
                          : inv.zatcaStatus}
                      </span>
                    </span>
                  </td>

                  {/* Action */}
                  <td className="p-3.5 text-end">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => handleDirectDownload(e, inv)}
                        disabled={downloadingId === inv.id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 transition shadow-xs cursor-pointer disabled:opacity-50"
                        title={t("Download PDF Tax Invoice Directly", "تنزيل الفاتورة الضريبية PDF مباشرة")}
                      >
                        {downloadingId === inv.id ? (
                          <>
                            <Loader2 size={13} className="text-[#4F2396] animate-spin" />
                            <span>{t("Downloading...", "جارٍ التنزيل...")}</span>
                          </>
                        ) : (
                          <>
                            <Download size={13} className="text-slate-500 dark:text-slate-400" />
                            <span>{t("Download", "تنزيل")}</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedInvoice(inv);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 transition cursor-pointer"
                      >
                        <Eye size={13} />
                        <span>{t("View", "عرض")}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AdminInvoiceModal
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
      />
    </>
  );
}
