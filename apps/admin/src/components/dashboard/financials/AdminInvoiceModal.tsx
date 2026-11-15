"use client";

import React, { useState } from "react";
import { X, Printer, ShieldCheck, QrCode, Download, Send, CheckCircle2, Loader2 } from "lucide-react";
import type { AdminTaxInvoiceRecord } from "@/lib/services/adminInvoicesService";
import { downloadInvoicePdf } from "@/lib/services/downloadInvoicePdf";
import { QAFNEST_ZATCA_DEFAULTS } from "@qafnest/shared";
import { useAdminAuth } from "@/context/AdminAuthContext";

import { adminPath } from "@/lib/adminUrl";
interface AdminInvoiceModalProps {
  invoice: AdminTaxInvoiceRecord | null;
  onClose: () => void;
}

export function AdminInvoiceModal({ invoice, onClose }: AdminInvoiceModalProps) {
  const { t, dir, lang } = useAdminAuth();
  const [reporting, setReporting] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [reportResult, setReportResult] = useState<{
    clearanceStatus: string;
    invoiceHash: string;
    reportingTimestamp: string;
    validationResults: { infoMessages: Array<{ code: string; message: string }> };
  } | null>(null);

  if (!invoice) return null;

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      await downloadInvoicePdf(invoice);
    } catch (err) {
      console.error("Direct PDF generation failed:", err);
      window.open(adminPath(`/api/admin/zatca?action=download_pdf&invoiceId=${invoice.id}`), "_blank");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleReportToZatca = async () => {
    setReporting(true);
    try {
      const res = await fetch(adminPath("/api/admin/zatca"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "report", invoiceId: invoice.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setReportResult(data);
      }
    } catch {
      // Ignore network errors in local dev
    } finally {
      setReporting(false);
    }
  };

  const isGuestStay = invoice.type === "guest_stay";
  const currencyLabel = t("SAR", "ر.س");

  return (
    <div
      dir={dir}
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 print:p-0 print:bg-white"
    >
      <div className="w-full max-w-2xl rounded-3xl bg-surface-container-lowest p-6 sm:p-8 shadow-2xl border border-surface-container-high space-y-6 max-h-[92vh] overflow-y-auto print:border-none print:shadow-none print:max-w-none print:p-4 text-on-surface">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-container-high print:hidden">
          <div className="flex items-center gap-2 text-xs font-bold text-on-surface-variant">
            <ShieldCheck size={16} className="text-status-emerald shrink-0" />
            <span>
              {t(
                "ZATCA Simplified Tax Invoice (Fatoorah Phase 2)",
                "فاتورة ضريبية مبسطة متوافقة مع الزكاة والدخل (المرحلة الثانية)"
              )}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl border border-surface-container-high bg-surface-container hover:bg-surface-container-high px-3 py-1.5 text-xs font-bold text-on-surface transition cursor-pointer"
            >
              <Printer size={13} />
              <span>{t("Print / PDF", "طباعة / PDF")}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="inline-flex items-center gap-1.5 rounded-xl border border-surface-container-high bg-surface-container hover:bg-surface-container-high px-3 py-1.5 text-xs font-bold text-on-surface hover:text-primary transition cursor-pointer disabled:opacity-50"
            >
              {downloadingPdf ? (
                <>
                  <Loader2 size={13} className="text-primary animate-spin" />
                  <span>{t("Downloading...", "جارٍ التنزيل...")}</span>
                </>
              ) : (
                <>
                  <Download size={13} className="text-primary" />
                  <span>{t("Download PDF", "تنزيل PDF")}</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleReportToZatca}
              disabled={reporting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary hover:opacity-90 px-3 py-1.5 text-xs font-bold text-on-primary transition cursor-pointer"
            >
              <Send size={13} />
              <span>
                {reporting
                  ? t("Reporting...", "جارٍ الإبلاغ...")
                  : t("Report to ZATCA", "إبلاغ لهيئة الزكاة")}
              </span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-1.5 text-outline hover:bg-surface-container cursor-pointer"
              aria-label={t("Close", "إغلاق")}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Live ZATCA Clearance Banner */}
        {reportResult && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 space-y-2 text-xs text-status-emerald print:hidden animate-in fade-in">
            <div className="flex items-center justify-between gap-2">
              <span className="font-extrabold flex items-center gap-1.5">
                <CheckCircle2 size={16} />
                <span>
                  {t(
                    `ZATCA Phase 2 Clearance Confirmed (Status: ${reportResult.clearanceStatus})`,
                    `تم اعتماد الفاتورة عبر المرحلة الثانية (الحالة: ${reportResult.clearanceStatus})`
                  )}
                </span>
              </span>
              <span className="text-[10px] font-mono text-emerald-800">
                {new Date(reportResult.reportingTimestamp).toLocaleTimeString(lang === "ar" ? "ar-SA" : "en-US")}
              </span>
            </div>
            <div className="space-y-1 text-[11px] text-emerald-900">
              <p className="font-mono truncate" dir="ltr">
                <strong>SHA-256 Hash:</strong> {reportResult.invoiceHash}
              </p>
              {reportResult.validationResults.infoMessages.map((m) => (
                <p key={m.code}>
                  ✓ [{m.code}]: {m.message}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Invoice Body */}
        <div className="space-y-6">
          <div className="flex items-start justify-between border-b border-surface-container pb-5 gap-4">
            <div>
              <span className="text-2xl font-black text-primary tracking-tight">
                Qaf<span className="text-[#FF9750]">Nest</span>.
              </span>
              <p className="text-xs text-on-surface font-bold mt-1">
                {QAFNEST_ZATCA_DEFAULTS.sellerNameAr}
              </p>
              <p className="text-[11px] text-on-surface-variant">
                {t("CR:", "سجل تجاري:")} {QAFNEST_ZATCA_DEFAULTS.crNumber} · {t("MoT License:", "ترخيص وزارة السياحة:")}{" "}
                {QAFNEST_ZATCA_DEFAULTS.licenseNumber}
              </p>
              <p className="text-[11px] text-on-surface-variant font-mono">
                {t("VAT ID:", "الرقم الضريبي:")} {QAFNEST_ZATCA_DEFAULTS.vatNumber} · {t("Support:", "الدعم:")} 0576707709
              </p>
            </div>

            <div className="flex flex-col items-center justify-center p-2 rounded-2xl border border-surface-container-high bg-surface-container-low text-center shrink-0">
              <QrCode size={50} className="text-on-surface" />
              <span className="text-[9px] font-mono text-outline mt-1 uppercase">
                {t("ZATCA Verified", "موثق ضريبياً")}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-surface-container-low rounded-2xl">
              <span className="text-outline font-bold block">{t("Invoice Number", "رقم الفاتورة")}</span>
              <span className="font-mono font-black text-on-surface mt-0.5 block">{invoice.invoiceNumber}</span>
            </div>
            <div className="p-3 bg-surface-container-low rounded-2xl">
              <span className="text-outline font-bold block">{t("Issue Date", "تاريخ الإصدار")}</span>
              <span className="font-bold text-on-surface mt-0.5 block">{invoice.issueDate}</span>
            </div>
            <div className="p-3 bg-surface-container-low rounded-2xl col-span-2 sm:col-span-1">
              <span className="text-outline font-bold block">{t("Booking Reference", "مرجع الحجز")}</span>
              <span className="font-mono font-bold text-primary mt-0.5 block">{invoice.bookingReference}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-surface-container-high p-4 bg-surface-container-low space-y-1.5 text-xs">
            <div className="flex justify-between font-bold gap-2">
              <span className="text-outline">{t("Client / Billed To:", "العميل / المفوتر إليه:")}</span>
              <span className="text-on-surface text-end">
                {invoice.clientName} ({invoice.clientRole.toUpperCase()})
              </span>
            </div>
            <div className="flex justify-between font-medium gap-2">
              <span className="text-outline">{t("Property:", "العقار:")}</span>
              <span className="text-on-surface text-end">{invoice.propertyTitle}</span>
            </div>
            <div className="flex justify-between font-medium gap-2">
              <span className="text-outline">{t("Payment Method:", "طريقة الدفع:")}</span>
              <span className="text-on-surface text-end">{invoice.paymentMethod}</span>
            </div>
          </div>

          <div className="border border-surface-container-high rounded-2xl overflow-hidden">
            <table className="w-full text-xs text-start">
              <thead className="bg-surface-container text-on-surface font-extrabold">
                <tr>
                  <th className="p-3 text-start">{t("Description", "الوصف")}</th>
                  <th className="p-3 text-end">{t("Rate (Excl. VAT)", "المبلغ (قبل الضريبة)")}</th>
                  <th className="p-3 text-end">{t("VAT (15%)", "الضريبة (15%)")}</th>
                  <th className="p-3 text-end">{t(`Total (${currencyLabel})`, `الإجمالي (${currencyLabel})`)}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container font-medium">
                <tr>
                  <td className="p-3">
                    <span className="font-bold block">
                      {isGuestStay
                        ? t("Licensed Vacation Rental Accommodation Stay", "إقامة سياحية مرخصة في وحدة مفروشة")
                        : t("Platform Facilitation & Marketing Service Fee", "رسوم الوساطة والتسويق عبر المنصة")}
                    </span>
                    <span className="text-[11px] text-on-surface-variant">{invoice.propertyTitle}</span>
                  </td>
                  <td className="p-3 text-end font-mono">
                    {invoice.taxableAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-end font-mono text-status-emerald">
                    {invoice.vatAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-end font-mono font-black text-on-surface text-sm">
                    {invoice.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="rounded-2xl bg-primary p-4 text-on-primary flex items-center justify-between">
            <span className="text-xs font-black">
              {t("Total Paid with 15% VAT Included", "الإجمالي المدفوع شاملاً ضريبة القيمة المضافة 15%")}
            </span>
            <span className="text-lg font-black font-mono">
              {currencyLabel} {invoice.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
