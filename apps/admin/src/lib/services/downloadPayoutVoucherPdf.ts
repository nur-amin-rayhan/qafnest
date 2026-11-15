"use client";

import { QAFNEST_ZATCA_DEFAULTS, isPayoutPostCheckoutEligible } from "@qafnest/shared";
import type { AdminPayoutRecord } from "./adminFinancialsService";
import { escapePdfHtml, renderHtmlToA4Pdf } from "./pdfRenderUtils";

/**
 * Generates and downloads a formal A4 SAMA SARIE Host Settlement Voucher PDF.
 */
export async function downloadPayoutVoucherPdf(payout: AdminPayoutRecord): Promise<void> {
  const safeRef = (payout.reference || payout.id || "PAYOUT").replace(/[^a-zA-Z0-9_-]/g, "");
  const eligibility = isPayoutPostCheckoutEligible(payout);
  const commissionPct = Math.round((payout.commissionRate || 0.15) * 100);

  const statusBadgeText =
    payout.status === "disbursed"
      ? "DISBURSED · تم التحويل"
      : payout.status === "processing"
      ? "PROCESSING SARIE · جاري التحويل"
      : payout.status === "on_hold"
      ? "ON HOLD · معلق"
      : !eligibility.eligible
      ? "ESCROW LOCKED (PRE-CHECKOUT) · محجوز حتى المغادرة"
      : payout.payoutRequestStatus === "requested"
      ? "HOST REQUESTED · طلب تحويل من المضيف"
      : "READY FOR SETTLEMENT · جاهز للتسوية";

  const bookingRowsHtml =
    payout.bookings && payout.bookings.length > 0
      ? payout.bookings
          .map(
            (b) => `
          <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f5f9; font-size: 11px;">
            <div>
              <strong style="font-family: monospace; color: #0f172a;">${escapePdfHtml(b.reference)}</strong>
              <span style="color: #475569;"> · ${escapePdfHtml(b.guestName)}</span>
              <div style="color: #64748b; font-size: 10px;">${escapePdfHtml(b.checkIn)} → ${escapePdfHtml(b.checkOut)} (${Number(b.nights || 1)} nights)</div>
            </div>
            <div style="font-family: monospace; font-weight: 800; color: #0f172a;">SAR ${Number(b.total || 0).toFixed(2)}</div>
          </div>`
          )
          .join("")
      : `<div style="font-size: 11px; color: #64748b; padding: 6px 0;">Property: ${escapePdfHtml(payout.propertyTitle)}</div>`;

  const html = `
    <div style="display: flex; flex-direction: column; justify-content: space-between; min-height: 1020px; box-sizing: border-box;">
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 14px; margin-bottom: 18px; border-bottom: 2px solid #e2e8f0;">
          <div>
            <div style="font-size: 24px; font-weight: 900; color: #4F2396; letter-spacing: -0.5px;">
              Qaf<span style="color: #FF9750;">Nest</span>.
            </div>
            <div style="font-size: 11px; color: #475569; margin-top: 4px; font-weight: 700;">
              SAMA SARIE REMITTANCE VOUCHER · سند تحويل مستحقات المضيف
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 15px; font-weight: 900; font-family: monospace; color: #0f172a;">
              ${escapePdfHtml(payout.reference)}
            </div>
            <div style="font-size: 10px; font-weight: 800; color: #4F2396; margin-top: 4px;">
              ${statusBadgeText}
            </div>
          </div>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px; margin-bottom: 18px;">
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 12px;">
            <div>
              <div style="font-size: 10px; color: #64748b; font-weight: 700;">Beneficiary Host · المضيف المستفيد</div>
              <div style="font-weight: 900; color: #0f172a; margin-top: 2px;">${escapePdfHtml(payout.hostName)}</div>
              <div style="font-size: 11px; color: #475569; font-family: monospace; margin-top: 2px;">${escapePdfHtml(payout.hostPhone || payout.hostEmail || "")}</div>
            </div>
            <div>
              <div style="font-size: 10px; color: #64748b; font-weight: 700;">Accommodation Property · الوحدة السكنية</div>
              <div style="font-weight: 800; color: #0f172a; margin-top: 2px;">${escapePdfHtml(payout.propertyTitle)}</div>
              <div style="font-size: 11px; color: #475569; margin-top: 2px;">Check-out Unlock: ${escapePdfHtml(payout.checkOutDate || payout.scheduledDate || "N/A")}</div>
            </div>
            <div>
              <div style="font-size: 10px; color: #64748b; font-weight: 700;">Beneficiary Bank · البنك المستفيد</div>
              <div style="font-weight: 800; color: #0f172a; margin-top: 2px;">${escapePdfHtml(payout.bankName || "Not Configured")}</div>
            </div>
            <div>
              <div style="font-size: 10px; color: #64748b; font-weight: 700;">SAMA Destination IBAN · رقم الآيبان</div>
              <div style="font-family: monospace; font-weight: 800; color: #0f172a; margin-top: 2px;">${escapePdfHtml(payout.iban || "Not Configured")}</div>
            </div>
            ${
              payout.sarieTxnId
                ? `<div style="grid-column: span 2; border-top: 1px solid #cbd5e1; padding-top: 8px; margin-top: 4px;">
                    <span style="font-size: 10px; color: #64748b; font-weight: 700;">Legal Bank / SAMA SARIE Transaction Number · الرقم المرجعي الرسمي للحوالة:</span>
                    <div style="font-family: monospace; font-weight: 900; font-size: 14px; color: #059669; margin-top: 2px;">${escapePdfHtml(payout.sarieTxnId)}</div>
                   </div>`
                : ""
            }
          </div>
        </div>

        <div style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 18px;">
          <div style="background: #f1f5f9; padding: 10px 14px; font-size: 12px; font-weight: 900; color: #0f172a;">
            Disbursement Settlement Breakdown · تفاصيل التسوية المالية
          </div>
          <div style="padding: 12px 14px; font-size: 12px;">
            ${
              payout.guestPaidTotal && payout.guestPaidTotal > 0
                ? `<div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">
                    <span>Guest Total Paid (incl. Service Fee &amp; 15% VAT)</span>
                    <span style="font-family: monospace;">SAR ${Number(payout.guestPaidTotal).toFixed(2)}</span>
                   </div>`
                : ""
            }
            <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #f1f5f9;">
              <span>Host Listing Gross (${Number(payout.staysCount || 1)} stays)</span>
              <span style="font-family: monospace; font-weight: 700;">SAR ${Number(payout.grossAmount || 0).toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #f1f5f9; color: #4F2396;">
              <span>Less: Platform Host Commission (${commissionPct}%)</span>
              <span style="font-family: monospace;">- SAR ${Number(payout.commissionAmount || 0).toFixed(2)}</span>
            </div>
            ${
              payout.promoDiscountAmount && payout.promoDiscountAmount > 0
                ? `<div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #f1f5f9; color: #b45309;">
                    <span>Less: Promo Code Deduction</span>
                    <span style="font-family: monospace;">- SAR ${Number(payout.promoDiscountAmount).toFixed(2)}</span>
                   </div>`
                : ""
            }
            ${
              payout.welcomeBonusSubsidyAmount && payout.welcomeBonusSubsidyAmount > 0
                ? `<div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #f1f5f9; color: #059669;">
                    <span>Plus: Welcome Bonus Reimbursed by QafNest</span>
                    <span style="font-family: monospace;">+ SAR ${Number(payout.welcomeBonusSubsidyAmount).toFixed(2)}</span>
                   </div>`
                : ""
            }
            <div style="display: flex; justify-content: space-between; padding: 10px 0 4px; font-weight: 900; font-size: 15px; color: #0f172a;">
              <span>Net Remittance to Host Bank · صافي المستحق للتحويل</span>
              <span style="font-family: monospace; color: #059669;">SAR ${Number(payout.netPayoutAmount || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 14px;">
          <div style="font-size: 11px; font-weight: 800; color: #0f172a; margin-bottom: 6px;">Included Stays &amp; Reservations · الحجوزات المشمولة</div>
          ${bookingRowsHtml}
        </div>
      </div>

      <div style="border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 24px; font-size: 10px; color: #64748b; text-align: center; line-height: 1.6;">
        <div><strong>QafNest Real Estate Vacation Rentals Co.</strong> · CR: ${escapePdfHtml(QAFNEST_ZATCA_DEFAULTS.crNumber)} · VAT: ${escapePdfHtml(QAFNEST_ZATCA_DEFAULTS.vatNumber)}</div>
        <div>Disbursed under SAMA SARIE Escrow Compliance · Exported ${new Date().toISOString().slice(0, 10)}</div>
      </div>
    </div>
  `;

  await renderHtmlToA4Pdf(html, `Payout-Voucher-${safeRef}.pdf`);
}
