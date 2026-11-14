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
        className="py-16 text-center text-xs font-bold text-on-surface-variant bg-surface-container-low rounded-2xl border border-surface-container-high"
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
        className="border border-surface-container-high rounded-2xl overflow-hidden bg-surface-container-lowest shadow-xs"
      >
        <div className="overflow-x-auto">
          <table className="min-w-[740px] w-full text-xs text-start">
            <thead className="bg-surface-container text-on-surface font-extrabold border-b border-surface-container-high">
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
            <tbody className="divide-y divide-surface-container font-medium text-on-surface">
              {invoices.map((inv) => (
                <tr
                  key={inv.id}
                  onClick={() => setSelectedInvoice(inv)}
                  className="hover:bg-surface-container-low/70 transition cursor-pointer"
                >
                  {/* Invoice # / Date */}
                  <td className="p-3.5">
                    <span className="font-mono font-bold text-on-surface block">{inv.invoiceNumber}</span>
                    <span className="text-[11px] text-on-surface-variant block mt-0.5">{inv.issueDate}</span>
                  </td>

                  {/* Type */}
                  <td className="p-3.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        inv.type === "guest_stay"
                          ? "bg-violet-50 text-primary border border-violet-200"
                          : "bg-emerald-50 text-status-emerald border border-emerald-200"
                      }`}
                    >
                      {inv.type === "guest_stay"
                        ? t("Guest Stay", "إقامة ضيف")
                        : t("Host Commission", "عمولة مضيف")}
                    </span>
                  </td>

                  {/* Client / Booking */}
                  <td className="p-3.5">
                    <span className="font-bold text-on-surface block truncate max-w-[180px]">
                      {inv.clientName}
                    </span>
                    <span className="text-[11px] text-on-surface-variant font-mono block mt-0.5">
                      {t("Ref:", "المرجع:")} {inv.bookingReference} · {inv.propertyTitle}
                    </span>
                  </td>

                  {/* Taxable */}
                  <td className="p-3.5 text-end font-mono">
                    {currencyLabel} {inv.taxableAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>

                  {/* VAT */}
                  <td className="p-3.5 text-end font-mono text-status-emerald">
                    {currencyLabel} {inv.vatAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>

                  {/* Total */}
                  <td className="p-3.5 text-end font-mono font-black text-on-surface text-sm">
                    {currencyLabel} {inv.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>

                  {/* ZATCA Status */}
                  <td className="p-3.5 text-center">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-status-emerald border border-emerald-200">
                      <ShieldCheck size={12} />
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
                        className="inline-flex items-center gap-1.5 rounded-xl border border-surface-container-high bg-surface-container hover:bg-surface-container-high px-3 py-1.5 text-xs font-bold text-on-surface hover:text-primary transition shadow-xs cursor-pointer disabled:opacity-50"
                        title={t("Download PDF Tax Invoice Directly", "تنزيل الفاتورة الضريبية PDF مباشرة")}
                      >
                        {downloadingId === inv.id ? (
                          <>
                            <Loader2 size={13} className="text-primary animate-spin" />
                            <span>{t("Downloading...", "جارٍ التنزيل...")}</span>
                          </>
                        ) : (
                          <>
                            <Download size={13} className="text-primary" />
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
                        className="inline-flex items-center gap-1.5 rounded-xl border border-surface-container-high bg-surface-container hover:bg-surface-container-high px-3 py-1.5 text-xs font-bold text-on-surface transition cursor-pointer"
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
