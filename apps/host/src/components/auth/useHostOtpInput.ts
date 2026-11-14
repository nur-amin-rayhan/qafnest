import { useRef } from "react";
import { OTP_LENGTH } from "./hostAuthHelpers";

export function useHostOtpInput({
  otp,
  setOtp,
}: {
  otp: string[];
  setOtp: (otp: string[]) => void;
}) {
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const nextOtp = [...otp];
    nextOtp[index] = value.slice(-1);
    setOtp(nextOtp);
    if (value && index < OTP_LENGTH - 1) {
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

