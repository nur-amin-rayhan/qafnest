import { NextRequest, NextResponse } from "next/server";
import { getAdminOrServerClient } from "@/lib/supabase/service";
import { getMyFatoorahPaymentStatus, verifyMyFatoorahSignature, extractPaidAmount } from "@/lib/services/myfatoorah";
import { recordCouponUsage } from "@/lib/services/couponService";
import {
  awardLoyaltyPoints,
  autoSaveCardFromInvoiceTransaction,
  verifyAndSettleBookingPaymentAmount,
  clearPendingWalletSplit,
} from "@/lib/services/walletService";
import { dispatchBookingZatcaInvoice } from "@/lib/services/zatcaReportingHelper";
import { getBookingFinancialSnapshot } from "@qafnest/shared/bookingFinancialsStore";
import {
  DEFAULT_CHECKIN_TIME,
  DEFAULT_CHECKOUT_TIME,
  doTimeSlotsOverlap,
} from "@qafnest/shared";

// Smart lock PINs are assigned manually by property hosts

export async function POST(request: NextRequest) {
  // 1. HMAC Signature Verification (SEC-04)
  const webhookSecret = process.env.MYFATOORAH_WEBHOOK_SECRET?.trim();
  const rawBody = await request.text();

  if (webhookSecret) {
    const signature =
      request.headers.get("myfatoorah-signature") ||
      request.headers.get("MyFatoorah-Signature");

    if (!verifyMyFatoorahSignature(rawBody, signature, webhookSecret)) {
      console.warn("[SECURITY ALERT] Unauthorized MyFatoorah webhook attempt: invalid or missing signature.");
      return NextResponse.json(
        { code: "unauthorized", message: "Invalid webhook signature." },
        { status: 401 }
      );
    }
  }

  let body: Record<string, unknown> = {};
  try {
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const params = new URLSearchParams(rawBody);
      params.forEach((val, key) => {
        body[key] = val;
      });
    } else {
      body = (rawBody ? JSON.parse(rawBody) : {}) as Record<string, unknown>;
    }
  } catch (parseErr) {
    console.error("Webhook payload parse error:", parseErr);
    return NextResponse.json({ code: "invalid_payload" }, { status: 400 });
  }

  const dataObj = (body.Data && typeof body.Data === "object" ? body.Data : body) as Record<string, unknown>;

  const paymentId =
    dataObj.PaymentId ||
    dataObj.paymentId ||
    dataObj.Id ||
    dataObj.id ||
    body.PaymentId ||
    body.paymentId;

  let bookingRef = String(
    dataObj.CustomerReference ||
    dataObj.customerReference ||
    dataObj.bookingRef ||
    body.CustomerReference ||
    body.bookingRef ||
    ""
  ).trim();

  if (!paymentId) {
    return NextResponse.json(
      { code: "missing_payment_id", message: "Webhook payload missing payment identifier." },
      { status: 400 }
    );
  }

  try {
    // 2. Authoritative transaction status verification via MyFatoorah API
    const statusResult = await getMyFatoorahPaymentStatus(String(paymentId), "PaymentId");
    const invoiceData = statusResult.Data;
    const isPaid =
      statusResult.IsSuccess &&
      (invoiceData?.InvoiceStatus === "Paid" ||
        invoiceData?.InvoiceTransactions?.some(
          (t) => t.TransactionStatus === "Succss" || t.TransactionStatus === "Success"
        ));

    if (!bookingRef && invoiceData?.CustomerReference) {
      bookingRef = invoiceData.CustomerReference.trim();
    }

    if (!bookingRef) {
      return NextResponse.json(
        { code: "missing_booking_reference", message: "Could not correlate transaction to booking." },
        { status: 422 }
      );
    }

    const dbClient = await getAdminOrServerClient();

    // 3. Fetch current booking record (standard RFC UUID pattern)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bookingRef);
    let selectQuery = dbClient
      .from("bookings")
      .select("id, status, payment_status, property_id, total_price, check_in, check_out, smart_lock_pin, booking_reference, guest_id, auth_subject");

    selectQuery = isUuid
      ? selectQuery.eq("id", bookingRef)
      : selectQuery.eq("booking_reference", bookingRef);

    const { data: existingBooking, error: fetchErr } = await selectQuery.maybeSingle();

    if (fetchErr || !existingBooking) {
      console.warn("Webhook booking lookup failed:", { fetchErr, bookingRef, found: Boolean(existingBooking) });
      return NextResponse.json({ code: "booking_not_found" }, { status: 404 });
    }

    // 4. Process State Transition
    if (isPaid && invoiceData) {
      // IDEMPOTENCY GUARD (SEC-02): If already confirmed by callback, return immediately without re-processing
      if (existingBooking.status === "confirmed" && existingBooking.payment_status === "success") {
        return NextResponse.json({ success: true, message: "Booking already confirmed." });
      }

      // SEC-06: Handling In-Flight Payment Reconciliation Race
      // If booking was prematurely marked 'cancelled' by reconciliation timeout while guest was completing payment:
      if (existingBooking.status === "cancelled") {
        const { data: candidateConflicts } = await dbClient
          .from("bookings")
          .select("id, check_in, check_out")
          .eq("property_id", existingBooking.property_id)
          .in("status", ["confirmed", "completed"])
          .neq("id", existingBooking.id)
          .lte("check_in", existingBooking.check_out)
          .gte("check_out", existingBooking.check_in);

        const hasSlotConflict = (candidateConflicts || []).some((c) =>
          doTimeSlotsOverlap(
            {
              checkIn: existingBooking.check_in,
              checkOut: existingBooking.check_out,
              checkinTime: DEFAULT_CHECKIN_TIME,
              checkoutTime: DEFAULT_CHECKOUT_TIME,
            },
            {
              checkIn: c.check_in,
              checkOut: c.check_out,
              checkinTime: DEFAULT_CHECKIN_TIME,
              checkoutTime: DEFAULT_CHECKOUT_TIME,
            }
          )
        );

        if (hasSlotConflict) {
          console.error(`[CRITICAL OVERBOOKING CONFLICT] Webhook: late payment for timed-out booking ${bookingRef}, but property rebooked! Immediate refund required.`);
          return NextResponse.json(
            { code: "overbooked_refund_required", message: "Property was booked during checkout timeout. Refund required." },
            { status: 409 }
          );
        }
        console.log(`[RECONCILIATION RESURRECTION] Webhook: resurrecting timed-out booking ${bookingRef} to confirmed.`);
      }

      // AMOUNT VALIDATION (SEC-01) & SPLIT SETTLEMENT
      const paidAmount = extractPaidAmount(invoiceData);
      const expectedAmount = Number(existingBooking.total_price);
      const assignedPin = existingBooking.smart_lock_pin || null;
      const gatewayName = invoiceData.InvoiceTransactions?.[0]?.PaymentGateway || "MyFatoorah";
      const targetRef = existingBooking.booking_reference || bookingRef;

      const paymentVerification = await verifyAndSettleBookingPaymentAmount({
        bookingRef: targetRef,
        expectedBookingTotal: expectedAmount,
        gatewayPaidAmount: paidAmount,
        gatewayName,
      });
      if (!paymentVerification.ok) {
        console.error(`[SECURITY ALERT] Webhook ${paymentVerification.message} (booking ${bookingRef})`);
        clearPendingWalletSplit(targetRef);
        return NextResponse.json(
          { code: paymentVerification.code, message: paymentVerification.message },
          { status: 422 }
        );
      }

      // Execute authoritative confirmation RPC
      const { data: rpcData, error: rpcError } = await dbClient.rpc("confirm_verified_booking", {
        p_booking_ref: targetRef,
        p_payment_id: String(paymentId),
        p_gateway: paymentVerification.effectiveGatewayLabel,
        p_amount: paymentVerification.totalConfirmedAmount,
        p_pin: assignedPin,
      });

      const rpcResult = rpcData as { success?: boolean; error?: string; already_confirmed?: boolean } | null;

      if (rpcResult && rpcResult.success === false) {
        if (rpcResult.error === "amount_mismatch") {
          return NextResponse.json({ code: "amount_mismatch", message: "Payment amount mismatch." }, { status: 422 });
        }
        if (rpcResult.error === "booking_already_paid") {
          return NextResponse.json({ success: true, message: "Booking already confirmed." });
        }
      }

      let wasConfirmedByThisProcess = Boolean(rpcResult && rpcResult.success && !rpcResult.already_confirmed);

      // Fallback only if RPC encountered unexpected infrastructure error
      if (rpcError && !rpcResult) {
        const { data: updatedBooking, error: updateErr } = await dbClient
          .from("bookings")
          .update({
            status: "confirmed",
            payment_status: "success",
            payment_id: String(paymentId),
            payment_method: paymentVerification.effectiveGatewayLabel,
            smart_lock_pin: assignedPin,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingBooking.id)
          .in("status", ["pending", "cancelled"]) // ATOMIC CAS LOCK: Transition from pending or timed-out cancelled
          .select()
          .maybeSingle();

        if (updateErr) {
          console.error("Webhook database update failed:", updateErr);
          return NextResponse.json({ code: "update_failed" }, { status: 500 });
        }

        if (updatedBooking) {
          wasConfirmedByThisProcess = true;
        }
      }

      // Side effects (only if this process performed the state flip)
      if (wasConfirmedByThisProcess) {
        // Safely record coupon usage if coupon_code exists
        // bookings table stores final net total_price without a coupon_code column in production schema

        // Award loyalty points & auto-save card to digital wallet
        try {
          const guestIdentifier = existingBooking.guest_id || (existingBooking as { auth_subject?: string }).auth_subject;
          if (guestIdentifier) {
            await awardLoyaltyPoints({
              userId: String(guestIdentifier),
              amountSpent: paymentVerification.totalConfirmedAmount,
              bookingRef,
              isWalletPayment: paymentVerification.isSplit,
            }).catch(() => {});

            const primaryTx = (invoiceData.InvoiceTransactions?.[0] || {}) as Record<string, unknown>;
            await autoSaveCardFromInvoiceTransaction({
              userId: String(guestIdentifier),
              customerName: invoiceData.CustomerName,
              gatewayName,
              primaryTx,
            });
          }
        } catch (walletErr) {
          console.warn("Notice: Webhook wallet side-effect error:", walletErr);
        }

        // Lock overnight property dates in property_availability (skip same-day 12h slots)
        if (existingBooking.property_id && existingBooking.check_in && existingBooking.check_out) {
          try {
            const startMs = Date.parse(`${existingBooking.check_in}T00:00:00.000Z`);
            const endMs = Date.parse(`${existingBooking.check_out}T00:00:00.000Z`);
            const numNights = Math.round((endMs - startMs) / 86_400_000);
            if (numNights > 0) {
              const rowsToUpsert = [];
              for (let i = 0; i < numNights; i++) {
                const dayDate = new Date(startMs + i * 86_400_000).toISOString().slice(0, 10);
                rowsToUpsert.push({
                  property_id: existingBooking.property_id,
                  date: dayDate,
                  is_available: false,
                  updated_at: new Date().toISOString(),
                });
              }
              await dbClient.from("property_availability").upsert(rowsToUpsert, {
                onConflict: "property_id,date",
              });
            }
          } catch (lockErr) {
            console.warn("Webhook lock availability notice:", lockErr);
          }
        }

        // Trigger host notification
        try {
          const { data: propData } = await dbClient
            .from("properties")
            .select("host_id, title")
            .eq("id", existingBooking.property_id)
            .single();

          if (propData && propData.host_id) {
            await dbClient.from("host_notifications").insert({
              host_id: propData.host_id,
              property_id: existingBooking.property_id,
              booking_id: existingBooking.id,
              event_type: "booking_confirmed",
              title: "حجز جديد مؤكد! 🎉",
              body: `تم تأكيد حجز جديد لـ ${propData.title} بقيمة ${existingBooking.total_price} ر.س للفترة من ${existingBooking.check_in} إلى ${existingBooking.check_out}.`,
              is_read: false,
            });
          }
        } catch {}

        // Report verified booking tax invoice to ZATCA Phase 2 API
        const finSnap = getBookingFinancialSnapshot(existingBooking.booking_reference || bookingRef) || getBookingFinancialSnapshot(existingBooking.id);
        await dispatchBookingZatcaInvoice({
          bookingId: existingBooking.id,
          bookingRef: existingBooking.booking_reference || bookingRef,
          totalWithVat: paymentVerification.totalConfirmedAmount,
          taxableAmount: finSnap?.taxableSubtotalSar,
          vatAmount: finSnap?.vatAmountSar,
          buyerName: invoiceData.CustomerName || "Valued Guest",
          propertyTitle: "Vacation Rental Accommodation",
          paymentMethod: paymentVerification.effectiveGatewayLabel,
        });
      }

      return NextResponse.json({
        success: true,
        status: "confirmed",
        payment_status: "success",
        booking_reference: bookingRef,
      });
    } else {
      // PREVENT AUTOMATIC CANCELLATION FOR PAID BOOKINGS
      if (existingBooking.status === "confirmed" && existingBooking.payment_status === "success") {
        console.warn("Ignoring failed/cancelled webhook for already confirmed paid booking:", bookingRef);
        return NextResponse.json({
          success: true,
          message: "Ignored failure webhook for already confirmed reservation.",
          status: existingBooking.status,
          payment_status: existingBooking.payment_status,
        });
      }

      // Only transition to cancelled if the reservation was still in pending / initiated state
      clearPendingWalletSplit(existingBooking.booking_reference || bookingRef);
      await dbClient
        .from("bookings")
        .update({
          status: "cancelled",
          payment_status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingBooking.id)
        .eq("status", "pending")
        .eq("payment_status", "initiated");

      return NextResponse.json({
        success: true,
        status: "cancelled",
        payment_status: "failed",
        booking_reference: bookingRef,
      });
    }
  } catch (err: unknown) {
    console.error("MyFatoorah webhook exception:", err);
    return NextResponse.json(
      { code: "server_error", message: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
