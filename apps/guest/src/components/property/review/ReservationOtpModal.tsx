"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { OtpStep, OtpChannel } from "./types";
import { ReservationOtpCodeStep } from "./otp/ReservationOtpCodeStep";
import { ReservationProfileStep } from "./otp/ReservationProfileStep";

interface ReservationOtpModalProps {
  otpModalOpen: boolean;
  setOtpModalOpen: (open: boolean) => void;
  otpStep: OtpStep;
  setOtpStep: (step: OtpStep) => void;
  otpBusy: boolean;
  otpCode: string;
  setOtpCode: (code: string) => void;
  sentPhone: string | null;
  sentChannel: OtpChannel;
  otpSeconds: number;
  otpError: string | null;
  setOtpError: (err: string | null) => void;
  firstName: string;
  setFirstName: (name: string) => void;
  lastName: string;
  setLastName: (name: string) => void;
  contactEmail: string;
  setContactEmail: (email: string) => void;
  otpInputRef: React.Ref<HTMLInputElement>;
  handleVerifyOtp: (event: React.FormEvent<HTMLFormElement>) => void;
  handleResendOtp: (channel: OtpChannel) => void;
  handleSaveProfile: (event: React.FormEvent<HTMLFormElement>) => void;
  onResetPhoneState: () => void;
  label: (en: string, ar: string) => string;
}

export default function ReservationOtpModal({
  otpModalOpen,
  setOtpModalOpen,
  otpStep,
  setOtpStep,
  otpBusy,
  otpCode,
  setOtpCode,
  sentPhone,
  sentChannel,
  otpSeconds,
  otpError,
  firstName,
  setFirstName,
  lastName,
  setLastName,
  contactEmail,
  setContactEmail,
  otpInputRef,
  handleVerifyOtp,
  handleResendOtp,
  handleSaveProfile,
  onResetPhoneState,
  label,
}: ReservationOtpModalProps) {
  return (
    <AnimatePresence>
      {otpModalOpen && (
        <motion.div
          className="fixed inset-0 z-[1200] flex items-center justify-center overflow-y-auto bg-gray-950/45 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !otpBusy) {
              setOtpModalOpen(false);
            }
          }}
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="reservation-otp-title"
            className="relative w-full max-w-[520px] rounded-[28px] border border-white/80 bg-white p-6 shadow-[0_30px_100px_rgba(20,12,40,0.28)] dark:border-white/10 dark:bg-[#12101a] sm:p-8"
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-700 dark:bg-violet-400/10 dark:text-violet-300">
                  {otpStep === "code"
                    ? label("Step 1 of 2 · Verify", "الخطوة ١ من ٢ · التحقق")
                    : label("Step 2 of 2 · Your details", "الخطوة ٢ من ٢ · بياناتك")}
                </span>
                <h2
                  id="reservation-otp-title"
                  className="mt-3 text-xl font-extrabold text-gray-950 dark:text-white"
                >
                  {otpStep === "code"
                    ? label("Verify phone number", "تحقق من رقم الهاتف")
                    : label("Complete your profile", "أكمل ملفك الشخصي")}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOtpModalOpen(false)}
                disabled={otpBusy}
                aria-label={label("Close verification", "إغلاق التحقق")}
                className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 dark:hover:bg-white/10 dark:hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {otpStep === "code" ? (
              <ReservationOtpCodeStep
                handleVerifyOtp={handleVerifyOtp}
                sentChannel={sentChannel}
                sentPhone={sentPhone}
                otpInputRef={otpInputRef}
                otpCode={otpCode}
                setOtpCode={setOtpCode}
                otpSeconds={otpSeconds}
                handleResendOtp={handleResendOtp}
                otpBusy={otpBusy}
                otpError={otpError}
                onResetPhoneState={onResetPhoneState}
                label={label}
              />
            ) : (
              <ReservationProfileStep
                handleSaveProfile={handleSaveProfile}
                firstName={firstName}
                setFirstName={setFirstName}
                lastName={lastName}
                setLastName={setLastName}
                contactEmail={contactEmail}
                setContactEmail={setContactEmail}
                otpError={otpError}
                otpBusy={otpBusy}
                sentPhone={sentPhone}
                setOtpStep={setOtpStep}
                label={label}
              />
            )}
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
