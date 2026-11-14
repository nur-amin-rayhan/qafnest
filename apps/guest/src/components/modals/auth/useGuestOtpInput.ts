import { useRef } from "react";
import { OTP_LENGTH } from "./authFlowHelpers";

export function useGuestOtpInput({
  otp,
  setOtp,
}: {
  otp: string[];
  setOtp: (otp: string[]) => void;
}) {
  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const handleOtpChange = (index: number, value: string) => {
    const digits = value.replace(/\D/g, "");
    if (!digits) {
      const nextOtp = [...otp];
      nextOtp[index] = "";
      setOtp(nextOtp);
      return;
    }
    if (digits.length > 1) {
      const nextOtp = [...otp];
      digits
        .slice(0, OTP_LENGTH - index)
        .split("")
        .forEach((digit, offset) => {
          nextOtp[index + offset] = digit;
        });
      setOtp(nextOtp);
      otpInputRefs.current[Math.min(index + digits.length, OTP_LENGTH - 1)]?.focus();
      return;
    }
    const newOtp = [...otp];
    newOtp[index] = digits;
    setOtp(newOtp);

    if (digits && index < OTP_LENGTH - 1) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  return {
    otpInputRefs,
    handleOtpChange,
    handleOtpKeyDown,
  };
}

