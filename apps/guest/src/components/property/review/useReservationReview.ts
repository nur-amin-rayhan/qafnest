"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getGuestAuthorizationHeaders } from "@/lib/auth/clientAuthHeaders";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import type { Property } from "@/data/properties";
import type { PricingBreakdown } from "@/lib/services/pricing";
import type { ConfirmedBooking, GatewayCapabilitiesResponse } from "./types";
import {
  resolveStayImages,
  resolveStayLocalization,
  calculateNights,
  calculateStayPricing,
  buildEditStayHref,
} from "./reservationReviewHelpers";
import { useReservationCallback } from "./useReservationCallback";
import { useReservationPhoneAuth } from "./useReservationPhoneAuth";
import { useReservationCheckout } from "./useReservationCheckout";
import {
  fetchLivePropertyAvailability,
  type LiveAvailabilityResult,
} from "@/lib/services/availability";

export function useReservationReview(property: Property) {
  const [supabase] = useState(() => createClient());
  const searchParams = useSearchParams();
  const searchParamString = searchParams.toString();
  const {
    language,
    formatPrice,
    checkinDate,
    setCheckinDate,
    checkinTime,
    setCheckinTime,
    checkoutDate,
    setCheckoutDate,
    checkoutTime,
    setCheckoutTime,
    guestsCount,
    setGuestsCount,
  } = useApp();
  const { user, session, profile, refreshProfile } = useAuth();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [pricing, setPricing] = useState<PricingBreakdown | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<ConfirmedBooking | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loyaltyPoints, setLoyaltyPoints] = useState<number>(0);
  const [gatewayCapabilities, setGatewayCapabilities] = useState<GatewayCapabilitiesResponse | null>(null);
  const [liveAvailability, setLiveAvailability] = useState<LiveAvailabilityResult | null>(null);

  useEffect(() => {
    if (!property?.id) return;
    fetchLivePropertyAvailability(property.id)
      .then((res) => setLiveAvailability(res))
      .catch(() => {});
  }, [property?.id]);

  useEffect(() => {
    const loadWallet = async () => {
      try {
        const headers = await getGuestAuthorizationHeaders(session);
        const r = await fetch(`/api/wallet?t=${Date.now()}`, { headers, cache: "no-store" });
        const data = r.ok ? await r.json() : null;
        if (data?.wallet) {
          setWalletBalance(Number(data.wallet.balance) || 0);
          setLoyaltyPoints(Number(data.wallet.loyaltyPoints) || 0);
        }
      } catch {}
    };
    void loadWallet();
    const onWalletUpdated = () => void loadWallet();
    window.addEventListener("qafnest:wallet-updated", onWalletUpdated);
    return () => window.removeEventListener("qafnest:wallet-updated", onWalletUpdated);
  }, [user, session]);

  useEffect(() => {
    fetch("/api/payments/methods")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.success && data?.methods) {
          setGatewayCapabilities(data as GatewayCapabilitiesResponse);
        }
      })
      .catch(() => {});
  }, []);

  const label = (english: string, arabic: string) =>
    language === "ar" ? arabic : english;

  const queryCheckinDate = searchParams.get("check_in");
  const queryCheckoutDate = searchParams.get("check_out");
  const queryCheckinTime = searchParams.get("check_in_time");
  const queryCheckoutTime = searchParams.get("check_out_time");
  const queryGuests = Number(searchParams.get("guests"));

  const bookingCheckinDate = queryCheckinDate || checkinDate;
  const bookingCheckoutDate = queryCheckoutDate || checkoutDate;
  const bookingCheckinTime = queryCheckinTime || property.checkinTime || checkinTime;
  const bookingCheckoutTime = queryCheckoutTime || property.checkoutTime || checkoutTime;
  const bookingGuestsCount =
    Number.isInteger(queryGuests) && queryGuests > 0 ? queryGuests : guestsCount;

  const { title, category, location, capacity } = useMemo(
    () => resolveStayLocalization(property, language),
    [property, language]
  );

  const images = useMemo(() => resolveStayImages(property), [property]);

  // Sync stay search params
  useEffect(() => {
    const params = new URLSearchParams(searchParamString);
    const checkin = params.get("check_in");
    const checkout = params.get("check_out");
    const checkinAt = params.get("check_in_time");
    const checkoutAt = params.get("check_out_time");
    const guests = Number(params.get("guests"));
    if (checkin) setCheckinDate(checkin);
    if (checkout) setCheckoutDate(checkout);
    if (checkinAt) setCheckinTime(checkinAt);
    else if (property.checkinTime) setCheckinTime(property.checkinTime);
    if (checkoutAt) setCheckoutTime(checkoutAt);
    else if (property.checkoutTime) setCheckoutTime(property.checkoutTime);
    if (Number.isInteger(guests) && guests > 0) setGuestsCount(guests);
  }, [
    searchParamString,
    property,
    setCheckinDate,
    setCheckinTime,
    setCheckoutDate,
    setCheckoutTime,
    setGuestsCount,
  ]);

  const nights = useMemo(
    () => calculateNights(bookingCheckinDate, bookingCheckoutDate),
    [bookingCheckinDate, bookingCheckoutDate]
  );

  const editStayHref = useMemo(
    () =>
      buildEditStayHref(
        property.id,
        searchParamString,
        bookingCheckinDate,
        bookingCheckoutDate,
        bookingCheckinTime,
        bookingCheckoutTime,
        bookingGuestsCount
      ),
    [
      property.id,
      searchParamString,
      bookingCheckinDate,
      bookingCheckoutDate,
      bookingCheckinTime,
      bookingCheckoutTime,
      bookingGuestsCount,
    ]
  );

  const { baseStayRate, total, hasDiscount, installmentPrice } = useMemo(
    () =>
      calculateStayPricing(
        property,
        bookingCheckinDate,
        nights,
        pricing ? pricing.total : null,
        language,
        {
          checkoutDate: bookingCheckoutDate,
          checkinTime: bookingCheckinTime,
          checkoutTime: bookingCheckoutTime,
          slotConfig: liveAvailability?.slotConfig || null,
          dateOverrides: liveAvailability?.priceOverrides,
        }
      ),
    [
      property,
      bookingCheckinDate,
      bookingCheckoutDate,
      bookingCheckinTime,
      bookingCheckoutTime,
      nights,
      pricing,
      language,
      liveAvailability?.slotConfig,
      liveAvailability?.priceOverrides,
    ]
  );

  // Sub-hook 1: Phone authentication & Profile verification
  const {
    phoneNumber,
    setPhoneNumber,
    sentPhone,
    otpChannel,
    setOtpChannel,
    sentChannel,
    otpCode,
    setOtpCode,
    otpSent,
    setOtpSent,
    otpModalOpen,
    setOtpModalOpen,
    otpStep,
    setOtpStep,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    contactEmail,
    setContactEmail,
    otpBusy,
    otpError,
    setOtpError,
    otpSeconds,
    phoneVerified,
    phoneOtpVerified,
    reservationPhone,
    effectiveName,
    effectiveEmail,
    effectivePhone,
    otpInputRef,
    recaptchaContainerRef,
    handleSendOtp,
    handleVerifyOtp,
    handleResendOtp,
    handleSaveProfile,
  } = useReservationPhoneAuth({
    supabase,
    user,
    profile,
    refreshProfile,
    label,
  });

  // Sub-hook 2: Payment checkout execution
  const {
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
    setSelectedCardRequiresCvv,
    cardCvv,
    setCardCvv,
  } = useReservationCheckout({
    property,
    bookingCheckinDate,
    bookingCheckoutDate,
    bookingCheckinTime,
    bookingCheckoutTime,
    bookingGuestsCount,
    phoneVerified,
    phoneOtpVerified,
    effectivePhone,
    effectiveName,
    effectiveEmail,
    user,
    pricing,
    totalAmount: total,
    walletBalance,
    samsungCapability: gatewayCapabilities?.methods.samsung,
    label,
    setOtpStep,
    setOtpModalOpen,
    setOtpError,
  });

  // Sub-hook 3: Payment gateway callback listener
  useReservationCallback({
    searchParamString,
    property,
    title,
    images,
    bookingCheckinDate,
    bookingCheckoutDate,
    bookingGuestsCount,
    nights,
    total,
    language,
    setConfirmedBooking,
    setPaymentMessage,
  });

  return {
    language,
    formatPrice,
    user,
    label,
    bookingCheckinDate,
    bookingCheckoutDate,
    bookingCheckinTime,
    bookingCheckoutTime,
    bookingGuestsCount,
    title,
    category,
    location,
    capacity,
    images,
    nights,
    editStayHref,
    baseStayRate,
    total,
    hasDiscount,
    installmentPrice,
    setPricing,
    phoneVerified,
    phoneOtpVerified,
    effectiveName,
    reservationPhone,
    effectiveEmail,
    phoneNumber,
    setPhoneNumber,
    otpChannel,
    setOtpChannel,
    otpBusy,
    otpSent,
    setOtpSent,
    otpError,
    setOtpError,
    handleSendOtp,
    handleVerifyOtp,
    handleResendOtp,
    handleSaveProfile,
    handlePay,
    paymentMethod,
    setPaymentMethod,
    useWalletCredit,
    setUseWalletCredit,
    walletSplitActive,
    remainingAmount,
    selectedCardId,
    setSelectedCardId,
    setSelectedCardRequiresCvv,
    cardCvv,
    setCardCvv,
    paymentMessage,
    setPaymentMessage,
    isPayDisabled,
    paymentBusy,
    activeImageIndex,
    setActiveImageIndex,
    otpModalOpen,
    setOtpModalOpen,
    otpStep,
    setOtpStep,
    otpCode,
    setOtpCode,
    sentPhone,
    sentChannel,
    otpSeconds,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    contactEmail,
    setContactEmail,
    confirmedBooking,
    walletBalance,
    loyaltyPoints,
    gatewayCapabilities,
    otpInputRef,
    recaptchaContainerRef,
  };
}
