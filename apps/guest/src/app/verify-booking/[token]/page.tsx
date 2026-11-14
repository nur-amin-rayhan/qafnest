"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, ShieldCheck, Phone, AlertCircle, RefreshCw } from "lucide-react";

interface SessionData {
  token: string;
  phoneNumber: string;
  guestName?: string;
  nationalId?: string;
  idType?: string;
  otpVerified: boolean;
  identityVerified: boolean;
  completed: boolean;
  verificationMethod: string;
  devOtpCode?: string;
}

export default function VerifyBookingPage({
  params,
}: {
  params?: { token?: string };
}) {
  const routeParams = useParams();
  const token = (params?.token || routeParams?.token || "") as string;
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [otpCode, setOtpCode] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [fullName, setFullName] = useState("");
  const [submittingOtp, setSubmittingOtp] = useState(false);
  const [submittingId, setSubmittingId] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchSession();
  }, [token]);

  async function fetchSession() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/verify-booking/${token}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load verification session");
      }
      setSession(data.session);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading session");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!otpCode.trim()) return;
    setSubmittingOtp(true);
    setStatusMessage(null);
    try {
      const res = await fetch(`/api/verify-booking/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify_otp", code: otpCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Invalid code");
      }
      setStatusMessage("Phone number verified successfully!");
      await fetchSession();
    } catch (err: unknown) {
      setStatusMessage(err instanceof Error ? err.message : "Failed to verify OTP");
    } finally {
      setSubmittingOtp(false);
    }
  }

  async function handleVerifyIdentity(e: React.FormEvent) {
    e.preventDefault();
    if (!nationalId.trim()) return;
    setSubmittingId(true);
    setStatusMessage(null);
    try {
      const res = await fetch(`/api/verify-booking/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify_identity",
          nationalId: nationalId.trim(),
          fullName: fullName.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Identity verification failed");
      }
      setStatusMessage("National ID verified with Yakeen / Nafath!");
      await fetchSession();
    } catch (err: unknown) {
      setStatusMessage(err instanceof Error ? err.message : "Identity check failed");
    } finally {
      setSubmittingId(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-emerald-900 text-white p-6 text-center">
          <div className="w-14 h-14 bg-emerald-800 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
            <ShieldCheck className="w-8 h-8 text-emerald-300" />
          </div>
          <h1 className="text-xl font-bold">QafNest Identity Verification</h1>
          <p className="text-xs text-emerald-200 mt-1">
            Integrated with Nafath &amp; Elm Yaqeen Government Platforms
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
            <p className="text-sm">Verifying session...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
            <p className="text-sm font-semibold text-rose-700">{error}</p>
            <button
              onClick={fetchSession}
              className="mt-4 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200"
            >
              Retry
            </button>
          </div>
        ) : session ? (
          <div className="p-6 space-y-6">
            {statusMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg font-medium">
                {statusMessage}
              </div>
            )}

            {/* Caller Info Banner */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 block">Registered Phone:</span>
                <span className="font-bold text-slate-800 font-mono flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" /> {session.phoneNumber}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block">Verification Status:</span>
                <span
                  className={`font-bold inline-block px-2 py-0.5 rounded text-[11px] ${
                    session.completed
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {session.completed ? "Fully Verified" : "Verification Required"}
                </span>
              </div>
            </div>

            {/* Step 1: Mobile Phone OTP */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                    1
                  </span>
                  <h2 className="text-sm font-bold text-slate-800">Phone Verification (OTP)</h2>
                </div>
                {session.otpVerified ? (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                    <CheckCircle2 className="w-4 h-4" /> Verified
                  </span>
                ) : (
                  <span className="text-xs text-amber-600 font-medium">Pending Code</span>
                )}
              </div>

              {!session.otpVerified ? (
                <form onSubmit={handleVerifyOtp} className="space-y-3">
                  <p className="text-xs text-slate-600">
                    Enter the 6-digit verification code sent via SMS to {session.phoneNumber}.
                  </p>
                  {session.devOtpCode && (
                    <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                      Sandbox Code: <strong>{session.devOtpCode}</strong>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="e.g. 123456"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm text-center font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                    <button
                      type="submit"
                      disabled={submittingOtp}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {submittingOtp ? "Verifying..." : "Verify OTP"}
                    </button>
                  </div>
                </form>
              ) : (
                <p className="text-xs text-slate-500">Phone ownership has been successfully confirmed.</p>
              )}
            </div>

            {/* Step 2: National ID / Iqama Verification */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                    2
                  </span>
                  <h2 className="text-sm font-bold text-slate-800">National ID / Iqama (Yakeen)</h2>
                </div>
                {session.identityVerified ? (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                    <CheckCircle2 className="w-4 h-4" /> Verified
                  </span>
                ) : (
                  <span className="text-xs text-amber-600 font-medium">Pending ID</span>
                )}
              </div>

              {!session.identityVerified ? (
                <form onSubmit={handleVerifyIdentity} className="space-y-3">
                  <p className="text-xs text-slate-600">
                    Enter your 10-digit Saudi National ID (starts with 1) or Resident Iqama (starts with 2).
                  </p>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Full Legal Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Abdullah Al-Otaibi"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      National ID / Iqama (10 digits)
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      placeholder="10XXXXXXXX or 2XXXXXXXXX"
                      value={nationalId}
                      onChange={(e) => setNationalId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submittingId}
                    className="w-full py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                  >
                    {submittingId ? "Connecting to Yakeen..." : "Verify National ID with Yakeen"}
                  </button>
                </form>
              ) : (
                <div className="text-xs text-slate-600 space-y-1">
                  <p>
                    Verified ID: <strong>{session.nationalId || "Protected"}</strong> ({session.idType === "national_id" ? "Saudi Citizen" : "Resident Iqama"})
                  </p>
                  <p className="text-emerald-700">Matched with Saudi National Elm Registry.</p>
                </div>
              )}
            </div>

            {/* Completion Banner */}
            {session.completed && (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-emerald-900">Verification Complete!</h3>
                <p className="text-xs text-emerald-700 mt-1">
                  Your identity and mobile number are verified. The customer support helpline agent can now proceed to confirm your booking reservation.
                </p>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
