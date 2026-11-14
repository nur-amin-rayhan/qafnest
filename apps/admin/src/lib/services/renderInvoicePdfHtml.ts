import QRCode from "qrcode";
import type { AdminTaxInvoiceRecord } from "./adminInvoicesService";
import { QAFNEST_ZATCA_DEFAULTS } from "@qafnest/shared";

export async function renderInvoicePdfHtml(invoice: AdminTaxInvoiceRecord, autoPrint = true): Promise<string> {
  let qrDataUrl = "";
  try {
    qrDataUrl = await QRCode.toDataURL(invoice.qrPayload || invoice.invoiceNumber, {
      width: 150,
      margin: 1,
      color: { dark: "#0f172a", light: "#ffffff" },
      errorCorrectionLevel: "M",
    });
  } catch (err) {
    console.warn("Could not generate QR code data URL:", err);
  }

  const isGuestStay = invoice.type === "guest_stay";
  const itemDescEn = isGuestStay
    ? "Licensed Vacation Rental Accommodation Stay"
    : "Platform Facilitation & Marketing Fee";
  const itemDescAr = isGuestStay
    ? "إقامة وحدة سكنية سياحية مرخصة (حجز معتمد)"
    : "رسوم وساطة وتسويق حجز الإقامة السياحية";

  return `<!DOCTYPE html>
<html dir="ltr" lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${invoice.invoiceNumber} - QafNest Tax Invoice (PDF)</title>
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
      background: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      font-size: 11pt;
      line-height: 1.4;
    }
    .no-print-bar {
      position: sticky;
      top: 0;
      z-index: 50;
      background: #0f172a;
      color: #ffffff;
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .btn-download {
      background: #4F2396;
      color: #ffffff;
      border: none;
      padding: 8px 18px;
      border-radius: 12px;
      font-weight: 800;
      font-size: 13px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: background 0.2s;
    }
    .btn-download:hover {
      background: #3B1B72;
    }
    .page-container {
      max-width: 210mm;
      min-height: 275mm;
      margin: 20px auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 16mm 18mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-shadow: 0 10px 30px rgba(0,0,0,0.06);
    }
    @media print {
      body {
        background: #ffffff !important;
      }
      .no-print-bar {
        display: none !important;
      }
      .page-container {
        margin: 0 !important;
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        max-width: none !important;
        min-height: auto !important;
      }
    }
    .invoice-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .logo-text {
      font-size: 26px;
      font-weight: 900;
      color: #4F2396;
      letter-spacing: -0.5px;
    }
    .logo-nest {
      color: #FF9750;
    }
    .badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 9999px;
      font-size: 10px;
      font-weight: 800;
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      margin-top: 6px;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }
    .meta-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 10px 14px;
    }
    .meta-label {
      font-size: 10px;
      color: #64748b;
      font-weight: 700;
      margin-bottom: 3px;
    }
    .meta-val {
      font-size: 13px;
      font-weight: 800;
      color: #0f172a;
      font-family: monospace;
    }
    .client-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px 16px;
      margin-bottom: 20px;
    }
    .client-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      padding: 3px 0;
    }
    .table-container {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 800;
      font-size: 11px;
      padding: 10px 14px;
      border-bottom: 1px solid #e2e8f0;
    }
    td {
      padding: 12px 14px;
      border-bottom: 1px solid #f1f5f9;
      font-size: 12px;
    }
    .total-box {
      background: #4F2396;
      color: #ffffff;
      border-radius: 14px;
      padding: 14px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 10px;
    }
    .total-val {
      font-size: 22px;
      font-weight: 900;
      font-family: monospace;
    }
    .footer-note {
      border-top: 1px solid #e2e8f0;
      padding-top: 14px;
      margin-top: 24px;
      font-size: 10px;
      color: #64748b;
      text-align: center;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <div>
      <strong>Simplified Tax Invoice · فاتورة ضريبية مبسطة</strong> · ${invoice.invoiceNumber}
    </div>
    <div style="display: flex; gap: 10px;">
      <button class="btn-download" onclick="window.print()">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
        Save as PDF / Print
      </button>
      <button class="btn-download" style="background: #334155;" onclick="window.close()">Close</button>
    </div>
  </div>

  <div class="page-container">
    <div>
      <!-- Top Title Bar -->
      <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 12px; margin-bottom: 16px; border-bottom: 2px solid #e2e8f0;">
        <div>
          <span style="font-size: 16px; font-weight: 900; color: #4F2396; letter-spacing: 0.5px; text-transform: uppercase;">
            SIMPLIFIED TAX INVOICE
          </span>
          <span style="font-size: 15px; font-weight: 800; color: #334155; margin-left: 8px;">
            · فاتورة ضريبية مبسطة
          </span>
        </div>
        <span class="badge">ZATCA Phase 2 Compliant · معتمدة رسمياً</span>
      </div>

      <!-- Header -->
      <div class="invoice-header">
        <div>
          <div class="logo-text">Qaf<span class="logo-nest">Nest</span>.</div>
          <div style="font-size: 13px; font-weight: 800; margin-top: 4px; color: #0f172a;">
            QafNest Real Estate Vacation Rentals Co. · ${QAFNEST_ZATCA_DEFAULTS.sellerNameAr}
          </div>
          <div style="font-size: 11px; color: #475569; margin-top: 5px;">
            <strong>CR:</strong> ${QAFNEST_ZATCA_DEFAULTS.crNumber} · <strong>السجل التجاري:</strong> ${QAFNEST_ZATCA_DEFAULTS.crNumber}
          </div>
          <div style="font-size: 11px; color: #475569; margin-top: 2px;">
            <strong>MoT License:</strong> ${QAFNEST_ZATCA_DEFAULTS.licenseNumber} · <strong>ترخيص وزارة السياحة:</strong> ${QAFNEST_ZATCA_DEFAULTS.licenseNumber}
          </div>
          <div style="font-size: 11px; color: #475569; margin-top: 2px;">
            <strong>VAT ID:</strong> <span style="font-family: monospace; font-weight: 800;">${QAFNEST_ZATCA_DEFAULTS.vatNumber}</span> · <strong>الرقم الضريبي</strong>
          </div>
        </div>

        <div style="text-align: center;">
          ${qrDataUrl ? `<img src="${qrDataUrl}" alt="ZATCA QR" style="width: 125px; height: 125px; border-radius: 8px; border: 1px solid #cbd5e1; padding: 4px; background: #fff;" />` : ''}
          <div style="font-size: 9px; color: #64748b; font-weight: 700; margin-top: 4px;">ZATCA QR · رمز التحقق</div>
        </div>
      </div>

      <!-- Meta Grid -->
      <div class="meta-grid">
        <div class="meta-card">
          <div class="meta-label">Invoice Number / رقم الفاتورة</div>
          <div class="meta-val">${invoice.invoiceNumber}</div>
        </div>
        <div class="meta-card">
          <div class="meta-label">Issue Date / تاريخ الإصدار</div>
          <div class="meta-val">${invoice.issueDate}</div>
        </div>
        <div class="meta-card">
          <div class="meta-label">Booking Ref / مرجع الحجز</div>
          <div class="meta-val" style="color: #4F2396;">${invoice.bookingReference}</div>
        </div>
      </div>

      <!-- Client Info -->
      <div class="client-box">
        <div class="client-row">
          <span style="color: #64748b; font-weight: 700;">Client / Billed To · العميل:</span>
          <span style="font-weight: 800;">${invoice.clientName} (${invoice.clientRole === 'guest' ? 'Guest / نزيل' : 'Host / مضيف'})</span>
        </div>
        <div class="client-row">
          <span style="color: #64748b; font-weight: 700;">Property Title · العقار:</span>
          <span style="font-weight: 800;">${invoice.propertyTitle}</span>
        </div>
        <div class="client-row">
          <span style="color: #64748b; font-weight: 700;">Payment Method · طريقة الدفع:</span>
          <span style="font-weight: 800;">${invoice.paymentMethod}</span>
        </div>
      </div>

      <!-- Table -->
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th style="width: 44%;">Description / البيان</th>
              <th style="text-align: right;">Taxable (SAR)<br /><span style="font-size: 9px; font-weight: normal; color: #64748b;">المبلغ الخاضع</span></th>
              <th style="text-align: right;">15% VAT (SAR)<br /><span style="font-size: 9px; font-weight: normal; color: #64748b;">ضريبة القيمة المضافة</span></th>
              <th style="text-align: right;">Total with VAT (SAR)<br /><span style="font-size: 9px; font-weight: normal; color: #64748b;">الإجمالي شامل الضريبة</span></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong style="display: block; font-size: 12px; color: #0f172a;">${itemDescEn}</strong>
                <span style="display: block; font-size: 11px; color: #475569; margin-top: 2px;">${itemDescAr}</span>
                <span style="display: block; font-size: 10px; color: #64748b; margin-top: 2px;">${invoice.propertyTitle} · Ref: ${invoice.bookingReference}</span>
              </td>
              <td style="text-align: right; font-family: monospace; font-weight: 700;">
                ${invoice.taxableAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </td>
              <td style="text-align: right; font-family: monospace; font-weight: 700; color: #059669;">
                ${invoice.vatAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </td>
              <td style="text-align: right; font-family: monospace; font-weight: 900; color: #0f172a; font-size: 13px;">
                ${invoice.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Total -->
      <div class="total-box">
        <div>
          <div style="font-size: 13px; font-weight: 900;">Total Amount Due (15% VAT Included)</div>
          <div style="font-size: 12px; opacity: 0.9; margin-top: 2px;">المبلغ الإجمالي المستحق (شامل ضريبة القيمة المضافة ١٥٪)</div>
        </div>
        <div class="total-val">
          SAR ${invoice.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer-note">
      <div>This simplified electronic tax invoice is generated in full compliance with ZATCA Phase 2 E-Invoicing regulations in the Kingdom of Saudi Arabia.</div>
      <div>تم إصدار هذه الفاتورة الإلكترونية المبسطة وفقاً للائحة الفوترة الإلكترونية المعتمدة من هيئة الزكاة والضريبة والجمارك بالمملكة العربية السعودية.</div>
      <div style="margin-top: 4px; font-weight: 700; color: #475569;">QafNest Real Estate Vacation Rentals Co. · Riyadh, Saudi Arabia · Support: 0576707709 · support@qafnest.com</div>
    </div>
  </div>

  ${autoPrint ? `
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.print();
      }, 400);
    });
  </script>
  ` : ''}
</body>
</html>`;
}
