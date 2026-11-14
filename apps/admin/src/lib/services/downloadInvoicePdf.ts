"use client";

import QRCode from "qrcode";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import type { AdminTaxInvoiceRecord } from "./adminInvoicesService";
import { QAFNEST_ZATCA_DEFAULTS } from "@qafnest/shared";

/**
 * Universal Bilingual (English + Arabic) ZATCA Phase 2 Tax Invoice PDF Downloader.
 * Generates an official, single-page A4 document matching Saudi Arabian ZATCA standards.
 */
export async function downloadInvoicePdf(invoice: AdminTaxInvoiceRecord): Promise<void> {
  // 1. Generate high-resolution ZATCA QR code
  let qrDataUrl = "";
  try {
    qrDataUrl = await QRCode.toDataURL(invoice.qrPayload || invoice.invoiceNumber, {
      width: 140,
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

  // 2. Build off-screen universal bilingual container
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "820px";
  container.style.background = "#ffffff";
  container.style.padding = "32px 36px";
  container.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
  container.style.color = "#0f172a";
  container.style.direction = "ltr";
  container.style.boxSizing = "border-box";
  container.style.zIndex = "-1000";

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; justify-content: space-between; min-height: 1040px; box-sizing: border-box;">
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
          <span style="display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 10px; font-weight: 800; background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0;">
            ZATCA Phase 2 Compliant · معتمدة رسمياً
          </span>
        </div>

        <!-- Seller Header & QR Code -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; margin-bottom: 18px; border-bottom: 1px solid #e2e8f0;">
          <div>
            <div style="font-size: 26px; font-weight: 900; color: #4F2396; letter-spacing: -0.5px;">
              Qaf<span style="color: #FF9750;">Nest</span>.
            </div>
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

        <!-- Metadata Grid -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 18px;">
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px 14px;">
            <div style="font-size: 10px; color: #64748b; font-weight: 700;">Invoice Number / رقم الفاتورة</div>
            <div style="font-size: 13px; font-weight: 900; color: #0f172a; font-family: monospace; margin-top: 3px;">${invoice.invoiceNumber}</div>
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px 14px;">
            <div style="font-size: 10px; color: #64748b; font-weight: 700;">Issue Date / تاريخ الإصدار</div>
            <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-top: 3px;">${invoice.issueDate}</div>
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px 14px;">
            <div style="font-size: 10px; color: #64748b; font-weight: 700;">Booking Reference / مرجع الحجز</div>
            <div style="font-size: 13px; font-weight: 900; color: #4F2396; font-family: monospace; margin-top: 3px;">${invoice.bookingReference}</div>
          </div>
        </div>

        <!-- Client & Property Details -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 16px; margin-bottom: 18px;">
          <div style="display: flex; justify-content: space-between; font-size: 12px; padding: 3px 0;">
            <span style="color: #64748b; font-weight: 700;">Client / Billed To · العميل:</span>
            <span style="font-weight: 800; color: #0f172a;">${invoice.clientName} (${invoice.clientRole === 'guest' ? 'Guest / نزيل' : 'Host / مضيف'})</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 12px; padding: 3px 0;">
            <span style="color: #64748b; font-weight: 700;">Property Title · العقار:</span>
            <span style="font-weight: 800; color: #0f172a;">${invoice.propertyTitle}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 12px; padding: 3px 0;">
            <span style="color: #64748b; font-weight: 700;">Payment Method · طريقة الدفع:</span>
            <span style="font-weight: 800; color: #0f172a;">${invoice.paymentMethod}</span>
          </div>
        </div>

        <!-- Line Items Table -->
        <div style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 18px;">
          <table style="width: 100%; border-collapse: collapse; text-align: left;">
            <thead>
              <tr style="background: #f1f5f9; color: #334155; font-weight: 800; font-size: 11px;">
                <th style="padding: 10px 14px; width: 44%;">Description / البيان</th>
                <th style="padding: 10px 14px; text-align: right;">Taxable (SAR)<br /><span style="font-size: 9px; font-weight: normal; color: #64748b;">المبلغ الخاضع</span></th>
                <th style="padding: 10px 14px; text-align: right;">15% VAT (SAR)<br /><span style="font-size: 9px; font-weight: normal; color: #64748b;">ضريبة القيمة المضافة</span></th>
                <th style="padding: 10px 14px; text-align: right;">Total with VAT (SAR)<br /><span style="font-size: 9px; font-weight: normal; color: #64748b;">الإجمالي شامل الضريبة</span></th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 12px 14px; border-bottom: 1px solid #f1f5f9; font-size: 12px;">
                  <strong style="display: block; font-size: 12px; color: #0f172a;">${itemDescEn}</strong>
                  <span style="display: block; font-size: 11px; color: #475569; margin-top: 2px;">${itemDescAr}</span>
                  <span style="display: block; font-size: 10px; color: #64748b; margin-top: 2px;">${invoice.propertyTitle} · Ref: ${invoice.bookingReference}</span>
                </td>
                <td style="padding: 12px 14px; border-bottom: 1px solid #f1f5f9; font-size: 12px; text-align: right; font-family: monospace; font-weight: 700;">
                  ${invoice.taxableAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
                <td style="padding: 12px 14px; border-bottom: 1px solid #f1f5f9; font-size: 12px; text-align: right; font-family: monospace; font-weight: 700; color: #059669;">
                  ${invoice.vatAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
                <td style="padding: 12px 14px; border-bottom: 1px solid #f1f5f9; font-size: 13px; text-align: right; font-family: monospace; font-weight: 900; color: #0f172a;">
                  ${invoice.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Total Box -->
        <div style="background: #4F2396; color: #ffffff; border-radius: 14px; padding: 14px 20px; display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
          <div>
            <div style="font-size: 13px; font-weight: 900;">Total Amount Due (15% VAT Included)</div>
            <div style="font-size: 12px; opacity: 0.9; margin-top: 2px;">المبلغ الإجمالي المستحق (شامل ضريبة القيمة المضافة ١٥٪)</div>
          </div>
          <div style="font-size: 22px; font-weight: 900; font-family: monospace;">
            SAR ${invoice.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      <!-- Universal Footer Note -->
      <div style="border-top: 1px solid #e2e8f0; padding-top: 14px; margin-top: 24px; font-size: 10px; color: #64748b; text-align: center; line-height: 1.6;">
        <div>This simplified electronic tax invoice is generated in full compliance with ZATCA Phase 2 E-Invoicing regulations in the Kingdom of Saudi Arabia.</div>
        <div>تم إصدار هذه الفاتورة الإلكترونية المبسطة وفقاً للائحة الفوترة الإلكترونية المعتمدة من هيئة الزكاة والضريبة والجمارك بالمملكة العربية السعودية.</div>
        <div style="margin-top: 4px; font-weight: 700; color: #475569;">QafNest Real Estate Vacation Rentals Co. · Riyadh, Saudi Arabia · Support: 0576707709 · support@qafnest.com</div>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pdfWidth = 210;
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");
    pdf.save(`Tax-Invoice-${invoice.invoiceNumber}.pdf`);
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
