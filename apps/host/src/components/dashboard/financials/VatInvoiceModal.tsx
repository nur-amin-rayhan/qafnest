"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { X, Printer, ShieldCheck, QrCode, Download } from "lucide-react";
import type { HostVatInvoice } from "@/lib/services/hostFinancialsService";
import {
  generateZatcaTlvBase64,
  generateZatcaUbl21Xml,
  QAFNEST_ZATCA_DEFAULTS,
} from "@qafnest/shared";

interface VatInvoiceModalProps {
  invoice: HostVatInvoice | null;
  onClose: () => void;
  lang: "ar" | "en";
  t: (en: string, ar: string) => string;
}

export function VatInvoiceModal({ invoice, onClose, lang, t }: VatInvoiceModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    if (!invoice) {
      setQrDataUrl("");
      return;
    }
    let active = true;
    const tlvPayload =
      invoice.qrPayload ||
      generateZatcaTlvBase64({
        sellerName: QAFNEST_ZATCA_DEFAULTS.sellerNameAr,
        vatNumber: QAFNEST_ZATCA_DEFAULTS.vatNumber,
        timestamp: invoice.date || new Date().toISOString(),
        totalWithVat: invoice.total.replace(/[^0-9.]/g, "") || "0.00",
        vatAmount: invoice.vat.replace(/[^0-9.]/g, "") || "0.00",
      });

    QRCode.toDataURL(tlvPayload, { width: 128, margin: 1 })
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

  if (!invoice) return null;

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleDownloadXml = () => {
    const parseAmount = (val: string) => Number(val.replace(/[^0-9.-]+/g, "")) || 0;
    const serviceFee = parseAmount(invoice.serviceFee);
    const vat = parseAmount(invoice.vat);
    const total = parseAmount(invoice.total);

    const xml = generateZatcaUbl21Xml({
      uuid: invoice.id,
      invoiceNumber: invoice.id,
      icv: 1,
      pih: "NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMjRiNWRjNmE2ZjBlMGE3",
      issueDate: invoice.date || "2026-11-05",
      issueTime: "14:00:00",
      type: "simplified",
      sellerNameAr: QAFNEST_ZATCA_DEFAULTS.sellerNameAr,
      sellerVatNumber: QAFNEST_ZATCA_DEFAULTS.vatNumber,
      buyerName: "Host Partner",
      lineItems: [
        {
          name: `Platform Commission Fee - ${invoice.propertyTitle}`,
          quantity: 1,
          unitPrice: serviceFee,
          subtotal: serviceFee,
          vatRate: 0.15,
          vatAmount: vat,
          total: total,
        },
      ],
      taxableAmount: serviceFee,
      vatAmount: vat,
      totalWithVat: total,
    });

    const blob = new Blob([xml], { type: "application/xml;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${invoice.id}-ZATCA-Phase2.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 print:p-0 print:bg-white">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 max-h-[92vh] overflow-y-auto print:border-none print:shadow-none print:max-w-none print:p-4">
        {/* Modal Controls (Hidden during print) */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 print:hidden">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <ShieldCheck size={16} className="text-emerald-600" />
            <span>{t("ZATCA Compliant Simplified Tax Invoice (Fatoorah)", "فاتورة ضريبية مبسطة معتمدة من هيئة الزكاة والضريبة والجمارك")}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition cursor-pointer"
            >
              <Printer size={14} />
              <span>{t("Print / Save PDF", "طباعة / حفظ PDF")}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadXml}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 text-xs font-bold text-[#4F2396] transition cursor-pointer"
              title={t("Download ZATCA Phase 2 UBL 2.1 XML", "تحميل ملف الفاتورة UBL 2.1 XML")}
            >
              <Download size={14} />
              <span>{t("UBL 2.1 XML", "ملف XML")}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Official Printable Invoice Document Body */}
        <div className="space-y-6 text-slate-900 font-body">
          {/* Top Brand Header */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-5">
            <div>
              <span className="text-2xl font-black text-[#4F2396] tracking-tight">
                Qaf<span className="text-[#FF9750]">Nest</span>
              </span>
              <p className="text-xs text-slate-500 font-bold mt-1">
                {t("QafNest Hospitality Platform LLC", "شركة منصة قاف نست للضيافة ذ.م.م")}
              </p>
              <p className="text-[11px] text-slate-400">
                {t("Ministry of Tourism License: 73102999", "ترخيص وزارة السياحة رقم: 73102999")}
              </p>
              <p className="text-[11px] text-slate-400">
                {t(
                  "VAT Registration Number: 310123456700003 · Support: 0576707709",
                  "الرقم الضريبي: 310123456700003 · الدعم: 0576707709"
                )}
              </p>
            </div>

            {/* ZATCA QR Code Representation */}
            <div className="flex flex-col items-center justify-center p-2 rounded-2xl border border-slate-200 bg-slate-50 text-center">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrDataUrl}
                  alt={t("ZATCA Phase 2 Invoice QR Code", "رمز الاستجابة السريعة لفاتورة زاتكا")}
                  className="h-16 w-16 rounded-lg bg-white p-0.5 object-contain"
                />
              ) : (
                <QrCode size={52} className="text-slate-800" />
              )}
              <span className="text-[9px] font-mono text-slate-500 mt-1 uppercase">ZATCA Fatoorah</span>
            </div>
          </div>

          {/* Invoice Meta Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 font-bold block">{t("Invoice Number", "رقم الفاتورة")}</span>
              <span className="font-mono font-black text-slate-900 mt-0.5 block">{invoice.id}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 font-bold block">{t("Issue Date", "تاريخ الإصدار")}</span>
              <span className="font-bold text-slate-900 mt-0.5 block">{invoice.date}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl col-span-2 sm:col-span-1">
              <span className="text-slate-400 font-bold block">{t("Booking Reference", "مرجع الحجز")}</span>
              <span className="font-mono font-bold text-[#4F2396] mt-0.5 block">{invoice.bookingRef}</span>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-100 text-slate-600 font-black">
                <tr>
                  <th className="p-3 text-start">{t("Description", "الوصف والبيان")}</th>
                  <th className="p-3 text-end">{t("Service Fee", "رسوم الخدمة")}</th>
                  <th className="p-3 text-end">{t("VAT (15%)", "ض.ق.م (15%)")}</th>
                  <th className="p-3 text-end">{t("Total (SAR)", "الإجمالي")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                <tr>
                  <td className="p-3">
                    <span className="font-bold text-slate-900 block">
                      {t("Platform Facilitation & Marketing Service Fee", "رسوم خدمة الوساطة والتسويق العقاري")}
                    </span>
                    <span className="text-[11px] text-slate-500">{invoice.propertyTitle}</span>
                  </td>
                  <td className="p-3 text-end font-mono">{invoice.serviceFee}</td>
                  <td className="p-3 text-end font-mono text-rose-600">{invoice.vat}</td>
                  <td className="p-3 text-end font-mono font-black text-slate-900">{invoice.total}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Grand Total */}
          <div className="rounded-2xl bg-violet-50/70 p-4 border border-violet-100 flex items-center justify-between">
            <span className="text-xs font-black text-slate-900">
              {t("Total VAT Included", "المجموع الكلي شامل ضريبة القيمة المضافة")}
            </span>
            <span className="text-lg font-black text-[#4F2396] font-mono">{invoice.total} SAR</span>
          </div>

          <p className="text-[10px] text-center text-slate-400">
            {t(
              "This is a computer-generated tax invoice compliant with the Zakat, Tax and Customs Authority (ZATCA) Electronic Invoicing Regulations.",
              "هذه فاتورة ضريبية مبسطة مصدرة إلكترونياً ومتوافقة مع متطلبات هيئة الزكاة والضريبة والجمارك (زاتكا) للفوترة الإلكترونية المرحلة الثانية."
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

