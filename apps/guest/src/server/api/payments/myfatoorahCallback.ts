import { NextRequest } from "next/server";
import { getAdminOrServerClient } from "@/lib/supabase/service";
import { getMyFatoorahPaymentStatus, extractPaidAmount } from "@/lib/services/myfatoorah";
import { recordCouponUsage } from "@/lib/services/couponService";
import { getCanonicalOrigin, buildSafeCallbackRedirect as buildBaseCallbackRedirect } from "@/lib/services/callbackRedirect";
import { resolveRequestLocale } from "@/lib/services/requestLocale";
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

async function handleCallback(request: NextRequest) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const resolvedLocale = resolveRequestLocale(request);
  const buildSafeCallbackRedirect = (
    origin: string,
    propertyId: string | null | undefined,
    params: Record<string, string | number | null | undefined>
  ) => buildBaseCallbackRedirect(origin, propertyId, params, resolvedLocale);

  let paymentId =
    searchParams.get("paymentId") ||
    searchParams.get("PaymentId") ||
    searchParams.get("Id") ||
    searchParams.get("id");

  if (!paymentId && request.method === "POST") {
    try {
      const contentType = request.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const body = await request.json();
        paymentId = body.paymentId || body.PaymentId || body.Id || body.id;
      } else if (contentType.includes("application/x-www-form-urlencoded")) {
        const formData = await request.formData();
        paymentId = (formData.get("paymentId") || formData.get("PaymentId") || formData.get("Id")) as string | null;
      }
    } catch {}
  }

  const rawPropertyId = searchParams.get("propertyId") || "";
  let bookingRef = (searchParams.get("bookingRef") || "").trim();
  const canonicalOrigin = getCanonicalOrigin(request);

  if (!paymentId) {
    return buildSafeCallbackRedirect(canonicalOrigin, rawPropertyId, {
      payment_error: "missing_payment_id",
      bookingRef: bookingRef || null,
    });
  }

  try {
    const statusResult = await getMyFatoorahPaymentStatus(paymentId, "PaymentId");
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

    const dbClient = await getAdminOrServerClient();

    if (isPaid && invoiceData) {
      const gatewayName = invoiceData.InvoiceTransactions?.[0]?.PaymentGateway || "MyFatoorah";
      const paidAmount = extractPaidAmount(invoiceData);
      let confirmedAmount = paidAmount;
      let confirmedGateway = gatewayName;

      if (bookingRef) {
        try {
          // 1. Fetch current booking record to verify expected amount and state
          const { data: existingBooking } = await dbClient
            .from("bookings")
            .select("id, property_id, status, payment_status, total_price, smart_lock_pin, check_in, check_out, guest_id, auth_subject")
            .eq("booking_reference", bookingRef)
            .maybeSingle();

          if (!existingBooking) {
            console.error(`[PAYMENT ERROR] Booking reference not found: ${bookingRef}`);
            return buildSafeCallbackRedirect(canonicalOrigin, rawPropertyId, {
              payment_error: "booking_not_found",
              message: "Booking reference could not be found.",
              bookingRef,
            });
          }

          // 2. IDEMPOTENCY GUARD (SEC-02): If already confirmed (e.g. by concurrent webhook), ensure card auto-save ran and return safely
          if (existingBooking.status === "confirmed" && existingBooking.payment_status === "success") {
            try {
              const guestIdentifier = existingBooking.guest_id || (existingBooking as { auth_subject?: string }).auth_subject;
              if (guestIdentifier) {
                const primaryTx = (invoiceData.InvoiceTransactions?.[0] || {}) as Record<string, unknown>;
                await autoSaveCardFromInvoiceTransaction({
                  userId: String(guestIdentifier),
                  customerName: invoiceData.CustomerName,
                  gatewayName,
                  primaryTx,
                });
              }
            } catch {}

            return buildSafeCallbackRedirect(canonicalOrigin, rawPropertyId, {
              confirmed: "true",
              bookingRef,
              amount: String(paidAmount),
              gateway: gatewayName,
              paymentId: String(paymentId),
            });
          }

          // SEC-06: Handling In-Flight Payment Reconciliation Race
          // If booking was prematurely marked 'cancelled' by reconciliation timeout while guest was completing 3D-Secure/Nafath:
          if (existingBooking.status === "cancelled") {
            // Check if any other confirmed reservation claimed these time-slots in the meantime
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
              console.error(`[CRITICAL OVERBOOKING CONFLICT] Late payment received for timed-out booking ${bookingRef}, but property was rebooked! Immediate refund required.`);
              return buildSafeCallbackRedirect(canonicalOrigin, rawPropertyId, {
                payment_error: "booking_timeout_refund_required",
                message: "Booking reservation timed out and property was rebooked. Automatic refund required.",
                bookingRef,
              });
            }
            console.log(`[RECONCILIATION RESURRECTION] Resurrecting timed-out booking ${bookingRef} to confirmed upon verified payment.`);
          }

          // 3. STRICT AMOUNT VALIDATION (SEC-01) & SPLIT SETTLEMENT:
          // Validates either full booking total OR remaining gateway balance + atomic wallet split settlement
          const expectedAmount = Number(existingBooking.total_price);
          const paymentVerification = await verifyAndSettleBookingPaymentAmount({
            bookingRef,
            expectedBookingTotal: expectedAmount,
            gatewayPaidAmount: paidAmount,
            gatewayName,
          });
          if (!paymentVerification.ok) {
            console.error(`[SECURITY ALERT] ${paymentVerification.message} (booking ${bookingRef})`);
            clearPendingWalletSplit(bookingRef);
            return buildSafeCallbackRedirect(canonicalOrigin, rawPropertyId, {
              payment_error: paymentVerification.code,
              message: paymentVerification.message,
              bookingRef,
            });
          }
          confirmedAmount = paymentVerification.totalConfirmedAmount;
          confirmedGateway = paymentVerification.effectiveGatewayLabel;

          // 4. PIN PRESERVATION: Keep existing PIN if host already set it; otherwise leave null until host assigns it
          const assignedPin = existingBooking.smart_lock_pin || null;

          // 5. Authoritative atomic state confirmation via database RPC
          const { data: rpcData, error: rpcError } = await dbClient.rpc("confirm_verified_booking", {
            p_booking_ref: bookingRef,
            p_payment_id: String(paymentId),
            p_gateway: paymentVerification.effectiveGatewayLabel,
            p_amount: paymentVerification.totalConfirmedAmount,
            p_pin: assignedPin,
          });

          const rpcResult = rpcData as { success?: boolean; error?: string; already_confirmed?: boolean } | null;

          // If RPC explicitly rejected due to amount mismatch, NEVER execute fallback update!
          if (rpcResult && rpcResult.success === false) {
            if (rpcResult.error === "amount_mismatch") {
              console.error(`[SECURITY ALERT] Stored procedure rejected amount mismatch for ${bookingRef}`);
              return buildSafeCallbackRedirect(canonicalOrigin, rawPropertyId, {
                payment_error: "amount_mismatch",
                bookingRef,
              });
            }
            if (rpcResult.error === "booking_already_paid") {
              return buildSafeCallbackRedirect(canonicalOrigin, rawPropertyId, {
                confirmed: "true",
                bookingRef,
                amount: String(paymentVerification.totalConfirmedAmount),
                gateway: paymentVerification.effectiveGatewayLabel,
                paymentId: String(paymentId),
              });
            }
          }

          let wasConfirmedByThisProcess = Boolean(rpcResult && rpcResult.success && !rpcResult.already_confirmed);

          // 6. Defensive Fallback: ONLY executed on unexpected infrastructure RPC error
          if (rpcError && !rpcResult) {
            console.warn("RPC confirm_verified_booking failed, running defensive CAS update:", rpcError);
            const { data: updatedBooking } = await dbClient
              .from("bookings")
              .update({
                status: "confirmed",
                payment_status: "success",
                payment_method: paymentVerification.effectiveGatewayLabel,
                payment_id: String(paymentId),
                smart_lock_pin: assignedPin,
                updated_at: new Date().toISOString(),
              })
              .eq("booking_reference", bookingRef)
              .in("status", ["pending", "cancelled"]) // ATOMIC LOCK: Transition from pending or timed-out cancelled
              .select("id, property_id, total_price, check_in, check_out")
              .maybeSingle();

            if (updatedBooking) {
              wasConfirmedByThisProcess = true;
            }
          }

          // 7. Post-Confirmation Side Effects: Execute ONLY if this process performed the state flip
          if (wasConfirmedByThisProcess) {
            let resolvedPropTitle = "Vacation Rental Accommodation";

            // Trigger host notification
            try {
              const { data: propData } = await dbClient
                .from("properties")
                .select("host_id, title")
                .eq("id", existingBooking.property_id)
                .single();

              if (propData?.title) {
                resolvedPropTitle = String(propData.title);
              }

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
            } catch (notifErr) {
              console.warn("Could not insert host notification:", notifErr);
            }

            // bookings table stores final net total_price without a coupon_code column in production schema

            // Award loyalty points on confirmed booking
            try {
              const guestIdentifier = existingBooking.guest_id || (existingBooking as { auth_subject?: string }).auth_subject;
              if (guestIdentifier) {
                await awardLoyaltyPoints({
                  userId: String(guestIdentifier),
                  amountSpent: paymentVerification.totalConfirmedAmount,
                  bookingRef,
                  isWalletPayment: paymentVerification.isSplit,
                });
              }
            } catch (loyaltyErr) {
              console.warn("Notice: Could not award loyalty points on callback:", loyaltyErr);
            }

            // Auto-save card to digital wallet for 1-click future checkout (cards only)
            try {
              const guestIdentifier = existingBooking.guest_id || (existingBooking as { auth_subject?: string }).auth_subject;
              if (guestIdentifier) {
                const primaryTx = (invoiceData.InvoiceTransactions?.[0] || {}) as Record<string, unknown>;
                await autoSaveCardFromInvoiceTransaction({
                  userId: String(guestIdentifier),
                  customerName: invoiceData.CustomerName,
                  gatewayName,
                  primaryTx,
                });
              }
            } catch (cardSaveErr) {
              console.warn("Notice: Could not auto-save card to wallet in callback:", cardSaveErr);
            }

            // ZATCA Phase 2 E-Invoicing Compliance Reporting
            const finSnap = getBookingFinancialSnapshot(bookingRef) || getBookingFinancialSnapshot(existingBooking.id);
            await dispatchBookingZatcaInvoice({
              bookingId: existingBooking.id,
              bookingRef,
              totalWithVat: paymentVerification.totalConfirmedAmount,
              taxableAmount: finSnap?.taxableSubtotalSar,
              vatAmount: finSnap?.vatAmountSar,
              buyerName: invoiceData.CustomerName || "Valued Guest",
              propertyTitle: resolvedPropTitle,
              paymentMethod: paymentVerification.effectiveGatewayLabel,
            });

            // Lock overnight property dates (skip same-day 12-hour bookings so afternoon 4 PM slot stays open)
            try {
              if (existingBooking.check_in && existingBooking.check_out && existingBooking.property_id) {
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
              }
            } catch (lockErr) {
              console.warn("Notice: Could not lock property_availability dates in callback:", lockErr);
            }
          }
        } catch (dbErr) {
          console.error("Failed to update booking status in Supabase:", dbErr);
        }
      }

      return buildSafeCallbackRedirect(canonicalOrigin, rawPropertyId, {
        confirmed: "true",
        bookingRef: bookingRef || null,
        amount: String(confirmedAmount),
        gateway: confirmedGateway,
        paymentId: String(paymentId),
      });
    } else {
      // Payment Failed, Cancelled, or Abandoned: Revert status to cancelled/failed
      const failureReason =
        invoiceData?.InvoiceTransactions?.[0]?.Error ||
        invoiceData?.InvoiceStatus ||
        statusResult.Message ||
        "Payment was not completed";

      if (bookingRef) {
        clearPendingWalletSplit(bookingRef);
        try {
          // SAFEGUARD: Never automatically cancel an already paid/confirmed booking
          await dbClient
            .from("bookings")
            .update({
              status: "cancelled",
              payment_status: "failed",
              updated_at: new Date().toISOString(),
            })
            .eq("booking_reference", bookingRef)
            .eq("status", "pending")
            .eq("payment_status", "initiated");
        } catch {}
      }

      return buildSafeCallbackRedirect(canonicalOrigin, rawPropertyId, {
        payment_error: "payment_failed",
        reason: failureReason,
        bookingRef: bookingRef || null,
      });
    }
  } catch (err: unknown) {
    console.error("MyFatoorah callback verification exception:", err);
    return buildSafeCallbackRedirect(canonicalOrigin, rawPropertyId, {
      payment_error: "verification_exception",
      message: "An unexpected error occurred during payment verification. Please try again.",
      bookingRef: bookingRef || null,
    });
  }
}

export async function GET(request: NextRequest) {
  return handleCallback(request);
}

export async function POST(request: NextRequest) {
  return handleCallback(request);
}
