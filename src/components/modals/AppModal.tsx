"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Smartphone } from "lucide-react";
import { useApp } from "@/context/AppContext";

export default function AppModal() {
  const { appModalOpen, closeAppModal } = useApp();
  const [phone, setPhone] = useState("");

  if (!appModalOpen) return null;

  const handleSendLink = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`📱 QafNest App download link dispatched via SMS & WhatsApp to ${phone}!`);
    closeAppModal();
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md transition-opacity duration-300"
      onClick={closeAppModal}
    >
      <div
        className="glass-strong glow-border max-w-md w-full rounded-3xl p-6 sm:p-8 relative shadow-2xl text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={closeAppModal}
          className="absolute top-5 right-5 h-8 w-8 rounded-full glass flex items-center justify-center text-muted hover:text-fg transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-700 to-fuchsia-400 p-[1px] mx-auto mb-4 shadow-glow">
          <div className="w-full h-full rounded-2xl bg-ink flex items-center justify-center">
            <Smartphone className="w-7 h-7 text-fuchsia-300" />
          </div>
        </div>

        <h3 className="font-display text-2xl font-bold text-fg mb-1">
          Download QafNest App
        </h3>
        <p className="text-xs text-muted/70 mb-6">
          Scan this QR code with your mobile camera to install the app and unlock digital smart lock access.
        </p>

        {/* High-Tech QR Code Container */}
        <div className="w-48 h-48 mx-auto bg-white p-3 rounded-2xl shadow-xl flex items-center justify-center mb-6 relative group">
          <div className="relative w-full h-full">
            <Image
              src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://qafnest.com/app&color=090714"
              alt="QafNest App QR Code"
              fill
              className="object-contain"
            />
          </div>
          <div className="absolute inset-0 bg-violet-600/10 rounded-2xl pointer-events-none border border-violet-500/20" />
        </div>

        {/* SMS Link Dispatcher */}
        <form onSubmit={handleSendLink} className="space-y-3">
          <div className="flex gap-2">
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+966 5X XXX XXXX"
              className="flex-grow rounded-xl bg-surface/[0.05] border border-white/10 px-4 py-2.5 text-xs text-fg placeholder:text-muted/40 focus:outline-none focus:border-violet-400"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-luxe-gradient text-white font-bold text-xs tracking-wide shrink-0 shadow-glow cursor-pointer"
            >
              Send Link
            </button>
          </div>
        </form>

        <p className="text-[10px] text-muted/50 mt-4">
          Available for iOS (App Store), Android (Google Play), and HarmonyOS (AppGallery).
        </p>
      </div>
    </div>
  );
}
