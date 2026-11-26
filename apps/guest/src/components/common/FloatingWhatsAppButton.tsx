"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { QAFNEST_SUPPORT_CONTACT } from "@qafnest/shared";
import { usePublicCmsWorkspace } from "@/lib/cms/usePublicCmsWorkspace";

export default function FloatingWhatsAppButton() {
  const { language } = useApp();
  const { workspace: cmsWorkspace } = usePublicCmsWorkspace();

  const cmsContact = cmsWorkspace?.globals?.contactUs;
  const rawWhatsapp = cmsContact?.whatsapp?.trim();
  const whatsappHref =
    rawWhatsapp && !rawWhatsapp.includes("500000000")
      ? (rawWhatsapp.startsWith("http") ? rawWhatsapp : `https://wa.me/${rawWhatsapp.replace(/\D/g, "")}`)
      : QAFNEST_SUPPORT_CONTACT.whatsappHref;

  const isAr = language === "ar";
  const positionClass = isAr ? "left-5 sm:left-6" : "right-5 sm:right-6";
  const tooltipText = isAr ? "تواصل معنا مباشرة عبر واتساب" : "Chat with us directly on WhatsApp";

  return (
    <aside
      aria-label={tooltipText}
      suppressHydrationWarning
      className={`fixed bottom-24 sm:bottom-6 ${positionClass} z-40 flex items-center group select-none`}
    >
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        title={tooltipText}
        suppressHydrationWarning
        className="relative flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] text-white shadow-xl shadow-emerald-600/30 hover:shadow-emerald-600/50 hover:scale-105 active:scale-95 transition-all duration-300 focus:outline-hidden focus:ring-4 focus:ring-emerald-400/40"
      >
        {/* Blinking / Pulsing radar ring */}
        <span
          className="absolute -inset-1 rounded-full bg-[#25D366] opacity-40 animate-ping pointer-events-none"
          aria-hidden="true"
        />

        {/* WhatsApp Icon */}
        <svg
          viewBox="0 0 24 24"
          className="w-7 h-7 fill-current relative z-10 transition-transform group-hover:scale-110"
          aria-hidden="true"
        >
          <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm0 18.14c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.37c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.22-8.23 8.22zm4.52-6.17c-.25-.12-1.47-.72-1.7-.81-.23-.08-.4-.12-.56.12-.17.25-.64.81-.79.98-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.57.12.17 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.53.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.23-.17-.48-.3z" />
        </svg>

        {/* Small live online blinking indicator dot */}
        <span
          className="absolute top-0.5 right-0.5 flex h-3.5 w-3.5"
          aria-hidden="true"
        >
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-75" />
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-400 border-2 border-white" />
        </span>
      </a>
    </aside>
  );
}
