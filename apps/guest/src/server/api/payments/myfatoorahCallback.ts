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
  refundSettledWalletSplit,
} from "@/lib/services/walletService";
import { dispatchBookingZatcaInvoice } from "@/lib/services/zatcaReportingHelper";
import { getBookingFinancialSnapshot } from "@qafnest/shared/bookingFinancialsStore";
import { acquirePropertyBookingLock } from "@qafnest/shared/bookingSlotStore";
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

    const gatewayCustomerRef = String(invoiceData?.CustomerReference || "").trim();
    if (!bookingRef && gatewayCustomerRef) {
      bookingRef = gatewayCustomerRef;
    }

    const dbClient = await getAdminOrServerClient();

    if (isPaid && invoiceData) {
      if (bookingRef && gatewayCustomerRef && gatewayCustomerRef !== bookingRef) {
        return buildSafeCallbackRedirect(canonicalOrigin, rawPropertyId, {
          payment_error: "reference_mismatch",
          bookingRef,
        });
      }

      const gatewayName = invoiceData.InvoiceTransactions?.[0]?.PaymentGateway || "MyFatoorah";
      const paidAmount = extractPaidAmount(invoiceData);
      let confirmedAmount = paidAmount;
      let confirmedGateway = gatewayName;

      if (bookingRef) {
        try {
          // 1. Fetch current booking record to verify expected amount and state
          const { data: initialBooking } = await dbClient
            .from("bookings")
            .select("id, property_id")
            .eq("booking_reference", bookingRef)
            .maybeSingle();

          if (!initialBooking) {
            console.error(`[PAYMENT ERROR] Booking reference not found: ${bookingRef}`);
            return buildSafeCallbackRedirect(canonicalOrigin, rawPropertyId, {
              payment_error: "booking_not_found",
              message: "Booking reference could not be found.",
              bookingRef,
            });
          }

          const callbackLockOutcome = await acquirePropertyBookingLock([initialBooking.property_id], async () => {
            const primaryBookingQuery = await dbClient
              .from("bookings")
              .select("id, property_id, status, payment_status, total_price, smart_lock_pin, check_in, check_out, checkin_time, checkout_time, guest_id, auth_subject")
              .eq("booking_reference", bookingRef)
              .maybeSingle();

            let existingBooking: Record<string, unknown> | null = primaryBookingQuery.data as Record<string, unknown> | null;
            let bookingFetchError = primaryBookingQuery.error;

            if (
              bookingFetchError &&
              (bookingFetchError.code === "42703" ||
                /checkin_time|checkout_time|column .* does not exist/i.test(bookingFetchError.message || ""))
            ) {
              const legacyBookingQuery = await dbClient
                .from("bookings")
                .select("id, property_id, status, payment_status, total_price, smart_lock_pin, check_in, check_out, guest_id, auth_subject")
                .eq("booking_reference", bookingRef)
                .maybeSingle();
              existingBooking = legacyBookingQuery.data as Record<string, unknown> | null;
              bookingFetchError = legacyBookingQuery.error;
            }

            if (bookingFetchError) {
              console.error("[PAYMENT ERROR] Failed to load booking inside callback lock:", {
                bookingRef,
                code: bookingFetchError.code,
                message: bookingFetchError.message,
              });
              return {
                redirect: buildSafeCallbackRedirect(canonicalOrigin, rawPropertyId, {
                  payment_error: "booking_confirmation_error",
                  message: "Could not verify booking record in database. Please contact support with your booking reference.",
                  bookingRef,
                }),
              };
            }

            if (!existingBooking) {
              return {
                redirect: buildSafeCallbackRedirect(canonicalOrigin, rawPropertyId, {
                  payment_error: "booking_not_found",
                  bookingRef,
                }),
              };
            }

            const bookingRecord = existingBooking as {
              id: string;
              property_id: string;
              status: string;
              payment_status: string;
              total_price: number;
              smart_lock_pin?: string | null;
              check_in: string;
              check_out: string;
              checkin_time?: string | null;
              checkout_time?: string | null;
              guest_id?: string | null;
              auth_subject?: string | null;
            };

            if (bookingRecord.status === "confirmed" && bookingRecord.payment_status === "success") {
              try {
                const guestIdentifier = bookingRecord.guest_id || bookingRecord.auth_subject;
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

              return {
                redirect: buildSafeCallbackRedirect(canonicalOrigin, rawPropertyId, {
                  confirmed: "true",
                  bookingRef,
                  amount: String(paidAmount),
                  gateway: gatewayName,
                  paymentId: String(paymentId),
                }),
              };
            }

            if (bookingRecord.status === "cancelled") {
              const primaryConflicts = await dbClient
                .from("bookings")
                .select("id, check_in, check_out, checkin_time, checkout_time")
                .eq("property_id", bookingRecord.property_id)
                .in("status", ["confirmed", "completed"])
                .neq("id", bookingRecord.id)
                .lte("check_in", bookingRecord.check_out)
                .gte("check_out", bookingRecord.check_in);

              let candidateConflicts = primaryConflicts.data as Array<Record<string, unknown>> | null;
              if (
                primaryConflicts.error &&
                (primaryConflicts.error.code === "42703" ||
                  /checkin_time|checkout_time|column .* does not exist/i.test(primaryConflicts.error.message || ""))
              ) {
                const legacyConflicts = await dbClient
                  .from("bookings")
                  .select("id, check_in, check_out")
                  .eq("property_id", bookingRecord.property_id)
                  .in("status", ["confirmed", "completed"])
                  .neq("id", bookingRecord.id)
                  .lte("check_in", bookingRecord.check_out)
                  .gte("check_out", bookingRecord.check_in);
                candidateConflicts = legacyConflicts.data as Array<Record<string, unknown>> | null;
              }

              const hasSlotConflict = (candidateConflicts || []).some((c) => {
                return doTimeSlotsOverlap(
                  {
                    checkIn: bookingRecord.check_in,
                    checkOut: bookingRecord.check_out,
                    checkinTime: bookingRecord.checkin_time ? String(bookingRecord.checkin_time).slice(0, 5) : DEFAULT_CHECKIN_TIME,
                    checkoutTime: bookingRecord.checkout_time ? String(bookingRecord.checkout_time).slice(0, 5) : DEFAULT_CHECKOUT_TIME,
                  },
                  {
                    checkIn: String(c.check_in || ""),
                    checkOut: String(c.check_out || ""),
                    checkinTime: c.checkin_time ? String(c.checkin_time).slice(0, 5) : DEFAULT_CHECKIN_TIME,
                    checkoutTime: c.checkout_time ? String(c.checkout_time).slice(0, 5) : DEFAULT_CHECKOUT_TIME,
                  }
                );
              });

              if (hasSlotConflict) {
                await clearPendingWalletSplit(bookingRef);
                return {
                  redirect: buildSafeCallbackRedirect(canonicalOrigin, rawPropertyId, {
                    payment_error: "booking_timeout_refund_required",
                    message: "Booking reservation timed out and property was rebooked. Automatic refund required.",
                    bookingRef,
                  }),
                };
              }
            }

            const expectedAmount = Number(bookingRecord.total_price);
            const paymentVerification = await verifyAndSettleBookingPaymentAmount({
              bookingRef,
              expectedBookingTotal: expectedAmount,
              gatewayPaidAmount: paidAmount,
              gatewayName,
            });
            if (!paymentVerification.ok) {
              await clearPendingWalletSplit(bookingRef);
              return {
                redirect: buildSafeCallbackRedirect(canonicalOrigin, rawPropertyId, {
                  payment_error: paymentVerification.code,
                  message: paymentVerification.message,
                  bookingRef,
                }),
              };
            }
            confirmedAmount = paymentVerification.totalConfirmedAmount;
            confirmedGateway = paymentVerification.effectiveGatewayLabel;

            const assignedPin = bookingRecord.smart_lock_pin || null;
            const { data: rpcData, error: rpcError } = await dbClient.rpc("confirm_verified_booking", {
              p_booking_ref: bookingRef,
              p_payment_id: String(paymentId),
              p_gateway: paymentVerification.effectiveGatewayLabel,
              p_amount: paymentVerification.totalConfirmedAmount,
              p_pin: assignedPin,
            });

            const rpcResult = rpcData as { success?: boolean; error?: string; already_confirmed?: boolean } | null;

            if (rpcResult && rpcResult.success === false) {
              if (rpcResult.error === "booking_already_paid") {
                return {
                  redirect: buildSafeCallbackRedirect(canonicalOrigin, rawPropertyId, {
                    confirmed: "true",
                    bookingRef,
                    amount: String(paymentVerification.totalConfirmedAmount),
                    gateway: paymentVerification.effectiveGatewayLabel,
                    paymentId: String(paymentId),
                  }),
                };
              }
              if (paymentVerification.isSplit) {
                await refundSettledWalletSplit(bookingRef, `Confirmation rejected (${rpcResult.error || "conflict"})`);
              } else {
                await clearPendingWalletSplit(bookingRef);
              }
              return {
                redirect: buildSafeCallbackRedirect(canonicalOrigin, rawPropertyId, {
                  payment_error: rpcResult.error || "confirmation_rejected",
                  bookingRef,
                }),
              };
            }

            let wasConfirmedByThisProcess = Boolean(rpcResult && rpcResult.success && !rpcResult.already_confirmed);

            if (rpcError && !rpcResult) {
              console.warn("RPC confirm_verified_booking failed, running defensive CAS update:", rpcError);
              const { data: updatedBooking, error: casErr } = await dbClient
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
                .in("status", ["pending", "cancelled"])
                .select("id, property_id, total_price, check_in, check_out")
                .maybeSingle();

              if (casErr || !updatedBooking) {
                if (paymentVerification.isSplit) {
                  await refundSettledWalletSplit(bookingRef, "Database confirmation conflict");
                }
                return {
                  redirect: buildSafeCallbackRedirect(canonicalOrigin, rawPropertyId, {
                    payment_error: "booking_slot_overlap",
                    bookingRef,
                  }),
                };
              }
              wasConfirmedByThisProcess = true;
            }

            if (wasConfirmedByThisProcess) {
              let resolvedPropTitle = "Vacation Rental Accommodation";
              try {
                const { data: propData } = await dbClient
                  .from("properties")
                  .select("host_id, title")
                  .eq("id", bookingRecord.property_id)
                  .single();

                if (propData?.title) resolvedPropTitle = String(propData.title);
                if (propData && propData.host_id) {
                  await dbClient.from("host_notifications").insert({
                    host_id: propData.host_id,
                    property_id: bookingRecord.property_id,
                    booking_id: bookingRecord.id,
                    event_type: "booking_confirmed",
                    title: "حجز جديد مؤكد! 🎉",
                    body: `تم تأكيد حجز جديد لـ ${propData.title} بقيمة ${bookingRecord.total_price} ر.س للفترة من ${bookingRecord.check_in} إلى ${bookingRecord.check_out}.`,
                    is_read: false,
                  });
                }
              } catch (notifErr) {
                console.warn("Could not insert host notification:", notifErr);
              }

              const finSnap = getBookingFinancialSnapshot(bookingRef) || getBookingFinancialSnapshot(bookingRecord.id);
              const guestIdentifier = bookingRecord.guest_id || bookingRecord.auth_subject;

              if (finSnap?.promoCode) {
                await recordCouponUsage(
                  finSnap.promoCode,
                  guestIdentifier ? String(guestIdentifier) : "guest",
                  bookingRef
                ).catch(() => undefined);
              }

              try {
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

              try {
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

              await dispatchBookingZatcaInvoice({
                bookingId: bookingRecord.id,
                bookingRef,
                totalWithVat: paymentVerification.totalConfirmedAmount,
                taxableAmount: finSnap?.taxableSubtotalSar,
                vatAmount: finSnap?.vatAmountSar,
                buyerName: invoiceData.CustomerName || "Valued Guest",
                propertyTitle: resolvedPropTitle,
                paymentMethod: paymentVerification.effectiveGatewayLabel,
              });

              try {
                if (bookingRecord.check_in && bookingRecord.check_out && bookingRecord.property_id) {
                  const startMs = Date.parse(`${bookingRecord.check_in}T00:00:00.000Z`);
                  const endMs = Date.parse(`${bookingRecord.check_out}T00:00:00.000Z`);
                  const numNights = Math.round((endMs - startMs) / 86_400_000);
                  if (numNights > 0) {
                    const rowsToUpsert = [];
                    for (let i = 0; i < numNights; i++) {
                      const dayDate = new Date(startMs + i * 86_400_000).toISOString().slice(0, 10);
                      rowsToUpsert.push({
                        property_id: bookingRecord.property_id,
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
            return null;
          });

          if (callbackLockOutcome?.redirect) {
            return callbackLockOutcome.redirect;
          }
        } catch (dbErr) {
          console.error("Failed to update booking status in Supabase:", dbErr);
          return buildSafeCallbackRedirect(canonicalOrigin, rawPropertyId, {
            payment_error: "booking_confirmation_error",
            bookingRef,
          });
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
      const failureReason =
        invoiceData?.InvoiceTransactions?.[0]?.Error ||
        invoiceData?.InvoiceStatus ||
        statusResult.Message ||
        "Payment was not completed";

      if (bookingRef && (!gatewayCustomerRef || gatewayCustomerRef === bookingRef)) {
        await clearPendingWalletSplit(bookingRef);
        try {
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
