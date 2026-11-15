"use client";

import type { SelectedBookingDetail } from "@/components/dashboard/types";
import { QAFNEST_ZATCA_DEFAULTS } from "@qafnest/shared";
import { escapePdfHtml, renderHtmlToA4Pdf } from "./pdfRenderUtils";

/**
 * Generates and downloads a formal A4 Booking & Settlement Voucher PDF
 * for an admin reservation dossier.
 */
export async function downloadBookingVoucherPdf(booking: SelectedBookingDetail): Promise<void> {
  const safeRef = (booking.id || booking.dbId || "BOOKING").replace(/[^a-zA-Z0-9_-]/g, "");
  const settlement = booking.settlement;
  const hostGrossSar = settlement?.hostGrossEntitlementSar ?? booking.amount;
  const hostCommSar = settlement?.hostCommissionAmountSar ?? 0;
  const hostNetSar = settlement?.hostNetPayoutSar ?? booking.payoutSummary?.netPayoutAmount ?? 0;
  const platformRevSar = settlement?.platformNetRevenueSar ?? 0;
  const guestVatSar = settlement?.vatAmountSar ?? 0;
  const guestFeeSar = settlement?.guestServiceFeeSar ?? 0;
  const baseSubtotalSar = settlement?.listingAmountSar ?? booking.amount;

  const html = `
    <div style="display: flex; flex-direction: column; justify-content: space-between; min-height: 1020px; box-sizing: border-box;">
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 14px; margin-bottom: 18px; border-bottom: 2px solid #e2e8f0;">
          <div>
            <div style="font-size: 24px; font-weight: 900; color: #4F2396; letter-spacing: -0.5px;">
              Qaf<span style="color: #FF9750;">Nest</span>.
            </div>
            <div style="font-size: 11px; color: #475569; margin-top: 4px; font-weight: 700;">
              BOOKING &amp; SETTLEMENT VOUCHER · مستند حجز وتسوية مالية
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 16px; font-weight: 900; font-family: monospace; color: #0f172a;">
              ${escapePdfHtml(booking.id)}
            </div>
            <div style="font-size: 11px; color: #64748b; margin-top: 3px; text-transform: uppercase; font-weight: 700;">
              Status: ${escapePdfHtml(booking.status)}
            </div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin-bottom: 18px;">
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 14px;">
            <div style="font-size: 10px; color: #64748b; font-weight: 800; text-transform: uppercase;">Property &amp; Stay · الوحدة والإقامة</div>
            <div style="font-size: 14px; font-weight: 900; color: #0f172a; margin-top: 4px;">${escapePdfHtml(booking.propertyTitle)}</div>
            <div style="font-size: 11px; color: #475569; margin-top: 3px;">${escapePdfHtml(booking.accommodations)}</div>
            ${booking.propertyLicense ? `<div style="font-size: 11px; color: #059669; font-family: monospace; font-weight: 700; margin-top: 3px;">MoT #${escapePdfHtml(booking.propertyLicense)}</div>` : ""}
            <div style="font-size: 11px; color: #0f172a; margin-top: 6px; font-weight: 700;">
              ${escapePdfHtml(booking.dates)} (${Number(booking.nights || 1)} nights · ${escapePdfHtml(booking.guests)})
            </div>
          </div>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 14px;">
            <div style="font-size: 10px; color: #64748b; font-weight: 800; text-transform: uppercase;">Guest &amp; Host · الضيف والمضيف</div>
            <div style="font-size: 12px; font-weight: 800; color: #0f172a; margin-top: 4px;">Guest: ${escapePdfHtml(booking.guestName)}</div>
            <div style="font-size: 11px; color: #475569; font-family: monospace; margin-top: 2px;">${escapePdfHtml(booking.phone || "N/A")} ${booking.guestEmail ? `· ${escapePdfHtml(booking.guestEmail)}` : ""}</div>
            <div style="border-top: 1px solid #e2e8f0; margin-top: 8px; padding-top: 6px;">
              <div style="font-size: 12px; font-weight: 800; color: #0f172a;">Host: ${escapePdfHtml(booking.hostName || "Verified Host")}</div>
              <div style="font-size: 11px; color: #475569; font-family: monospace; margin-top: 2px;">${escapePdfHtml(booking.hostPhone || booking.hostEmail || "N/A")}</div>
            </div>
          </div>
        </div>

        <div style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 18px;">
          <div style="background: #f1f5f9; padding: 10px 14px; font-size: 12px; font-weight: 900; color: #0f172a;">
            Billing &amp; Host Disbursement Breakdown · تفاصيل الفوترة والتسوية
          </div>
          <div style="padding: 12px 14px; font-size: 12px;">
            <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #f1f5f9;">
              <span style="color: #475569;">Listing Subtotal (${Number(booking.nights || 1)} nights)</span>
              <span style="font-family: monospace; font-weight: 700;">${baseSubtotalSar.toFixed(2)} SAR</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #f1f5f9;">
              <span style="color: #475569;">Guest Service Fee</span>
              <span style="font-family: monospace;">+ ${guestFeeSar.toFixed(2)} SAR</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #f1f5f9;">
              <span style="color: #475569;">ZATCA VAT (15%)</span>
              <span style="font-family: monospace;">+ ${guestVatSar.toFixed(2)} SAR</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #cbd5e1; font-weight: 900; font-size: 13px; color: #4F2396;">
              <span>Gross Guest Billing · إجمالي مدفوعات الضيف</span>
              <span style="font-family: monospace;">${Number(booking.amount || 0).toFixed(2)} SAR</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #f1f5f9;">
              <span style="color: #475569;">Host Listing Gross</span>
              <span style="font-family: monospace; font-weight: 700;">${hostGrossSar.toFixed(2)} SAR</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #f1f5f9; color: #dc2626;">
              <span>Host Platform Commission</span>
              <span style="font-family: monospace;">- ${hostCommSar.toFixed(2)} SAR</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid #f1f5f9; font-weight: 900; color: #059669;">
              <span>Host Net Entitlement · صافي مستحقات المضيف</span>
              <span style="font-family: monospace;">${hostNetSar.toFixed(2)} SAR</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 5px 0; font-weight: 700;">
              <span>Platform Net Revenue</span>
              <span style="font-family: monospace;">${platformRevSar.toFixed(2)} SAR</span>
            </div>
          </div>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 14px; font-size: 11px;">
          <div style="font-weight: 800; color: #0f172a; margin-bottom: 6px;">SAMA SARIE Payout Dossier · بيانات التحويل البنكي</div>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
            <div><strong>Voucher Ref:</strong> <span style="font-family: monospace;">${escapePdfHtml(booking.payoutSummary?.reference || "Pending Sync")}</span></div>
            <div><strong>Disbursement Status:</strong> ${escapePdfHtml(booking.payoutSummary?.status || booking.payoutStatus)}</div>
            <div><strong>Beneficiary Bank:</strong> ${escapePdfHtml(booking.payoutSummary?.bankName || "Not Configured")}</div>
            <div><strong>Destination IBAN:</strong> <span style="font-family: monospace;">${escapePdfHtml(booking.payoutSummary?.iban || "Not Configured")}</span></div>
            ${booking.payoutSummary?.sarieTxnId ? `<div style="grid-column: span 2;"><strong>Legal Bank / SARIE Txn #:</strong> <span style="font-family: monospace; color: #059669; font-weight: 800;">${escapePdfHtml(booking.payoutSummary.sarieTxnId)}</span></div>` : ""}
          </div>
        </div>
      </div>

      <div style="border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 24px; font-size: 10px; color: #64748b; text-align: center; line-height: 1.6;">
        <div><strong>QafNest Real Estate Vacation Rentals Co.</strong> · CR: ${escapePdfHtml(QAFNEST_ZATCA_DEFAULTS.crNumber)} · VAT: ${escapePdfHtml(QAFNEST_ZATCA_DEFAULTS.vatNumber)}</div>
        <div>Official QafNest Admin Operations Settlement Voucher · Generated ${new Date().toISOString().slice(0, 10)}</div>
      </div>
    </div>
  `;

  await renderHtmlToA4Pdf(html, `Booking-Voucher-${safeRef}.pdf`);
}
