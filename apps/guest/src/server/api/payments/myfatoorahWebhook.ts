import { NextRequest, NextResponse } from "next/server";
import { getAdminOrServerClient } from "@/lib/supabase/service";
import { getMyFatoorahPaymentStatus, verifyMyFatoorahSignature, extractPaidAmount } from "@/lib/services/myfatoorah";
import { recordCouponUsage } from "@/lib/services/couponService";
import {
  awardLoyaltyPoints,
  autoSaveCardFromInvoiceTransaction,
  verifyAndSettleBookingPaymentAmount,
  clearPendingWalletSplit,
  refundSettledWalletSplit,
} from "@/lib/services/walletService";
import { dispatchBookingZatcaInvoice } from "@/lib/services/zatcaReportingHelper";
import {
  getBookingFinancialSnapshot,
  hydrateBookingFinancialsStore,
} from "@qafnest/shared/bookingFinancialsStore";
import {
  createBookingRefundRecord,
  hydrateBookingRefundStore,
  persistBookingRefundStore,
} from "@qafnest/shared/bookingRefundStore";
import { acquirePropertyBookingLock } from "@qafnest/shared/bookingSlotStore";
import {
  DEFAULT_CHECKIN_TIME,
  DEFAULT_CHECKOUT_TIME,
  doTimeSlotsOverlap,
} from "@qafnest/shared";

// Smart lock PINs are assigned manually by property hosts

export async function POST(request: NextRequest) {
  // 1. HMAC Signature Verification (SEC-04) — fail closed in production when secret missing
  const webhookSecret = process.env.MYFATOORAH_WEBHOOK_SECRET?.trim();
  const rawBody = await request.text();

  if (!webhookSecret && process.env.NODE_ENV === "production") {
    console.error("[SECURITY ALERT] MYFATOORAH_WEBHOOK_SECRET is missing in production.");
    return NextResponse.json(
      { code: "webhook_not_configured", message: "Webhook verification is not configured." },
      { status: 503 }
    );
  }

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

    const gatewayCustomerRef = String(invoiceData?.CustomerReference || "").trim();
    if (!bookingRef && gatewayCustomerRef) {
      bookingRef = gatewayCustomerRef;
    } else if (bookingRef && gatewayCustomerRef && bookingRef !== gatewayCustomerRef) {
      return NextResponse.json(
        { code: "reference_mismatch", message: "Payment transaction reference does not match booking reference." },
        { status: 422 }
      );
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
    let initialSelectQuery = dbClient
      .from("bookings")
      .select("id, property_id, status, payment_status, booking_reference");

    initialSelectQuery = isUuid
      ? initialSelectQuery.eq("id", bookingRef)
      : initialSelectQuery.eq("booking_reference", bookingRef);

    const { data: initialBooking, error: initialFetchErr } = await initialSelectQuery.maybeSingle();

    if (initialFetchErr || !initialBooking) {
      console.warn("Webhook booking lookup failed:", { initialFetchErr, bookingRef, found: Boolean(initialBooking) });
      return NextResponse.json({ code: "booking_not_found" }, { status: 404 });
    }

    // 4. Process State Transition atomically under property lock
    if (isPaid && invoiceData) {
      return await acquirePropertyBookingLock([initialBooking.property_id], async () => {
        const primaryBookingQuery = await dbClient
          .from("bookings")
          .select("id, status, payment_status, property_id, total_price, check_in, check_out, checkin_time, checkout_time, smart_lock_pin, booking_reference, guest_id, auth_subject")
          .eq("id", initialBooking.id)
          .maybeSingle();

        let existingBookingRaw: Record<string, unknown> | null = primaryBookingQuery.data as Record<string, unknown> | null;
        let bookingFetchError = primaryBookingQuery.error;

        if (
          bookingFetchError &&
          (bookingFetchError.code === "42703" ||
            /checkin_time|checkout_time|column .* does not exist/i.test(bookingFetchError.message || ""))
        ) {
          const legacyBookingQuery = await dbClient
            .from("bookings")
            .select("id, status, payment_status, property_id, total_price, check_in, check_out, smart_lock_pin, booking_reference, guest_id, auth_subject")
            .eq("id", initialBooking.id)
            .maybeSingle();
          existingBookingRaw = legacyBookingQuery.data as Record<string, unknown> | null;
          bookingFetchError = legacyBookingQuery.error;
        }

        if (bookingFetchError) {
          console.error("Webhook booking lookup DB error inside lock:", {
            bookingRef,
            code: bookingFetchError.code,
            message: bookingFetchError.message,
          });
          return NextResponse.json(
            { code: "booking_fetch_error", message: "Failed to look up booking." },
            { status: 500 }
          );
        }

        if (!existingBookingRaw) {
          return NextResponse.json({ code: "booking_not_found" }, { status: 404 });
        }

        const existingBooking = existingBookingRaw as {
          id: string;
          status: string;
          payment_status: string;
          property_id: string;
          total_price: number;
          check_in: string;
          check_out: string;
          checkin_time?: string | null;
          checkout_time?: string | null;
          smart_lock_pin?: string | null;
          booking_reference?: string | null;
          guest_id?: string | null;
          auth_subject?: string | null;
        };

        if (existingBooking.status === "confirmed" && existingBooking.payment_status === "success") {
          try {
            const guestIdentifier = existingBooking.guest_id || existingBooking.auth_subject;
            if (guestIdentifier) {
              const gatewayName = invoiceData.InvoiceTransactions?.[0]?.PaymentGateway || "MyFatoorah";
              const primaryTx = (invoiceData.InvoiceTransactions?.[0] || {}) as Record<string, unknown>;
              await autoSaveCardFromInvoiceTransaction({
                userId: String(guestIdentifier),
                customerName: invoiceData.CustomerName,
                gatewayName,
                primaryTx,
              });
            }
          } catch {}
          return NextResponse.json({ success: true, message: "Booking already confirmed." });
        }

        if (existingBooking.status === "cancelled") {
          const primaryConflicts = await dbClient
            .from("bookings")
            .select("id, check_in, check_out, checkin_time, checkout_time")
            .eq("property_id", existingBooking.property_id)
            .in("status", ["confirmed", "checked_in", "completed"])
            .neq("id", existingBooking.id)
            .lte("check_in", existingBooking.check_out)
            .gte("check_out", existingBooking.check_in);

          let candidateConflicts = primaryConflicts.data as Array<Record<string, unknown>> | null;
          if (
            primaryConflicts.error &&
            (primaryConflicts.error.code === "42703" ||
              /checkin_time|checkout_time|column .* does not exist/i.test(primaryConflicts.error.message || ""))
          ) {
            const legacyConflicts = await dbClient
              .from("bookings")
              .select("id, check_in, check_out")
              .eq("property_id", existingBooking.property_id)
              .in("status", ["confirmed", "checked_in", "completed"])
              .neq("id", existingBooking.id)
              .lte("check_in", existingBooking.check_out)
              .gte("check_out", existingBooking.check_in);
            candidateConflicts = legacyConflicts.data as Array<Record<string, unknown>> | null;
          }

          const hasSlotConflict = (candidateConflicts || []).some((c) => {
            return doTimeSlotsOverlap(
              {
                checkIn: existingBooking.check_in,
                checkOut: existingBooking.check_out,
                checkinTime: existingBooking.checkin_time ? String(existingBooking.checkin_time).slice(0, 5) : DEFAULT_CHECKIN_TIME,
                checkoutTime: existingBooking.checkout_time ? String(existingBooking.checkout_time).slice(0, 5) : DEFAULT_CHECKOUT_TIME,
              },
              {
                checkIn: String(c.check_in || ""),
                checkOut: String(c.check_out || ""),
                checkinTime: c.checkin_time ? String(c.checkin_time).slice(0, 5) : DEFAULT_CHECKIN_TIME,
                checkoutTime: c.checkout_time ? String(c.checkout_time).slice(0, 5) : DEFAULT_CHECKOUT_TIME,
              }
            );
          });

          let hasBlockedNight = false;
          if (!hasSlotConflict && existingBooking.check_out > existingBooking.check_in) {
            const { data: blockedRows } = await dbClient
              .from("property_availability")
              .select("date")
              .eq("property_id", existingBooking.property_id)
              .eq("is_available", false)
              .gte("date", existingBooking.check_in)
              .lt("date", existingBooking.check_out)
              .limit(1);
            hasBlockedNight = Boolean(blockedRows && blockedRows.length > 0);
          }

          if (hasSlotConflict || hasBlockedNight) {
            const ref = existingBooking.booking_reference || bookingRef;
            const gatewayPaid = extractPaidAmount(invoiceData);
            await refundSettledWalletSplit(ref, "Late webhook conflict after reservation timeout");
            await clearPendingWalletSplit(ref);
            await hydrateBookingRefundStore();
            createBookingRefundRecord({
              bookingRef: ref,
              guestId: existingBooking.guest_id ? String(existingBooking.guest_id) : undefined,
              totalBookingPrice: Number(existingBooking.total_price || gatewayPaid),
              refundAmount: gatewayPaid,
              refundPercentage: 100,
              penaltyAmount: 0,
              cancellationReason: "Automatic refund queued: dates became unavailable before webhook settlement.",
              actor: "admin",
              policyTier: "admin_override",
              refundMethod: "original_card",
            });
            await persistBookingRefundStore();
            try {
              await dbClient
                .from("bookings")
                .update({
                  status: "refund_requested",
                  payment_id: String(paymentId),
                  updated_at: new Date().toISOString(),
                })
                .eq("id", existingBooking.id);
            } catch {}
            return NextResponse.json(
              { code: "overbooked_refund_required", message: "Property was booked during checkout timeout. Refund queued." },
              { status: 409 }
            );
          }
        }

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
          await refundSettledWalletSplit(targetRef, paymentVerification.message);
          await clearPendingWalletSplit(targetRef);
          return NextResponse.json(
            { code: paymentVerification.code, message: paymentVerification.message },
            { status: 422 }
          );
        }

        const { data: rpcData, error: rpcError } = await dbClient.rpc("confirm_verified_booking", {
          p_booking_ref: targetRef,
          p_payment_id: String(paymentId),
          p_gateway: paymentVerification.effectiveGatewayLabel,
          p_amount: paymentVerification.totalConfirmedAmount,
          p_pin: assignedPin,
        });

        const rpcResult = rpcData as { success?: boolean; error?: string; already_confirmed?: boolean } | null;

        if (rpcResult && rpcResult.success === false) {
          if (rpcResult.error === "booking_already_paid") {
            return NextResponse.json({ success: true, message: "Booking already confirmed." });
          }
          await refundSettledWalletSplit(targetRef, `Webhook confirmation rejected (${rpcResult.error || "conflict"})`);
          await clearPendingWalletSplit(targetRef);
          if (rpcResult.error === "booking_slot_overlap" || rpcResult.error === "property_date_blocked") {
            await hydrateBookingRefundStore();
            createBookingRefundRecord({
              bookingRef: targetRef,
              guestId: existingBooking.guest_id ? String(existingBooking.guest_id) : undefined,
              totalBookingPrice: Number(existingBooking.total_price || paidAmount),
              refundAmount: paidAmount,
              refundPercentage: 100,
              penaltyAmount: 0,
              cancellationReason: `Automatic refund queued due to atomic booking conflict (${rpcResult.error}).`,
              actor: "admin",
              policyTier: "admin_override",
              refundMethod: "original_card",
            });
            await persistBookingRefundStore();
            try {
              await dbClient
                .from("bookings")
                .update({ status: "refund_requested", payment_id: String(paymentId), updated_at: new Date().toISOString() })
                .eq("id", existingBooking.id);
            } catch {}
          }
          return NextResponse.json(
            { code: rpcResult.error || "confirmation_rejected", message: "Payment verification conflict." },
            { status: rpcResult.error === "booking_slot_overlap" ? 409 : 422 }
          );
        }

        let wasConfirmedByThisProcess = Boolean(rpcResult && rpcResult.success && !rpcResult.already_confirmed);

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
            .in("status", ["pending", "cancelled"])
            .select()
            .maybeSingle();

          if (updateErr || !updatedBooking) {
            await refundSettledWalletSplit(targetRef, "Database confirmation conflict");
            await clearPendingWalletSplit(targetRef);
            await hydrateBookingRefundStore();
            createBookingRefundRecord({
              bookingRef: targetRef,
              guestId: existingBooking.guest_id ? String(existingBooking.guest_id) : undefined,
              totalBookingPrice: Number(existingBooking.total_price || paidAmount),
              refundAmount: paidAmount,
              refundPercentage: 100,
              penaltyAmount: 0,
              cancellationReason: "Automatic refund queued due to webhook confirmation conflict.",
              actor: "admin",
              policyTier: "admin_override",
              refundMethod: "original_card",
            });
            await persistBookingRefundStore();
            return NextResponse.json({ code: "booking_slot_overlap" }, { status: 409 });
          }

          wasConfirmedByThisProcess = true;
        }

        if (wasConfirmedByThisProcess) {
          await hydrateBookingFinancialsStore().catch(() => undefined);
          const finSnap = getBookingFinancialSnapshot(existingBooking.booking_reference || bookingRef) || getBookingFinancialSnapshot(existingBooking.id);
          const guestIdentifier = existingBooking.guest_id || (existingBooking as { auth_subject?: string }).auth_subject;

          if (finSnap?.promoCode) {
            await recordCouponUsage(
              finSnap.promoCode,
              guestIdentifier ? String(guestIdentifier) : "guest",
              targetRef
            ).catch(() => undefined);
          }

          try {
            if (guestIdentifier) {
              await awardLoyaltyPoints({
                userId: String(guestIdentifier),
                amountSpent: paymentVerification.totalConfirmedAmount,
                bookingRef: targetRef,
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

          let resolvedPropTitle = "Vacation Rental Accommodation";
          try {
            const { data: propData } = await dbClient
              .from("properties")
              .select("host_id, title")
              .eq("id", existingBooking.property_id)
              .single();

            if (propData?.title) resolvedPropTitle = String(propData.title);
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

          await dispatchBookingZatcaInvoice({
            bookingId: existingBooking.id,
            bookingRef: existingBooking.booking_reference || bookingRef,
            totalWithVat: paymentVerification.totalConfirmedAmount,
            taxableAmount: finSnap?.taxableSubtotalSar,
            vatAmount: finSnap?.vatAmountSar,
            buyerName: invoiceData.CustomerName || "Valued Guest",
            propertyTitle: resolvedPropTitle,
            paymentMethod: paymentVerification.effectiveGatewayLabel,
          });
        }

        return NextResponse.json({
          success: true,
          status: "confirmed",
          payment_status: "success",
          booking_reference: bookingRef,
        });
      });
    } else {
      if (initialBooking.status === "confirmed" && initialBooking.payment_status === "success") {
        return NextResponse.json({
          success: true,
          message: "Ignored failure webhook for already confirmed reservation.",
          status: initialBooking.status,
          payment_status: initialBooking.payment_status,
        });
      }

      const targetRef = initialBooking.booking_reference || bookingRef;
      await refundSettledWalletSplit(targetRef, "Payment gateway failure webhook");
      await clearPendingWalletSplit(targetRef);
      await dbClient
        .from("bookings")
        .update({
          status: "cancelled",
          payment_status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", initialBooking.id)
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
      { code: "server_error", message: "Failed to process payment webhook." },
      { status: 500 }
    );
  }
}
