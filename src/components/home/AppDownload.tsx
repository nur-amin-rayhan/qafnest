"use client";

import { useState } from "react";
import {
  Smartphone,
  Key,
  MessageSquare,
  FileText,
  Bell,
  Play,
  QrCode,
  Lock,
  Unlock,
  Navigation,
  MessageCircle,
  Receipt,
  Wifi,
  Battery,
  Apple,
} from "lucide-react";
import { useApp } from "@/context/AppContext";

export default function AppDownload() {
  const { openAppModal } = useApp();
  const [isUnlocked, setIsUnlocked] = useState(false);

  return (
    <section id="app" className="py-20 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="glass-strong glow-border rounded-3xl p-8 sm:p-14 relative overflow-hidden border border-violet-400/20">
          {/* Ambient Background Glow */}
          <div className="absolute -right-20 -bottom-20 w-96 h-96 rounded-full bg-violet-600/20 blur-[100px] pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
            {/* Left Column: Copy & Value Proposition */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full glass px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-fuchsia-300 mb-4 border border-fuchsia-500/20">
                <Smartphone className="w-3.5 h-3.5 text-fuchsia-400" />
                QafNest Mobile Experience · حمل تطبيق قـاف نست
              </div>
              <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-fg mb-4">
                You make it yourself, <br />
                <span className="text-gradient">from your mobile!</span>
              </h2>
              <p className="text-sm sm:text-base text-muted/80 font-light leading-relaxed mb-8 max-w-xl">
                Turn your smartphone into your chalet&apos;s smart door key. Manage reservations, split payments with Tabby, receive your self check-in digital PIN code, and chat live with your host anytime.
              </p>

              {/* App Feature Bullets */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-violet-600/20 border border-violet-400/30 flex items-center justify-center text-fuchsia-300 shrink-0 mt-0.5">
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-fg">Smart Lock Digital Key</h4>
                    <p className="text-[11px] text-muted/70">
                      One-tap bluetooth unlock or instant encrypted PIN for seamless self check-in.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-violet-600/20 border border-violet-400/30 flex items-center justify-center text-fuchsia-300 shrink-0 mt-0.5">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-fg">Direct In-App Host Chat</h4>
                    <p className="text-[11px] text-muted/70">
                      Instant messaging with property owners and 24/7 bilingual concierge.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-violet-600/20 border border-violet-400/30 flex items-center justify-center text-fuchsia-300 shrink-0 mt-0.5">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-fg">1-Click VAT Tax Invoices</h4>
                    <p className="text-[11px] text-muted/70">
                      Instant ZATCA-compliant digital invoices for corporate and personal records.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-violet-600/20 border border-violet-400/30 flex items-center justify-center text-fuchsia-300 shrink-0 mt-0.5">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-fg">Exclusive App Only Rates</h4>
                    <p className="text-[11px] text-muted/70">
                      Extra 10% to 15% discount vouchers delivered directly to your device.
                    </p>
                  </div>
                </div>
              </div>

              {/* Download Badges & QR Code Trigger */}
              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={openAppModal}
                  className="glass glow-border px-4 py-2.5 rounded-xl flex items-center gap-3 hover:bg-white/10 transition-all cursor-pointer"
                >
                  <Apple className="w-6 h-6 text-white" />
                  <div className="text-left">
                    <span className="text-[9px] uppercase tracking-wider text-muted/80 block">
                      Download on the
                    </span>
                    <span className="text-xs font-bold text-white block -mt-0.5">
                      App Store
                    </span>
                  </div>
                </button>

                <button
                  onClick={openAppModal}
                  className="glass glow-border px-4 py-2.5 rounded-xl flex items-center gap-3 hover:bg-white/10 transition-all cursor-pointer"
                >
                  <Play className="w-6 h-6 text-fuchsia-400" />
                  <div className="text-left">
                    <span className="text-[9px] uppercase tracking-wider text-muted/80 block">
                      Get it on
                    </span>
                    <span className="text-xs font-bold text-white block -mt-0.5">
                      Google Play
                    </span>
                  </div>
                </button>

                <button
                  onClick={openAppModal}
                  className="glass px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-white/10 transition-all text-xs font-semibold text-violet-300 cursor-pointer"
                >
                  <QrCode className="w-5 h-5 text-fuchsia-300" />
                  <span>Scan QR Code</span>
                </button>
              </div>
            </div>

            {/* Right Column: Interactive Phone Mockup with Smart Lock UI */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-[280px] sm:w-[310px] h-[580px] rounded-[44px] bg-black p-3.5 shadow-[0_0_50px_rgba(168,85,247,0.3)] border-4 border-violet-500/40 animate-float">
                {/* Dynamic Island / Speaker Notch */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-full z-30 flex items-center justify-end px-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-violet-950/80 border border-violet-500/40" />
                </div>

                {/* Screen Content */}
                <div className="w-full h-full rounded-[34px] overflow-hidden bg-gradient-to-b from-[#110C24] via-[#090714] to-[#040308] p-5 flex flex-col justify-between relative border border-white/10">
                  {/* Status Bar */}
                  <div className="flex items-center justify-between text-[11px] text-white/70 pt-2 pb-4">
                    <span className="font-bold">9:41</span>
                    <div className="flex items-center gap-1.5">
                      <Wifi className="w-3 h-3" />
                      <Battery className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* App Header */}
                  <div className="text-center">
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider glass px-2.5 py-0.5 rounded-full inline-block mb-1">
                      Stay Confirmed · Active Today
                    </span>
                    <h5 className="text-sm font-bold text-white">
                      Al-Ammariyah Royal Chalet
                    </h5>
                    <p className="text-[10px] text-violet-300">
                      Self Check-in at 3:00 PM
                    </p>
                  </div>

                  {/* Digital Smart Lock Interface */}
                  <div className="my-auto text-center">
                    <div
                      onClick={() => setIsUnlocked(!isUnlocked)}
                      className="w-32 h-32 rounded-full mx-auto bg-gradient-to-tr from-violet-700 via-fuchsia-500 to-violet-500 p-[2px] shadow-[0_0_30px_rgba(232,121,249,0.5)] flex items-center justify-center cursor-pointer group transition-transform hover:scale-105 active:scale-95"
                    >
                      <div
                        className={`w-full h-full rounded-full bg-ink flex flex-col items-center justify-center gap-1 transition-all ${
                          isUnlocked ? "border border-emerald-500/50" : ""
                        }`}
                      >
                        {isUnlocked ? (
                          <Unlock className="w-8 h-8 text-emerald-400" />
                        ) : (
                          <Lock className="w-8 h-8 text-fuchsia-400" />
                        )}
                        <span
                          className={`text-[10px] font-bold uppercase tracking-widest ${
                            isUnlocked ? "text-emerald-300" : "text-violet-200"
                          }`}
                        >
                          {isUnlocked ? "Unlocked" : "Tap to Unlock"}
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted/70 mt-3">
                      Smart Lock PIN:{" "}
                      <span className="font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded">
                        #849201
                      </span>
                    </p>
                  </div>

                  {/* Quick Action Bar */}
                  <div className="glass rounded-2xl p-2.5 flex items-center justify-around text-center">
                    <div className="cursor-pointer hover:text-fuchsia-300 transition-colors">
                      <Navigation className="w-4 h-4 mx-auto text-violet-300 mb-0.5" />
                      <span className="text-[9px] text-white/80 block">Directions</span>
                    </div>
                    <div className="h-6 w-[1px] bg-white/10" />
                    <div className="cursor-pointer hover:text-fuchsia-300 transition-colors">
                      <MessageCircle className="w-4 h-4 mx-auto text-violet-300 mb-0.5" />
                      <span className="text-[9px] text-white/80 block">Host Chat</span>
                    </div>
                    <div className="h-6 w-[1px] bg-white/10" />
                    <div className="cursor-pointer hover:text-fuchsia-300 transition-colors">
                      <Receipt className="w-4 h-4 mx-auto text-violet-300 mb-0.5" />
                      <span className="text-[9px] text-white/80 block">Invoice</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
