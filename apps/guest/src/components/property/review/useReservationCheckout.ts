"use client";

import { useState, useEffect } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getGuestAuthorizationHeaders } from "@/lib/auth/clientAuthHeaders";
import { dispatchOpenIdentityModal } from "@/components/modals/GuestIdentityGateModal";
import { isPropertyAvailable } from "@/lib/services/availability";
import { requestSamsungPayWebToken } from "@/lib/services/samsungPayWeb";
import type { Property } from "@/data/properties";
import type { PricingBreakdown } from "@/lib/services/pricing";
import type {
  PaymentMethod,
  ConfirmedBooking,
  SamsungPayClientCapability,
} from "./types";

interface UseReservationCheckoutOptions {
  property: Property;
  bookingCheckinDate: string;
  bookingCheckoutDate: string;
  bookingCheckinTime?: string;
  bookingCheckoutTime?: string;
  bookingGuestsCount: number;
  phoneVerified: boolean;
  identityVerified: boolean;
  phoneOtpVerified: boolean;
  effectivePhone: string;
  effectiveName: string;
  effectiveEmail: string;
  user: User | null;
  session?: Session | null;
  pricing: PricingBreakdown | null;
  totalAmount?: number;
  walletBalance?: number;
  samsungCapability?: SamsungPayClientCapability;
  label: (english: string, arabic: string) => string;
  setOtpStep: (step: "code" | "profile") => void;
  setOtpModalOpen: (open: boolean) => void;
  setOtpError: (err: string | null) => void;
}

export function useReservationCheckout({
  property,
  bookingCheckinDate,
  bookingCheckoutDate,
  bookingCheckinTime,
  bookingCheckoutTime,
  bookingGuestsCount,
  phoneVerified,
  identityVerified,
  phoneOtpVerified,
  effectivePhone,
  effectiveName,
  effectiveEmail,
  user,
  session,
  pricing,
  totalAmount = 0,
  walletBalance = 0,
  samsungCapability,
  label,
  setOtpStep,
  setOtpModalOpen,
  setOtpError,
}: UseReservationCheckoutOptions) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [useWalletCredit, setUseWalletCredit] = useState(false);
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedCardRequiresCvv, setSelectedCardRequiresCvv] = useState<boolean>(false);
  const [cardCvv, setCardCvv] = useState<string>("");

  const effectiveTotal = totalAmount || pricing?.total || property.basePrice;
  const walletCanCoverFull = effectiveTotal > 0 && walletBalance >= effectiveTotal;
  const walletSplitActive = useWalletCredit && walletBalance > 0 && walletBalance < effectiveTotal;
  const effectiveWalletApplied = walletSplitActive ? walletBalance : 0;
  const remainingAmount = Math.max(
    0,
    Math.round((effectiveTotal - effectiveWalletApplied) * 100) / 100
  );

  useEffect(() => {
    if (paymentMethod === "wallet" && effectiveTotal > 0 && walletBalance < effectiveTotal) {
      if (walletBalance > 0) {
        setUseWalletCredit(true);
      }
      setPaymentMethod(null);
    }
  }, [paymentMethod, walletBalance, effectiveTotal]);

  useEffect(() => {
    if (useWalletCredit && walletBalance <= 0) {
      setUseWalletCredit(false);
    }
  }, [useWalletCredit, walletBalance]);

  const effectiveCheckoutMethod: PaymentMethod | null =
    useWalletCredit && walletCanCoverFull && !paymentMethod ? "wallet" : paymentMethod;

  const isPayDisabled =
    paymentBusy || !phoneVerified || !identityVerified || !effectiveCheckoutMethod;

  const handlePay = async () => {
    setPaymentMessage(null);
    if (!phoneVerified) {
      if (phoneOtpVerified) {
        setOtpStep("profile");
        setOtpModalOpen(true);
      } else {
        setOtpError(
          user
            ? label(
                "Please verify your mobile number above before continuing to payment.",
                "يرجى التحقق من رقم جوالك في القسم أعلاه قبل المتابعة للدفع."
              )
            : label(
                "Verify your mobile number here before continuing.",
                "تحقق من رقم جوالك هنا قبل المتابعة."
              )
        );
      }
      document
        .getElementById("phone-verification")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    /*
     * Nafath / Elm Yaqeen Identity Verification gate
     * Kept inactive while government API credentials are pending.
     * To activate when API credentials arrive, set REQUIRE_GOVERNMENT_ID_VERIFICATION = true.
     */
    const REQUIRE_GOVERNMENT_ID_VERIFICATION = false;
    if (REQUIRE_GOVERNMENT_ID_VERIFICATION && !identityVerified) {
      setPaymentMessage(
        label(
          "Verify your Saudi National ID or Iqama via Nafath / Elm Yaqeen before completing your booking.",
          "يرجى توثيق الهوية الوطنية أو الإقامة عبر نفاذ / علم يقين قبل إتمام الحجز."
        )
      );
      dispatchOpenIdentityModal();
      return;
    }
    if (!effectiveCheckoutMethod) {
      setPaymentMessage(
        walletSplitActive
          ? label(
              `Please choose Card, Apple Pay, Google Pay, or STC Pay for the remaining ${remainingAmount.toFixed(2)} SAR.`,
              `يرجى اختيار البطاقة أو Apple Pay أو Google Pay أو STC Pay لسداد المبلغ المتبقي (${remainingAmount.toFixed(2)} ر.س).`
            )
          : label(
              "Please select a payment method before paying.",
              "يرجى اختيار طريقة الدفع قبل إتمام الحجز."
            )
      );
      document
        .getElementById("payment-methods")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const isUsingSavedCard = effectiveCheckoutMethod === "card" && Boolean(selectedCardId && selectedCardId !== "new");
    if (isUsingSavedCard && selectedCardRequiresCvv) {
      const cleanCvv = cardCvv.trim();
      if (!cleanCvv || cleanCvv.length < 3) {
        setPaymentMessage(
          label(
            "Please enter the 3 or 4-digit CVV code of your saved card to proceed.",
            "يرجى إدخال رمز الأمان (CVV) المكون من ٣ أو ٤ أرقام للبطاقة المحفوظة للمتابعة."
          )
        );
        document
          .getElementById("payment-methods")
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
    }
    if (paymentBusy) return;

    if (
      !isPropertyAvailable(property.id, bookingCheckinDate, bookingCheckoutDate, {
        checkinTime: bookingCheckinTime,
        checkoutTime: bookingCheckoutTime,
      })
    ) {
      setPaymentMessage(
        label(
          "These dates or time slots are no longer available. Please select different dates or times.",
          "هذه التواريخ أو الأوقات المحددة لم تعد متاحة. يُرجى اختيار مواعيد أخرى."
        )
      );
      return;
    }

    setPaymentBusy(true);
    try {
      let samsungPayToken: string | undefined;
      if (effectiveCheckoutMethod === "samsung") {
        if (!samsungCapability?.available || !samsungCapability.serviceId) {
          setPaymentMessage(
            label(
              "Samsung Pay Web Checkout is awaiting Samsung Pay Portal Service ID and MyFatoorah SAMSUNG_PAY activation. Please choose Card, Apple Pay, Google Pay, STC Pay, or QafNest Wallet.",
              "الدفع عبر Samsung Pay قيد التفعيل ويتطلب ربط معرف الخدمة (Service ID) وتفعيل SAMSUNG_PAY في ماي فاتورة. يرجى اختيار البطاقة أو Apple Pay أو Google Pay أو STC Pay أو المحفظة."
            )
          );
          return;
        }
        try {
          samsungPayToken = await requestSamsungPayWebToken({
            serviceId: samsungCapability.serviceId,
            environment: samsungCapability.environment,
            amountSar: remainingAmount || effectiveTotal,
          });
        } catch (sdkErr: unknown) {
          setPaymentMessage(
            label(
              sdkErr instanceof Error
                ? `Samsung Pay was cancelled or could not open: ${sdkErr.message}`
                : "Samsung Pay authorization was cancelled.",
              "تم إلغاء الدفع عبر Samsung Pay أو تعذر فتح Samsung Wallet. يرجى المحاولة مرة أخرى."
            )
          );
          return;
        }
      }

      const authHeaders = await getGuestAuthorizationHeaders(session);

      const activeLocale: "en" | "ar" = label("en", "ar") === "en" ? "en" : "ar";

      const response = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({
          locale: activeLocale,
          method: effectiveCheckoutMethod,
          useWalletCredit: walletSplitActive || effectiveCheckoutMethod === "wallet",
          propertyId: property.id,
          checkIn: bookingCheckinDate,
          checkOut: bookingCheckoutDate,
          checkinTime: bookingCheckinTime || "16:00",
          checkoutTime: bookingCheckoutTime || "12:00",
          guests: bookingGuestsCount,
          guestPhone: effectivePhone,
          guestName: effectiveName,
          guestEmail: effectiveEmail,
          guestSubject: user?.id,
          couponCode: pricing?.couponCode,
          savedCardId: isUsingSavedCard ? selectedCardId : undefined,
          cardCvv: isUsingSavedCard ? cardCvv.trim() : undefined,
          samsungPayToken,
        }),
      });
      const rawBody = await response.text();
      let result: {
        success?: boolean;
        code?: string;
        message?: string;
        messageAr?: string;
        provider?: string;
        redirectUrl?: string;
        bookingId?: string;
        bookingRef?: string;
        smartLockPin?: string;
        amount?: number;
        checkIn?: string;
        checkOut?: string;
        nights?: number;
        guests?: number;
        property?: ConfirmedBooking["property"];
      } = {};
      if (rawBody) {
        try {
          const parsed = JSON.parse(rawBody);
          if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            result = parsed as typeof result;
          }
        } catch {
          // Non-JSON response (e.g., upstream 500/502 page): handled cleanly below via !response.ok
        }
      }

      if (!response.ok) {
        if (
          result.code === "phone_verification_required" ||
          result.code === "profile_details_required"
        ) {
          setOtpStep(
            result.code === "profile_details_required" ? "profile" : "code"
          );
          setOtpModalOpen(true);
        } else if (result.code === "identity_verification_required") {
          dispatchOpenIdentityModal();
        }
        const isCouponError =
          result.code === "promotions_disabled" ||
          result.code === "invalid_coupon" ||
          result.code === "invalid_code" ||
          result.code === "empty_code" ||
          result.code?.startsWith("coupon_") ||
          result.code === "min_spend_not_met" ||
          result.code === "min_nights_not_met";

        const providerNameMap: Record<string, string> = {
          tabby: "Tabby",
          tamara: "Tamara",
          google: "Google Pay",
          stcpay: "STC Pay",
          samsung: "Samsung Pay",
          apple: "Apple Pay",
        };
        const providerName =
          result.provider ||
          providerNameMap[effectiveCheckoutMethod || ""] ||
          "Card & Wallets";

        let msgEn =
          result.message ||
          (response.status >= 500
            ? `${providerName} checkout encountered a server error (HTTP ${response.status}). No charge or booking was made. Please try again.`
            : `${providerName} checkout is unavailable. No charge or booking was made.`);
        let msgAr =
          result.messageAr ||
          result.message ||
          (response.status >= 500
            ? `حدث خطأ في خادم الدفع (${response.status}) ولم يتم الخصم أو إنشاء الحجز. يرجى المحاولة مرة أخرى.`
            : `الدفع عبر ${providerName} غير متاح حالياً. لم يتم الخصم.`);

        if (isCouponError) {
          msgEn = result.message || "Coupon code is invalid or no longer eligible.";
          msgAr = ((result as Record<string, unknown>).messageAr as string) || result.message || "كود الخصم غير صالح أو لم يعد مستوفياً للشروط.";
        } else if (result.code === "identity_verification_required") {
          msgEn = "Verify your Saudi National ID or Iqama via Nafath / Elm Yaqeen to complete your booking.";
          msgAr = "يجب توثيق الهوية الوطنية أو الإقامة عبر نفاذ / علم يقين لإتمام الحجز.";
        } else if (result.code === "phone_verification_required") {
          msgEn = "Your mobile verification session has expired. Verify your number again to continue.";
          msgAr = "انتهت جلسة التحقق من رقم الجوال. تحقق من رقمك مرة أخرى للمتابعة.";
        } else if (result.code === "profile_details_required") {
          msgEn = "Please complete your name and email details to continue.";
          msgAr = "أكمل الاسم والبريد الإلكتروني للمتابعة.";
        } else if (result.code === "invalid_booking") {
          msgEn = "Please review your dates and guest count before continuing.";
          msgAr = "راجع تواريخ الإقامة وعدد الضيوف قبل المتابعة.";
        } else if (result.code === "dates_unavailable") {
          msgEn = "These dates are already booked. Please choose different dates.";
          msgAr = "هذه التواريخ محجوزة بالفعل. يرجى اختيار تواريخ أخرى.";
        } else if (result.code === "property_unavailable") {
          msgEn = "This property is currently unavailable for booking. Please choose another listing.";
          msgAr = "هذا العقار غير متاح للحجز حالياً. يرجى اختيار عقار آخر.";
        } else if (result.code === "bnpl_gateway_pending") {
          msgEn = `${providerName} installments are currently under onboarding. Please use Card, Apple Pay, Google Pay, or STC Pay for instant confirmation.`;
          msgAr = `تقسيط ${providerName} قيد التفعيل حالياً. يرجى اختيار بطاقة مدى أو البطاقة الائتمانية أو Apple Pay أو Google Pay أو STC Pay لتأكيد حجزك فوراً.`;
        } else if (result.code === "samsung_pay_gateway_pending") {
          msgEn = "Samsung Pay Web Checkout is awaiting Samsung Pay Portal Service ID and MyFatoorah SAMSUNG_PAY activation. Please choose Card, Apple Pay, Google Pay, STC Pay, or QafNest Wallet.";
          msgAr = "الدفع عبر Samsung Pay قيد التفعيل ويتطلب ربط معرف الخدمة وتفعيل SAMSUNG_PAY في ماي فاتورة. يرجى اختيار البطاقة أو Apple Pay أو Google Pay أو STC Pay.";
        } else if (result.code === "samsung_pay_token_required") {
          msgEn = "Samsung Pay authorization token was missing. Please authorize in Samsung Wallet and retry.";
          msgAr = "لم يتم استلام رمز التفويض من Samsung Wallet. يرجى المحاولة مرة أخرى.";
        } else if (result.code === "payment_provider_not_configured") {
          msgEn = `${providerName} checkout is not connected yet. No charge or booking was made.`;
          msgAr = `بوابة دفع ${providerName} غير متصلة بعد. لم يتم الخصم أو إنشاء الحجز.`;
        } else if (result.code === "myfatoorah_error") {
          msgEn = result.message || "Failed to initialize MyFatoorah payment gateway.";
          msgAr = result.message || "تعذر بدء عملية الدفع عبر ماي فاتورة.";
        }

        setPaymentMessage(label(msgEn, msgAr));
        return;
      }

      if (result.redirectUrl) {
        window.location.href = result.redirectUrl;
        return;
      }

      setPaymentMessage(
        label(
          "Unable to redirect to payment gateway. Please try again.",
          "تعذر التحويل إلى بوابة الدفع. يرجى المحاولة مرة أخرى."
        )
      );
    } catch {
      setPaymentMessage(
        label(
          "We could not reach the payment service. Please try again.",
          "تعذر الاتصال بخدمة الدفع. حاول مرة أخرى."
        )
      );
    } finally {
      setPaymentBusy(false);
    }
  };

  return {
    paymentMethod,
    setPaymentMethod,
    useWalletCredit,
    setUseWalletCredit,
    walletSplitActive,
    remainingAmount,
    paymentBusy,
    paymentMessage,
    setPaymentMessage,
    isPayDisabled,
    handlePay,
    selectedCardId,
    setSelectedCardId,
    selectedCardRequiresCvv,
    setSelectedCardRequiresCvv,
    cardCvv,
    setCardCvv,
  };
}

