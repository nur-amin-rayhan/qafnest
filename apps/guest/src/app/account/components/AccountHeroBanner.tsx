"use client";

import React from "react";
import {
  ShieldCheck,
  Globe,
  Power,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface AccountHeroBannerProps {
  user: User | null;
  displayName: string;
  userInitial: string;
  editPhone: string;
  editEmail: string;
  language: string;
  toggleLanguage: () => void;
  openAuthModal: (mode: "signin" | "signup") => void;
  signOut: () => void;
  t: (en: string, ar: string) => string;
}

export default function AccountHeroBanner({
  user,
  displayName,
  userInitial,
  editPhone,
  editEmail,
  language,
  toggleLanguage,
  openAuthModal,
  signOut,
  t,
}: AccountHeroBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl sm:rounded-[32px] bg-gradient-to-r from-[#2c0e5a] via-[#4F2396] to-[#7c3aed] text-white p-6 sm:p-8 lg:p-10 shadow-xl shadow-purple-900/15 border border-purple-400/20 mb-8">
      {/* Subtle Ambient Decorative Glow */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#FF9750]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-purple-400/25 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left/Right User Greeting */}
        <div className="flex items-center gap-5">
          {/* Luxury Avatar Circle */}
          <div className="relative shrink-0 flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/10 backdrop-blur-md border-2 border-white/30 text-white shadow-lg">
            <span className="text-2xl sm:text-3xl font-black font-display tracking-tight text-[#FF9750]">
              {userInitial}
            </span>
            <span
              className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-[#4F2396] rounded-full shadow-xs"
              title="Verified Account"
            />
          </div>

          {/* Name & Official Tourism Accreditation */}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                <span>{displayName}</span>
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-300">
                <ShieldCheck size={13} className="text-emerald-400" />
                <span>{t("Verified Guest", "ضيف موثق")}</span>
              </span>
            </div>

            <p className="text-xs text-purple-300/80 mt-1.5 font-mono" dir="ltr">
              {editPhone} {editEmail ? `· ${editEmail}` : ""}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

