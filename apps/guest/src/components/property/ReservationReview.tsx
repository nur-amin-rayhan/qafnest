"use client";

import React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft } from "lucide-react";
import Footer from "@/components/common/Footer";
import Navbar from "@/components/common/Navbar";
import type { Property } from "@/data/properties";

import { useReservationReview } from "./review/useReservationReview";
import ReservationSidebar from "./review/ReservationSidebar";
import ReservationPaymentMethods from "./review/ReservationPaymentMethods";
import ReservationGuestVerification from "./review/ReservationGuestVerification";
import { ReservationPropertySummary } from "./review/ReservationPropertySummary";
import { ReservationPoliciesCard } from "./review/ReservationPoliciesCard";

const AppModal = dynamic(() => import("@/components/modals/AppModal"), { ssr: false });
const AuthModal = dynamic(() => import("@/components/modals/AuthModal"), { ssr: false });
const SearchModal = dynamic(() => import("@/components/modals/SearchModal"), { ssr: false });
const ReservationOtpModal = dynamic(() => import("./review/ReservationOtpModal"), { ssr: false });
const ReservationConfirmedModal = dynamic(() => import("./review/ReservationConfirmedModal"), { ssr: false });

interface ReservationReviewProps {
  property: Property;
}

export default function ReservationReview({ property }: ReservationReviewProps) {
  const {
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
    total,
    gatewayCapabilities,
    otpInputRef,
    recaptchaContainerRef,
  } = useReservationReview(property);

  return (
    <div className="min-h-screen bg-white pb-16 text-gray-900 dark:bg-[#08070D] dark:text-gray-100">
      <Navbar />
      <main className="mx-auto max-w-[1240px] px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <Link
          href={editStayHref}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-violet-700 dark:text-gray-400 dark:hover:text-violet-300"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {label("Back to stay details", "العودة إلى تفاصيل الإقامة")}
        </Link>

        <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div className="min-w-0">
            <div className="mb-6">
              <span className="inline-flex rounded-full bg-violet-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-violet-700 dark:bg-violet-400/10 dark:text-violet-300">
                {label("Reservation · Step 1", "الحجز · الخطوة ١")}
              </span>
              <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-gray-950 dark:text-white sm:text-4xl">
                {label("Review & Pay", "مراجعة الحجز والدفع")}
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {label(
                  "Review your stay and guest details before moving to payment.",
                  "راجع تفاصيل الإقامة والضيوف قبل الانتقال إلى الدفع."
                )}
              </p>
            </div>

            {/* Property Quick Info Card */}
            <ReservationPropertySummary
              property={property}
              title={title}
              category={category}
              location={location}
              capacity={capacity}
              label={label}
            />

            {/* Guest Verification Section */}
            <ReservationGuestVerification
              phoneVerified={phoneVerified}
              phoneOtpVerified={phoneOtpVerified}
              effectiveName={effectiveName}
              reservationPhone={reservationPhone}
              effectiveEmail={effectiveEmail}
              user={user}
              phoneNumber={phoneNumber}
              setPhoneNumber={setPhoneNumber}
              otpChannel={otpChannel}
              setOtpChannel={setOtpChannel}
              otpBusy={otpBusy}
              otpSent={otpSent}
              otpError={otpError}
              setOtpError={setOtpError}
              handleSendOtp={handleSendOtp}
              onOpenProfileStep={() => {
                setOtpStep("profile");
                setOtpModalOpen(true);
              }}
              onOpenCodeStep={() => {
                setOtpStep("code");
                setOtpModalOpen(true);
              }}
              recaptchaContainerRef={recaptchaContainerRef}
              label={label}
            />

            {/* Booking Policies and Conditions */}
            <ReservationPoliciesCard
              bookingCheckinTime={bookingCheckinTime}
              bookingCheckoutTime={bookingCheckoutTime}
              label={label}
            />

            {/* Payment Methods Section */}
            <ReservationPaymentMethods
              phoneVerified={phoneVerified}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              setPaymentMessage={setPaymentMessage}
              user={user}
              installmentPrice={installmentPrice}
              walletBalance={walletBalance}
              totalAmount={total}
              useWalletCredit={useWalletCredit}
              setUseWalletCredit={setUseWalletCredit}
              gatewayCapabilities={gatewayCapabilities}
              label={label}
              selectedCardId={selectedCardId}
              setSelectedCardId={setSelectedCardId}
              setSelectedCardRequiresCvv={setSelectedCardRequiresCvv}
              cardCvv={cardCvv}
              setCardCvv={setCardCvv}
            />
          </div>

          {/* Desktop & Sticky Reservation Sidebar */}
          <ReservationSidebar
            property={property}
            title={title}
            location={location}
            images={images}
            activeImageIndex={activeImageIndex}
            setActiveImageIndex={setActiveImageIndex}
            nights={nights}
            bookingCheckinDate={bookingCheckinDate}
            bookingCheckoutDate={bookingCheckoutDate}
            bookingCheckinTime={bookingCheckinTime}
            bookingCheckoutTime={bookingCheckoutTime}
            bookingGuestsCount={bookingGuestsCount}
            editStayHref={editStayHref}
            baseStayRate={baseStayRate}
            setPricing={setPricing}
            hasDiscount={hasDiscount}
            formatPrice={formatPrice}
            language={language}
            label={label}
            handlePay={handlePay}
            isPayDisabled={isPayDisabled}
            paymentBusy={paymentBusy}
            phoneVerified={phoneVerified}
            paymentMethod={paymentMethod}
            walletSplitActive={walletSplitActive}
            walletBalance={walletBalance}
            remainingAmount={remainingAmount}
            user={user}
            paymentMessage={paymentMessage}
          />
        </div>
      </main>

      {/* OTP and Profile Completion Modal */}
      <ReservationOtpModal
        otpModalOpen={otpModalOpen}
        setOtpModalOpen={setOtpModalOpen}
        otpStep={otpStep}
        setOtpStep={setOtpStep}
        otpBusy={otpBusy}
        otpCode={otpCode}
        setOtpCode={setOtpCode}
        sentPhone={sentPhone}
        sentChannel={sentChannel}
        otpSeconds={otpSeconds}
        otpError={otpError}
        setOtpError={setOtpError}
        firstName={firstName}
        setFirstName={setFirstName}
        lastName={lastName}
        setLastName={setLastName}
        contactEmail={contactEmail}
        setContactEmail={setContactEmail}
        otpInputRef={otpInputRef}
        handleVerifyOtp={handleVerifyOtp}
        handleResendOtp={handleResendOtp}
        handleSaveProfile={handleSaveProfile}
        onResetPhoneState={() => {
          setOtpModalOpen(false);
          setOtpSent(false);
          setOtpCode("");
          setOtpError(null);
        }}
        label={label}
      />

      {/* Booking Confirmed Smart Lock Modal */}
      <ReservationConfirmedModal
        confirmedBooking={confirmedBooking}
        label={label}
      />

      <Footer />
      <AuthModal />
      <AppModal />
      <SearchModal />
    </div>
  );
}
