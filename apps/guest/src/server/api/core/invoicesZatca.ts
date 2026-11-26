import { NextRequest, NextResponse } from "next/server";
import { verifyGuestSession } from "@/lib/auth/serverAuth";
import { getAdminOrServerClient } from "@/lib/supabase/service";
import { getUserWallet } from "@/lib/services/walletService";
import {
  findZatcaInvoiceRecord,
  getServerZatcaConfig,
  reportInvoiceToZatca,
} from "@qafnest/shared/zatcaStore";
import {
  dispatchBookingZatcaInvoice,
  dispatchWalletTopupZatcaInvoice,
} from "@/lib/services/zatcaReportingHelper";

export async function GET(request: NextRequest) {
  const authUser = await verifyGuestSession(request);
  if (!authUser) {
    return NextResponse.json({ code: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const uuid = searchParams.get("uuid") || undefined;
  const invoiceNumber = searchParams.get("invoiceNumber") || undefined;
  const ref = searchParams.get("ref") || undefined;

  const existing = findZatcaInvoiceRecord({
    uuid,
    invoiceNumber,
    bookingReference: ref,
  });

  if (!existing) {
    return NextResponse.json({
      success: true,
      found: false,
      environment: getServerZatcaConfig().environment,
    });
  }

  const lookupRef = existing.bookingReference || ref;
  let isAuthorized = authUser.role === "admin";
  if (!isAuthorized && lookupRef) {
    if (lookupRef.startsWith("TOPUP-")) {
      const wallet = await getUserWallet(authUser.id);
      isAuthorized = wallet.transactions.some((tx) => tx.reference === lookupRef);
    } else {
      const dbClient = await getAdminOrServerClient();
      const { data: booking } = await dbClient
        .from("bookings")
        .select("guest_id, auth_subject")
        .eq("booking_reference", lookupRef)
        .maybeSingle();
      if (booking) {
        isAuthorized = Boolean(
          booking.guest_id === authUser.id ||
          booking.auth_subject === authUser.id ||
          (authUser.isPhoneVerified && authUser.phone && booking.auth_subject === authUser.phone)
        );
      }
    }
  }

  if (!isAuthorized) {
    return NextResponse.json({ code: "forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    success: true,
    found: true,
    record: {
      uuid: existing.uuid,
      invoiceNumber: existing.invoiceNumber,
      bookingReference: existing.bookingReference,
      icv: existing.icv,
      environment: existing.environment,
      clearanceStatus: existing.clearanceStatus,
      validationStatus: existing.validationStatus,
      httpStatus: existing.httpStatus,
      invoiceHash: existing.invoiceHash,
      qrPayload: existing.qrPayload,
      signedXml: existing.signedXml,
      reportedAt: existing.reportedAt,
      requestId: existing.requestId,
      validationMessages: existing.validationMessages,
    },
  });
}

export async function POST(request: NextRequest) {
  const authUser = await verifyGuestSession(request);
  if (!authUser) {
    return NextResponse.json({ code: "unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      kind?: "booking" | "wallet";
      id?: string;
      reference?: string;
      invoiceNumber?: string;
      propertyTitle?: string;
    };

    const dbClient = await getAdminOrServerClient();
    const isUuidId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(body.id || ""));

    if (body.kind === "booking" && (body.id || body.reference)) {
      const q = dbClient
        .from("bookings")
        .select("id, booking_reference, property_id, total_price, status, payment_status, guest_id, auth_subject, payment_method")
        .limit(1);
      const { data: booking } = await (isUuidId && body.id
        ? q.eq("id", body.id)
        : q.eq("booking_reference", body.reference || body.id || "")
      ).maybeSingle();

      if (!booking) {
        return NextResponse.json({ code: "booking_not_found" }, { status: 404 });
      }

      const ownsBooking =
        booking.guest_id === authUser.id ||
        booking.auth_subject === authUser.id ||
        (authUser.isPhoneVerified && authUser.phone && booking.auth_subject === authUser.phone);

      if (!ownsBooking && authUser.role !== "admin") {
        return NextResponse.json({ code: "forbidden" }, { status: 403 });
      }

      const existing = findZatcaInvoiceRecord({
        uuid: booking.id,
        invoiceNumber: body.invoiceNumber,
        bookingReference: booking.booking_reference,
      });

      if (
        existing &&
        (existing.clearanceStatus === "REPORTED" || existing.clearanceStatus === "CLEARED")
      ) {
        return NextResponse.json({
          success: true,
          alreadyReported: true,
          record: existing,
        });
      }

      const total = Number(booking.total_price) || 0;
      const isPaid =
        booking.payment_status === "success" ||
        ["confirmed", "checked_in", "completed"].includes(String(booking.status || "").toLowerCase());

      if (total <= 0 || !isPaid) {
        return NextResponse.json(
          { code: "not_eligible_for_tax_invoice", message: "Only real paid transactions can be reported to ZATCA." },
          { status: 400 }
        );
      }

      let dbPropertyTitle = "QafNest Stay Accommodation";
      if (booking.property_id) {
        const { data: propRow } = await dbClient
          .from("properties")
          .select("title")
          .eq("id", booking.property_id)
          .maybeSingle();
        if (propRow?.title) {
          dbPropertyTitle = String(propRow.title).trim();
        }
      }

      const result = await dispatchBookingZatcaInvoice({
        bookingId: booking.id,
        bookingRef: booking.booking_reference || booking.id.slice(0, 8).toUpperCase(),
        totalWithVat: total,
        buyerName: authUser.name || "Valued Guest Customer",
        propertyTitle: dbPropertyTitle,
        paymentMethod: booking.payment_method || "card",
      });

      const saved = findZatcaInvoiceRecord({ uuid: booking.id });
      return NextResponse.json({
        success: Boolean(result?.success),
        record: saved || result,
      });
    }

    if (body.kind === "wallet" && (body.id || body.reference)) {
      const wallet = await getUserWallet(authUser.id);
      const tx = wallet.transactions.find(
        (t) =>
          (body.id && t.id === body.id) ||
          (body.reference && t.reference === body.reference)
      );

      if (!tx) {
        return NextResponse.json({ code: "transaction_not_found" }, { status: 404 });
      }

      const rawAmount = Math.abs(Number(tx.amount) || 0);
      const isMonetary =
        rawAmount > 0 &&
        (tx.type === "topup" || tx.type === "booking_payment" || tx.type === "refund");

      if (!isMonetary) {
        return NextResponse.json(
          { code: "points_excluded", message: "Non-monetary reward/redemption transactions are excluded from ZATCA." },
          { status: 400 }
        );
      }

      const cleanRef = tx.reference.replace(/[^A-Za-z0-9]/g, "-").toUpperCase();
      const invoiceNumber = cleanRef.startsWith("INV-") ? cleanRef : `INV-${cleanRef}`;

      let result;
      if (tx.type === "refund") {
        const taxable = Math.round((rawAmount / 1.15) * 100) / 100;
        const vat = Math.round((rawAmount - taxable) * 100) / 100;
        result = await reportInvoiceToZatca({
          invoiceId: tx.id,
          invoiceNumber,
          bookingReference: tx.reference,
          buyerName: authUser.name || "Valued Guest Account",
          lineItems: [
            {
              name: tx.titleEn || "Booking Refund Credit Note",
              quantity: 1,
              unitPrice: taxable,
              subtotal: taxable,
              vatRate: 0.15,
              vatAmount: vat,
              total: rawAmount,
            },
          ],
          taxableAmount: taxable,
          vatAmount: vat,
          totalWithVat: rawAmount,
          type: "simplified",
          invoiceTypeCode: "381", // ZATCA Credit Note for Refund
          billingReferenceId: tx.reference,
          paymentMeansCode: "42",
        });
      } else {
        result = await dispatchWalletTopupZatcaInvoice({
          transactionId: tx.id,
          reference: tx.reference,
          amount: rawAmount,
          buyerName: authUser.name || "Valued Guest Account",
          paymentMethod: tx.paymentMethod || "card",
        });
      }

      const saved = findZatcaInvoiceRecord({ invoiceNumber });
      return NextResponse.json({
        success: Boolean(result?.success),
        record: saved || result,
      });
    }

    return NextResponse.json({ code: "invalid_request" }, { status: 400 });
  } catch (err: unknown) {
    console.error("[invoicesZatca POST] error:", err);
    return NextResponse.json(
      { code: "server_error", message: "Failed to verify ZATCA invoice." },
      { status: 500 }
    );
  }
}
