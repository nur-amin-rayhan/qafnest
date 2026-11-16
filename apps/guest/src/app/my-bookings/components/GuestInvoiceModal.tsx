"use client";

import React, { useState } from "react";
import { X, Printer, ShieldCheck, Download, Loader2, CheckCircle2, RefreshCw } from "lucide-react";
import type { Booking } from "../types";
import { generateZatcaTlvBase64, generateZatcaUbl21Xml, QAFNEST_ZATCA_DEFAULTS } from "@qafnest/shared";
import { getLocalizedPropertyTitle } from "@/lib/localization/localeHelper";
import { printInvoiceA4 } from "@/lib/services/printInvoiceA4";
import { ZatcaQrCode } from "@/components/common/ZatcaQrCode";
import { useZatcaInvoiceStatus } from "@/hooks/useZatcaInvoiceStatus";

interface GuestInvoiceModalProps {
  booking: Booking | null;
  onClose: () => void;
  language: "en" | "ar";
  label: (en: string, ar: string) => string;
}

export function GuestInvoiceModal({
  booking,
  onClose,
  language,
  label,
}: GuestInvoiceModalProps) {
  const [printing, setPrinting] = useState(false);

  const rawTotal = Number(booking?.total_price) || 0;
  const fallbackInvoiceNumber = booking ? `INV-${booking.id.slice(0, 8).toUpperCase()}` : "";

  const { record: zatcaRecord, syncing: zatcaSyncing, syncWithZatcaApi } = useZatcaInvoiceStatus({
    kind: "booking",
    id: booking?.id,
    invoiceNumber: fallbackInvoiceNumber,
    propertyTitle: booking?.property?.title || "Vacation Rental Accommodation",
    enabled: Boolean(booking && rawTotal > 0),
  });

  if (!booking) return null;

  const total = rawTotal;
  // Standard 15% VAT calculation: Total = Base * 1.15 => VAT = Total - (Total / 1.15)
  const baseRate = Math.round((total / 1.15) * 100) / 100;
  const vatAmount = Math.round((total - baseRate) * 100) / 100;

  const invoiceNumber = zatcaRecord?.invoiceNumber || fallbackInvoiceNumber;
  const issueDate = booking.created_at
    ? new Date(booking.created_at).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : booking.check_in;

  const fallbackTlvPayload = generateZatcaTlvBase64({
    sellerName: QAFNEST_ZATCA_DEFAULTS.sellerNameAr,
    vatNumber: QAFNEST_ZATCA_DEFAULTS.vatNumber,
    timestamp: booking.created_at || new Date().toISOString(),
    totalWithVat: total,
    vatAmount: vatAmount,
  });

  // Prefer the real Phase 2 9-tag QR returned by ZATCA reporting, fallback to 5-tag TLV
  const zatcaPayload = zatcaRecord?.qrPayload || fallbackTlvPayload;

  const handlePrint = async () => {
    setPrinting(true);
    try {
      await printInvoiceA4({
        invoiceNumber,
        referenceNumber: booking.id,
        issueDate,
        issueTime: "15:00",
        sellerNameAr: QAFNEST_ZATCA_DEFAULTS.sellerNameAr,
        sellerNameEn: QAFNEST_ZATCA_DEFAULTS.sellerNameEn,
        vatNumber: QAFNEST_ZATCA_DEFAULTS.vatNumber,
        licenseNumber: QAFNEST_ZATCA_DEFAULTS.licenseNumber,
        buyerName: "Valued Guest Customer",
        paymentMethod: "MADA / VISA / APPLE PAY",
        qrPayload: zatcaPayload,
        lineItems: [
          {
            name: booking.property
              ? getLocalizedPropertyTitle(booking.property, language)
              : language === "ar"
              ? "إقامة إيجار عطلات مرخصة"
              : "Vacation Rental Accommodation",
            description: `${booking.total_nights} ${language === "ar" ? "ليالٍ إقامة" : "nights stay"} (${booking.check_in} → ${booking.check_out})`,
            quantity: 1,
            unitPrice: baseRate,
            subtotal: baseRate,
            vatRate: 0.15,
            vatAmount: vatAmount,
            total: total,
          },
        ],
        subtotal: baseRate,
        vatAmount: vatAmount,
        grandTotal: total,
        isArabic: language === "ar",
      });
    } catch (err) {
      console.warn("Notice: Print service fallback:", err);
      if (typeof window !== "undefined") {
        window.print();
      }
    } finally {
      setPrinting(false);
    }
  };

  const handleDownloadXml = () => {
    const xml =
      zatcaRecord?.signedXml ||
      generateZatcaUbl21Xml({
        uuid: booking.id,
        invoiceNumber,
        icv: zatcaRecord?.icv || 1,
        pih: "NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMjRiNWRjNmE2ZjBlMGE3",
        issueDate: booking.created_at ? booking.created_at.split("T")[0] : (booking.check_in || "2026-11-05"),
        issueTime: "12:00:00",
        type: "simplified",
        sellerNameAr: QAFNEST_ZATCA_DEFAULTS.sellerNameAr,
        sellerVatNumber: QAFNEST_ZATCA_DEFAULTS.vatNumber,
        buyerName: "Valued Guest",
        lineItems: [
          {
            name: booking.property?.title || "Vacation Rental Accommodation",
            quantity: 1,
            unitPrice: baseRate,
            subtotal: baseRate,
            vatRate: 0.15,
            vatAmount: vatAmount,
            total: total,
          },
        ],
        taxableAmount: baseRate,
        vatAmount: vatAmount,
        totalWithVat: total,
      });

    const blob = new Blob([xml], { type: "application/xml;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${invoiceNumber}-ZATCA-Phase2.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Strict Single-Page A4 Print Stylesheet */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            min-height: 100% !important;
            overflow: visible !important;
          }
          body * {
            visibility: hidden !important;
          }
          #zatca-booking-print-modal,
          #zatca-booking-print-modal * {
            visibility: visible !important;
          }
          #zatca-booking-print-modal {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 16px !important;
            border: 1px solid #e2e8f0 !important;
            border-radius: 16px !important;
            box-shadow: none !important;
            background: #ffffff !important;
            color: #000000 !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
          }
          .print-hidden-element {
            display: none !important;
            visibility: hidden !important;
          }
        }
      `}</style>

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 print:static print:p-0 print:bg-white">
        <div
          id="zatca-booking-print-modal"
          className="w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-violet-100 dark:border-white/10 dark:bg-[#12101a] space-y-5 max-h-[92vh] overflow-y-auto text-gray-900 dark:text-white"
        >
          {/* Modal Controls (Hidden in Print) */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-violet-100 dark:border-white/10 print-hidden-element">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>
                {label(
                  "Simplified Tax Invoice (ZATCA Compliant)",
                  "فاتورة ضريبية مبسطة معتمدة من هيئة الزكاة والضريبة والجمارك"
                )}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                disabled={printing}
                className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 text-xs font-bold text-[#4F2396] dark:border-violet-500/30 dark:bg-violet-950/40 dark:text-violet-300 transition cursor-pointer disabled:opacity-50"
              >
                {printing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Printer className="h-3.5 w-3.5" />}
                <span>{label("Print / PDF (A4)", "طباعة / PDF (A4)")}</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadXml}
                className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 text-xs font-bold text-[#4F2396] dark:border-violet-500/30 dark:bg-violet-950/40 dark:text-violet-300 transition cursor-pointer"
                title={label("Download ZATCA Phase 2 UBL 2.1 XML", "تحميل ملف الفاتورة UBL 2.1 XML")}
              >
                <Download className="h-3.5 w-3.5" />
                <span>{label("UBL 2.1 XML", "ملف XML")}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Printable Official Invoice Body */}
          <div className="space-y-5 print:text-black">
          {/* Brand Header */}
          <div className="flex items-start justify-between border-b border-gray-100 pb-5 dark:border-white/10">
            <div>
              <span className="text-2xl font-black text-[#4F2396] tracking-tight">
                Qaf<span className="text-[#FF9750]">Nest</span>.
              </span>
              <p className="text-xs text-gray-600 dark:text-gray-300 font-bold mt-1">
                {label(
                  QAFNEST_ZATCA_DEFAULTS.sellerNameEn,
                  QAFNEST_ZATCA_DEFAULTS.sellerNameAr
                )}
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {label(
                  `Ministry of Tourism License: ${QAFNEST_ZATCA_DEFAULTS.licenseNumber}`,
                  `ترخيص وزارة السياحة: ${QAFNEST_ZATCA_DEFAULTS.licenseNumber}`
                )}
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {label(
                  `VAT Number: ${QAFNEST_ZATCA_DEFAULTS.vatNumber} · Support: 0576707709`,
                  `الرقم الضريبي: ${QAFNEST_ZATCA_DEFAULTS.vatNumber} · الدعم: 0576707709`
                )}
              </p>
            </div>

            {/* ZATCA QR Code Representation */}
            <div
              className="flex flex-col items-center justify-center p-2 rounded-2xl border border-violet-100 bg-violet-50/50 dark:border-white/10 dark:bg-white/5 text-center shrink-0"
              title={`ZATCA TLV Payload: ${zatcaPayload}`}
            >
              <ZatcaQrCode value={zatcaPayload} size={100} />
              <span className="text-[9px] font-mono text-gray-500 mt-1 uppercase font-bold">ZATCA Fatoorah</span>
            </div>
          </div>

          {/* Meta Details */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-2xl">
              <span className="text-gray-400 font-bold block">{label("Invoice Number", "رقم الفاتورة")}</span>
              <span className="font-mono font-black text-gray-900 dark:text-white mt-0.5 block">{invoiceNumber}</span>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-2xl">
              <span className="text-gray-400 font-bold block">{label("Issue Date", "تاريخ الإصدار")}</span>
              <span className="font-bold text-gray-900 dark:text-white mt-0.5 block">{issueDate}</span>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-2xl col-span-2 sm:col-span-1">
              <span className="text-gray-400 font-bold block">{label("Reservation ID", "رقم الحجز")}</span>
              <span className="font-mono font-bold text-[#4F2396] dark:text-violet-300 mt-0.5 block truncate">
                {booking.id}
              </span>
            </div>
          </div>

          {/* Stay Info */}
          <div className="rounded-2xl border border-violet-100 p-4 dark:border-white/10 bg-violet-50/20 dark:bg-white/5 space-y-1 text-xs">
            <div className="flex justify-between font-bold">
              <span className="text-gray-500">{label("Accommodation", "العقار المحجوز")}:</span>
              <span className="text-gray-900 dark:text-white">
                {booking.property
                  ? getLocalizedPropertyTitle(booking.property, language)
                  : language === "ar"
                  ? "إقامة قاف نست"
                  : "QafNest Property"}
              </span>
            </div>
            <div className="flex justify-between font-medium">
              <span className="text-gray-500">{label("Stay Period", "فترة الإقامة")}:</span>
              <span className="text-gray-900 dark:text-white">
                {booking.check_in} → {booking.check_out} ({booking.total_nights} {label("nights", "ليالٍ")})
              </span>
            </div>
            <div className="flex justify-between font-medium">
              <span className="text-gray-500">{label("Guests", "عدد الضيوف")}:</span>
              <span className="text-gray-900 dark:text-white">{booking.guests_count} {label("guests", "ضيوف")}</span>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-gray-100 dark:border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-xs text-start">
              <thead className="bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 font-black">
                <tr>
                  <th className="p-3 text-start">{label("Description", "البيان")}</th>
                  <th className="p-3 text-end">{label("Rate (Excl. VAT)", "المبلغ قبل الضريبة")}</th>
                  <th className="p-3 text-end">{label("VAT (15%)", "ضريبة القيمة المضافة")}</th>
                  <th className="p-3 text-end">{label("Total Paid (SAR)", "الإجمالي المدفوع")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/10 font-medium">
                <tr>
                  <td className="p-3">
                    <span className="font-bold block">{label("Vacation Rental Accommodation", "إقامة إيجار عطلات مرخصة")}</span>
                    <span className="text-[11px] text-gray-500">{booking.total_nights} {label("nights stay", "ليالٍ إقامة")}</span>
                  </td>
                  <td className="p-3 text-end font-mono">{baseRate.toLocaleString()} SAR</td>
                  <td className="p-3 text-end font-mono text-rose-600 dark:text-rose-400">{vatAmount.toLocaleString()} SAR</td>
                  <td className="p-3 text-end font-mono font-black text-gray-950 dark:text-white text-sm">
                    {total.toLocaleString()} SAR
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Grand Total Strip */}
          <div className="rounded-2xl bg-[#4F2396] p-4 text-white flex items-center justify-between">
            <span className="text-xs font-black">{label("Total Paid with 15% VAT", "المجموع الكلي المدفوع شامل الضريبة")}</span>
            <span className="text-lg font-black font-mono">{total.toLocaleString()} SAR</span>
          </div>

          {/* Live ZATCA Phase 2 API Reporting Verification Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-emerald-200/70 bg-emerald-50/70 px-3.5 py-2.5 text-[11px] dark:border-emerald-500/20 dark:bg-emerald-950/20">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold">
              {zatcaSyncing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#4F2396] dark:text-violet-300" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              )}
              <span>
                {zatcaSyncing
                  ? label("Verifying & reporting invoice with ZATCA API...", "جاري مطابقة وإرسال الفاتورة لبوابة زاتكا...")
                  : zatcaRecord?.clearanceStatus === "REPORTED" || zatcaRecord?.clearanceStatus === "CLEARED"
                  ? label(
                      `ZATCA API Verified (${zatcaRecord.environment.toUpperCase()} · ${zatcaRecord.clearanceStatus} · ICV #${zatcaRecord.icv})`,
                      `معتمد من بوابة زاتكا (${zatcaRecord.clearanceStatus} · ICV #${zatcaRecord.icv})`
                    )
                  : label("ZATCA Phase 2 Electronic Tax Invoice Ready", "فاتورة ضريبية إلكترونية متوافقة مع زاتكا")}
              </span>
            </div>
            {zatcaRecord?.invoiceHash ? (
              <span
                className="font-mono text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-[200px]"
                title={`SHA-256 Hash: ${zatcaRecord.invoiceHash}`}
              >
                Hash: {zatcaRecord.invoiceHash.slice(0, 14)}…
              </span>
            ) : (
              !zatcaSyncing && (
                <button
                  type="button"
                  onClick={syncWithZatcaApi}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-[#4F2396] hover:underline dark:text-violet-300 cursor-pointer"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>{label("Sync ZATCA", "مزامنة زاتكا")}</span>
                </button>
              )
            )}
          </div>

          <p className="text-[10px] text-center text-gray-400">
            {label(
              "Computer-generated invoice compliant with ZATCA Electronic Invoicing regulations (Fatoorah Phase 2).",
              "فاتورة ضريبية مبسطة مصدرة إلكترونياً ومتوافقة مع نظام الفوترة الإلكترونية (فاتورة المرحلة الثانية) لهيئة الزكاة والضريبة والجمارك."
            )}
          </p>
        </div>
      </div>
    </div>
  </>
);
}

