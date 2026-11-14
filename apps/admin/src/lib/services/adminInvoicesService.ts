import { generateZatcaTlvBase64, QAFNEST_ZATCA_DEFAULTS } from "@qafnest/shared";
import { getZatcaInvoiceRecords } from "@qafnest/shared/zatcaStore";
import { getServerPlatformFeeConfig } from "@qafnest/shared/platformFeeStore";
import { resolveBookingSettlement } from "@qafnest/shared/bookingFinancialsStore";
import { createAdminDataClient } from "@/lib/adminApi";

export interface AdminTaxInvoiceRecord {
  id: string;
  invoiceNumber: string;
  type: "guest_stay" | "host_commission";
  issueDate: string;
  bookingReference: string;
  clientName: string;
  clientRole: "guest" | "host";
  propertyTitle: string;
  taxableAmount: number;
  vatRate: number; // 0.15
  vatAmount: number;
  totalAmount: number;
  paymentMethod: string;
  zatcaStatus: "compliant" | "cleared" | "reported";
  qrPayload: string;
}

export const INITIAL_ADMIN_INVOICES: AdminTaxInvoiceRecord[] = [];

export async function getLiveAdminInvoices(): Promise<AdminTaxInvoiceRecord[]> {
  const results: AdminTaxInvoiceRecord[] = [];
  const seenGuestRefs = new Set<string>();
  const seenHostRefs = new Set<string>();
  const bookingMetaByRef = new Map<
    string,
    { propertyTitle: string; paymentMethod: string; guestName: string; hostName: string }
  >();

  let bookings: any[] = [];
  const profileNameMap = new Map<string, string>();
  const supabase = createAdminDataClient();

  if (supabase) {
    try {
      const { data: bookingRows, error: bookingsError } = await supabase
        .from("bookings")
        .select(
          "id, booking_reference, total_price, total_nights, status, payment_status, created_at, guest_id, auth_subject, payment_method, properties(id, title, category, host_id, base_price)"
        )
        .eq("payment_status", "success")
        .order("created_at", { ascending: false })
        .limit(100);

      if (bookingsError) {
        console.warn("[adminInvoicesService] bookings query error:", bookingsError.message);
      }

      bookings = (bookingRows || []).filter(
        (b: any) => b.status === "confirmed" || b.status === "completed"
      );

      const profileIds = Array.from(
        new Set(
          bookings.flatMap((b: any) => {
            const prop = Array.isArray(b.properties) ? b.properties[0] : b.properties;
            return [b.guest_id, prop?.host_id].filter(Boolean);
          })
        )
      ) as string[];

      if (profileIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", profileIds);
        for (const prof of profiles || []) {
          if (prof.full_name) {
            profileNameMap.set(prof.id, prof.full_name);
          }
        }
      }

      for (const b of bookings) {
        const ref = b.booking_reference || b.id;
        const prop = Array.isArray(b.properties) ? b.properties[0] : b.properties;
        const guestName =
          (b.guest_id && profileNameMap.get(b.guest_id)) || b.auth_subject || ref;
        const hostName =
          (prop?.host_id && profileNameMap.get(prop.host_id)) || "Host Partner";
        bookingMetaByRef.set(ref, {
          propertyTitle: prop?.title || "Reservation",
          paymentMethod: b.payment_method || "Online Payment",
          guestName,
          hostName,
        });
      }
    } catch (err) {
      console.warn("[adminInvoicesService] Supabase bookings lookup notice:", err);
    }
  }

  const feeCfg = getServerPlatformFeeConfig();
  const configuredVatFraction = Math.round(((feeCfg.vatRatePercent ?? 15) / 100) * 10000) / 10000;

  try {
    const auditRecords = getZatcaInvoiceRecords(250);
    for (const rec of auditRecords) {
      const ref = rec.bookingReference || rec.invoiceNumber;
      const isHostCommission = rec.type === "standard";
      if (rec.bookingReference) {
        if (isHostCommission) seenHostRefs.add(rec.bookingReference);
        else seenGuestRefs.add(rec.bookingReference);
      }
      const meta = rec.bookingReference ? bookingMetaByRef.get(rec.bookingReference) : undefined;
      const taxableAmt = Number(rec.taxableAmount) || 0;
      const vatAmt = Number(rec.vatAmount) || 0;
      const computedVatRate =
        taxableAmt > 0 && vatAmt >= 0
          ? Math.round((vatAmt / taxableAmt) * 10000) / 10000
          : configuredVatFraction;
      results.push({
        id: rec.uuid,
        invoiceNumber: rec.invoiceNumber,
        type: isHostCommission ? "host_commission" : "guest_stay",
        issueDate: rec.issueDate,
        bookingReference: ref,
        clientName: rec.buyerName || meta?.guestName || "—",
        clientRole: isHostCommission ? "host" : "guest",
        propertyTitle: meta?.propertyTitle || "Reservation Invoice",
        taxableAmount: taxableAmt,
        vatRate: computedVatRate,
        vatAmount: vatAmt,
        totalAmount: Number(rec.totalWithVat) || 0,
        paymentMethod: meta?.paymentMethod || "MyFatoorah",
        zatcaStatus:
          rec.clearanceStatus === "CLEARED"
            ? "cleared"
            : rec.clearanceStatus === "REPORTED"
            ? "reported"
            : "compliant",
        qrPayload: rec.qrPayload || "",
      });
    }
  } catch (err) {
    console.warn("[adminInvoicesService] audit record lookup notice:", err);
  }

  for (const b of bookings) {
    const ref = b.booking_reference || b.id;
    const total = Math.round((Number(b.total_price) || 0) * 100) / 100;
    if (total <= 0) continue;

    const prop = Array.isArray(b.properties) ? b.properties[0] : b.properties;
    const meta = bookingMetaByRef.get(ref);
    const isoDate = b.created_at || new Date().toISOString();
    const settlement = resolveBookingSettlement({
      bookingId: b.id,
      bookingReference: ref,
      totalPricePaid: total,
      nights: b.total_nights,
      nightlyPrice: prop?.base_price,
      category: prop?.category,
      feeConfig: feeCfg,
    });
    const bookingVatFraction =
      Math.round(((settlement.vatRatePercent ?? feeCfg.vatRatePercent ?? 15) / 100) * 10000) / 10000;

    if (!seenGuestRefs.has(ref)) {
      seenGuestRefs.add(ref);
      const vat = settlement.governmentVatRemittanceSar;
      const taxable = Math.round((total - vat) * 100) / 100;
      results.push({
        id: b.id,
        invoiceNumber: `INV-${ref}`,
        type: "guest_stay",
        issueDate: isoDate.slice(0, 10),
        bookingReference: ref,
        clientName: meta?.guestName || ref,
        clientRole: "guest",
        propertyTitle: meta?.propertyTitle || prop?.title || "—",
        taxableAmount: taxable,
        vatRate: bookingVatFraction,
        vatAmount: vat,
        totalAmount: total,
        paymentMethod: meta?.paymentMethod || b.payment_method || "Online Payment",
        zatcaStatus: "compliant",
        qrPayload: generateZatcaTlvBase64({
          sellerName: QAFNEST_ZATCA_DEFAULTS.sellerNameAr,
          vatNumber: QAFNEST_ZATCA_DEFAULTS.vatNumber,
          timestamp: isoDate,
          totalWithVat: total.toFixed(2),
          vatAmount: vat.toFixed(2),
        }),
      });
    }

    if (!seenHostRefs.has(ref)) {
      seenHostRefs.add(ref);
      const commVat = Math.round(settlement.hostCommissionAmountSar * bookingVatFraction * 100) / 100;
      const totalCommissionWithVat = Math.round((settlement.hostCommissionAmountSar + commVat) * 100) / 100;
      results.push({
        id: `comm-${b.id}`,
        invoiceNumber: `INV-COMM-${ref}`,
        type: "host_commission",
        issueDate: isoDate.slice(0, 10),
        bookingReference: ref,
        clientName: meta?.hostName || "Host Partner",
        clientRole: "host",
        propertyTitle: meta?.propertyTitle || prop?.title || "—",
        taxableAmount: settlement.hostCommissionAmountSar,
        vatRate: bookingVatFraction,
        vatAmount: commVat,
        totalAmount: totalCommissionWithVat,
        paymentMethod: "Platform Commission Deduction",
        zatcaStatus: "compliant",
        qrPayload: generateZatcaTlvBase64({
          sellerName: QAFNEST_ZATCA_DEFAULTS.sellerNameAr,
          vatNumber: QAFNEST_ZATCA_DEFAULTS.vatNumber,
          timestamp: isoDate,
          totalWithVat: totalCommissionWithVat.toFixed(2),
          vatAmount: commVat.toFixed(2),
        }),
      });
    }
  }

  return results;
}

export function generateZatcaJournalCsv(
  invoices: AdminTaxInvoiceRecord[] = INITIAL_ADMIN_INVOICES
): string {
  const headers = [
    "Invoice_Number",
    "Invoice_Type",
    "Issue_Date",
    "Booking_Reference",
    "Client_Name",
    "Client_Role",
    "Property_Title",
    "Taxable_Amount_SAR",
    "VAT_Rate",
    "VAT_Amount_SAR",
    "Total_Amount_SAR",
    "Payment_Method",
    "ZATCA_Status",
  ];

  const rows = invoices.map((inv) => [
    inv.invoiceNumber,
    inv.type,
    inv.issueDate,
    inv.bookingReference,
    `"${(inv.clientName || "").replace(/"/g, '""')}"`,
    inv.clientRole,
    `"${(inv.propertyTitle || "").replace(/"/g, '""')}"`,
    inv.taxableAmount.toFixed(2),
    "15%",
    inv.vatAmount.toFixed(2),
    inv.totalAmount.toFixed(2),
    `"${(inv.paymentMethod || "").replace(/"/g, '""')}"`,
    inv.zatcaStatus.toUpperCase(),
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
}
