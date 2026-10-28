"use client";

import { useState } from "react";
import { X, ShieldCheck, Zap, Check } from "lucide-react";
import { useApp } from "@/context/AppContext";

export default function BookingModal() {
  const { bookingModal, closeBookingModal, formatPrice, formatTabby } = useApp();
  const [paymentOption, setPaymentOption] = useState<"full" | "split">("split");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  if (!bookingModal.isOpen) return null;

  const totalStay = bookingModal.basePrice * 2; // 2 nights demo

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      closeBookingModal();
      alert(
        `🌟 Instant Reservation Confirmed for ${bookingModal.propertyTitle}!\nPayment: ${
          paymentOption === "split"
            ? "Tabby / Tamara 4-Month Installment"
            : "Full Direct Payment"
        }\nYour booking voucher and self check-in smart lock PIN have been dispatched via SMS & WhatsApp to ${phone || "+966 5X XXX XXXX"}.`
      );
    }, 800);
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md transition-opacity duration-300"
      onClick={closeBookingModal}
    >
      <div
        className="glass-strong glow-border max-w-lg w-full rounded-3xl p-6 sm:p-8 relative shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={closeBookingModal}
          className="absolute top-5 right-5 h-8 w-8 rounded-full glass flex items-center justify-center text-muted hover:text-fg transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] uppercase tracking-widest text-emerald-300 font-bold glass px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" /> Verified License
          </span>
          <span className="text-[10px] uppercase tracking-widest text-fuchsia-400 font-bold glass px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <Zap className="w-3 h-3 text-fuchsia-400" /> Instant Book
          </span>
        </div>

        <h3 className="font-display text-2xl font-bold text-fg mb-1">
          {bookingModal.propertyTitle}
        </h3>
        <p className="text-xs text-muted/70 mb-5">
          Protected by QafNest Host Guarantee & Free Relocation.
        </p>

        {/* Price Breakdown */}
        <div className="glass rounded-2xl p-4 mb-5 border border-white/10 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted">Rate per night:</span>
            <span className="font-bold text-fg">
              {formatPrice(bookingModal.basePrice)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Stay Duration:</span>
            <span className="font-bold text-fg">2 Nights (Weekend)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Cleaning & Service Fee:</span>
            <span className="text-emerald-400 font-semibold">FREE (Covered)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Taxes & Ministry VAT:</span>
            <span className="text-emerald-400 font-semibold">Included</span>
          </div>
          <div className="pt-2 border-t border-white/10 flex justify-between items-baseline">
            <span className="font-bold text-sm text-fg">Total Amount:</span>
            <span className="font-display text-xl font-bold text-gradient">
              {formatPrice(totalStay)}
            </span>
          </div>
        </div>

        {/* Payment Plan Selector */}
        <div className="mb-5">
          <span className="text-xs font-semibold text-violet-300 block mb-2">
            Select Payment Method:
          </span>
          <div className="grid grid-cols-2 gap-3">
            <label
              className={`glass rounded-2xl p-3 border cursor-pointer transition-all flex flex-col justify-between ${
                paymentOption === "full"
                  ? "border-violet-400 bg-violet-600/20"
                  : "border-white/10 hover:border-violet-400/30"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-fg">Pay in Full</span>
                <input
                  type="radio"
                  name="payment-modal-opt"
                  checked={paymentOption === "full"}
                  onChange={() => setPaymentOption("full")}
                  className="accent-fuchsia-400"
                />
              </div>
              <span className="text-[10px] text-muted/70">
                Mada, Apple Pay, Visa
              </span>
            </label>

            <label
              className={`glass rounded-2xl p-3 border cursor-pointer transition-all flex flex-col justify-between ${
                paymentOption === "split"
                  ? "border-violet-400 bg-violet-600/20"
                  : "border-white/10 hover:border-violet-400/30"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-fuchsia-300">
                  Tabby / Tamara
                </span>
                <input
                  type="radio"
                  name="payment-modal-opt"
                  checked={paymentOption === "split"}
                  onChange={() => setPaymentOption("split")}
                  className="accent-fuchsia-400"
                />
              </div>
              <span className="text-[10px] text-violet-300 font-semibold">
                {formatTabby(totalStay)}
              </span>
            </label>
          </div>
        </div>

        {/* Guest Input Fields */}
        <form onSubmit={handleConfirm} className="space-y-3">
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full Name (As per National ID / Passport)"
            className="w-full rounded-xl bg-surface/[0.05] border border-white/10 px-4 py-2.5 text-xs sm:text-sm text-fg placeholder:text-muted/40 focus:outline-none focus:border-violet-400"
          />
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Mobile Number (+966 / WhatsApp)"
            className="w-full rounded-xl bg-surface/[0.05] border border-white/10 px-4 py-2.5 text-xs sm:text-sm text-fg placeholder:text-muted/40 focus:outline-none focus:border-violet-400"
          />

          <button
            type="submit"
            disabled={isSuccess}
            className="w-full py-3.5 rounded-xl bg-luxe-gradient text-white font-bold text-sm tracking-wide shadow-glow hover:shadow-glow-lg transition-all mt-4 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>
              {isSuccess
                ? "Processing Reservation..."
                : "Confirm Instant Reservation"}
            </span>
            <Check className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
