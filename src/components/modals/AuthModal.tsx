"use client";

import { useState, useRef, useEffect } from "react";
import {
  X,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Mail,
  Lock,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { createClient } from "@/lib/supabase/client";

export default function AuthModal() {
  const { authModalOpen, closeAuthModal, signupRole, loginWithPhone } = useAuth();
  const { language } = useApp();
  const supabase = createClient();

  // Auth Method: 'phone' | 'email'
  const [authMethod, setAuthMethod] = useState<"phone" | "email">("phone");
  // Phone flow step: 'phone_input' | 'otp_verify'
  const [phoneStep, setPhoneStep] = useState<"phone_input" | "otp_verify">("phone_input");

  // State
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedRole, setSelectedRole] = useState<"guest" | "host">(signupRole);
  const [licenseNo, setLicenseNo] = useState("");

  // OTP Digits (4-box input like Gathern)
  const [otp, setOtp] = useState(["", "", "", ""]);
  const otpInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Resend Countdown Timer
  const [timer, setTimer] = useState(45);

  // Email Flow State
  const [isEmailSignIn, setIsEmailSignIn] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Reset state on open
  useEffect(() => {
    if (authModalOpen) {
      setPhoneStep("phone_input");
      setErrorMsg(null);
      setSuccessMsg(null);
      setOtp(["", "", "", ""]);
      setTimer(45);
    }
  }, [authModalOpen]);

  // Countdown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (phoneStep === "otp_verify" && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [phoneStep, timer]);

  if (!authModalOpen) return null;

  // Handle Step 1: Send OTP to Mobile Number
  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanPhone = phone.trim().replace(/\s+/g, "");
    if (!cleanPhone || cleanPhone.length < 9) {
      setErrorMsg("Please enter a valid 9-digit Saudi mobile number (e.g. 50 123 4567).");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setPhoneStep("otp_verify");
      setTimer(45);
      setTimeout(() => otpInputRefs[0].current?.focus(), 150);
    }, 600);
  };

  // Handle OTP Digit Input
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input box
    if (value && index < 3) {
      otpInputRefs[index + 1].current?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs[index - 1].current?.focus();
    }
  };

  // Handle Step 2: Verify OTP and Login
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const enteredCode = otp.join("");

    if (enteredCode.length < 4) {
      setErrorMsg("Please enter the complete 4-digit verification code.");
      return;
    }

    setLoading(true);
    try {
      // Complete phone login & store user session
      await loginWithPhone(phone, selectedRole, fullName, licenseNo);
      setSuccessMsg(`Welcome to QafNest as a ${selectedRole === "host" ? "Verified Host" : "Guest"}!`);
      setTimeout(() => {
        closeAuthModal();
      }, 1000);
    } catch {
      setErrorMsg("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Email Fallback Login / Signup
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (isEmailSignIn) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setSuccessMsg("Welcome back! Signing you in...");
        setTimeout(() => closeAuthModal(), 800);
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone: phone,
              role: selectedRole,
              tourism_license_no: selectedRole === "host" ? licenseNo : null,
            },
          },
        });
        if (error) throw error;
        setSuccessMsg("Account created successfully!");
        setTimeout(() => closeAuthModal(), 1000);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity duration-300"
      onClick={closeAuthModal}
    >
      <div
        className="max-w-md w-full rounded-3xl p-6 sm:p-8 relative shadow-2xl bg-white dark:bg-[#0E0E1A] border border-gray-100 dark:border-white/10 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 h-8 w-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Ministry Badge */}
        <div className="flex items-center gap-1.5 mb-3">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-purple-600 dark:text-purple-400" />
            {language === "ar" ? "معتمد ومرخص من وزارة السياحة" : "Saudi Tourism Verified"}
          </span>
        </div>

        {/* ============================================================== */}
        {/* PHONE NUMBER AUTH FLOW (GATHERN BENCHMARK)                     */}
        {/* ============================================================== */}
        {authMethod === "phone" && (
          <div>
            {phoneStep === "phone_input" ? (
              <>
                <div className="mb-6">
                  <h3 className="font-display text-2xl font-bold text-gray-900 dark:text-white">
                    {language === "ar" ? "تسجيل الدخول أو إنشاء حساب" : "Login or Sign up"}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {language === "ar"
                      ? "أدخل رقم جوالك لتصلك رسالة نصية برمز التحقق"
                      : "Enter your mobile number to receive a verification code"}
                  </p>
                </div>

                {/* Role Selector Tabs (Guest vs Host) */}
                <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-gray-100 dark:bg-white/5 mb-5 border border-gray-200/50 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setSelectedRole("guest")}
                    className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      selectedRole === "guest"
                        ? "bg-purple-700 text-white shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    {language === "ar" ? "ضيف (حجز إقامات)" : "Guest (Book Stays)"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole("host")}
                    className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      selectedRole === "host"
                        ? "bg-purple-700 text-white shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    {language === "ar" ? "مضيف (إضافة عقارات)" : "Host (List Stays)"}
                  </button>
                </div>

                <form onSubmit={handleSendOtp} className="space-y-4">
                  {/* Name Input */}
                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5">
                      {language === "ar" ? "الاسم الكامل" : "Full Name"}
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={language === "ar" ? "مثال: فيصل العتيبي" : "e.g. Faisal Al-Otaibi"}
                      className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-600"
                    />
                  </div>

                  {/* Saudi Mobile Number Input */}
                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5">
                      {language === "ar" ? "رقم الجوال" : "Mobile Number"}
                    </label>
                    <div className="flex items-center gap-2" dir="ltr">
                      {/* Country Prefix Box */}
                      <div className="px-3 py-3 rounded-2xl bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 flex items-center gap-1.5 shrink-0">
                        <span className="text-base">🇸🇦</span>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">+966</span>
                      </div>

                      {/* Phone Input */}
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
                        placeholder="5X XXX XXXX"
                        maxLength={9}
                        className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-600"
                      />
                    </div>
                  </div>

                  {/* Optional Host License Input */}
                  {selectedRole === "host" && (
                    <div>
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5">
                        {language === "ar" ? "رقم ترخيص وزارة السياحة (اختياري)" : "Ministry Tourism License No (Optional)"}
                      </label>
                      <input
                        type="text"
                        value={licenseNo}
                        onChange={(e) => setLicenseNo(e.target.value)}
                        placeholder="e.g. TL-2026-9842"
                        className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-600"
                      />
                    </div>
                  )}

                  {/* Error & Success Messages */}
                  {errorMsg && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>{language === "ar" ? "متابعة" : "Continue"}</span>
                        <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                      </>
                    )}
                  </button>
                </form>
              </>
            ) : (
              /* OTP Verification Step */
              <div>
                <div className="mb-6">
                  <h3 className="font-display text-2xl font-bold text-gray-900 dark:text-white">
                    {language === "ar" ? "أدخل رمز التحقق" : "Enter Verification Code"}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {language === "ar" ? "أدخل الرمز المكون من 4 أرقام المرسل إلى " : "Enter the 4-digit code sent via SMS to "}
                    <span className="font-bold text-gray-900 dark:text-white" dir="ltr">
                      +966 {phone}
                    </span>{" "}
                    <button
                      type="button"
                      onClick={() => setPhoneStep("phone_input")}
                      className="text-purple-600 dark:text-purple-400 underline font-semibold ml-1 rtl:mr-1 rtl:ml-0 cursor-pointer"
                    >
                      {language === "ar" ? "تغيير" : "Change"}
                    </button>
                  </p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  {/* 4 Digit Boxes */}
                  <div className="flex items-center justify-center gap-3" dir="ltr">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={otpInputRefs[index]}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="w-14 h-14 text-center font-mono text-xl font-bold rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 transition-all"
                      />
                    ))}
                  </div>

                  {/* Demo Helper Note */}
                  <p className="text-[11px] text-center text-gray-400 dark:text-gray-500">
                    {language === "ar"
                      ? "💡 تجربة: أدخل 1234 أو أي 4 أرقام للتجربة"
                      : "💡 Test Demo: Enter 1234 or any 4 digits"}
                  </p>

                  {/* Resend Timer */}
                  <div className="text-center text-xs text-gray-500">
                    {timer > 0 ? (
                      <span>
                        {language === "ar"
                          ? `إعادة الإرسال بعد 00:${String(timer).padStart(2, "0")}`
                          : `Resend code in 00:${String(timer).padStart(2, "0")}`}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setTimer(45)}
                        className="font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                      >
                        {language === "ar" ? "إعادة إرسال الرمز الآن" : "Resend Code Now"}
                      </button>
                    )}
                  </div>

                  {/* Error & Success */}
                  {errorMsg && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {successMsg && (
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{successMsg}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || otp.join("").length < 4}
                    className="w-full py-3.5 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>{language === "ar" ? "تحقق ومتابعة" : "Verify & Continue"}</span>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Switch to Email Button */}
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-white/10 text-center">
              <button
                type="button"
                onClick={() => setAuthMethod("email")}
                className="text-xs font-semibold text-gray-500 hover:text-purple-700 dark:hover:text-purple-400 transition-colors flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>{language === "ar" ? "أو المتابعة عبر البريد الإلكتروني" : "Or continue with Email"}</span>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* EMAIL & PASSWORD FLOW (ALTERNATIVE)                           */}
        {/* ============================================================== */}
        {authMethod === "email" && (
          <div>
            <div className="mb-6">
              <h3 className="font-display text-2xl font-bold text-gray-900 dark:text-white">
                {isEmailSignIn ? "Sign In with Email" : "Create Account"}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Enter your credentials to access your booking dashboard
              </p>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              {!isEmailSignIn && (
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-600"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>{isEmailSignIn ? "Sign In" : "Create Account"}</span>
                )}
              </button>
            </form>

            <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
              <button
                type="button"
                onClick={() => setIsEmailSignIn(!isEmailSignIn)}
                className="hover:underline font-semibold text-purple-600 dark:text-purple-400 cursor-pointer"
              >
                {isEmailSignIn ? "Need an account? Sign up" : "Already have an account? Sign in"}
              </button>

              <button
                type="button"
                onClick={() => setAuthMethod("phone")}
                className="hover:underline font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-1 cursor-pointer"
              >
                <Phone className="w-3 h-3" />
                <span>Mobile Login</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
