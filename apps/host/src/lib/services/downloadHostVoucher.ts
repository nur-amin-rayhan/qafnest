import type { HostRemittance } from "@/lib/services/hostFinancialsTypes";

function escapeHtml(val: unknown): string {
  return String(val ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Generates and downloads a self-contained bilingual (EN + AR) Settlement Voucher HTML file
 * that opens cleanly in any browser or prints directly to PDF.
 */
export function downloadHostRemittanceVoucher(remittance: HostRemittance): void {
  if (typeof window === "undefined") return;

  const safeId = (remittance.id || "VOUCHER").replace(/[^a-zA-Z0-9_-]/g, "");
  const commPct =
    remittance.commissionRatePercent ??
    (remittance.grossAmount > 0
      ? Math.round((remittance.commissionAmount / remittance.grossAmount) * 1000) / 10
      : 15);

  const statusText =
    remittance.status === "settled"
      ? "DISBURSED VIA SAMA SARIE · تم الصرف عبر سريع"
      : remittance.status === "processing"
      ? "PROCESSING TRANSFER · قيد المعالجة والتحويل"
      : "SCHEDULED PAYOUT · دفعة مجدولة";

  const rowsHtml =
    remittance.bookings.length > 0
      ? remittance.bookings
          .map(
            (b) => `
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-weight: 700;">${escapeHtml(b.bookingReference)}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(b.propertyTitle)}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${escapeHtml(b.checkIn)} → ${escapeHtml(b.checkOut)}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace;">${Number(b.grossAmount || 0).toFixed(2)} SAR</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace; font-weight: 800; color: #059669;">${Number(b.netPayout || 0).toFixed(2)} SAR</td>
        </tr>`
          )
          .join("")
      : `<tr><td colspan="5" style="padding: 14px; text-align: center; color: #64748b;">No itemized stays linked to this remittance.</td></tr>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>QafNest Remittance Voucher - ${escapeHtml(remittance.id)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color: #0f172a; margin: 0; padding: 32px; background: #f8fafc; }
    .card { max-width: 820px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 32px; box-shadow: 0 4px 20px rgba(15,23,42,0.06); }
    @media print { body { background: #fff; padding: 0; } .card { border: none; box-shadow: none; padding: 12px; } .no-print { display: none !important; } }
  </style>
</head>
<body>
  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #e2e8f0;padding-bottom:16px;margin-bottom:20px;">
      <div>
        <div style="font-size:26px;font-weight:900;color:#4F2396;letter-spacing:-0.5px;">Qaf<span style="color:#FF9750;">Nest</span>.</div>
        <div style="font-size:12px;color:#475569;font-weight:700;margin-top:4px;">HOST REMITTANCE &amp; SETTLEMENT VOUCHER · سند صرف مستحقات المضيف</div>
      </div>
      <div style="text-align:right;">
        <div style="font-family:monospace;font-size:16px;font-weight:900;color:#0f172a;">${escapeHtml(remittance.id)}</div>
        <div style="font-size:11px;font-weight:800;color:#4F2396;margin-top:4px;">${statusText}</div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:16px;margin-bottom:20px;font-size:13px;">
      <div><strong>Settlement Date:</strong><br/>${escapeHtml(remittance.dateEn)} (${escapeHtml(remittance.dateAr)})</div>
      <div><strong>Destination Bank:</strong><br/>${escapeHtml(remittance.bank || "Not Configured")}</div>
      <div style="grid-column:span 2;"><strong>Destination IBAN:</strong> <span style="font-family:monospace;font-weight:800;">${escapeHtml(remittance.iban || "Not Configured")}</span></div>
    </div>

    <div style="border:1px solid #e2e8f0;border-radius:14px;padding:16px;margin-bottom:20px;font-size:13px;">
      <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f1f5f9;">
        <span style="color:#475569;">Gross Bookings Amount · إجمالي الحجوزات</span>
        <strong style="font-family:monospace;">${Number(remittance.grossAmount || 0).toFixed(2)} SAR</strong>
      </div>
      <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f1f5f9;color:#dc2626;">
        <span>QafNest Service Fee (${commPct}%) · عمولة المنصة</span>
        <strong style="font-family:monospace;">- ${Number(remittance.commissionAmount || 0).toFixed(2)} SAR</strong>
      </div>
      ${
        (remittance.promoDiscountAmount || 0) > 0
          ? `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f1f5f9;color:#dc2626;">
              <span>Promo Discount Deduction</span>
              <strong style="font-family:monospace;">- ${Number(remittance.promoDiscountAmount).toFixed(2)} SAR</strong>
             </div>`
          : ""
      }
      <div style="display:flex;justify-content:space-between;padding:10px 0 2px;font-size:16px;font-weight:900;color:#4F2396;">
        <span>Net Transferred / Payable · صافي المستحق</span>
        <span style="font-family:monospace;">${escapeHtml(remittance.amount)} SAR</span>
      </div>
    </div>

    <table style="width:100%;border-collapse:collapse;font-size:12px;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
      <thead style="background:#f1f5f9;text-align:left;">
        <tr>
          <th style="padding:10px 12px;">Booking Ref</th>
          <th style="padding:10px 12px;">Property</th>
          <th style="padding:10px 12px;">Stay Dates</th>
          <th style="padding:10px 12px;text-align:right;">Gross</th>
          <th style="padding:10px 12px;text-align:right;">Host Net</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <div style="margin-top:24px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;text-align:center;">
      QafNest Real Estate Vacation Rentals Co. · Riyadh, Saudi Arabia · SAMA SARIE Regulated Settlement Voucher
    </div>
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `QafNest-Voucher-${safeId}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
