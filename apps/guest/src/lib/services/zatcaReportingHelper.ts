import { getServerZatcaConfig, reportInvoiceToZatca } from "@qafnest/shared/zatcaStore";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function dispatchBookingZatcaInvoice(params: {
  bookingId: string;
  bookingRef: string;
  totalWithVat: number;
  taxableAmount?: number;
  vatAmount?: number;
  buyerName?: string;
  propertyTitle?: string;
  paymentMethod?: string;
}) {
  const total = round2(Number(params.totalWithVat) || 0);
  if (total <= 0) return null;

  try {
    const zConfig = getServerZatcaConfig();
    if (!zConfig.autoReport) return null;

    const taxable =
      typeof params.taxableAmount === "number" && params.taxableAmount > 0
        ? round2(params.taxableAmount)
        : round2(total / (1 + (zConfig.vatRate || 0.15)));
    const vat =
      typeof params.vatAmount === "number" && params.vatAmount >= 0
        ? round2(params.vatAmount)
        : round2(total - taxable);

    const invoiceNumber = params.bookingRef.startsWith("INV-")
      ? params.bookingRef
      : `INV-${params.bookingRef.toUpperCase()}`;

    // Map payment method to UNCL 4461 payment means code (48 = Bank card, 42 = Payment to bank/wallet, 10 = Cash)
    const pm = (params.paymentMethod || "").toLowerCase();
    const paymentMeansCode = pm.includes("wallet") ? "42" : "48";

    return await reportInvoiceToZatca({
      invoiceId: params.bookingId,
      invoiceNumber,
      bookingReference: params.bookingRef,
      buyerName: params.buyerName || "Valued Guest Customer",
      lineItems: [
        {
          name: params.propertyTitle || "Vacation Rental Accommodation",
          quantity: 1,
          unitPrice: taxable,
          subtotal: taxable,
          vatRate: zConfig.vatRate || 0.15,
          vatAmount: vat,
          total,
        },
      ],
      taxableAmount: taxable,
      vatAmount: vat,
      totalWithVat: total,
      type: "simplified",
      invoiceTypeCode: "388",
      paymentMeansCode,
    });
  } catch (err) {
    console.warn("[ZATCA Booking Reporting Notice]:", err);
    return null;
  }
}

export async function dispatchWalletTopupZatcaInvoice(params: {
  transactionId?: string;
  reference: string;
  amount: number;
  buyerName?: string;
  paymentMethod?: string;
}) {
  const total = round2(Number(params.amount) || 0);
  if (total <= 0) return null;

  try {
    const zConfig = getServerZatcaConfig();
    if (!zConfig.autoReport) return null;

    const taxable = round2(total / (1 + (zConfig.vatRate || 0.15)));
    const vat = round2(total - taxable);
    const cleanRef = params.reference.replace(/[^A-Za-z0-9]/g, "-").toUpperCase();
    const invoiceNumber = cleanRef.startsWith("INV-") ? cleanRef : `INV-${cleanRef}`;

    return await reportInvoiceToZatca({
      invoiceId: params.transactionId || params.reference,
      invoiceNumber,
      bookingReference: params.reference,
      buyerName: params.buyerName || "Valued Guest Account",
      lineItems: [
        {
          name: "QafNest Wallet Credit Top-Up / شحن رصيد محفظة قاف نست",
          quantity: 1,
          unitPrice: taxable,
          subtotal: taxable,
          vatRate: zConfig.vatRate || 0.15,
          vatAmount: vat,
          total,
        },
      ],
      taxableAmount: taxable,
      vatAmount: vat,
      totalWithVat: total,
      type: "simplified",
      invoiceTypeCode: "388",
      paymentMeansCode: "48",
    });
  } catch (err) {
    console.warn("[ZATCA Topup Reporting Notice]:", err);
    return null;
  }
}
