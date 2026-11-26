"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
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
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    if (!invoice) {
      setQrDataUrl("");
      return;
    }
    let active = true;
    QRCode.toDataURL(invoice.qrPayload || invoice.invoiceNumber, { width: 128, margin: 1 })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch(() => {
        if (active) setQrDataUrl("");
      });
    return () => {
      active = false;
    };
  }, [invoice]);
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
      <div className="w-full max-w-2xl rounded-xl bg-white dark:bg-[#0E0D16] p-6 sm:p-8 shadow-xl border border-slate-200/90 dark:border-slate-800 space-y-6 max-h-[92vh] overflow-y-auto print:border-none print:shadow-none print:max-w-none print:p-4 text-slate-900 dark:text-slate-100">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800 print:hidden">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
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
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 transition cursor-pointer shadow-xs"
            >
              <Printer size={13} />
              <span>{t("Print / PDF", "طباعة / PDF")}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 transition cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {downloadingPdf ? (
                <>
                  <Loader2 size={13} className="text-[#4F2396] dark:text-purple-400 animate-spin" />
                  <span>{t("Downloading...", "جارٍ التنزيل...")}</span>
                </>
              ) : (
                <>
                  <Download size={13} className="text-[#4F2396] dark:text-purple-400" />
                  <span>{t("Download PDF", "تنزيل PDF")}</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleReportToZatca}
              disabled={reporting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#4F2396] hover:bg-[#3D1A78] px-3.5 py-1.5 text-xs font-semibold text-white transition cursor-pointer shadow-xs"
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
              className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              aria-label={t("Close", "إغلاق")}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Live ZATCA Clearance Banner */}
        {reportResult && (
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/80 dark:bg-emerald-950/40 p-4 space-y-2 text-xs text-emerald-800 dark:text-emerald-300 print:hidden animate-in fade-in">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold flex items-center gap-1.5">
                <CheckCircle2 size={16} />
                <span>
                  {t(
                    `ZATCA Phase 2 Clearance Confirmed (Status: ${reportResult.clearanceStatus})`,
                    `تم اعتماد الفاتورة عبر المرحلة الثانية (الحالة: ${reportResult.clearanceStatus})`
                  )}
                </span>
              </span>
              <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400">
                {new Date(reportResult.reportingTimestamp).toLocaleTimeString(lang === "ar" ? "ar-SA" : "en-US")}
              </span>
            </div>
            <div className="space-y-1 text-[11px] text-emerald-900 dark:text-emerald-200">
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
          <div className="flex items-start justify-between border-b border-slate-200/80 dark:border-slate-800 pb-5 gap-4">
            <div>
              <span className="text-2xl font-black text-[#4F2396] dark:text-purple-400 tracking-tight">
                Qaf<span className="text-[#FF9750]">Nest</span>.
              </span>
              <p className="text-xs text-slate-900 dark:text-slate-100 font-semibold mt-1">
                {QAFNEST_ZATCA_DEFAULTS.sellerNameAr}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {t("CR:", "سجل تجاري:")} {QAFNEST_ZATCA_DEFAULTS.crNumber} · {t("MoT License:", "ترخيص وزارة السياحة:")}{" "}
                {QAFNEST_ZATCA_DEFAULTS.licenseNumber}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                {t("VAT ID:", "الرقم الضريبي:")} {QAFNEST_ZATCA_DEFAULTS.vatNumber} · {t("Support:", "الدعم:")} 0576707709
              </p>
            </div>

            <div className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/60 text-center shrink-0">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrDataUrl}
                  alt={t("ZATCA Tax Invoice QR Code", "رمز الاستجابة السريعة لفاتورة زاتكا")}
                  className="w-16 h-16 rounded-lg bg-white p-0.5 object-contain"
                />
              ) : (
                <QrCode size={50} className="text-slate-900 dark:text-slate-100" />
              )}
              <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 mt-1 uppercase">
                {t("ZATCA Verified", "موثق ضريبياً")}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-50/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-xl">
              <span className="text-slate-500 dark:text-slate-400 font-medium block">{t("Invoice Number", "رقم الفاتورة")}</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 mt-0.5 block">{invoice.invoiceNumber}</span>
            </div>
            <div className="p-3 bg-slate-50/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-xl">
              <span className="text-slate-500 dark:text-slate-400 font-medium block">{t("Issue Date", "تاريخ الإصدار")}</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5 block">{invoice.issueDate}</span>
            </div>
            <div className="p-3 bg-slate-50/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-xl col-span-2 sm:col-span-1">
              <span className="text-slate-500 dark:text-slate-400 font-medium block">{t("Booking Reference", "مرجع الحجز")}</span>
              <span className="font-mono font-semibold text-[#4F2396] dark:text-purple-400 mt-0.5 block">{invoice.bookingReference}</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 bg-slate-50/75 dark:bg-slate-900/60 space-y-1.5 text-xs">
            <div className="flex justify-between font-semibold gap-2">
              <span className="text-slate-500 dark:text-slate-400">{t("Client / Billed To:", "العميل / المفوتر إليه:")}</span>
              <span className="text-slate-900 dark:text-slate-100 text-end">
                {invoice.clientName} ({invoice.clientRole.toUpperCase()})
              </span>
            </div>
            <div className="flex justify-between font-medium gap-2">
              <span className="text-slate-500 dark:text-slate-400">{t("Property:", "العقار:")}</span>
              <span className="text-slate-900 dark:text-slate-100 text-end">{invoice.propertyTitle}</span>
            </div>
            <div className="flex justify-between font-medium gap-2">
              <span className="text-slate-500 dark:text-slate-400">{t("Payment Method:", "طريقة الدفع:")}</span>
              <span className="text-slate-900 dark:text-slate-100 text-end">{invoice.paymentMethod}</span>
            </div>
          </div>

          <div className="border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-[#0E0D16]">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-50/90 dark:bg-slate-900/90 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="p-3 text-start">{t("Description", "الوصف")}</th>
                  <th className="p-3 text-end">{t("Rate (Excl. VAT)", "المبلغ (قبل الضريبة)")}</th>
                  <th className="p-3 text-end">{t("VAT (15%)", "الضريبة (15%)")}</th>
                  <th className="p-3 text-end">{t(`Total (${currencyLabel})`, `الإجمالي (${currencyLabel})`)}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-900 dark:text-slate-100">
                <tr>
                  <td className="p-3">
                    <span className="font-semibold block">
                      {isGuestStay
                        ? t("Licensed Vacation Rental Accommodation Stay", "إقامة سياحية مرخصة في وحدة مفروشة")
                        : t("Platform Facilitation & Marketing Service Fee", "رسوم الوساطة والتسويق عبر المنصة")}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">{invoice.propertyTitle}</span>
                  </td>
                  <td className="p-3 text-end font-mono">
                    {invoice.taxableAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-end font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                    {invoice.vatAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-end font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {invoice.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="rounded-xl bg-[#4F2396] p-4 text-white flex items-center justify-between shadow-xs">
            <span className="text-xs font-semibold">
              {t("Total Paid with 15% VAT Included", "الإجمالي المدفوع شاملاً ضريبة القيمة المضافة 15%")}
            </span>
            <span className="text-lg font-bold font-mono">
              {currencyLabel} {invoice.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
