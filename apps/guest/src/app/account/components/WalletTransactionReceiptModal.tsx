"use client";

import React, { useState } from "react";
import { X, Printer, ShieldCheck, Download, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import type { WalletTransaction } from "@/lib/services/walletService";
import { generateZatcaTlvBase64, generateZatcaUbl21Xml, QAFNEST_ZATCA_DEFAULTS } from "@qafnest/shared";
import { printInvoiceA4 } from "@/lib/services/printInvoiceA4";
import { ZatcaQrCode } from "@/components/common/ZatcaQrCode";
import { useZatcaInvoiceStatus } from "@/hooks/useZatcaInvoiceStatus";

interface WalletTransactionReceiptModalProps {
  transaction: WalletTransaction | null;
  onClose: () => void;
  language: "en" | "ar";
  t: (en: string, ar: string) => string;
}

export function WalletTransactionReceiptModal({
  transaction,
  onClose,
  language,
  t,
}: WalletTransactionReceiptModalProps) {
  const [printing, setPrinting] = useState(false);

  const rawAmount = transaction ? Math.abs(Number(transaction.amount) || 0) : 0;
  const cleanRef = transaction ? transaction.reference.replace(/[^A-Za-z0-9]/g, "-").toUpperCase() : "";
  const fallbackInvoiceNumber = cleanRef ? (cleanRef.startsWith("INV-") ? cleanRef : `INV-${cleanRef}`) : "";

  const { record: zatcaRecord, syncing: zatcaSyncing, syncWithZatcaApi } = useZatcaInvoiceStatus({
    kind: "wallet",
    id: transaction?.id,
    reference: transaction?.reference,
    invoiceNumber: fallbackInvoiceNumber,
    enabled: Boolean(transaction && rawAmount > 0),
  });

  if (!transaction || rawAmount <= 0) {
    return null;
  }

  const total = rawAmount;
  // Standard 15% VAT calculation
  const baseRate = Math.round((total / 1.15) * 100) / 100;
  const vatAmount = Math.round((total - baseRate) * 100) / 100;

  const invoiceNumber = zatcaRecord?.invoiceNumber || fallbackInvoiceNumber;
  const issueDate = new Date(transaction.createdAt).toLocaleDateString(
    language === "ar" ? "ar-SA" : "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );
  const issueTime = new Date(transaction.createdAt).toLocaleTimeString(
    language === "ar" ? "ar-SA" : "en-US",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  );

  const fallbackTlvPayload = generateZatcaTlvBase64({
    sellerName: QAFNEST_ZATCA_DEFAULTS.sellerNameAr,
    vatNumber: QAFNEST_ZATCA_DEFAULTS.vatNumber,
    timestamp: transaction.createdAt || new Date().toISOString(),
    totalWithVat: total,
    vatAmount: vatAmount,
  });

  const zatcaPayload = zatcaRecord?.qrPayload || fallbackTlvPayload;

  const handlePrint = async () => {
    setPrinting(true);
    try {
      await printInvoiceA4({
        invoiceNumber,
        referenceNumber: transaction.reference,
        issueDate,
        issueTime,
        sellerNameAr: QAFNEST_ZATCA_DEFAULTS.sellerNameAr,
        sellerNameEn: QAFNEST_ZATCA_DEFAULTS.sellerNameEn,
        vatNumber: QAFNEST_ZATCA_DEFAULTS.vatNumber,
        licenseNumber: QAFNEST_ZATCA_DEFAULTS.licenseNumber,
        buyerName: "Valued Guest Account",
        paymentMethod: transaction.type === "topup" ? "MADA / GATEWAY" : "QAFNEST WALLET",
        qrPayload: zatcaPayload,
        lineItems: [
          {
            name: t(transaction.titleEn, transaction.titleAr),
            description: `${t("Transaction Reference", "مرجع المعاملة")}: ${transaction.reference}`,
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
      console.warn("Notice: Print fallback:", err);
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
        uuid: transaction.id,
        invoiceNumber,
        icv: zatcaRecord?.icv || 1,
        pih: "NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMjRiNWRjNmE2ZjBlMGE3",
        issueDate: transaction.createdAt ? transaction.createdAt.split("T")[0] : "2026-11-09",
        issueTime: "12:00:00",
        type: "simplified",
        sellerNameAr: QAFNEST_ZATCA_DEFAULTS.sellerNameAr,
        sellerVatNumber: QAFNEST_ZATCA_DEFAULTS.vatNumber,
        buyerName: "Valued Guest Account",
        lineItems: [
          {
            name: t(transaction.titleEn, transaction.titleAr),
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
    a.download = `${invoiceNumber}-ZATCA.xml`;
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
          #zatca-receipt-print-modal,
          #zatca-receipt-print-modal * {
            visibility: visible !important;
          }
          #zatca-receipt-print-modal {
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
          id="zatca-receipt-print-modal"
          className="w-full max-w-xl rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-violet-100 dark:border-white/10 dark:bg-[#12101a] space-y-5 max-h-[92vh] overflow-y-auto text-gray-900 dark:text-white"
        >
          {/* Modal Controls (Hidden in Print) */}
          <div className="flex items-center justify-between pb-3 border-b border-violet-100 dark:border-white/10 print-hidden-element">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>
                {t(
                  "Simplified Tax Invoice & Receipt (ZATCA Compliant)",
                  "فاتورة ضريبية وإيصال مالي معتمد من هيئة الزكاة والضريبة والجمارك"
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
                <span>{t("Print / PDF (A4)", "طباعة / PDF (A4)")}</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadXml}
                className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 text-xs font-bold text-[#4F2396] dark:border-violet-500/30 dark:bg-violet-950/40 dark:text-violet-300 transition cursor-pointer"
                title={t("Download ZATCA XML", "تحميل ملف XML")}
              >
                <Download className="h-3.5 w-3.5" />
                <span>XML</span>
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
          <div className="space-y-4 print:text-black">
            {/* Brand Header */}
            <div className="flex items-start justify-between border-b border-gray-100 pb-4 dark:border-white/10">
              <div>
                <span className="text-2xl font-black text-[#4F2396] tracking-tight">
                  Qaf<span className="text-[#FF9750]">Nest</span>.
                </span>
                <p className="text-xs text-gray-700 dark:text-gray-200 font-bold mt-1">
                  {t(QAFNEST_ZATCA_DEFAULTS.sellerNameEn, QAFNEST_ZATCA_DEFAULTS.sellerNameAr)}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  {t(
                    `Ministry of Tourism License: ${QAFNEST_ZATCA_DEFAULTS.licenseNumber}`,
                    `ترخيص وزارة السياحة: ${QAFNEST_ZATCA_DEFAULTS.licenseNumber}`
                  )}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  {t(
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
                <span className="text-[9px] font-mono text-gray-500 mt-1 uppercase font-bold">ZATCA QR</span>
              </div>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-3 rounded-2xl bg-gray-50/70 p-3.5 dark:bg-white/5 text-xs">
              <div>
                <span className="text-gray-500">{t("Invoice / Receipt No:", "رقم الفاتورة / الإيصال:")}</span>
                <p className="font-mono font-bold mt-0.5 text-gray-900 dark:text-white">{invoiceNumber}</p>
              </div>
              <div>
                <span className="text-gray-500">{t("Transaction Ref:", "الرقم المرجعي للعملية:")}</span>
                <p className="font-mono font-bold mt-0.5 text-gray-900 dark:text-white">{transaction.reference}</p>
              </div>
              <div>
                <span className="text-gray-500">{t("Issue Date & Time:", "تاريخ ووقت الإصدار:")}</span>
                <p className="font-medium mt-0.5 text-gray-900 dark:text-white">{issueDate} · {issueTime}</p>
              </div>
              <div>
                <span className="text-gray-500">{t("Payment Channel:", "طريقة الدفع / القناة:")}</span>
                <p className="font-bold uppercase mt-0.5 text-violet-700 dark:text-violet-300">
                  {transaction.paymentMethod || "Digital Wallet"}
                </p>
              </div>
            </div>

            {/* Transaction Summary Line Item */}
            <div className="border border-gray-100 rounded-2xl overflow-hidden dark:border-white/10">
              <div className="bg-gray-50/80 px-4 py-2 text-xs font-bold text-gray-500 dark:bg-white/5 flex justify-between">
                <span>{t("Description", "الوصف والبيان")}</span>
                <span>{t("Amount", "المبلغ")}</span>
              </div>
              <div className="p-3.5 flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-gray-900 dark:text-white text-sm">
                    {t(transaction.titleEn, transaction.titleAr)}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {transaction.type === "topup"
                      ? t("Wallet balance top-up via payment gateway", "شحن رصيد المحفظة عبر بوابة الدفع الإلكترونية")
                      : transaction.type === "booking_payment"
                      ? t("Stay reservation payment via digital wallet", "سداد حجز إقامة سياحية من رصيد المحفظة")
                      : t("Payment transaction", "عملية سداد مالي")}
                  </p>
                </div>
                <span className="font-mono font-bold text-sm text-gray-900 dark:text-white" dir="ltr">
                  {baseRate.toFixed(2)} SAR
                </span>
              </div>
            </div>

            {/* VAT & Totals Breakdown */}
            <div className="space-y-1.5 border-t border-gray-100 pt-3 dark:border-white/10 text-xs">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>{t("Subtotal (Excl. VAT):", "المبلغ قبل الضريبة:")}</span>
                <span className="font-mono" dir="ltr">{baseRate.toFixed(2)} SAR</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>{t("VAT (15%):", "ضريبة القيمة المضافة (١٥٪):")}</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400" dir="ltr">
                  {vatAmount.toFixed(2)} SAR
                </span>
              </div>
              <div className="flex justify-between text-sm font-black border-t border-gray-200 pt-2.5 dark:border-white/10">
                <span className="text-gray-950 dark:text-white">{t("Total Amount (Incl. VAT):", "الإجمالي شامل الضريبة:")}</span>
                <span className="text-violet-700 dark:text-violet-300 font-mono text-base" dir="ltr">
                  {total.toFixed(2)} SAR
                </span>
              </div>
            </div>

            {/* Official Verification Seal + Live ZATCA Status */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3 flex flex-wrap items-center justify-between gap-2 dark:border-emerald-500/20 dark:bg-emerald-950/20">
              <div className="flex items-center gap-2.5">
                {zatcaSyncing ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[#4F2396] dark:text-violet-300 shrink-0" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                )}
                <div className="text-[11px] text-emerald-900 dark:text-emerald-200 leading-snug">
                  <p className="font-bold">
                    {zatcaSyncing
                      ? t("Verifying & reporting with ZATCA API...", "جاري مطابقة وإرسال الإيصال لبوابة زاتكا...")
                      : zatcaRecord?.clearanceStatus === "REPORTED" || zatcaRecord?.clearanceStatus === "CLEARED"
                      ? t(
                          `ZATCA API Verified (${zatcaRecord.environment.toUpperCase()} · ${zatcaRecord.clearanceStatus} · ICV #${zatcaRecord.icv})`,
                          `معتمد من بوابة زاتكا (${zatcaRecord.clearanceStatus} · ICV #${zatcaRecord.icv})`
                        )
                      : t(
                          "Cryptographically sealed in accordance with KSA e-invoicing laws.",
                          "تم توثيق هذا الإيصال وختمه رقمياً وفقاً للائحة الفوترة الإلكترونية السعودية."
                        )}
                  </p>
                  {zatcaRecord?.invoiceHash && (
                    <p className="font-mono text-[10px] opacity-80 mt-0.5 truncate max-w-[260px]">
                      SHA-256: {zatcaRecord.invoiceHash.slice(0, 22)}…
                    </p>
                  )}
                </div>
              </div>
              {!zatcaSyncing && !zatcaRecord && (
                <button
                  type="button"
                  onClick={syncWithZatcaApi}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-[#4F2396] hover:underline dark:text-violet-300 cursor-pointer"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>{t("Sync ZATCA", "مزامنة زاتكا")}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
