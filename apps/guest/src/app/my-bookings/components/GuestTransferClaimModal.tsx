"use client";

import React, { useState } from "react";
import { X, Building2, CheckCircle2, ShieldCheck, Copy, Check } from "lucide-react";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase/client";
import { createClient } from "@/lib/supabase/client";
import type { Booking } from "../types";

interface GuestTransferClaimModalProps {
  booking: Booking | null;
  onClose: () => void;
  onSubmitted: () => void;
  language: "en" | "ar";
  label: (en: string, ar: string) => string;
}

export function GuestTransferClaimModal({
  booking,
  onClose,
  onSubmitted,
  language,
  label,
}: GuestTransferClaimModalProps) {
  const [transferRef, setTransferRef] = useState("");
  const [bankName, setBankName] = useState("Saudi National Bank (SNB)");
  const [senderName, setSenderName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [copiedIban, setCopiedIban] = useState(false);

  if (!booking) return null;
  const bookingRef = booking.booking_reference || booking.id;

  const iban = "SA4410000001234567890123";

  function copyIban() {
    navigator.clipboard?.writeText(iban);
    setCopiedIban(true);
    setTimeout(() => setCopiedIban(false), 2000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!transferRef.trim() || !bookingRef) return;
    setSubmitting(true);
    setError(null);
    try {
      let authToken: string | null = null;
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getSession();
        authToken = data.session?.access_token || null;
      } catch {}
      if (!authToken && isFirebaseConfigured()) {
        try {
          const fbAuth = getFirebaseAuth();
          await fbAuth.authStateReady();
          if (fbAuth.currentUser) {
            authToken = await fbAuth.currentUser.getIdToken();
          }
        } catch {}
      }

      const res = await fetch(`/api/bookings/${encodeURIComponent(bookingRef)}/transfer-claim`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          transferReference: transferRef.trim(),
          bankName,
          senderName: senderName.trim() || undefined,
          amount: Number(booking?.total_price || 0),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit transfer claim");
      }
      setSuccess(true);
      setTimeout(() => {
        onSubmitted();
        onClose();
      }, 1800);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error submitting transfer claim");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-amber-600" />
            <h2 className="text-base font-bold text-slate-900">
              {label("SADAD / Bank Transfer Payment", "الدفع عبر سداد / التحويل البنكي")}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {success ? (
            <div className="py-8 text-center space-y-3">
              <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
              <h3 className="text-lg font-bold text-slate-900">
                {label("Transfer Claim Submitted", "تم إرسال إشعار التحويل بنجاح")}
              </h3>
              <p className="text-xs text-slate-600">
                {label(
                  "Support will verify your payment and confirm your booking reservation.",
                  "سيتولى فريق الدعم التحقق من الحوالة وتأكيد الحجز قريباً."
                )}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
                  {error}
                </div>
              )}

              {/* Bank Details Card */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-700">
                  <span>{label("Beneficiary Bank", "البنك المستفيد")}:</span>
                  <span className="font-bold text-slate-900">Saudi National Bank (SNB)</span>
                </div>
                <div className="flex justify-between items-center text-slate-700">
                  <span>{label("Account Name", "اسم الحساب")}:</span>
                  <span className="font-bold text-slate-900">QafNest Hospitality Escrow</span>
                </div>
                <div className="flex justify-between items-center text-slate-700 pt-1 border-t border-amber-200/60">
                  <span>IBAN:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-slate-900 text-[11px]">{iban}</span>
                    <button
                      type="button"
                      onClick={copyIban}
                      className="p-1 text-slate-500 hover:text-slate-800"
                      title="Copy IBAN"
                    >
                      {copiedIban ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center text-slate-700 pt-1 border-t border-amber-200/60">
                  <span>{label("Amount Due", "المبلغ المطلوب")}:</span>
                  <strong className="text-emerald-700 font-mono text-sm">{booking.total_price} SAR</strong>
                </div>
              </div>

              {/* Form inputs */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {label("Transfer Reference / Receipt # *", "رقم الحوالة البنكية / إيصال الدفع *")}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TRF-92847291"
                  value={transferRef}
                  onChange={(e) => setTransferRef(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono focus:border-amber-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {label("Sender Bank", "البنك المحول منه")}
                </label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-amber-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                >
                  <option value="Saudi National Bank (SNB)">Saudi National Bank (SNB)</option>
                  <option value="Al Rajhi Bank">Al Rajhi Bank</option>
                  <option value="Riyad Bank">Riyad Bank</option>
                  <option value="Alinma Bank">Alinma Bank</option>
                  <option value="Banque Saudi Fransi">Banque Saudi Fransi</option>
                  <option value="Arab National Bank (ANB)">Arab National Bank (ANB)</option>
                  <option value="SABB / SAB">SAB (Saudi Awwal Bank)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {label("Sender Name (Optional)", "اسم المحول (اختياري)")}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mohammed Al-Ghamdi"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-amber-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  {label("Cancel", "إلغاء")}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-amber-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-amber-700 disabled:opacity-50 transition cursor-pointer"
                >
                  {submitting ? label("Submitting...", "جاري الإرسال...") : label("Submit Transfer Claim", "تأكيد إرسال الحوالة")}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
