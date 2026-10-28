"use client";

import { useState } from "react";
import { X, Lock, Mail, User as UserIcon, Phone, ShieldCheck, Key, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";

export default function AuthModal() {
  const { authModalOpen, closeAuthModal, authMode, signupRole } = useAuth();
  const supabase = createClient();

  const [isSignIn, setIsSignIn] = useState(authMode === "signin");
  const [selectedRole, setSelectedRole] = useState<"guest" | "host">(signupRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [licenseNo, setLicenseNo] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!authModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (isSignIn) {
        // Sign In
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setErrorMsg(error.message);
          setLoading(false);
          return;
        }

        setSuccessMsg("Welcome back! Redirecting...");
        setTimeout(() => {
          closeAuthModal();
        }, 1000);
      } else {
        // Sign Up
        const { error, data } = await supabase.auth.signUp({
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

        if (error) {
          setErrorMsg(error.message);
          setLoading(false);
          return;
        }

        if (data.session) {
          setSuccessMsg(`Welcome to QafNest as a ${selectedRole === "host" ? "Verified Host" : "Guest"}!`);
        } else {
          setSuccessMsg("Account created! Please check your email to verify your account.");
        }

        setTimeout(() => {
          closeAuthModal();
        }, 1500);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md transition-opacity duration-300"
      onClick={closeAuthModal}
    >
      <div
        className="glass-strong glow-border max-w-md w-full rounded-3xl p-6 sm:p-8 relative shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 h-8 w-8 rounded-full glass flex items-center justify-center text-muted hover:text-fg transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Monogram */}
        <div className="flex items-center gap-3 mb-4">
          <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-violet-700 to-fuchsia-400 flex items-center justify-center font-display font-bold text-white text-base">
            Q
          </div>
          <div>
            <h3 className="font-display text-xl font-bold text-fg">
              QAF<span className="text-gradient">NEST</span>
            </h3>
            <span className="text-[10px] uppercase tracking-widest text-violet-300 font-semibold block">
              {isSignIn ? "Account Login" : "Create New Account"}
            </span>
          </div>
        </div>

        {/* Tab Switcher: Sign In vs Sign Up */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-white/[0.04] border border-white/10 mb-5">
          <button
            type="button"
            onClick={() => {
              setIsSignIn(true);
              setErrorMsg(null);
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              isSignIn ? "bg-violet-600/40 text-white shadow-glow" : "text-muted hover:text-fg"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignIn(false);
              setErrorMsg(null);
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              !isSignIn ? "bg-fuchsia-600/40 text-white shadow-glow" : "text-muted hover:text-fg"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Role Selector (Only on Sign Up) */}
        {!isSignIn && (
          <div className="mb-4">
            <label className="block text-[11px] font-semibold text-muted mb-1.5">
              Account Type · نوع الحساب
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedRole("guest")}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  selectedRole === "guest"
                    ? "border-violet-400 bg-violet-500/15 text-white shadow-glow"
                    : "border-white/10 bg-white/[0.02] text-muted hover:border-white/20"
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-fg mb-0.5">
                  <UserIcon className="w-3.5 h-3.5 text-violet-400" /> Guest (نزيل)
                </div>
                <p className="text-[10px] text-muted/70">Book chalets & villas</p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole("host")}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  selectedRole === "host"
                    ? "border-fuchsia-400 bg-fuchsia-500/15 text-white shadow-glow"
                    : "border-white/10 bg-white/[0.02] text-muted hover:border-white/20"
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-fg mb-0.5">
                  <Key className="w-3.5 h-3.5 text-fuchsia-400" /> Host (مضيف)
                </div>
                <p className="text-[10px] text-muted/70">List & earn revenue</p>
              </button>
            </div>
          </div>
        )}

        {/* Error / Success Messages */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center gap-2.5 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-2.5 text-emerald-300 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {!isSignIn && (
            <div>
              <label className="block text-[11px] font-semibold text-muted mb-1">
                Full Name · الاسم الكامل
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Faisal Al-Otaibi"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl bg-surface/[0.05] border border-white/10 pl-10 pr-4 py-2.5 text-fg focus:outline-none focus:border-violet-400"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-muted mb-1">
              Email Address · البريد الإلكتروني
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl bg-surface/[0.05] border border-white/10 pl-10 pr-4 py-2.5 text-fg focus:outline-none focus:border-violet-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-muted mb-1">
              Password · كلمة المرور
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl bg-surface/[0.05] border border-white/10 pl-10 pr-4 py-2.5 text-fg focus:outline-none focus:border-violet-400"
              />
            </div>
          </div>

          {!isSignIn && (
            <div>
              <label className="block text-[11px] font-semibold text-muted mb-1">
                Phone Number (WhatsApp) · رقم الجوال
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="tel"
                  placeholder="+966 5X XXX XXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl bg-surface/[0.05] border border-white/10 pl-10 pr-4 py-2.5 text-fg focus:outline-none focus:border-violet-400"
                />
              </div>
            </div>
          )}

          {/* Host Specific Tourism License Field */}
          {!isSignIn && selectedRole === "host" && (
            <div>
              <label className="block text-[11px] font-semibold text-muted mb-1 flex items-center justify-between">
                <span>Tourism License (Optional) · ترخيص السياحة</span>
                <span className="text-[10px] text-fuchsia-300">Verified Badge</span>
              </label>
              <div className="relative">
                <ShieldCheck className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="e.g. 73102999 (Ministry of Tourism)"
                  value={licenseNo}
                  onChange={(e) => setLicenseNo(e.target.value)}
                  className="w-full rounded-xl bg-surface/[0.05] border border-white/10 pl-10 pr-4 py-2.5 text-fg focus:outline-none focus:border-fuchsia-400"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-luxe-gradient text-white font-bold tracking-wider uppercase text-xs shadow-glow hover:opacity-95 transition-opacity flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : isSignIn ? (
              "Sign In to QafNest"
            ) : selectedRole === "host" ? (
              "Register as Host · تسجيل كمضيف"
            ) : (
              "Create Guest Account"
            )}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-muted/70">
          {isSignIn ? (
            <p>
              Don&apos;t have an account yet?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsSignIn(false);
                  setErrorMsg(null);
                }}
                className="text-violet-400 font-bold hover:underline cursor-pointer"
              >
                Sign up
              </button>
            </p>
          ) : (
            <p>
              Already registered?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsSignIn(true);
                  setErrorMsg(null);
                }}
                className="text-fuchsia-400 font-bold hover:underline cursor-pointer"
              >
                Log in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
