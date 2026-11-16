/**
 * Single-Page A4 Tax Invoice & Receipt Printer
 * Uses an isolated hidden iframe to guarantee EXACTLY 1 A4 PAGE print output
 * without any background page overflow or blank pages.
 */

import QRCode from "qrcode";
import { escapeHtml } from "@qafnest/shared/escapeHtml";

export interface PrintableInvoiceParams {
  invoiceNumber: string;
  referenceNumber: string;
  issueDate: string;
  issueTime: string;
  sellerNameAr: string;
  sellerNameEn: string;
  vatNumber: string;
  licenseNumber: string;
  buyerName: string;
  paymentMethod: string;
  qrPayload: string;
  lineItems: Array<{
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    vatRate: number;
    vatAmount: number;
    total: number;
  }>;
  subtotal: number;
  vatAmount: number;
  grandTotal: number;
  isArabic: boolean;
}

export async function printInvoiceA4(params: PrintableInvoiceParams): Promise<void> {
  const qrDataUrl = await QRCode.toDataURL(params.qrPayload, {
    width: 140,
    margin: 1,
    color: { dark: "#0f172a", light: "#ffffff" },
    errorCorrectionLevel: "M",
  });

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.style.visibility = "hidden";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    window.print();
    return;
  }

  const dir = params.isArabic ? "rtl" : "ltr";
  const lang = params.isArabic ? "ar" : "en";

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html dir="${dir}" lang="${lang}">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(params.invoiceNumber)} - QafNest Tax Invoice</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm 14mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            width: 100%;
            height: 100%;
            background: #ffffff;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #0f172a;
            font-size: 11pt;
            line-height: 1.4;
          }
          .page-container {
            width: 100%;
            min-height: 270mm;
            max-height: 275mm;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 2mm 0;
          }
          .header-box {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #4F2396;
            padding-bottom: 12px;
            margin-bottom: 14px;
          }
          .brand-title {
            font-size: 24pt;
            font-weight: 900;
            color: #4F2396;
            letter-spacing: -0.5px;
          }
          .brand-accent {
            color: #FF9750;
          }
          .company-name {
            font-size: 11pt;
            font-weight: 700;
            color: #1e293b;
            margin-top: 2px;
          }
          .company-meta {
            font-size: 8.5pt;
            color: #64748b;
            margin-top: 1px;
          }
          .qr-box {
            display: flex;
            flex-direction: column;
            align-items: center;
            border: 1px solid #e2e8f0;
            padding: 4px;
            border-radius: 8px;
            background: #faf5ff;
          }
          .qr-label {
            font-size: 7.5pt;
            font-weight: 700;
            color: #4F2396;
            text-transform: uppercase;
            margin-top: 2px;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 10px 14px;
            margin-bottom: 16px;
          }
          .meta-label {
            font-size: 8pt;
            color: #64748b;
          }
          .meta-value {
            font-size: 9.5pt;
            font-weight: 700;
            color: #0f172a;
            margin-top: 1px;
            font-family: monospace;
          }
          .table-section {
            flex: 1 1 auto;
            display: flex;
            flex-direction: column;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9pt;
          }
          th {
            background: #4F2396;
            color: #ffffff;
            font-weight: 700;
            padding: 8px 10px;
            text-align: ${params.isArabic ? "right" : "left"};
          }
          th.num-col, td.num-col {
            text-align: ${params.isArabic ? "left" : "right"};
            font-family: monospace;
          }
          td {
            padding: 10px 10px;
            border-bottom: 1px solid #f1f5f9;
            color: #1e293b;
          }
          .item-name {
            font-weight: 700;
            font-size: 9.5pt;
          }
          .item-desc {
            font-size: 8pt;
            color: #64748b;
            margin-top: 2px;
          }
          .flexible-space {
            flex: 1 1 auto;
            min-height: 40px;
          }
          .footer-section {
            border-top: 1.5px solid #e2e8f0;
            padding-top: 12px;
            margin-top: auto;
          }
          .totals-grid {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 12px;
          }
          .totals-card {
            width: 260px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 10px 12px;
          }
          .totals-row {
            display: flex;
            justify-content: space-between;
            font-size: 8.5pt;
            color: #475569;
            margin-bottom: 4px;
          }
          .grand-total-row {
            display: flex;
            justify-content: space-between;
            font-size: 12pt;
            font-weight: 900;
            color: #4F2396;
            border-top: 1.5px solid #cbd5e1;
            padding-top: 6px;
            margin-top: 6px;
          }
          .seal-box {
            display: flex;
            align-items: center;
            gap: 10px;
            background: #f0fdf4;
            border: 1px solid #86efac;
            border-radius: 8px;
            padding: 8px 12px;
            font-size: 8pt;
            color: #166534;
          }
          .compliance-note {
            text-align: center;
            font-size: 7.5pt;
            color: #94a3b8;
            margin-top: 8px;
          }
        </style>
      </head>
      <body>
        <div class="page-container">
          <!-- Top Section: Brand & ZATCA QR -->
          <div>
            <div class="header-box">
              <div>
                <div class="brand-title">Qaf<span class="brand-accent">Nest</span>.</div>
                <div class="company-name">${escapeHtml(params.isArabic ? params.sellerNameAr : params.sellerNameEn)}</div>
                <div class="company-meta">${params.isArabic ? "ترخيص وزارة السياحة:" : "Ministry of Tourism License:"} ${escapeHtml(params.licenseNumber)}</div>
                <div class="company-meta">${params.isArabic ? "الرقم الضريبي (VAT):" : "VAT Registration No:"} ${escapeHtml(params.vatNumber)}</div>
              </div>
              <div class="qr-box">
                <img src="${qrDataUrl}" width="110" height="110" alt="ZATCA Verified QR Code" />
                <span class="qr-label">ZATCA Fatoorah</span>
              </div>
            </div>

            <!-- Metadata Strip -->
            <div class="meta-grid">
              <div>
                <div class="meta-label">${params.isArabic ? "رقم الفاتورة:" : "Invoice Number:"}</div>
                <div class="meta-value">${escapeHtml(params.invoiceNumber)}</div>
              </div>
              <div>
                <div class="meta-label">${params.isArabic ? "الرقم المرجعي:" : "Transaction Ref:"}</div>
                <div class="meta-value">${escapeHtml(params.referenceNumber)}</div>
              </div>
              <div>
                <div class="meta-label">${params.isArabic ? "تاريخ ووقت الإصدار:" : "Issue Date & Time:"}</div>
                <div class="meta-value" style="font-family: inherit;">${escapeHtml(params.issueDate)} ${escapeHtml(params.issueTime)}</div>
              </div>
              <div>
                <div class="meta-label">${params.isArabic ? "وسيلة الدفع:" : "Payment Method:"}</div>
                <div class="meta-value" style="color: #4F2396;">${escapeHtml(params.paymentMethod)}</div>
              </div>
            </div>
          </div>

          <!-- Middle Section: Line Items & Statement -->
          <div class="table-section">
            <table>
              <thead>
                <tr>
                  <th style="width: 45%;">${params.isArabic ? "البيان والخدمة" : "Item & Service Description"}</th>
                  <th class="num-col" style="width: 15%;">${params.isArabic ? "المبلغ قبل الضريبة" : "Rate (Excl. VAT)"}</th>
                  <th class="num-col" style="width: 15%;">${params.isArabic ? "الضريبة (١٥٪)" : "VAT (15%)"}</th>
                  <th class="num-col" style="width: 25%;">${params.isArabic ? "الإجمالي شاملاً الضريبة" : "Total (Incl. VAT)"}</th>
                </tr>
              </thead>
              <tbody>
                ${params.lineItems
                  .map(
                    (item) => `
                  <tr>
                    <td>
                      <div class="item-name">${escapeHtml(item.name)}</div>
                      ${item.description ? `<div class="item-desc">${escapeHtml(item.description)}</div>` : ""}
                    </td>
                    <td class="num-col">${item.subtotal.toFixed(2)} SAR</td>
                    <td class="num-col" style="color: #b91c1c;">${item.vatAmount.toFixed(2)} SAR</td>
                    <td class="num-col" style="font-weight: 700; color: #0f172a;">${item.total.toFixed(2)} SAR</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>

            <!-- Flexible Space to stretch layout across full A4 page -->
            <div class="flexible-space"></div>
          </div>

          <!-- Bottom Section: Totals, Seal & Compliance Statement -->
          <div class="footer-section">
            <div class="totals-grid">
              <div class="totals-card">
                <div class="totals-row">
                  <span>${params.isArabic ? "المبلغ الخاضع للضريبة:" : "Subtotal (Excl. VAT):"}</span>
                  <span style="font-family: monospace; font-weight: 700;">${params.subtotal.toFixed(2)} SAR</span>
                </div>
                <div class="totals-row">
                  <span>${params.isArabic ? "ضريبة القيمة المضافة (١٥٪):" : "VAT Amount (15%):"}</span>
                  <span style="font-family: monospace; font-weight: 700; color: #b91c1c;">${params.vatAmount.toFixed(2)} SAR</span>
                </div>
                <div class="grand-total-row">
                  <span>${params.isArabic ? "الإجمالي النهائي:" : "Grand Total:"}</span>
                  <span style="font-family: monospace;">${params.grandTotal.toFixed(2)} SAR</span>
                </div>
              </div>
            </div>

            <div class="seal-box">
              <span style="font-size: 16pt;">🛡️</span>
              <div>
                <strong>${params.isArabic ? "فاتورة ضريبية مبسطة معتمدة" : "ZATCA Verified Simplified Tax Invoice"}</strong>
                <div>${params.isArabic ? "تم إصدار هذه الفاتورة وتوثيقها بختم إلكتروني مشفر وفقاً لمتطلبات هيئة الزكاة والضريبة والجمارك (المرحلة الثانية)." : "Digitally sealed and reported in full compliance with Saudi Arabia ZATCA e-invoicing Phase 2 regulations."}</div>
              </div>
            </div>

            <div class="compliance-note">
              QafNest Kingdom of Saudi Arabia · Ministry of Tourism License #73102999 · CR #1010648921 · Support: 0576707709 · Fatoorah Verified
            </div>
          </div>
        </div>
      </body>
    </html>
  `);
  doc.close();

  iframe.contentWindow?.focus();
  setTimeout(() => {
    iframe.contentWindow?.print();
    setTimeout(() => {
      try {
        document.body.removeChild(iframe);
      } catch {}
    }, 1500);
  }, 350);
}
